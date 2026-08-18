const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('QuoteController Unit Test Suite', () => {
  let requesterToken;
  let repairerToken;
  let repairer2Token;
  let requestId;
  let quoteId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Quote Customer',
      email: 'quote_customer@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;

    const rep1Res = await request(app).post('/api/auth/register').send({
      name: 'Tech Alpha',
      email: 'tech_alpha@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
      categories: ['Electronics'],
    });
    repairerToken = rep1Res.body.data.token;

    const rep2Res = await request(app).post('/api/auth/register').send({
      name: 'Tech Beta',
      email: 'tech_beta@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
      categories: ['Electronics'],
    });
    repairer2Token = rep2Res.body.data.token;

    const rRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Sony Bravia TV',
        itemDescription: 'Sound works but no display.',
        category: 'Electronics',
        issueDescription: 'Backlight failure.',
      });
    requestId = rRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── submitQuote ──────────────────────────────────────────────────────────
  describe('submitQuote', () => {
    test('provided valid quote payload → calls POST /api/quotes → expected 201 + Pending quote', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          repairRequestId: requestId,
          price: 1200,
          estimatedDays: 2,
          message: 'Includes LED backlight strip replacement.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(1200);
      expect(res.body.data.status).toBe('Pending');

      quoteId = res.body.data._id;
    });

    test('provided competing quote from Tech Beta → calls POST /api/quotes → expected 201 + second quote', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairer2Token}`)
        .send({
          repairRequestId: requestId,
          price: 1000,
          estimatedDays: 3,
          message: 'Can fix in 3 days.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(1000);
    });

    test('provided missing price → calls POST /api/quotes → expected 400', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          repairRequestId: requestId,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getQuotesForRequest ──────────────────────────────────────────────────
  describe('getQuotesForRequest', () => {
    test('provided requestId → calls GET /api/quotes/request/:requestId → expected 200 + array of 2 quotes', async () => {
      const res = await request(app)
        .get(`/api/quotes/request/${requestId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ─── acceptQuote ──────────────────────────────────────────────────────────
  describe('acceptQuote', () => {
    test('provided requester accepts Tech Alpha quote → calls PUT /api/quotes/:id/accept → expected 200 + Accepted + competing quote Rejected', async () => {
      const res = await request(app)
        .put(`/api/quotes/${quoteId}/accept`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Accepted');

      // Check competing quotes are auto-rejected
      const quotesRes = await request(app)
        .get(`/api/quotes/request/${requestId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      const competingQuote = quotesRes.body.data.find((q) => q._id !== quoteId);
      expect(competingQuote.status).toBe('Rejected');
    });

    test('provided non-owner user → calls PUT /api/quotes/:id/accept → expected 403', async () => {
      const res = await request(app)
        .put(`/api/quotes/${quoteId}/accept`)
        .set('Authorization', `Bearer ${repairerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('provided assigned repair request → calls POST /api/quotes → expected 400 + assigned error', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairer2Token}`)
        .send({
          repairRequestId: requestId,
          price: 900,
          estimatedDays: 2,
          message: 'Late quote attempt',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('assigned');
    });

    test('provided technician attempts to quote their own repair request → expected 400 self-quote blocked', async () => {
      // Tech Alpha creates a personal repair request
      const ownReq = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          itemTitle: 'Tech Personal Drill',
          itemDescription: 'Cordless brushless impact driver with worn motor brushes.',
          category: 'Electronics',
          issueDescription: 'Motor brush worn out',
        });

      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          repairRequestId: ownReq.body.data._id,
          price: 500,
          estimatedDays: 1,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot bid or quote on their own');
    });
  });
});
