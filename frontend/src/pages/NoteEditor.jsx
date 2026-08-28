import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import TagInput from '../components/TagInput.jsx';
import { createNote, fetchNoteById, updateNote } from '../api/notes.js';

function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      setTitle('');
      setContent('');
      setTags([]);
      setError('');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    async function loadNote() {
      try {
        const note = await fetchNoteById(id);
        if (!active) return;
        if (!note || typeof note.title !== 'string' || typeof note.content !== 'string') {
          throw new Error('Invalid note data');
        }
        setTitle(note.title);
        setContent(note.content);
        setTags(Array.isArray(note.tags) ? note.tags : []);
      } catch {
        if (active) setError('Could not load note');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNote();

    return () => {
      active = false;
    };
  }, [id, isEditing]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateNote(id, title, content, tags);
      } else {
        await createNote(title, content, tags);
      }
      navigate('/dashboard');
    } catch {
      setError('Could not save note');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="note-editor-page">
        {loading ? (
          <p className="dashboard-status">Loading note...</p>
        ) : (
          <>
            <h1>{isEditing ? 'Edit note' : 'New note'}</h1>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSave} className="note-editor-form">
              <input
                type="text"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="note-title-input"
              />
              <TagInput tags={tags} onChange={setTags} />
              <RichTextEditor content={content} onChange={setContent} />
              <div className="note-editor-actions">
                <button type="button" onClick={handleCancel} disabled={saving} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default NoteEditor;
