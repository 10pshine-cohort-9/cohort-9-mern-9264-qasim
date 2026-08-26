// These tests connect to the same MongoDB instance used in development
// (MONGO_URI from backend/.env) rather than an in-memory database, to avoid
// the extra binary-download dependency of mongodb-memory-server. Test users
// and notes are created with unique, timestamped identifiers and removed
// again in the after() hook so they don't linger in the database.

require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const { expect } = require('chai');

const app = require('../src/app');
const User = require('../src/models/User');
const Note = require('../src/models/Note');

const userAEmail = `notes-test-a-${Date.now()}@example.com`;
const userBEmail = `notes-test-b-${Date.now()}@example.com`;
const password = 'password123';

let tokenA;
let tokenB;
let userAId;
let userBId;

describe('Notes routes', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const registerA = await request(app)
      .post('/api/auth/register')
      .send({ email: userAEmail, password });
    tokenA = registerA.body.token;
    userAId = registerA.body.user.id;

    const registerB = await request(app)
      .post('/api/auth/register')
      .send({ email: userBEmail, password });
    tokenB = registerB.body.token;
    userBId = registerB.body.user.id;
  });

  after(async () => {
    await Note.deleteMany({ owner: { $in: [userAId, userBId] } });
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await mongoose.connection.close();
  });

  describe('POST /api/notes', () => {
    it('creates a note while authenticated', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'First note', content: 'Some content' });

      expect(res.status).to.equal(201);
      expect(res.body.title).to.equal('First note');
      expect(res.body.owner).to.equal(userAId);
    });

    it('rejects note creation without a token', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'No auth', content: 'Should fail' });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/notes', () => {
    it("lists only the authenticated user's own notes", async () => {
      await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'User B note', content: 'Belongs to B' });

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).to.equal(200);
      expect(res.body.every((note) => note.owner === userAId)).to.equal(true);
    });
  });

  describe('GET /api/notes/:id', () => {
    let noteId;

    before(async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Fetchable note', content: 'Content here' });
      noteId = res.body._id;
    });

    it('gets a note by id successfully', async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).to.equal(200);
      expect(res.body._id).to.equal(noteId);
    });

    it('rejects getting a note that belongs to another user', async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).to.equal(403);
    });

    it('returns 404 for a note that does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/notes/${missingId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let noteId;

    before(async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Original title', content: 'Original content' });
      noteId = res.body._id;
    });

    it('updates a note successfully', async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated title' });

      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal('Updated title');
      expect(res.body.content).to.equal('Original content');
    });

    it('returns 404 when updating a note that does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/notes/${missingId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Does not matter' });

      expect(res.status).to.equal(404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let noteId;

    before(async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'To be deleted', content: 'Content' });
      noteId = res.body._id;
    });

    it('deletes a note successfully', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Note deleted');
    });

    it('returns 404 when deleting a note that does not exist', async () => {
      const missingId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/notes/${missingId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).to.equal(404);
    });
  });
});
