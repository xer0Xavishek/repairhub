const request = require('supertest');
const app = require('../../server/src/app');
const RepairRequest = require('../../server/src/models/RepairRequest');
const User = require('../../server/src/models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('ReviewController Unit Test Suite', () => {
  let requesterToken;
  let repairerId;
  let completedRequestId;
  let activeRequestId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const reqRes = await request(app).post('/api/auth/register').send({
      name: 'Reviewer Requester',
      email: 'reviewer_req@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    requesterToken = reqRes.body.data.token;
    const requesterId = reqRes.body.data._id;

    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Rated Repairer',
      email: 'rated_rep@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
      categories: ['Home Appliances'],
    });
    repairerId = repRes.body.data._id;

    // Completed repair request
    const r1 = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Blender Motor Unit',
        itemDescription: 'Replaced carbon brushes.',
        category: 'Home Appliances',
        issueDescription: 'Motor was dead.',
      });
    completedRequestId = r1.body.data._id;

    await RepairRequest.findByIdAndUpdate(completedRequestId, {
      status: 'Completed',
      assignedRepairerId: repairerId,
    });

    // Non-completed repair request (In Progress)
    const r2 = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        itemTitle: 'Unfinished Toaster Repair',
        itemDescription: 'Heating element issue.',
        category: 'Home Appliances',
        issueDescription: 'Toaster stays cold.',
      });
    activeRequestId = r2.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── createReview ─────────────────────────────────────────────────────────
  describe('createReview', () => {
    test('provided 5-star review payload for completed job → calls POST /api/reviews → expected 201 + updated repairer rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairRequestId: completedRequestId,
          qualityRating: 5,
          communicationRating: 4,
          turnaroundRating: 5,
          comment: 'Fantastic repair service, works like brand new!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.averageRating).toBe(4.7);

      const repairer = await User.findById(repairerId);
      expect(repairer.rating).toBe(4.7);
      expect(repairer.ratingCount).toBe(1);
    });

    test('provided review for non-completed request → calls POST /api/reviews → expected 400', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          repairRequestId: activeRequestId,
          qualityRating: 5,
          communicationRating: 5,
          turnaroundRating: 5,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('completed repair jobs');
    });

    test('provided duplicate review for same repair request → calls POST /api/reviews → expected 400', async () => {
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
  });

  // ─── getReviewsForRepairer ────────────────────────────────────────────────
  describe('getReviewsForRepairer', () => {
    test('provided repairerId → calls GET /api/reviews/repairer/:repairerId → expected 200 + list of reviews', async () => {
      const res = await request(app).get(`/api/reviews/repairer/${repairerId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].comment).toContain('Fantastic repair service');
    });
  });
});
