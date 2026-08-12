const mongoose = require('mongoose');

beforeAll(async () => {
  const testMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repairhub_test';
  await mongoose.connect(testMongoUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Drop test database and close connection
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {}
    await mongoose.connection.close();
  }
});
