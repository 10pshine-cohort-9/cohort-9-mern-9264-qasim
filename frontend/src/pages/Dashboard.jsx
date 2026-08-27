import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createNote, deleteNote, fetchNotes } from '../api/notes.js';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const CARD_ACCENTS = ['accent-indigo', 'accent-teal', 'accent-coral', 'accent-amber', 'accent-plum'];

function getCardAccent(id) {
  let hash = 0;
  for (const char of String(id)) {
    hash = (hash + char.charCodeAt(0)) % CARD_ACCENTS.length;
  }
  return CARD_ACCENTS[hash];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(email) {
  if (!email) return '';
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function formatRelativeTime(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Dashboard() {
  const { user } = useAuth();
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
    <div className="app-shell">
      <AppHeader />
      <div className="dashboard-page">
        <div className="dashboard-toolbar">
          <div>
            <p className="dashboard-greeting">{getGreeting()}, {getDisplayName(user?.email)}</p>
            <h1>Your notes</h1>
          </div>
          <div className="dashboard-toolbar-actions">
            <Link to="/notes/new" className="btn-primary">+ New note</Link>
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
          </div>
        </div>

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
          <p className="dashboard-status">Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M8 12h8M8 15.5h8M8 8.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="empty-state-title">No notes yet</p>
            <p className="empty-state-subtitle">Create your first note to get started.</p>
            <Link to="/notes/new" className="btn-primary">+ New note</Link>
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="dashboard-status">No notes match your search.</p>
        ) : (
          <ul className="notes-grid">
            {filteredNotes.map((note) => (
              <li key={note._id} className={`note-card ${getCardAccent(note._id)}`}>
                <Link to={`/notes/${note._id}`} className="note-card-link">
                  <h2>{note.title}</h2>
                  <p>{stripHtml(note.content).slice(0, 120)}</p>
                  {formatRelativeTime(note.updatedAt) && (
                    <span className="note-card-time">Edited {formatRelativeTime(note.updatedAt)}</span>
                  )}
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
    </div>
  );
}

export default Dashboard;
