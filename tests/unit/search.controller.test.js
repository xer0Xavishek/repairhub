const request = require('supertest');
const app = require('../../server/src/app');
const User = require('../../server/src/models/User');
const RepairRequest = require('../../server/src/models/RepairRequest');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('SearchController Unit Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const u = await User.create({
      name: 'Gulshan Technician',
      email: 'gulshan_tech@repairhub.com',
      passwordHash: 'Password123!',
      role: 'repairer',
      categories: ['Electronics'],
      businessName: 'Gulshan Electronic Repair',
    });

    await RepairRequest.create({
      ticketNumber: 'RH-2026-8888',
      requesterId: u._id,
      itemTitle: 'Gulshan Smart TV',
      itemDescription: '55-inch LED TV display panel',
      category: 'Electronics',
      issueDescription: 'Display backlight flickering.',
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── globalSearch ─────────────────────────────────────────────────────────
  describe('globalSearch', () => {
    test('provided query=Gulshan → calls GET /api/search?query=Gulshan → expected 200 + matched repairers and requests', async () => {
      const res = await request(app).get('/api/search?query=Gulshan');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalCount).toBeGreaterThanOrEqual(2);
      expect(res.body.data.repairers.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.requests.length).toBeGreaterThanOrEqual(1);
    });

    test('provided category=Electronics filter → calls GET /api/search?category=Electronics → expected 200 + results', async () => {
      const res = await request(app).get('/api/search?category=Electronics');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repairers.length).toBeGreaterThanOrEqual(1);
    });

    test('provided type=repairers filter → calls GET /api/search?type=repairers → expected requests & events empty', async () => {
      const res = await request(app).get('/api/search?type=repairers');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requests.length).toBe(0);
      expect(res.body.data.events.length).toBe(0);
    });
  });
});
