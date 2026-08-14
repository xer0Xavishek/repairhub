const request = require('supertest');
const app = require('../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Module 1: Repair Request & Physical Tracking Pipeline Test Suite', () => {
  let requesterToken;
  let requesterId;
  let createdRequestId;
  let createdTicketNumber;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Register test requester
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Requester',
      email: 'requester_test1@repairhub.com',
      password: 'password123',
      role: 'requester',
    });

    requesterToken = res.body.data.token;
    requesterId = res.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('TC-1.1: Successfully create a multi-step repair request (F01, F02, F03)', async () => {
    const res = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Sony Bravia 43-inch LED TV',
        itemDescription: 'Sound is clear but display panel stays black with blinking red LED.',
        category: 'Electronics',
        subCategory: 'Television',
        photos: ['https://example.com/tv1.jpg'],
        issueDescription: 'Backlight inverter board or power supply capacitor issue.',
        preferredMethod: 'drop-off',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itemTitle).toBe('Sony Bravia 43-inch LED TV');
    expect(res.body.data.category).toBe('Electronics');
    expect(res.body.data.status).toBe('Requested');
    expect(res.body.data.ticketNumber).toMatch(/^RH-\d{4}-\d{4}$/);
    expect(res.body.data.qrCode).toContain('data:image/png;base64');

    createdRequestId = res.body.data._id;
    createdTicketNumber = res.body.data.ticketNumber;
  });

  test('TC-1.2: Reject invalid repair request with missing required fields', async () => {
    const res = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: '', // Missing title
        category: 'Electronics',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('TC-1.3: Verify 5-stage pipeline transition from Requested to Quoted (F04)', async () => {
    const res = await request(app)
      .put(`/api/repairs/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        status: 'Quoted',
        note: 'Technician provided initial estimate',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Quoted');
  });

  test('TC-1.4: Disallow illegal state machine skip (e.g. Quoted directly to Completed)', async () => {
    const res = await request(app)
      .put(`/api/repairs/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        status: 'Completed', // Illegal skip
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid state transition');
  });

  test('TC-1.5: Verify QR drop-off scan advances status to In Progress (F03)', async () => {
    const res = await request(app)
      .post(`/api/repairs/${createdRequestId}/verify-qr`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        ticketNumber: createdTicketNumber,
        scanType: 'dropoff',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dropoffVerified).toBe(true);
    expect(res.body.data.status).toBe('In Progress');
  });

  test('TC-1.6: Verify immutable ItemHistoryLog entries created (F05)', async () => {
    const res = await request(app)
      .get(`/api/repairs/${createdRequestId}/history`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0].changeType).toBe('REQUEST_CREATED');
  });

  test('TC-1.7: Repairer responds with decision on repair request (F04, F05)', async () => {
    // Create an open request in Requested status
    const openReqRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Microwave Oven for Decision',
        itemDescription: 'Heating element failure',
        category: 'Home Appliances',
        issueDescription: 'Does not heat up',
      });
    const openRequestId = openReqRes.body.data._id;

    // Register repairer
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Test Technician',
      email: 'tech_module1@repairhub.com',
      password: 'password123',
      role: 'repairer',
    });
    const repairerToken = repRes.body.data.token;

    const res = await request(app)
      .put(`/api/repairs/${openRequestId}/decision`)
      .set('Authorization', `Bearer ${repairerToken}`)
      .send({ decision: 'accepted' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.repairerResponses).toBeDefined();
    expect(res.body.data.repairerResponses.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.repairerResponses[0].decision).toBe('accepted');
  });

  test('TC-1.8: Normalize scanType drop-off and pickup in QR verification (F03)', async () => {
    // Test that pickup handles hyphenated 'pick-up' or standard 'pickup'
    const res = await request(app)
      .post(`/api/repairs/${createdRequestId}/verify-qr`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        ticketNumber: createdTicketNumber,
        scanType: 'pickup',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pickupVerified).toBe(true);
    expect(res.body.data.status).toBe('Completed');
  });
});
