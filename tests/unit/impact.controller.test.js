const request = require('supertest');
const app = require('../../server/src/app');
const EnvironmentalImpact = require('../../server/src/models/EnvironmentalImpact');
const RepairRequest = require('../../server/src/models/RepairRequest');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('ImpactController Unit Test Suite', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Eco Champion',
      email: 'eco_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    userToken = userRes.body.data.token;
    userId = userRes.body.data._id;

    // Seed completed repair request and environmental impact entry
    const req1 = await RepairRequest.create({
      ticketNumber: 'RH-2026-9999',
      requesterId: userId,
      itemTitle: 'Repaired Washing Machine',
      itemDescription: 'Drum bearing noise',
      issueDescription: 'Worn bearings replaced',
      category: 'Home Appliances',
      status: 'Completed',
    });

    await EnvironmentalImpact.create({
      repairRequestId: req1._id,
      category: 'Home Appliances',
      wasteDivertedKg: 12.5,
      co2SavedKg: 50.0,
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── getGlobalImpact ──────────────────────────────────────────────────────
  describe('getGlobalImpact', () => {
    test('provided public GET request → calls GET /api/impact/global → expected 200 + global impact metrics', async () => {
      const res = await request(app).get('/api/impact/global');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRepairsCompleted).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalWasteDivertedKg).toBe(12.5);
      expect(res.body.data.totalCo2SavedKg).toBe(50.0);
      expect(res.body.data.treesEquivalent).toBeDefined();
      expect(res.body.data.categoryBreakdown['Home Appliances']).toBeDefined();
    });
  });

  // ─── getUserImpact ────────────────────────────────────────────────────────
  describe('getUserImpact', () => {
    test('provided valid user token → calls GET /api/impact/user → expected 200 + personal impact metrics + eco badges', async () => {
      const res = await request(app)
        .get('/api/impact/user')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completedRepairsCount).toBe(1);
      expect(res.body.data.totalWasteDivertedKg).toBe(12.5);
      expect(res.body.data.totalCo2SavedKg).toBe(50.0);
      expect(Array.isArray(res.body.data.badges)).toBe(true);
      expect(res.body.data.badges.length).toBeGreaterThanOrEqual(1);
    });

    test('provided unauthenticated request → calls GET /api/impact/user → expected 401', async () => {

      const res = await request(app).get('/api/impact/user');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getImpactCoefficients ───────────────────────────────────────────────
  describe('getImpactCoefficients', () => {

    test('provided public request → calls GET /api/impact/coefficients → expected 200 + benchmark matrix', async () => {
      const res = await request(app).get('/api/impact/coefficients');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.Electronics).toBeDefined();
      expect(res.body.data.Electronics.co2SavedKg).toBe(45.0);
      expect(res.body.data['Home Appliances'].wasteDivertedKg).toBe(8.5);
    });
  });

  // ─── calculatePotentialImpact ─────────────────────────────────────────────
  describe('calculatePotentialImpact', () => {
    test('provided category and quantity → calls POST /api/impact/calculate → expected 200 + projected savings', async () => {
      const res = await request(app)
        .post('/api/impact/calculate')
        .send({ category: 'Electronics', quantity: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Electronics');
      expect(res.body.data.quantity).toBe(2);
      expect(res.body.data.wasteDivertedKg).toBe(0.7); // 0.35 * 2
      expect(res.body.data.co2SavedKg).toBe(90.0); // 45.0 * 2
      expect(res.body.data.treesEquivalent).toBeDefined();
    });
  });
});

