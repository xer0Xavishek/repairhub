const request = require('supertest');
const app = require('../server/src/app');
const User = require('../server/src/models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('User Profile & Map Pin Location & RBAC Suite', () => {
  let customerToken;
  let customerId;
  let repairerToken;
  let repairerId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Register a test customer with phone and custom map location pin
    const customerRes = await request(app).post('/api/auth/register').send({
      name: 'Tanvir Hossain',
      email: 'tanvir.test@repairhub.com',
      password: 'CustomerPass2026',
      phone: '01711234567',
      role: 'requester',
      address: 'Kha 224 Pragati Sarani, Merul Badda',
      coordinates: [90.4255, 23.7712], // [lon, lat]
    });
    customerToken = customerRes.body.data.token;
    customerId = customerRes.body.data._id;

    // Register a test repairer with workshop details
    const repairerRes = await request(app).post('/api/auth/register').send({
      name: 'Master Rafiq',
      email: 'rafiq.test@repairhub.com',
      password: 'TechnicianPass2026',
      phone: '01811987654',
      role: 'repairer',
      technicianType: 'workshop',
      businessName: 'Rafiq Precision Workshop',
      categories: ['Electronics', 'Home Appliances'],
      startingRate: 350,
      address: 'Gulshan 1, Dhaka',
      coordinates: [90.4172, 23.7895],
    });
    repairerToken = repairerRes.body.data.token;
    repairerId = repairerRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('PRF-1.1: Reject profile update without JWT authentication token', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send({ phone: '01999999999' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('PRF-1.2: Customer can update phone number, address, and interactive map pin location', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Tanvir Hossain Updated',
        phone: '01799887766',
        address: 'Road 8/A, Dhanmondi, Dhaka',
        coordinates: [90.3752, 23.7465], // [lon, lat] for Dhanmondi pin
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('01799887766');
    expect(res.body.data.address).toBe('Road 8/A, Dhanmondi, Dhaka');
    expect(res.body.data.location.coordinates).toEqual([90.3752, 23.7465]);
    expect(res.body.data.latLng).toEqual([23.7465, 90.3752]);
  });

  test('PRF-1.3: Repairer can update workshop business name, categories, rate, and operating model', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({
        businessName: 'Rafiq Master Tech & Board Lab',
        technicianType: 'freelance',
        categories: ['Smartphones', 'Electronics'],
        startingRate: 500,
        address: 'Banani Road 11, Dhaka',
        coordinates: [90.4066, 23.7937],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.businessName).toBe('Rafiq Master Tech & Board Lab');
    expect(res.body.data.technicianType).toBe('freelance');
    expect(res.body.data.categories).toContain('Smartphones');
    expect(res.body.data.startingRate).toBe(500);
    expect(res.body.data.location.coordinates).toEqual([90.4066, 23.7937]);
  });

  test('PRF-1.4: Password update is securely applied and allows login with new password', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        password: 'NewCustomerPassword2026',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'tanvir.test@repairhub.com',
      password: 'NewCustomerPassword2026',
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
  });
});
