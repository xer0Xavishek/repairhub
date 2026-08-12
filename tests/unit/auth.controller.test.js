const request = require('supertest');
const app = require('../../server/src/app');
const User = require('../../server/src/models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('AuthController Unit Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── registerUser ────────────────────────────────────────────────────────
  describe('registerUser', () => {
    test('provided valid requester data → calls POST /api/auth/register → expected 201 + token + role=requester', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Unit Requester',
        email: 'unit_req@repairhub.com',
        password: 'Password123!',
        role: 'requester',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.role).toBe('requester');
      expect(res.body.data.name).toBe('Unit Requester');
    });

    test('provided valid repairer data with categories → calls POST /api/auth/register → expected 201 + role=repairer', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Unit Repairer',
        email: 'unit_repairer@repairhub.com',
        password: 'Password123!',
        role: 'repairer',
        categories: ['Electronics', 'Home Appliances'],
        businessName: 'Unit Repair Shop',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('repairer');
    });

    test('provided invalid email → calls POST /api/auth/register → expected 400 + email error', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad Email User',
        email: 'invalid-email-format',
        password: 'Password123!',
        role: 'requester',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email');
    });

    test('provided short password (< 6 chars) → calls POST /api/auth/register → expected 400 + password error', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pwd User',
        email: 'shortpwd@repairhub.com',
        password: '123',
        role: 'requester',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('6 characters');
    });

    test('provided role=admin → calls POST /api/auth/register → expected 403 + privilege escalation blocked', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker Admin',
        email: 'hacker_admin@repairhub.com',
        password: 'Password123!',
        role: 'admin',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Administrator');
    });

    test('provided duplicate email → calls POST /api/auth/register → expected 400 + user exists error', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Candidate',
        email: 'unit_req@repairhub.com',
        password: 'Password123!',
        role: 'requester',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ─── loginUser ───────────────────────────────────────────────────────────
  describe('loginUser', () => {
    test('provided valid credentials → calls POST /api/auth/login → expected 200 + token', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unit_req@repairhub.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.email).toBe('unit_req@repairhub.com');
    });

    test('provided wrong password → calls POST /api/auth/login → expected 401 + invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unit_req@repairhub.com',
        password: 'WrongPassword999!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    test('provided nonexistent email → calls POST /api/auth/login → expected 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost_user@repairhub.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('provided missing email or password → calls POST /api/auth/login → expected 400', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unit_req@repairhub.com',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email and password');
    });

    test('provided suspended user credentials → calls POST /api/auth/login → expected 403 + suspended error', async () => {
      await User.create({
        name: 'Banned Test User',
        email: 'banned_unit@repairhub.com',
        passwordHash: 'Password123!',
        role: 'requester',
        isSuspended: true,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'banned_unit@repairhub.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('suspended');
    });

    test('provided non-admin user credentials with requiredRole=admin → calls POST /api/auth/login → expected 403 + admin only error', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unit_req@repairhub.com',
        password: 'Password123!',
        requiredRole: 'admin',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin Gateway');
    });
  });

  // ─── getMe ───────────────────────────────────────────────────────────────
  describe('getMe', () => {
    let validToken;

    beforeAll(async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'unit_req@repairhub.com',
        password: 'Password123!',
      });
      validToken = res.body.data.token;
    });

    test('provided valid Bearer token → calls GET /api/auth/me → expected 200 + user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('unit_req@repairhub.com');
    });

    test('provided missing token → calls GET /api/auth/me → expected 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── logoutUser ──────────────────────────────────────────────────────────
  describe('logoutUser', () => {
    test('provided logout request → calls POST /api/auth/logout → expected 200 + success message', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('logged out');
    });
  });
});
