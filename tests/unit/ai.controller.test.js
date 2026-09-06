const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('AIController Unit Test Suite', () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── runDiagnosticTriage ──────────────────────────────────────────────────
  describe('runDiagnosticTriage', () => {
    test('provided symptom query → calls POST /api/ai/diagnose → expected 200 + structured diagnostic report with triage_steps', async () => {
      const res = await request(app)
        .post('/api/ai/diagnose')
        .send({
          query: 'Microwave sparks visibly on right interior wall during heating cycle',
          category: 'Home Appliances',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.defect_type).toBeDefined();
      expect(Array.isArray(res.body.data.triage_steps)).toBe(true);
      expect(res.body.data.triage_steps.length).toBeGreaterThanOrEqual(1);
    });

    test('provided smartphone screen query → calls GET /api/ai/diagnose?query=cracked screen → expected 200 + OLED display guide', async () => {
      const res = await request(app).get('/api/ai/diagnose?query=cracked screen phone display');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matched_manual).toMatch(/OLED|Display/i);
    });
  });

  // ─── runVisualDamageAssessment ────────────────────────────────────────────
  describe('runVisualDamageAssessment', () => {
    test('provided itemTitle and category → calls POST /api/ai/visual-assessment → expected 200 + visual damage metrics', async () => {
      const res = await request(app)
        .post('/api/ai/visual-assessment')
        .send({
          itemTitle: 'Samsung Smart TV 55-inch',
          category: 'Electronics',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item_analyzed).toBe('Samsung Smart TV 55-inch');
      expect(res.body.data.severity_score).toBeDefined();
      expect(res.body.data.is_repairable).toBe(true);
    });
  });
});
