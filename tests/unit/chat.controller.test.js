const request = require('supertest');
const app = require('../../server/src/app');
const { connectTestDB, closeTestDB, clearTestDB } = require('../testHelper');

describe('ChatController Unit Test Suite', () => {
  let senderToken;
  let receiverId;
  let requestId;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    const u1 = await request(app).post('/api/auth/register').send({
      name: 'Chat Sender',
      email: 'chat_sender@repairhub.com',
      password: 'Password123!',
      role: 'requester',
    });
    senderToken = u1.body.data.token;

    const u2 = await request(app).post('/api/auth/register').send({
      name: 'Chat Receiver',
      email: 'chat_receiver@repairhub.com',
      password: 'Password123!',
      role: 'repairer',
    });
    receiverId = u2.body.data._id;

    const rRes = await request(app)
      .post('/api/repairs')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        itemTitle: 'Laptop Display Flickering',
        itemDescription: 'OLED screen cable issue.',
        category: 'Electronics',
        issueDescription: 'Ribbon connector loose.',
      });
    requestId = rRes.body.data._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ─── sendMessage ─────────────────────────────────────────────────────────
  describe('sendMessage', () => {
    test('provided message payload → calls POST /api/chat/messages → expected 201 + message object', async () => {
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          repairRequestId: requestId,
          receiverId,
          content: 'Hello, can you inspect the ribbon cable today?',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello, can you inspect the ribbon cable today?');
      expect(res.body.data.repairRequestId).toBe(requestId);
    });

    test('provided missing required fields → calls POST /api/chat/messages → expected 400', async () => {
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          content: 'Incomplete message payload',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('provided completed repair request → calls POST /api/chat/messages → expected 400 + chat closed error', async () => {
      const RepairRequest = require('../../server/src/models/RepairRequest');
      await RepairRequest.findByIdAndUpdate(requestId, { status: 'Completed' });

      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          repairRequestId: requestId,
          receiverId,
          content: 'Should fail because order is completed',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('completed');
    });
  });

  // ─── getMessagesByRequest ─────────────────────────────────────────────────
  describe('getMessagesByRequest', () => {
    test('provided requestId → calls GET /api/chat/request/:requestId → expected 200 + list of chat messages', async () => {
      const res = await request(app)
        .get(`/api/chat/request/${requestId}`)
        .set('Authorization', `Bearer ${senderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].content).toBe('Hello, can you inspect the ribbon cable today?');
    });
  });
});
