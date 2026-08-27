import api from './axios.js';

export async function fetchNotes() {
  const res = await api.get('/api/notes');
  return res.data;
}

export async function fetchNoteById(id) {
  const res = await api.get(`/api/notes/${id}`);
  return res.data;
}

export async function createNote(title, content) {
  const res = await api.post('/api/notes', { title, content });
  return res.data;
}

export async function updateNote(id, title, content) {
  const res = await api.put(`/api/notes/${id}`, { title, content });
  return res.data;
}

export async function deleteNote(id) {
  const res = await api.delete(`/api/notes/${id}`);
  return res.data;
}
