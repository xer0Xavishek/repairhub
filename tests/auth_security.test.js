const request = require('supertest');
const app = require('../server/src/app');
const User = require('../server/src/models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Authentication & Identity Security Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('SEC-1.1: Reject registration with invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Invalid Email User',
      email: 'not-an-email',
      password: 'password123',
      role: 'requester',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('valid email');
  });

  test('SEC-1.2: Reject registration with short password (< 6 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pwd User',
      email: 'short_pwd@repairhub.com',
      password: '123',
      role: 'requester',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('at least 6 characters');
  });

  test('SEC-1.3: Block unauthorized privilege escalation to Administrator', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker Admin Candidate',
      email: 'hacker_admin@repairhub.com',
      password: 'password123',
      role: 'admin',
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Administrator privileges is forbidden');
  });

  test('SEC-1.4: Successful registration with sanitized credentials', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Legit Customer',
      email: 'legit_customer@repairhub.com',
      password: 'StrongPassword2026',
      role: 'requester',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('SEC-1.5: Prevent duplicate registration with same email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Legit Customer Duplicate',
      email: 'legit_customer@repairhub.com',
      password: 'StrongPassword2026',
      role: 'requester',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  test('SEC-1.6: Block suspended user from logging in (403 Forbidden)', async () => {
    // Create suspended user
    await User.create({
      name: 'Banned Bad Actor',
      email: 'banned_actor@repairhub.com',
      passwordHash: 'password123',
      role: 'requester',
      isSuspended: true,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'banned_actor@repairhub.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('suspended');
  });

  test('SEC-1.7: Secure logout endpoint returns session termination response', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('SEC-1.8: Strict Customer Data Isolation — Customer A cannot view Customer B repairs', async () => {
    // 1. Register Customer A and Customer B
    const custARes = await request(app).post('/api/auth/register').send({
      name: 'Customer Alice',
      email: 'alice@repairhub.com',
      password: 'StrongPassword123',
      role: 'requester',
    });
    const custBRes = await request(app).post('/api/auth/register').send({
      name: 'Customer Bob',
      email: 'bob@repairhub.com',
      password: 'StrongPassword123',
      role: 'requester',
    });

    const tokenA = custARes.body.data.token;
    const tokenB = custBRes.body.data.token;

    // 2. Customer A creates a private repair request
    await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemTitle: 'Alice Broken Blender',
        itemDescription: 'Motor does not spin.',
        category: 'Home Appliances',
        issueDescription: 'Smokes on start.',
      });

    // 3. Customer B calls GET /api/repairs (even without query params or with requesterId=me)
    const bRepairsGeneral = await request(app)
      .get('/api/repairs')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(bRepairsGeneral.statusCode).toBe(200);
    expect(bRepairsGeneral.body.count).toBe(0);
    expect(bRepairsGeneral.body.data).toEqual([]);

    const bRepairsMe = await request(app)
      .get('/api/repairs?requesterId=me')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(bRepairsMe.statusCode).toBe(200);
    expect(bRepairsMe.body.count).toBe(0);
    expect(bRepairsMe.body.data).toEqual([]);

    // 4. Customer A verifies their own repair request is visible only to them
    const aRepairs = await request(app)
      .get('/api/repairs')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(aRepairs.statusCode).toBe(200);
    expect(aRepairs.body.count).toBe(1);
    expect(aRepairs.body.data[0].itemTitle).toBe('Alice Broken Blender');
  });

  test('SEC-1.9: Unauthenticated or invalid query params never dump database repairs', async () => {
    // Unauthenticated GET /api/repairs?requesterId=me
    const unauthMe = await request(app).get('/api/repairs?requesterId=me');
    expect(unauthMe.statusCode).toBe(200);
    expect(unauthMe.body.count).toBe(0);

    // Invalid requesterId string
    const invalidId = await request(app).get('/api/repairs?requesterId=non_existent_fake_user_id');
    expect(invalidId.statusCode).toBe(200);
    expect(invalidId.body.count).toBe(0);
  });

  test('SEC-1.10: Strict case-sensitive login - avishek@gmail.com cannot be logged into with Avishek@gmail.com', async () => {
    // 1. Register account with avishek@gmail.com
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Avishek Exact',
      email: 'avishek@gmail.com',
      password: 'password123',
      role: 'requester',
    });
    expect(regRes.statusCode).toBe(201);

    // 2. Attempt login with Avishek@gmail.com (capitalized A) -> must fail (401)
    const failRes = await request(app).post('/api/auth/login').send({
      email: 'Avishek@gmail.com',
      password: 'password123',
    });
    expect(failRes.statusCode).toBe(401);
    expect(failRes.body.success).toBe(false);

    // 3. Attempt login with exact registered casing avishek@gmail.com -> must succeed (200)
    const successRes = await request(app).post('/api/auth/login').send({
      email: 'avishek@gmail.com',
      password: 'password123',
    });
    expect(successRes.statusCode).toBe(200);
    expect(successRes.body.success).toBe(true);
  });
});
