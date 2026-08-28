import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { createNote, deleteNote, fetchNotes } from '../api/notes.js';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const requestIdRef = useRef(0);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const data = await fetchNotes();
      if (requestId !== requestIdRef.current) return;
      setNotes(data);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Could not load notes');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
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

  function handleExport() {
    const exportData = notes.map((note) => ({
      title: note.title,
      content: note.content,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setImporting(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error('Invalid file format');
      }

      const validItems = parsed.filter(
        (item) =>
          item &&
          typeof item.title === 'string' &&
          item.title.trim() &&
          typeof item.content === 'string' &&
          item.content.trim()
      );

      if (validItems.length === 0) {
        throw new Error('No valid notes found in file');
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of validItems) {
        try {
          await createNote(item.title, item.content);
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }

      await loadNotes();

      if (failCount > 0) {
        setError(`Imported ${successCount} of ${validItems.length} notes. ${failCount} failed.`);
      }
    } catch {
      setError('Could not import notes. Make sure the file is a valid export.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
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
          <button type="button" onClick={handleExport} className="btn-secondary" disabled={notes.length === 0}>
            Export
          </button>
          <button type="button" onClick={handleImportClick} className="btn-secondary" disabled={importing}>
            {importing ? 'Importing...' : 'Import'}
          </button>
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            onChange={handleImportFile}
            style={{ display: 'none' }}
            data-testid="import-file-input"
          />
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
