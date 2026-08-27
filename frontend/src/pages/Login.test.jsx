import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Login from './Login.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

jest.mock('../api/axios.js', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  api.post.mockReset();
});

test('renders email and password fields', () => {
  renderLogin();

  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('submits valid credentials and calls the login endpoint', async () => {
  api.post.mockResolvedValueOnce({
    data: { token: 'abc123', user: { id: '1', email: 'test@example.com' } },
  });

  renderLogin();

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });
});

test('shows an error message when login fails', async () => {
  api.post.mockRejectedValueOnce(new Error('Request failed'));

  renderLogin();

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
});
