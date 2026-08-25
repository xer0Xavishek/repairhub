const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server/src/app');
const User = require('../server/src/models/User');
const RepairRequest = require('../server/src/models/RepairRequest');
const Payment = require('../server/src/models/Payment');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Module 5: Reviews, Ratings & Administration Test Suite (Sprint 5)', () => {
  let adminToken;
  let requesterToken;
  let repairerId;
  let completedRequestId;
  let paymentId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Create System Admin directly via database (prevents public endpoint elevation)
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin_test@repairhub.com',
      passwordHash: 'password123',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'repairhub_super_secret_jwt_key_2026');

    // Register requester
    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Reviewer Customer',
      email: 'reviewer@repairhub.com',
      password: 'password123',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;
    const requesterId = reqRes.body.data._id;

    // Register repairer
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Unverified Fixer',
      email: 'unverified@repairhub.com',
      password: 'password123',
      role: 'repairer',
      categories: ['Electronics'],
    });
    repairerId = repRes.body.data._id;

    // Create a COMPLETED repair request for review testing
    const rRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Repaired Blender Motor',
        itemDescription: 'Motor brushes replaced.',
        category: 'Home Appliances',
        issueDescription: 'Motor was dead.',
      });
    completedRequestId = rRes.body.data._id;

    // Directly set to Completed and assign repairer
    await RepairRequest.findByIdAndUpdate(completedRequestId, {
      status: 'Completed',
      assignedRepairerId: repairerId,
    });

    // Create a disputed payment for escrow testing
    const payment = await Payment.create({
      repairRequestId: completedRequestId,
      payerId: requesterId,
      payeeId: repairerId,
      amount: 850,
      platformFee: 42.5,
      status: 'Initiated',
      escrowStatus: 'HELD_IN_ESCROW',
      transactionId: 'TXN-DISPUTE-999',
    });
    paymentId = payment._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('TC-5.1: Admin verifies repairer credentials and awards Trust Badge (F21)', async () => {
    const res = await request(app)
      .put(`/api/admin/verify-repairer/${repairerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isVerified).toBe(true);
  });

  test('TC-5.2: Submit 5-star multi-criteria review (F18)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairRequestId: completedRequestId,
        qualityRating: 5,
        communicationRating: 4,
        turnaroundRating: 5,
        comment: 'Exceptional repair quality, blender runs like brand new!',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.averageRating).toBe(4.7);

    // Verify repairer profile rating updated
    const repairer = await User.findById(repairerId);
    expect(repairer.rating).toBe(4.7);
    expect(repairer.ratingCount).toBe(1);
  });

  test('TC-5.3: Disallow duplicate review for same repair request (F18)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairRequestId: completedRequestId,
        qualityRating: 5,
        communicationRating: 5,
        turnaroundRating: 5,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('TC-5.4: Admin retrieves platform analytics & GMV metrics (F19)', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
    expect(res.body.data.totalRepairs).toBeGreaterThanOrEqual(1);
  });

  test('TC-5.5: Admin suspends and reactivates a user account (F19)', async () => {
    const suspendRes = await request(app)
      .put(`/api/admin/users/${repairerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: true });

    expect(suspendRes.statusCode).toBe(200);
    expect(suspendRes.body.success).toBe(true);
    expect(suspendRes.body.data.isSuspended).toBe(true);

    const reactivateRes = await request(app)
      .put(`/api/admin/users/${repairerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isSuspended: false });

    expect(reactivateRes.statusCode).toBe(200);
    expect(reactivateRes.body.success).toBe(true);
    expect(reactivateRes.body.data.isSuspended).toBe(false);
  });

  test('TC-5.6: Admin resolves disputed escrow payment with refund (F20)', async () => {
    const res = await request(app)
      .put(`/api/admin/escrow/${paymentId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'REFUND_TO_CUSTOMER',
        resolutionNotes: 'Item not repairable; refunded full escrow deposit',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Refunded');
    expect(res.body.data.escrowStatus).toBe('REFUNDED_TO_CUSTOMER');
  });

  test('TC-5.7: Admin rejects incomplete repairer verification (F21)', async () => {
    const res = await request(app)
      .put(`/api/admin/reject-repairer/${repairerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'NID and Trade License scans were blurry' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isVerified).toBe(false);
  });
});
