import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from './Dashboard.jsx';
import * as notesApi from '../api/notes.js';
import { useAuth } from '../context/AuthContext.jsx';

jest.mock('../api/notes.js', () => ({
  fetchNotes: jest.fn(),
  fetchNoteById: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { email: 'qasim@example.com' },
      logout: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows empty state when there are no notes', async () => {
    notesApi.fetchNotes.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/no notes yet/i)).toBeInTheDocument();
  });

  test('renders a list of notes', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'First note', content: '<p>Hello world</p>' },
      { _id: '2', title: 'Second note', content: '<p>Another one</p>' },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  test('deletes a note after confirmation', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'First note', content: '<p>Hello world</p>' },
    ]);
    notesApi.deleteNote.mockResolvedValue({ message: 'Note deleted' });
    window.confirm = jest.fn(() => true);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const deleteButton = await screen.findByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(notesApi.deleteNote).toHaveBeenCalledWith('1');
    });
  });
});
