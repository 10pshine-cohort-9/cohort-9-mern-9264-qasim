import { useEffect, useState } from 'react';

import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchNotes } from '../api/notes.js';
import { updateProfile } from '../api/auth.js';

function Profile() {
  const { user, updateUser } = useAuth();

  const [noteCount, setNoteCount] = useState(null);
  const [error, setError] = useState('');
  const [countFailed, setCountFailed] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    async function loadCount() {
      try {
        const notes = await fetchNotes();
        setNoteCount(notes.length);
      } catch {
        setError('Could not load note count');
        setCountFailed(true);
      }
    }

    loadCount();
  }, []);

  async function handleNameSave(e) {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!name.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    setNameSaving(true);
    try {
      const data = await updateProfile({ name: name.trim() });
      updateUser({ ...user, name: data.user.name });
      setNameSuccess('Name updated.');
    } catch (err) {
      setNameError(err.message || 'Could not update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Could not change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="profile-page">
        <h1>Profile</h1>

        {error && <p className="auth-error">{error}</p>}

        <div className="profile-card">
          <div className="profile-field">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Total notes</span>
            <span className="profile-value">
              {countFailed ? 'Unavailable' : noteCount === null ? 'Loading...' : noteCount}
            </span>
          </div>
        </div>

        <h2 className="profile-section-title">Display name</h2>
        <form onSubmit={handleNameSave} className="profile-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="note-title-input"
          />
          {nameError && <p className="auth-error">{nameError}</p>}
          {nameSuccess && <p className="profile-success">{nameSuccess}</p>}
          <button type="submit" className="btn-primary" disabled={nameSaving}>
            {nameSaving ? 'Saving...' : 'Save name'}
          </button>
        </form>

        <h2 className="profile-section-title">Change password</h2>
        <form onSubmit={handlePasswordSave} className="profile-form">
          <label htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="profile-hint">At least 8 characters, including one special character.</p>
          <label htmlFor="confirmNewPassword">Confirm new password</label>
          <input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          {passwordError && <p className="auth-error">{passwordError}</p>}
          {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}
          <button type="submit" className="btn-primary" disabled={passwordSaving}>
            {passwordSaving ? 'Saving...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
