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

  test('filters notes by title as the user types', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'Grocery list', content: '<p>Milk and eggs</p>' },
      { _id: '2', title: 'Meeting notes', content: '<p>Discuss budget</p>' },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Grocery list');

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    fireEvent.change(searchInput, { target: { value: 'grocery' } });

    expect(screen.getByText('Grocery list')).toBeInTheDocument();
    expect(screen.queryByText('Meeting notes')).not.toBeInTheDocument();
  });

  test('filters notes by content when title does not match', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'Grocery list', content: '<p>Milk and eggs</p>' },
      { _id: '2', title: 'Meeting notes', content: '<p>Discuss budget</p>' },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Grocery list');

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    fireEvent.change(searchInput, { target: { value: 'budget' } });

    expect(screen.getByText('Meeting notes')).toBeInTheDocument();
    expect(screen.queryByText('Grocery list')).not.toBeInTheDocument();
  });

  test('shows a no-match message when search has no results', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'Grocery list', content: '<p>Milk and eggs</p>' },
    ]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Grocery list');

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    fireEvent.change(searchInput, { target: { value: 'zzzzz' } });

    expect(await screen.findByText(/no notes match your search/i)).toBeInTheDocument();
  });

  test('export button is disabled when there are no notes', async () => {
    notesApi.fetchNotes.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText(/no notes yet/i);
    expect(screen.getByText('Export')).toBeDisabled();
  });

  test('exports notes as a downloadable JSON file', async () => {
    notesApi.fetchNotes.mockResolvedValue([
      { _id: '1', title: 'Grocery list', content: '<p>Milk and eggs</p>' },
    ]);

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Grocery list');

    fireEvent.click(screen.getByText('Export'));

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('imports valid notes from a JSON file', async () => {
    notesApi.fetchNotes.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { _id: '1', title: 'Imported note', content: 'Imported content' },
    ]);
    notesApi.createNote.mockResolvedValue({ _id: '1', title: 'Imported note', content: 'Imported content' });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText(/no notes yet/i);

    const fileContent = JSON.stringify([{ title: 'Imported note', content: 'Imported content' }]);
    const file = new File([fileContent], 'notes-export.json', { type: 'application/json' });

    const input = screen.getByTestId('import-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(notesApi.createNote).toHaveBeenCalledWith('Imported note', 'Imported content');
    });

    expect(await screen.findByText('Imported note')).toBeInTheDocument();
  });

  test('shows an error when importing an invalid file', async () => {
    notesApi.fetchNotes.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText(/no notes yet/i);

    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' });
    const input = screen.getByTestId('import-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/could not import notes/i)).toBeInTheDocument();
  });
});
