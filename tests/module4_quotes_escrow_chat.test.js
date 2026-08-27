const request = require('supertest');
const app = require('../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Module 4: Quotes, SSLCommerz Escrow & Chat Test Suite', () => {
  let requesterToken;
  let requesterId;
  let repairerToken;
  let repairerId;
  let requestId;
  let quoteId;
  let paymentId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Register requester
    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Escrow Requester',
      email: 'escrow_req@repairhub.com',
      password: 'password123',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;
    requesterId = reqRes.body.data._id;

    // Register repairer
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Precision Technician',
      email: 'precision@repairhub.com',
      password: 'password123',
      role: 'repairer',
      categories: ['Electronics'],
    });
    repairerToken = repRes.body.data.token;
    repairerId = repRes.body.data._id;

    // Create a repair request
    const rRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Microwave Inverter Board',
        itemDescription: 'Sparks and doesn’t heat.',
        category: 'Electronics',
        issueDescription: 'Blown fuse & capacitor.',
      });
    requestId = rRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('TC-4.1: Repairer submits estimate quote (F16)', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({
        repairRequestId: requestId,
        price: 850,
        estimatedDays: 3,
        message: 'Includes replacement diode and mica waveguide sheet.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(850);
    expect(res.body.data.status).toBe('Pending');
    quoteId = res.body.data._id;
  });

  test('TC-4.2: Requester accepts quote and assigns technician (F16)', async () => {
    const res = await request(app)
      .put(`/api/quotes/${quoteId}/accept`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Accepted');
  });

  test('TC-4.3: Authorize SSLCommerz payment into Escrow (F17)', async () => {
    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairRequestId: requestId,
        quoteId,
        amount: 850,
        method: 'SSLCommerz',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.escrowStatus).toBe('HELD_IN_ESCROW');
    expect(res.body.data.amount).toBe(850);
    paymentId = res.body.data._id;
  });

  test('TC-4.4: Send in-app chat message between customer and technician (F18)', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairRequestId: requestId,
        receiverId: repairerId,
        content: 'Hi! Have you tested the high-voltage diode yet?',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Hi! Have you tested the high-voltage diode yet?');
  });

  test('TC-4.5: Release Escrow funds to repairer after pickup (F17)', async () => {
    const res = await request(app)
      .post(`/api/payments/${paymentId}/release-escrow`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.escrowStatus).toBe('RELEASED_TO_REPAIRER');
    expect(res.body.data.releasedAt).toBeDefined();
  });

  test('TC-4.6: Reject chat messages once repair order is completed', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairRequestId: requestId,
        receiverId: repairerId,
        content: 'Trying to message after order is completed',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('completed');
  });
});
