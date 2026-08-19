const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('BookingController Unit Test Suite', () => {
  let requesterToken;
  let repairerId;
  let createdBookingId;
  let scheduledTime;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Booking Customer',
      email: 'booking_customer@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;

    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Master Technician',
      email: 'master_tech@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
      categories: ['Electronics', 'Home Appliances'],
      businessName: 'Master Tech Workshop',
      coordinates: [90.4125, 23.8103],
    });
    repairerId = repRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── createBooking ────────────────────────────────────────────────────────
  describe('createBooking', () => {
    test('provided valid booking data → calls POST /api/bookings → expected 201 + Confirmed booking', async () => {
      scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairerId,
          scheduledTime,
          type: 'In-Shop Diagnostic',
          notes: 'Testing microwave sparks',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Confirmed');
      expect(res.body.data.repairerId).toBe(repairerId);

      createdBookingId = res.body.data._id;
    });

    test('provided double booking for same repairer & slot → calls POST /api/bookings → expected 409 + waitlist suggestion', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairerId,
          scheduledTime,
          type: 'In-Shop Diagnostic',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.canJoinWaitlist).toBe(true);
    });

    test('provided missing repairerId → calls POST /api/bookings → expected 400', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          scheduledTime,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('provided past time slot → calls POST /api/bookings → expected 400 + cannot book past slot error', async () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairerId,
          scheduledTime: pastTime,
          type: 'In-Shop Diagnostic',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('passed');
    });
  });

  // ─── getBookings ──────────────────────────────────────────────────────────
  describe('getBookings', () => {
    test('provided valid requester token → calls GET /api/bookings → expected 200 + list of user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── rescheduleBooking ────────────────────────────────────────────────────
  describe('rescheduleBooking', () => {
    test('provided valid newScheduledTime → calls PUT /api/bookings/:id/reschedule → expected 200 + Rescheduled', async () => {
      const newTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}/reschedule`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          newScheduledTime: newTime,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Rescheduled');
    });

    test('provided missing newScheduledTime → calls PUT /api/bookings/:id/reschedule → expected 400', async () => {
      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}/reschedule`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── joinWaitlist ─────────────────────────────────────────────────────────
  describe('joinWaitlist', () => {
    test('provided valid repairerId & requestedDate → calls POST /api/bookings/waitlist → expected 201 + queue position', async () => {
      const res = await request(app)
        .post('/api/bookings/waitlist')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairerId,
          requestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          preferredSlot: 'Morning (10:00 AM)',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queuePosition).toBe(1);
      expect(res.body.data.status).toBe('Waiting');
    });
  });

  // ─── getWaitlist ──────────────────────────────────────────────────────────
  describe('getWaitlist', () => {
    test('provided repairerId → calls GET /api/bookings/waitlist/:repairerId → expected 200 + waitlist entries', async () => {
      const res = await request(app)
        .get(`/api/bookings/waitlist/${repairerId}`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── cancelBooking ────────────────────────────────────────────────────────
  describe('cancelBooking', () => {
    test('provided booking ID → calls PUT /api/bookings/:id/cancel → expected 200 + Cancelled + promoted waitlist candidate', async () => {
      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${requesterToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Cancelled');
      expect(res.body.promotedWaitlistCandidate).toBeDefined();
    });
  });

  // ─── searchRepairers ──────────────────────────────────────────────────────
  describe('searchRepairers', () => {
    test('provided category query parameter → calls GET /api/bookings/repairers?category=Electronics → expected 200 + array of repairers', async () => {
      const res = await request(app).get('/api/bookings/repairers?category=Electronics');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].categories).toContain('Electronics');
    });
  });
});
