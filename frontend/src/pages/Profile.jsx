import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { fetchNotes } from '../api/notes.js';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [noteCount, setNoteCount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCount() {
      try {
        const notes = await fetchNotes();
        setNoteCount(notes.length);
      } catch {
        setError('Could not load note count');
      }
    }

    loadCount();
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="profile-page">
      <Link to="/dashboard" className="profile-back-link">&larr; Back to Notes</Link>

      <h1>Profile</h1>

      {error && <p className="auth-error">{error}</p>}

      <div className="profile-card">
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Total Notes</span>
          <span className="profile-value">{noteCount === null ? 'Loading...' : noteCount}</span>
        </div>
      </div>

      <button type="button" onClick={handleLogout} className="btn-secondary">
        Logout
      </button>
    </div>
  );
}

export default Profile;
