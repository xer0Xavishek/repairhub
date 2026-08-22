const request = require('supertest');
const app = require('../server/src/app');
const RepairCafeEvent = require('../server/src/models/RepairCafeEvent');
const { calculateEnvironmentalImpact } = require('../server/src/utils/impactCalculator');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Module 3: Repair Cafés, Waitlist & Sustainability Test Suite (Sprint 4)', () => {
  let organizerToken;
  let user1Token;
  let user2Token;
  let eventId;
  let createdGuideId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Event Organizer',
      email: 'org_test@repairhub.com',
      password: 'password123',
      role: 'organizer',
    });
    organizerToken = orgRes.body.data.token;

    const u1Res = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'u1_test@repairhub.com',
      password: 'password123',
      role: 'requester',
    });
    user1Token = u1Res.body.data.token;

    const u2Res = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'u2_test@repairhub.com',
      password: 'password123',
      role: 'requester',
    });
    user2Token = u2Res.body.data.token;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test('TC-3.1: Create Repair Café event with capacity limit = 1 (F11)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Mohakhali Mini Repair Workshop',
        description: 'Testing capacity & waitlist flow',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 1,
        venueName: 'UB01 Hall',
        address: 'Mohakhali, Dhaka',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.capacity).toBe(1);
    eventId = res.body.data._id;
  });

  test('TC-3.2: First user successfully RSVPs as Attending (F12)', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isWaitlisted).toBe(false);
  });

  test('TC-3.3: Second user is placed on FIFO waitlist position #1 (F12)', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.isWaitlisted).toBe(true);
    expect(res.body.position).toBe(1);
  });

  test('TC-3.4: Automated waitlist promotion when User 1 cancels RSVP (F12)', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}/rsvp`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.promotedWaitlistUser).toBeDefined();

    // Verify User 2 is now Attending
    const event = await RepairCafeEvent.findById(eventId);
    const user2Rsvp = event.rsvps.find((r) => r.status === 'Attending');
    expect(user2Rsvp).toBeDefined();
    expect(event.waitlist.length).toBe(0);
  });

  test('TC-3.5: Mathematical verification of CO2 & e-waste calculation (F14)', () => {
    const elecImpact = calculateEnvironmentalImpact('Electronics');
    expect(elecImpact.wasteDivertedKg).toBe(0.35);
    expect(elecImpact.co2SavedKg).toBe(45.0);

    const appImpact = calculateEnvironmentalImpact('Home Appliances');
    expect(appImpact.wasteDivertedKg).toBe(8.5);
    expect(appImpact.co2SavedKg).toBe(35.0);
  });

  test('TC-3.6: Publish Community DIY Repair Guide (F15)', async () => {
    const res = await request(app)
      .post('/api/guides')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Blender Motor Carbon Brush Replacement',
        category: 'Home Appliances',
        difficulty: 'Easy',
        estimatedMinutes: 20,
        summary: 'Replace worn motor carbon brushes to restore spinning power.',
        steps: [
          {
            stepNumber: 1,
            stepTitle: 'Unplug and access base',
            instruction: 'Unscrew the four rubber foot pads on the base.',
          },
        ],
        toolsRequired: ['Screwdriver'],
        partsNeeded: ['Carbon Brushes (pair)'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Blender Motor');
    createdGuideId = res.body.data._id;
  });

  test('TC-3.7: Upvote Community DIY Repair Guide (F15)', async () => {
    const res = await request(app)
      .post(`/api/guides/${createdGuideId}/upvote`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.upvotes).toBe(1);
    expect(res.body.hasUpvoted).toBe(true);
  });

  test('TC-3.8: Filter Community DIY Guides by category (F15)', async () => {
    const res = await request(app).get('/api/guides?category=Home Appliances');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].category).toBe('Home Appliances');
  });
});
