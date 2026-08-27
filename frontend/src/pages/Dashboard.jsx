import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { deleteNote, fetchNotes } from '../api/notes.js';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch {
      setError('Could not load notes');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Delete this note? This cannot be undone.');
    if (!confirmed) return;

    setError('');
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((note) => note._id !== id));
    } catch {
      setError('Could not delete note');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return notes;

    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(term);
      const contentMatch = stripHtml(note.content || '').toLowerCase().includes(term);
      return titleMatch || contentMatch;
    });
  }, [notes, searchTerm]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Your Notes</h1>
          {user?.email && <p className="dashboard-user">{user.email}</p>}
        </div>
        <div className="dashboard-header-actions">
          <Link to="/notes/new" className="btn-primary">+ New Note</Link>
          <button type="button" onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </header>

      {notes.length > 0 && (
        <div className="dashboard-search">
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dashboard-search-input"
          />
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="dashboard-empty">No notes yet. Create your first one.</p>
      ) : filteredNotes.length === 0 ? (
        <p className="dashboard-empty">No notes match your search.</p>
      ) : (
        <ul className="notes-grid">
          {filteredNotes.map((note) => (
            <li key={note._id} className="note-card">
              <Link to={`/notes/${note._id}`} className="note-card-link">
                <h2>{note.title}</h2>
                <p>{stripHtml(note.content).slice(0, 120)}</p>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(note._id)}
                className="note-card-delete"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
