const request = require('supertest');
const app = require('../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Module 2: Discovery, Geolocation & Booking Engine Test Suite (Sprint 3)', () => {
  let requesterToken;
  let repairerId;
  let createdBookingId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Register requester
    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Booking Tester',
      email: 'booking_tester@repairhub.com',
      password: 'password123',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;

    // Register repairer with location coordinates
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Gulshan Fixer',
      email: 'gulshan_fixer@repairhub.com',
      password: 'password123',
      role: 'repairer',
      categories: ['Electronics', 'Home Appliances'],
      businessName: 'Gulshan Tech Care',
      coordinates: [90.4174, 23.7808], // Gulshan 1 Dhaka
    });
    repairerId = repRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('TC-2.1: Filter repairers by category and rating (F07)', async () => {
    const res = await request(app).get('/api/bookings/repairers?category=Electronics');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].categories).toContain('Electronics');
  });

  test('TC-2.2: Create appointment booking slot (F08)', async () => {
    const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairerId,
        scheduledTime,
        type: 'In-Shop Diagnostic',
        notes: 'Checking television power supply',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Confirmed');
    createdBookingId = res.body.data._id;
  });

  test('TC-2.3: Prevent double-booking conflict for the same technician at the same time (F08)', async () => {
    const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Same time tomorrow
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairerId,
        scheduledTime,
        type: 'In-Shop Diagnostic',
      });

    expect(res.statusCode).toBe(409); // Conflict
    expect(res.body.success).toBe(false);
    expect(res.body.canJoinWaitlist).toBe(true);
  });

  test('TC-2.4: Reschedule booking to an open time slot (F08)', async () => {
    const newScheduledTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 2 days from now
    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/reschedule`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        newScheduledTime,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Rescheduled');
  });

  test('TC-2.5: Join technician appointment waitlist when slot is busy (F09)', async () => {
    const requestedDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/bookings/waitlist')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        repairerId,
        requestedDate,
        preferredSlot: 'Morning (10:00 AM)',
        notes: 'Need urgent microwave repair',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.queuePosition).toBe(1);
    expect(res.body.data.status).toBe('Waiting');
  });

  test('TC-2.6: Cancel booking and promote waitlist candidate (F08, F09)', async () => {
    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Cancelled');
    expect(res.body.promotedWaitlistCandidate).toBeDefined();
    expect(res.body.promotedWaitlistCandidate.status).toBe('Promoted');
  });

  test('TC-2.7: Global multi-parameter search across entities (F10)', async () => {
    const res = await request(app).get('/api/search?query=Gulshan&category=Electronics');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.repairers.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.repairers[0].businessName).toContain('Gulshan');
  });
});
