import { useEffect, useState } from 'react';

import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchNotes } from '../api/notes.js';

function Profile() {
  const { user } = useAuth();

  const [noteCount, setNoteCount] = useState(null);
  const [error, setError] = useState('');
  const [countFailed, setCountFailed] = useState(false);

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
      </div>
    </div>
  );
}

export default Profile;
