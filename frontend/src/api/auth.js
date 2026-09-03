import api from './axios.js';

function normalizeError(err) {
  const message = err?.response?.data?.message || 'Request failed';
  const normalized = new Error(message);
  normalized.statusCode = err?.response?.status;
  return normalized;
}

export async function updateProfile({ name, currentPassword, newPassword }) {
  try {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (currentPassword !== undefined) payload.currentPassword = currentPassword;
    if (newPassword !== undefined) payload.newPassword = newPassword;

    const res = await api.put('/api/auth/profile', payload);
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
}
