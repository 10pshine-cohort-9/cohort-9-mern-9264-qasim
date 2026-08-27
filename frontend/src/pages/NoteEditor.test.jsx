import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import NoteEditor from './NoteEditor.jsx';
import * as notesApi from '../api/notes.js';

jest.mock('../api/notes.js', () => ({
  fetchNotes: jest.fn(),
  fetchNoteById: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.mock('../components/RichTextEditor.jsx', () => {
  return function MockRichTextEditor({ content, onChange }) {
    return (
      <textarea
        data-testid="mock-editor"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

function renderNewNote() {
  return render(
    <MemoryRouter initialEntries={['/notes/new']}>
      <Routes>
        <Route path="/notes/new" element={<NoteEditor />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NoteEditor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows validation error when saving without title or content', async () => {
    renderNewNote();

    fireEvent.click(screen.getByText('Save'));

    expect(await screen.findByText(/title and content are required/i)).toBeInTheDocument();
    expect(notesApi.createNote).not.toHaveBeenCalled();
  });

  test('creates a new note with title and content', async () => {
    notesApi.createNote.mockResolvedValue({ _id: '1', title: 'My note', content: 'Hello' });

    renderNewNote();

    fireEvent.change(screen.getByPlaceholderText('Note title'), {
      target: { value: 'My note' },
    });
    fireEvent.change(screen.getByTestId('mock-editor'), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(notesApi.createNote).toHaveBeenCalledWith('My note', 'Hello');
    });
  });
});
