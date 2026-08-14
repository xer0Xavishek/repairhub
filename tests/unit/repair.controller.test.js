const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('RepairController Unit Test Suite', () => {
  let requesterToken;
  let repairerToken;
  let createdRequestId;
  let createdTicketNumber;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Repair Tester',
      email: 'repair_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    requesterToken = regRes.body.data.token;

    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Technician Unit Tester',
      email: 'repairer_unit@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
    });
    repairerToken = repRes.body.data.token;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── createRepairRequest ──────────────────────────────────────────────────
  describe('createRepairRequest', () => {
    test('provided valid repair payload → calls POST /api/repairs → expected 201 + ticketNumber + qrCode', async () => {
      const res = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          itemTitle: 'Panasonic Microwave Oven',
          itemDescription: 'Sparks when powered on.',
          category: 'Home Appliances',
          subCategory: 'Microwave',
          issueDescription: 'Mica sheet carbon arcing burn.',
          preferredMethod: 'drop-off',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itemTitle).toBe('Panasonic Microwave Oven');
      expect(res.body.data.status).toBe('Requested');
      expect(res.body.data.ticketNumber).toMatch(/^RH-\d{4}-\d{4}$/);
      expect(res.body.data.qrCode).toContain('data:image/png;base64');

      createdRequestId = res.body.data._id;
      createdTicketNumber = res.body.data.ticketNumber;
    });

    test('provided missing itemTitle → calls POST /api/repairs → expected 400 + validation message', async () => {
      const res = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          category: 'Electronics',
          issueDescription: 'Missing title test',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide all required fields');
    });
  });

  // ─── getRepairRequests ────────────────────────────────────────────────────
  describe('getRepairRequests', () => {
    test('provided valid token → calls GET /api/repairs → expected 200 + array of requests', async () => {
      const res = await request(app)
        .get('/api/repairs')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    test('provided category filter → calls GET /api/repairs?category=Home Appliances → expected filtered array', async () => {
      const res = await request(app)
        .get('/api/repairs?category=Home Appliances')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].category).toBe('Home Appliances');
    });
  });

  // ─── getRepairRequestById ─────────────────────────────────────────────────
  describe('getRepairRequestById', () => {
    test('provided valid ID → calls GET /api/repairs/:id → expected 200 + single repair request object', async () => {
      const res = await request(app)
        .get(`/api/repairs/${createdRequestId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(createdRequestId);
    });

    test('provided invalid ID → calls GET /api/repairs/507f1f77bcf86cd799439011 → expected 404', async () => {
      const res = await request(app)
        .get('/api/repairs/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getAvailableRepairRequests ───────────────────────────────────────────
  describe('getAvailableRepairRequests', () => {
    test('provided valid token → calls GET /api/repairs/available → expected 200 + list of unassigned requests', async () => {
      const res = await request(app)
        .get('/api/repairs/available')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── respondToRepairRequest ───────────────────────────────────────────────
  describe('respondToRepairRequest', () => {
    test('provided repairer token and decision accepted → calls PUT /api/repairs/:id/decision → expected 200 + decision accepted', async () => {
      // Create request in Requested status
      const createRes = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          itemTitle: 'Unit Test Drone Repair',
          itemDescription: 'Motor brushless gyro wobble',
          category: 'Electronics',
          issueDescription: 'ESC burnout and rotor replacement',
        });
      const targetId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/repairs/${targetId}/decision`)
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({ decision: 'accepted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repairerResponses.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.repairerResponses[0].decision).toBe('accepted');
    });

    test('provided invalid decision string → calls PUT /api/repairs/:id/decision → expected 400', async () => {
      const res = await request(app)
        .put(`/api/repairs/${createdRequestId}/decision`)
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({ decision: 'undecided' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Decision must be 'accepted' or 'rejected'");
    });

    test('provided requester token (non-repairer) → calls PUT /api/repairs/:id/decision → expected 403', async () => {
      const res = await request(app)
        .put(`/api/repairs/${createdRequestId}/decision`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ decision: 'accepted' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });


  // ─── updateRepairStatus ───────────────────────────────────────────────────
  describe('updateRepairStatus', () => {
    test('provided valid stage transition (Requested → Quoted) → calls PUT /api/repairs/:id/status → expected 200 + Quoted', async () => {
      const res = await request(app)
        .put(`/api/repairs/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          status: 'Quoted',
          note: 'Estimate provided by technician',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Quoted');
    });

    test('provided invalid skip (Quoted → Completed) → calls PUT /api/repairs/:id/status → expected 400 + FSM violation', async () => {
      const res = await request(app)
        .put(`/api/repairs/${createdRequestId}/status`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          status: 'Completed',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid state transition');
    });
  });

  // ─── verifyQRHandover ─────────────────────────────────────────────────────
  describe('verifyQRHandover', () => {
    test('provided valid ticket number for dropoff → calls POST /api/repairs/:id/verify-qr → expected 200 + In Progress', async () => {
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

    test('provided invalid ticket number → calls POST /api/repairs/:id/verify-qr → expected 400', async () => {
      const res = await request(app)
        .post(`/api/repairs/${createdRequestId}/verify-qr`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          ticketNumber: 'RH-INVALID-9999',
          scanType: 'dropoff',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getItemHistoryLog ────────────────────────────────────────────────────
  describe('getItemHistoryLog', () => {
    test('provided valid requestId → calls GET /api/repairs/:id/history → expected 200 + array of history entries', async () => {
      const res = await request(app)
        .get(`/api/repairs/${createdRequestId}/history`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].repairRequestId.toString()).toBe(createdRequestId);
    });
  });
});
