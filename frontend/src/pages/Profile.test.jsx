import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Profile from './Profile.jsx';
import * as notesApi from '../api/notes.js';
import { useAuth } from '../context/AuthContext.jsx';

jest.mock('../api/notes.js', () => ({
  fetchNotes: jest.fn(),
  fetchNoteById: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

jest.mock('../api/auth.js', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

describe('Profile', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { email: 'qasim@example.com' },
      logout: jest.fn(),
      updateUser: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays the user email', async () => {
    notesApi.fetchNotes.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    try {
      expect(await screen.findByText('qasim@example.com')).toBeInTheDocument();
    } catch (err) {
      console.error('displays the user email: assertion failed', err);
      throw err;
    }
  });

  test('displays the correct note count', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'Note 1', content: 'a' },
      { _id: '2', title: 'Note 2', content: 'b' },
      { _id: '3', title: 'Note 3', content: 'c' },
    ]);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    try {
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    } catch (err) {
      console.error('displays the correct note count: assertion failed', err);
      throw err;
    }
  });

  test('shows an error if note count cannot be loaded', async () => {
    notesApi.fetchNotes.mockRejectedValue(new Error('network error'));

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    try {
      expect(await screen.findByText(/could not load note count/i)).toBeInTheDocument();
    } catch (err) {
      console.error('shows an error if note count cannot be loaded: assertion failed', err);
      throw err;
    }
  });
});
