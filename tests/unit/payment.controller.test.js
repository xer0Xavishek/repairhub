const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('PaymentController Unit Test Suite', () => {
  let requesterToken;
  let repairerToken;
  let requestId;
  let paymentId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Payment Requester',
      email: 'payment_req@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;

    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Payment Repairer',
      email: 'payment_rep@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
      categories: ['Electronics'],
    });
    repairerToken = repRes.body.data.token;

    const rRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Mixer Grinder',
        itemDescription: 'Motor brush burning smell.',
        category: 'Home Appliances',
        issueDescription: 'Replace brushes.',
      });
    requestId = rRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── initiatePayment ──────────────────────────────────────────────────────
  describe('initiatePayment', () => {
    test('provided valid payment payload → calls POST /api/payments/initiate → expected 201 + HELD_IN_ESCROW', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairRequestId: requestId,
          amount: 500,
          method: 'SSLCommerz',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrowStatus).toBe('HELD_IN_ESCROW');
      expect(res.body.data.amount).toBe(500);
      expect(res.body.data.platformFee).toBe(25); // 5% platform fee = 25

      paymentId = res.body.data._id;
    });

    test('provided invalid repairRequestId → calls POST /api/payments/initiate → expected 404', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairRequestId: '507f1f77bcf86cd799439011',
          amount: 500,
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getPaymentByRequest ──────────────────────────────────────────────────
  describe('getPaymentByRequest', () => {
    test('provided requestId → calls GET /api/payments/request/:requestId → expected 200 + payment record', async () => {
      const res = await request(app)
        .get(`/api/payments/request/${requestId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(paymentId);
    });
  });

  // ─── releaseEscrow ────────────────────────────────────────────────────────
  describe('releaseEscrow', () => {
    test('provided valid paymentId → calls POST /api/payments/:id/release-escrow → expected 200 + RELEASED_TO_REPAIRER', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/release-escrow`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrowStatus).toBe('RELEASED_TO_REPAIRER');
      expect(res.body.data.releasedAt).toBeDefined();
    });

    test('provided already released paymentId → calls POST /api/payments/:id/release-escrow → expected 400 + already released', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/release-escrow`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been released');
    });
  });
});
