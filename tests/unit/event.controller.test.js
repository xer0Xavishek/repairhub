const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('EventController Unit Test Suite', () => {
  let organizerToken;
  let user1Token;
  let user2Token;
  let eventId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Workshop Organizer',
      email: 'organizer_unit@repairhub.com',
      password: 'Password123!',
      role: 'organizer',
    });
    organizerToken = orgRes.body.data.token;

    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'Attendee One',
      email: 'attendee1_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    user1Token = u1Res.body.data.token;

    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'Attendee Two',
      email: 'attendee2_unit@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    user2Token = u2Res.body.data.token;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── createEvent ──────────────────────────────────────────────────────────
  describe('createEvent', () => {
    test('provided valid event payload → calls POST /api/events → expected 201 + event object', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Dhanmondi Community Repair Café',
          description: 'Bring your broken small appliances and bicycles for free fixing!',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          capacity: 1, // capacity set to 1 to test waitlist flow
          venueName: 'Dhanmondi Community Center',
          address: 'Road 8A, Dhanmondi, Dhaka',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Dhanmondi Community Repair Café');
      expect(res.body.data.capacity).toBe(1);

      eventId = res.body.data._id;
    });

    test('provided missing required fields → calls POST /api/events → expected 400', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Incomplete Event',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── getEvents ────────────────────────────────────────────────────────────
  describe('getEvents', () => {
    test('provided request → calls GET /api/events → expected 200 + list of upcoming events', async () => {
      const res = await request(app).get('/api/events');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── rsvpEvent ────────────────────────────────────────────────────────────
  describe('rsvpEvent', () => {
    test('provided first RSVP (capacity open) → calls POST /api/events/:id/rsvp → expected 200 + isWaitlisted=false', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isWaitlisted).toBe(false);
    });

    test('provided second RSVP (capacity full = 1) → calls POST /api/events/:id/rsvp → expected 200 + isWaitlisted=true + position=1', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isWaitlisted).toBe(true);
      expect(res.body.position).toBe(1);
    });

    test('provided duplicate RSVP from same user → calls POST /api/events/:id/rsvp → expected 400', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });
  });

  // ─── cancelRsvp ───────────────────────────────────────────────────────────
  describe('cancelRsvp', () => {
    test('provided user 1 cancels RSVP → calls DELETE /api/events/:id/rsvp → expected 200 + user 2 promoted from waitlist', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.promotedWaitlistUser).toBeDefined();
    });
  });
});
