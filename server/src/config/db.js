const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repairhub';
    const conn = await mongoose.connect(connUri, { serverSelectionTimeoutMS: 2000 });
    const ensureSeeded = async () => {
      if (process.env.NODE_ENV !== 'test') {
        try {
          const User = require('../models/User');
          const count = await User.countDocuments();
          if (count === 0) {
            console.log('[MongoDB] Empty database detected. Seeding verified accounts...');
            const seedDatabase = require('../utils/seedData');
            await seedDatabase();
          }
        } catch (seedErr) {
          console.warn('[MongoDB Seed Notice]:', seedErr.message);
        }
      }
    };

    if (conn) {
      await ensureSeeded();
    }
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Local daemon offline (${error.message}). Starting embedded In-Memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB Embedded] Connected to In-Memory instance: ${uri}`);
      if (process.env.NODE_ENV !== 'test') {
        try {
          const User = require('../models/User');
          const count = await User.countDocuments();
          if (count === 0) {
            console.log('[MongoDB] Empty database detected. Seeding verified accounts...');
            const seedDatabase = require('../utils/seedData');
            await seedDatabase();
          }
        } catch (seedErr) {
          console.warn('[MongoDB Seed Notice]:', seedErr.message);
        }
      }
      return conn;
    } catch (inMemErr) {
      console.error(`[MongoDB Error] Failed to start in-memory Mongo: ${inMemErr.message}`);
    }
  }
};

module.exports = connectDB;
