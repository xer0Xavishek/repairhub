const request = require('supertest');
const app = require('../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('./testHelper');

describe('Interactive Platform Services - Comprehensive Feature Verification Suite', () => {
  let customerUser, repairerUser;
  let customerToken, repairerToken;
  let testRepairRequest;
  let requestId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    // Register test customer
    const custRes = await request(app).post('/api/auth/register').send({
      name: 'Avishek Biswas',
      email: 'avishek@bracu.ac.bd',
      password: 'SecurePassword123!',
      role: 'requester',
      phone: '01711223344',
      address: 'BRAC University Merul Badda, Dhaka',
    });
    customerUser = custRes.body.data;
    customerToken = custRes.body.data.token;

    // Register test repairer
    const repRes = await request(app).post('/api/auth/register').send({
      name: 'Master Rafiq',
      email: 'rafiq@repairhub.com',
      password: 'SecurePassword123!',
      role: 'repairer',
      phone: '01811223344',
      address: 'Mohakhali C/A, Dhaka',
      businessName: 'Master Rafiq Electronics & Precision Lab',
      categories: ['Electronics', 'Home Appliances'],
    });
    repairerUser = repRes.body.data;
    repairerToken = repRes.body.data.token;

    // Create a repair request
    const reqRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        itemTitle: 'Samsung Smart Microwave (28L)',
        itemDescription: 'Samsung 28L digital solo microwave oven.',
        category: 'Home Appliances',
        issueDescription: 'Loud electrical arcing & burnt waveguide cover plate.',
        preferredMethod: 'drop-off',
      });
    testRepairRequest = reqRes.body.data;
    requestId = testRepairRequest._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 1: Landing Page & Design System Standards
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 1: Landing Page & Ares Design System Tokens', () => {
    test('verifies design tokens consistency in frontend source', () => {
      const fs = require('fs');
      const path = require('path');
      const landingSrc = fs.readFileSync(path.join(__dirname, '../client/src/components/LandingPage.jsx'), 'utf8');
      
      // Check for primary terracotta color and onEvents wire-up
      expect(landingSrc).toContain('#CB4D22');
      expect(landingSrc).toContain('onEvents');
      expect(landingSrc).toContain('hero-top-grid');
      expect(landingSrc).toContain('hero-mid-grid');
      expect(landingSrc).toContain('showcase-cards-grid');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 2: Interactive Geolocation Map (Leaflet & Haversine Distance)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 2: Interactive Geolocation Map & Haversine Calculations', () => {
    function calculateHaversineKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    test('correctly calculates Haversine distance between Merul Badda and Mohakhali', () => {
      const merulBadda = [23.7712, 90.4255];
      const mohakhali = [23.7781, 90.3995];
      const dist = calculateHaversineKm(merulBadda[0], merulBadda[1], mohakhali[0], mohakhali[1]);
      
      // Distance is ~2.75 km in Dhaka city
      expect(dist).toBeGreaterThan(2.0);
      expect(dist).toBeLessThan(4.0);
    });

    test('verifies InteractiveMap component has Ares terracotta circle and action buttons', () => {
      const fs = require('fs');
      const path = require('path');
      const mapSrc = fs.readFileSync(path.join(__dirname, '../client/src/components/InteractiveMap.jsx'), 'utf8');
      
      expect(mapSrc).toContain("color: '#CB4D22'");
      expect(mapSrc).toContain('calculateHaversineKm');
      expect(mapSrc).toContain('Book Slot');
      expect(mapSrc).toContain('Reset Filters');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 3: AI Repair Copilot (RAG & Guardrails)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 3: AI Repair Copilot Diagnostics', () => {
    test('POST /api/ai/diagnose with hardware symptom returns structured repair triage report', async () => {
      const res = await request(app)
        .post('/api/ai/diagnose')
        .send({
          query: 'Microwave sparks visibly on right interior wall near the mica card',
          category: 'Home Appliances',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.defect_type).toBeDefined();
      expect(res.body.data.triage_steps).toBeInstanceOf(Array);
      expect(res.body.data.triage_steps.length).toBeGreaterThan(0);
    });

    test('POST /api/ai/diagnose with off-topic query triggers pre-flight guardrail refusal', async () => {
      const res = await request(app)
        .post('/api/ai/diagnose')
        .send({
          query: 'Write me a poem about the rainy weather in Dhaka',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_repair_related).toBe(false);
      expect(res.body.data.refusal_reason).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 4: AI Vision Damage Assessment
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 4: AI Vision Damage Assessment', () => {
    test('POST /api/ai/visual-assessment returns damage metrics and repairability status', async () => {
      const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
      const res = await request(app)
        .post('/api/ai/visual-assessment')
        .send({
          itemTitle: 'Sony Bravia 4K LED TV',
          category: 'Electronics',
          imageData: sampleBase64,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item_analyzed).toBe('Sony Bravia 4K LED TV');
      expect(res.body.data.severity_score).toBeDefined();
      expect(res.body.data.is_repairable).toBe(true);
      expect(res.body.data.estimated_price_range).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 5: Stripe Payment Gateway & Escrow Initiation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 5: Stripe Payment Gateway & Escrow', () => {
    test('POST /api/payments/initiate creates payment transaction with HELD_IN_ESCROW escrowStatus', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          repairRequestId: requestId,
          amount: 750,
          currency: 'BDT',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escrowStatus).toBe('HELD_IN_ESCROW');
      expect(res.body.data.amount).toBe(750);
    });

    test('GET /api/payments/request/:requestId requires valid JWT authorization', async () => {
      const unauthRes = await request(app)
        .get(`/api/payments/request/${requestId}`);
      expect(unauthRes.statusCode).toBe(401);

      const authRes = await request(app)
        .get(`/api/payments/request/${requestId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(authRes.statusCode).toBe(200);
      expect(authRes.body.success).toBe(true);
      expect(authRes.body.data.escrowStatus).toBe('HELD_IN_ESCROW');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 6: Socket.io Real-Time Chat & Message Persistence
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 6: Socket.io Real-Time Chat & History Persistence', () => {
    test('POST /api/chat/messages persists message and returns 201', async () => {
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          repairRequestId: requestId,
          receiverId: repairerUser._id,
          content: 'Hello Master Rafiq, when can I bring the microwave in?',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('when can I bring the microwave in?');
    });

    test('GET /api/chat/request/:requestId returns full conversation thread', async () => {
      const res = await request(app)
        .get(`/api/chat/request/${requestId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // FEATURE 7: User-Reported Bugs 13-17 Regression Verification
  // ════════════════════════════════════════════════════════════════════════════
  describe('Feature 7: Verification of Bugs 13–17', () => {
    let secondRepairerUser, secondRepairerToken;
    let completedRequestId;

    beforeAll(async () => {
      // Register a second repairer to test competitor bid privacy
      const rep2Res = await request(app).post('/api/auth/register').send({
        name: 'Dhaka Bike Doctor',
        email: 'bikedoctor@repairhub.com',
        password: 'SecurePassword123!',
        role: 'repairer',
        phone: '01911223344',
        address: 'Banani, Dhaka',
        businessName: 'Dhaka Cycle & Gear Hub',
        categories: ['Mechanical'],
      });
      secondRepairerUser = rep2Res.body.data;
      secondRepairerToken = rep2Res.body.data.token;
    });

    test('Bug 13: In audit log, repairer cannot see other repairers bids', async () => {
      // Repairer 1 bids
      await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          repairRequestId: requestId,
          price: 1200,
          estimatedDays: 2,
          message: 'Can fix microwave today',
        });

      // Repairer 2 bids
      await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${secondRepairerToken}`)
        .send({
          repairRequestId: requestId,
          price: 950,
          estimatedDays: 3,
          message: 'Alternative bid from competitor',
        });

      // Repairer 1 fetches audit log
      const resRep1 = await request(app)
        .get(`/api/repairs/${requestId}/history`)
        .set('Authorization', `Bearer ${repairerToken}`);

      expect(resRep1.statusCode).toBe(200);
      const quotesInLog1 = resRep1.body.data.filter((item) => item.changeType === 'QUOTE_SUBMITTED');
      // Repairer 1 must only see their own quote
      expect(quotesInLog1.length).toBe(1);
      expect(quotesInLog1[0].actorId._id.toString()).toBe(repairerUser._id.toString());
      expect(quotesInLog1[0].note).toContain('1200');

      // Customer sees both bids in audit log
      const resCust = await request(app)
        .get(`/api/repairs/${requestId}/history`)
        .set('Authorization', `Bearer ${customerToken}`);

      const quotesInCustLog = resCust.body.data.filter((item) => item.changeType === 'QUOTE_SUBMITTED');
      expect(quotesInCustLog.length).toBe(2);
    });

    test('Bug 16: Declining a bid persists and excludes the order from repairer query', async () => {
      // Create a fresh request
      const newReq = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          itemTitle: 'Electric Blender',
          itemDescription: 'Philips Blender motor buzzing',
          category: 'Home Appliances',
          issueDescription: 'Blades stuck',
        });
      const declineTargetId = newReq.body.data._id;

      // Repairer 1 declines the order
      const declineRes = await request(app)
        .put(`/api/repairs/${declineTargetId}/decision`)
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({ decision: 'rejected' });

      expect(declineRes.statusCode).toBe(200);

      // Repairer 1 queries repair requests
      const repRequestsRes = await request(app)
        .get('/api/repairs')
        .set('Authorization', `Bearer ${repairerToken}`);

      expect(repRequestsRes.statusCode).toBe(200);
      const foundInList = repRequestsRes.body.data.some((r) => r._id === declineTargetId);
      expect(foundInList).toBe(false);
    });

    test('Bug 17: Workshops or freelancers cannot book diagnostic appointment slots', async () => {
      const scheduledTime = new Date(Date.now() + 86400000 * 2).toISOString();
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${repairerToken}`)
        .send({
          repairerId: secondRepairerUser._id,
          scheduledTime,
          durationMinutes: 90,
          type: 'In-Shop Diagnostic',
        });

      expect(bookingRes.statusCode).toBe(403);
      expect(bookingRes.body.success).toBe(false);
      expect(bookingRes.body.message).toContain('cannot book diagnostic appointment slots');
    });

    test('Bug 14 & 15: 1-star review accurately calculates rating and cannot be published multiple times', async () => {
      // Create completed repair request for review testing
      const compReq = await request(app)
        .post('/api/repairs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          itemTitle: 'Ceiling Fan',
          itemDescription: 'Slow speed',
          category: 'Home Appliances',
          issueDescription: 'Capacitor replacement',
        });
      completedRequestId = compReq.body.data._id;

      // Assign to repairer and mark as Completed
      await request(app)
        .put(`/api/repairs/${completedRequestId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Quoted' });

      await request(app)
        .put(`/api/repairs/${completedRequestId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'In Progress' });

      await request(app)
        .put(`/api/repairs/${completedRequestId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Ready for Pickup' });

      await request(app)
        .put(`/api/repairs/${completedRequestId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Completed' });

      // Customer publishes 1-star review
      const revRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          repairRequestId: completedRequestId,
          repairerId: repairerUser._id,
          qualityRating: 1,
          communicationRating: 1,
          turnaroundRating: 1,
          comment: 'Not satisfied with speed.',
        });

      expect(revRes.statusCode).toBe(201);
      expect(revRes.body.data.averageRating).toBe(1.0);

      // Verify repairer profile rating reflects 1.0
      const repProfileRes = await request(app).get(`/api/reviews/repairer/${repairerUser._id}`);
      expect(repProfileRes.statusCode).toBe(200);
      expect(repProfileRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(repProfileRes.body.data[0].averageRating).toBe(1.0);

      // Bug 14: Submitting review again for the same request must be blocked
      const dupRevRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          repairRequestId: completedRequestId,
          repairerId: repairerUser._id,
          qualityRating: 5,
          comment: 'Trying to change review',
        });

      expect(dupRevRes.statusCode).toBe(400);
      expect(dupRevRes.body.success).toBe(false);
      expect(dupRevRes.body.message).toContain('already been published');
    });
  });
});
