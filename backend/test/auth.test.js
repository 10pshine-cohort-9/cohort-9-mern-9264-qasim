// These tests connect to the same MongoDB instance used in development
// (MONGO_URI from backend/.env) rather than an in-memory database, to avoid
// the extra binary-download dependency of mongodb-memory-server. Test users
// are created with a unique, timestamped email and removed again in the
// after() hook so they don't linger in the database.

require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const { expect } = require('chai');

const app = require('../src/app');
const User = require('../src/models/User');

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Auth routes', () => {
  before(async () => {
    try {
      const uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
      await mongoose.connect(uri);
    } catch (err) {
      throw err;
    }
  });

  after(async () => {
    try {
      await User.deleteMany({ email: testEmail });
    } finally {
      await mongoose.connection.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).to.equal(201);
      expect(res.body.token).to.be.a('string');
      expect(res.body.user.email).to.equal(testEmail);
      expect(res.body.user).to.not.have.property('password');
    });

    it('rejects registration with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).to.equal(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).to.equal(200);
      expect(res.body.token).to.be.a('string');
      expect(res.body.user.email).to.equal(testEmail);
    });

    it('rejects login with the wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).to.equal(401);
    });

    it('rejects login with a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `nobody-${Date.now()}@example.com`, password: testPassword });

      expect(res.status).to.equal(401);
    });
  });
});
