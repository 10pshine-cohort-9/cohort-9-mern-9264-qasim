require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const { expect } = require('chai');

const app = require('../src/app');
const User = require('../src/models/User');

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'Password123!';

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

    it('rejects a password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `short-${Date.now()}@example.com`, password: 'Ab1!' });

      expect(res.status).to.equal(400);
    });

    it('rejects a password without a special character', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `nospecial-${Date.now()}@example.com`, password: 'Password123' });

      expect(res.status).to.equal(400);
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

  describe('PUT /api/auth/profile', () => {
    let token;

    before(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      token = res.body.token;
    });

    it('rejects the request without a token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'No Auth' });

      expect(res.status).to.equal(401);
    });

    it('updates the user\'s name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Qasim Ali' });

      expect(res.status).to.equal(200);
      expect(res.body.user.name).to.equal('Qasim Ali');
    });

    it('rejects setting a new password without currentPassword', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'NewPassword1!' });

      expect(res.status).to.equal(400);
    });

    it('rejects a weak new password', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: testPassword, newPassword: 'weak' });

      expect(res.status).to.equal(400);
    });

    it('rejects an incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongCurrent1!', newPassword: 'NewPassword1!' });

      expect(res.status).to.equal(401);
    });

    it('changes the password successfully and the new password works on login', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: testPassword, newPassword: 'NewPassword1!' });

      expect(res.status).to.equal(200);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'NewPassword1!' });

      expect(loginRes.status).to.equal(200);
    });
  });
});
