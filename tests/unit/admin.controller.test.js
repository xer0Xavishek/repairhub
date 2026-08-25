const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server/src/app');
const User = require('../../server/src/models/User');
const Payment = require('../../server/src/models/Payment');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('AdminController Unit Test Suite', () => {
  let adminToken;
  let repairerId;
  let paymentId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin_unit@repairhub.com',
      passwordHash: 'Password123!',
      role: 'admin',
    });
    adminToken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || 'repairhub_super_secret_jwt_key_2026'
    );

    const repUser = await User.create({
      name: 'Unverified Technician',
      email: 'unverified_unit@repairhub.com',
      passwordHash: 'Password123!',
      role: 'repairer',
      isVerified: false,
    });
    repairerId = repUser._id;

    const payment = await Payment.create({
      repairRequestId: '507f1f77bcf86cd799439011',
      payerId: adminUser._id,
      payeeId: repairerId,
      amount: 1500,
      platformFee: 75,
      status: 'Initiated',
      escrowStatus: 'HELD_IN_ESCROW',
      transactionId: 'TXN-UNIT-ADMIN-100',
    });
    paymentId = payment._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── getAllUsers ──────────────────────────────────────────────────────────
  describe('getAllUsers', () => {
    test('provided admin token → calls GET /api/admin/users → expected 200 + list of all registered users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].passwordHash).toBeUndefined(); // passwordHash excluded
    });
  });

  // ─── verifyRepairer ───────────────────────────────────────────────────────
  describe('verifyRepairer', () => {
    test('provided valid repairer ID → calls PUT /api/admin/verify-repairer/:id → expected 200 + isVerified=true', async () => {
      const res = await request(app)
        .put(`/api/admin/verify-repairer/${repairerId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(true);
    });
  });

  // ─── rejectRepairer ───────────────────────────────────────────────────────
  describe('rejectRepairer', () => {
    test('provided valid repairer ID & reason → calls PUT /api/admin/reject-repairer/:id → expected 200 + isVerified=false', async () => {
      const res = await request(app)
        .put(`/api/admin/reject-repairer/${repairerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'NID document scan blurry' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(false);
    });
  });

  // ─── toggleUserStatus ─────────────────────────────────────────────────────
  describe('toggleUserStatus', () => {
    test('provided isSuspended=true → calls PUT /api/admin/users/:id/status → expected 200 + user suspended', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${repairerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSuspended: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSuspended).toBe(true);
    });

    test('provided isSuspended=false → calls PUT /api/admin/users/:id/status → expected 200 + user reactivated', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${repairerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSuspended: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSuspended).toBe(false);
    });
  });

  // ─── resolveEscrowDispute ─────────────────────────────────────────────────
  describe('resolveEscrowDispute', () => {
    test('provided action=REFUND_TO_CUSTOMER → calls PUT /api/admin/escrow/:paymentId/resolve → expected 200 + REFUNDED_TO_CUSTOMER', async () => {
      const res = await request(app)
        .put(`/api/admin/escrow/${paymentId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REFUND_TO_CUSTOMER',
          resolutionNotes: 'Customer refunded due to non-repairable item.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrowStatus).toBe('REFUNDED_TO_CUSTOMER');
      expect(res.body.data.status).toBe('Refunded');
    });

    test('provided invalid action → calls PUT /api/admin/escrow/:paymentId/resolve → expected 400', async () => {
      const res = await request(app)
        .put(`/api/admin/escrow/${paymentId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'INVALID_ACTION',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getPlatformMetrics ───────────────────────────────────────────────────
  describe('getPlatformMetrics', () => {
    test('provided admin token → calls GET /api/admin/metrics → expected 200 + GMV & user metrics', async () => {
      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.data.gmv).toBeDefined();
      expect(res.body.data.platformEarnings).toBeDefined();
    });
  });

  // ─── getEscrowPayments ───────────────────────────────────────────────────
  describe('getEscrowPayments', () => {
    test('provided admin token → calls GET /api/admin/escrow → expected 200 + list of escrow payments', async () => {
      const res = await request(app)
        .get('/api/admin/escrow')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });
});
