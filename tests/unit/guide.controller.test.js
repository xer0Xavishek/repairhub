const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('GuideController Unit Test Suite', () => {
  let authorToken;
  let readerToken;
  let guideId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const u1 = await request(app).post('/api/auth/register').send({
      name: 'Guide Author',
      email: 'author_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    authorToken = u1.body.data.token;

    const u2 = await request(app).post('/api/auth/register').send({
      name: 'Guide Reader',
      email: 'reader_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    readerToken = u2.body.data.token;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── createGuide ──────────────────────────────────────────────────────────
  describe('createGuide', () => {
    test('provided valid guide payload → calls POST /api/guides → expected 201 + guide object', async () => {
      const res = await request(app)
        .post('/api/guides')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'How to replace microwave mica waveguide cover',
          category: 'Home Appliances',
          difficulty: 'Easy',
          estimatedMinutes: 15,
          summary: 'Simple step-by-step DIY guide to stop interior sparking.',
          steps: [
            { stepNumber: 1, stepTitle: 'Unplug unit', instruction: 'Safely disconnect from wall socket.' },
            { stepNumber: 2, stepTitle: 'Slide out mica card', instruction: 'Remove retaining plastic clip.' },
          ],
          toolsRequired: ['Screwdriver', 'Isopropyl alcohol'],
          partsNeeded: ['Mica Sheet (৳150)'],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('microwave mica');
      expect(res.body.data.authorName).toBe('Guide Author');

      guideId = res.body.data._id;
    });

    test('provided missing required fields → calls POST /api/guides → expected 400', async () => {
      const res = await request(app)
        .post('/api/guides')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Incomplete Guide',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getGuides ────────────────────────────────────────────────────────────
  describe('getGuides', () => {
    test('provided public GET → calls GET /api/guides → expected 200 + list of guides', async () => {
      const res = await request(app).get('/api/guides');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    test('provided category filter → calls GET /api/guides?category=Home Appliances → expected 200 + category match', async () => {
      const res = await request(app).get('/api/guides?category=Home Appliances');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].category).toBe('Home Appliances');
    });
  });

  // ─── getGuideById ─────────────────────────────────────────────────────────
  describe('getGuideById', () => {
    test('provided valid guide ID → calls GET /api/guides/:id → expected 200 + guide detail', async () => {
      const res = await request(app).get(`/api/guides/${guideId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(guideId);
    });

    test('provided invalid guide ID → calls GET /api/guides/507f1f77bcf86cd799439011 → expected 404', async () => {
      const res = await request(app).get('/api/guides/507f1f77bcf86cd799439011');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── toggleUpvoteGuide ────────────────────────────────────────────────────
  describe('toggleUpvoteGuide', () => {
    test('provided upvote toggle → calls POST /api/guides/:id/upvote → expected 200 + upvotes=1 + hasUpvoted=true', async () => {
      const res = await request(app)
        .post(`/api/guides/${guideId}/upvote`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.upvotes).toBe(1);
      expect(res.body.hasUpvoted).toBe(true);
    });

    test('provided un-upvote toggle → calls POST /api/guides/:id/upvote again → expected 200 + upvotes=0 + hasUpvoted=false', async () => {
      const res = await request(app)
        .post(`/api/guides/${guideId}/upvote`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.upvotes).toBe(0);
      expect(res.body.hasUpvoted).toBe(false);
    });
  });
});
