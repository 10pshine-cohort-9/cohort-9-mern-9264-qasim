import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Toast from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createNote, deleteNote, fetchNotes, togglePinned } from '../api/notes.js';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const CARD_ACCENTS = ['accent-indigo', 'accent-teal', 'accent-coral', 'accent-amber', 'accent-plum'];
const TAG_COLORS = ['tag-indigo', 'tag-teal', 'tag-coral', 'tag-amber', 'tag-plum'];

function getCardAccent(id) {
  let hash = 0;
  for (const char of String(id)) {
    hash = (hash + char.codePointAt(0)) % CARD_ACCENTS.length;
  }
  return CARD_ACCENTS[hash];
}

function getTagColor(tag) {
  let hash = 0;
  for (const char of String(tag)) {
    hash = (hash + char.codePointAt(0)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 16) return 'Good afternoon';
  return 'Good evening';
}

function getDisplayName(user) {
  if (user?.name) return user.name;
  if (!user?.email) return '';
  const namePart = user.email.split('@')[0];
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
  const [sortBy, setSortBy] = useState('updated-desc');
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState('');
  const [activeView, setActiveView] = useState('all');

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
      setToast('Note deleted.');
    } catch {
      setError('Could not delete note');
    }
  }

  async function handlePinToggle(note) {
    setError('');
    try {
      const updated = await togglePinned(note._id, !note.pinned);
      setNotes((prev) => prev.map((n) => (n._id === note._id ? updated : n)));
      setToast(updated.pinned ? 'Note pinned.' : 'Note unpinned.');
    } catch {
      setError('Could not update pin status');
    }
  }

  function handleExport() {
    const exportData = notes.map((note) => ({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      pinned: note.pinned || false,
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
    link.remove();
    URL.revokeObjectURL(url);
    setToast('Notes exported.');
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
        throw new TypeError('Invalid file format');
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
        throw new TypeError('No valid notes found in file');
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of validItems) {
        try {
          await createNote(item.title, item.content, Array.isArray(item.tags) ? item.tags : []);
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }

      await loadNotes();

      if (failCount > 0) {
        setError(`Imported ${successCount} of ${validItems.length} notes. ${failCount} failed.`);
      } else {
        setToast(`Imported ${successCount} note${successCount === 1 ? '' : 's'}.`);
      }
    } catch {
      setError('Could not import notes. Make sure the file is a valid export.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  const allTags = useMemo(() => {
    const counts = {};
    for (const note of notes) {
      if (!Array.isArray(note.tags)) continue;
      for (const tag of note.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, count: counts[name], colorClass: getTagColor(name) }));
  }, [notes]);

  const pinnedCount = useMemo(() => notes.filter((note) => note.pinned).length, [notes]);

  const viewFilteredNotes = useMemo(() => {
    if (activeView === 'pinned') {
      return notes.filter((note) => note.pinned);
    }
    if (activeView.startsWith('tag:')) {
      const tagName = activeView.slice(4);
      return notes.filter((note) => Array.isArray(note.tags) && note.tags.includes(tagName));
    }
    return notes;
  }, [notes, activeView]);

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return viewFilteredNotes;

    return viewFilteredNotes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(term);
      const contentMatch = stripHtml(note.content || '').toLowerCase().includes(term);
      const tagMatch = Array.isArray(note.tags) && note.tags.some((tag) => tag.toLowerCase().includes(term));
      return titleMatch || contentMatch || tagMatch;
    });
  }, [viewFilteredNotes, searchTerm]);

  const sortedNotes = useMemo(() => {
    const arr = [...filteredNotes];
    arr.sort((a, b) => {
      const pinDiff = (b.pinned === true) - (a.pinned === true);
      if (pinDiff !== 0) return pinDiff;
      if (sortBy === 'updated-asc') {
        return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    return arr;
  }, [filteredNotes, sortBy]);

  function getViewTitle() {
    if (activeView === 'pinned') return 'Pinned notes';
    if (activeView.startsWith('tag:')) return `#${activeView.slice(4)}`;
    return 'Your notes';
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="dashboard-layout">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          allCount={notes.length}
          pinnedCount={pinnedCount}
          tags={allTags}
        />
        <div className="dashboard-page">
          <div className="dashboard-toolbar">
            <div>
              <p className="dashboard-greeting">
                {getGreeting()}, {getDisplayName(user)}
              </p>
              <h1>{getViewTitle()}</h1>
              <p className="dashboard-tagline">Capture the spark. Keep the thought.</p>
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
            <div className="dashboard-controls">
              <input
                type="text"
                placeholder="Search notes by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dashboard-search-input"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="dashboard-sort-select"
                aria-label="Sort notes"
              >
                <option value="updated-desc">Recently updated</option>
                <option value="updated-asc">Oldest first</option>
                <option value="title-asc">Title A-Z</option>
              </select>
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
          ) : sortedNotes.length === 0 ? (
            <p className="dashboard-status">No notes match your search.</p>
          ) : (
            <ul className="notes-grid">
              {sortedNotes.map((note) => (
                <li key={note._id} className={`note-card ${getCardAccent(note._id)}`}>
                  <Link to={`/notes/${note._id}`} className="note-card-link">
                    <h2>{note.pinned && '📌 '}{note.title}</h2>
                    <p>{stripHtml(note.content).slice(0, 120)}</p>
                    {Array.isArray(note.tags) && note.tags.length > 0 && (
                      <div className="note-card-tags">
                        {note.tags.map((tag) => (
                          <span key={tag} className={`note-card-tag ${getTagColor(tag)}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {formatRelativeTime(note.updatedAt) && (
                      <span className="note-card-time">Edited {formatRelativeTime(note.updatedAt)}</span>
                    )}
                  </Link>
                  <div className="note-card-actions">
                    <button
                      type="button"
                      onClick={() => handlePinToggle(note)}
                      className={`note-card-icon-btn ${note.pinned ? 'active' : ''}`}
                      aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={note.pinned ? 'currentColor' : 'none'}>
                        <path d="M12 17v5M9 10.5V6a3 3 0 0 1 6 0v4.5c0 .3.15.5.4.65l1.3.8c.5.3.8.85.8 1.4v.65a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-.65c0-.55.3-1.1.8-1.4l1.3-.8c.25-.15.4-.35.4-.65Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <Link
                      to={`/notes/${note._id}`}
                      className="note-card-icon-btn"
                      aria-label={`Edit ${note.title}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(note._id)}
                      className="note-card-icon-btn danger"
                      aria-label={`Delete ${note.title}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}

export default Dashboard;
