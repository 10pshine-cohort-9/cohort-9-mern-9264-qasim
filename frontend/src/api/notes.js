import api from './axios.js';

function normalizeError(err) {
  const message = err?.response?.data?.message || 'Request failed';
  const normalized = new Error(message);
  normalized.statusCode = err?.response?.status;
  return normalized;
}

export async function fetchNotes() {
  try {
    const res = await api.get('/api/notes');
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function fetchNoteById(id) {
  try {
    const res = await api.get(`/api/notes/${id}`);
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function createNote(title, content, tags = [], pinned = false) {
  try {
    const res = await api.post('/api/notes', { title, content, tags, pinned });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function updateNote(id, title, content, tags = [], pinned = undefined) {
  try {
    const payload = { title, content, tags };
    if (pinned !== undefined) payload.pinned = pinned;
    const res = await api.put(`/api/notes/${id}`, payload);
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function togglePinned(id, pinned) {
  try {
    const res = await api.put(`/api/notes/${id}`, { pinned });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function deleteNote(id) {
  try {
    const res = await api.delete(`/api/notes/${id}`);
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}
