const mongoose = require('mongoose');

const Note = require('../models/Note');

function notFoundError() {
  const err = new Error('Note not found');
  err.statusCode = 404;
  return err;
}

function forbiddenError() {
  const err = new Error('Not authorized to access this note');
  err.statusCode = 403;
  return err;
}

function normalizePinned(pinned) {
  if (pinned === true || pinned === false) return pinned;
  if (pinned === 'true') return true;
  if (pinned === 'false') return false;
  return undefined;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 10);
}

async function createNote(req, res, next) {
  try {
    const { title, content, tags, pinned } = req.body;

    if (!title || !content) {
      const err = new Error('Title and content are required');
      err.statusCode = 400;
      throw err;
    }

    const note = await Note.create({
      title,
      content,
      tags: normalizeTags(tags),
      pinned: normalizePinned(pinned) ?? false,
      owner: req.user.id,
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function getNotes(req, res, next) {
  try {
    const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
}

async function getNoteById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw notFoundError();

    const note = await Note.findById(req.params.id);

    if (!note) throw notFoundError();
    if (note.owner.toString() !== req.user.id) throw forbiddenError();

    res.json(note);
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw notFoundError();

    const note = await Note.findById(req.params.id);

    if (!note) throw notFoundError();
    if (note.owner.toString() !== req.user.id) throw forbiddenError();

    const { title, content, tags, pinned } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = normalizeTags(tags);
    const normalizedPinned = normalizePinned(pinned);
    if (normalizedPinned !== undefined) note.pinned = normalizedPinned;

    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw notFoundError();

    const note = await Note.findById(req.params.id);

    if (!note) throw notFoundError();
    if (note.owner.toString() !== req.user.id) throw forbiddenError();

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createNote, getNotes, getNoteById, updateNote, deleteNote };
