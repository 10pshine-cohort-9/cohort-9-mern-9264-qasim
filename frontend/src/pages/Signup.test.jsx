import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Signup from './Signup.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

jest.mock('../api/axios.js', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

function renderSignup() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Signup />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  api.post.mockReset();
});

test('renders email, password, and confirm password fields', () => {
  renderSignup();

  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
});

test('submits valid, matching input and calls the register endpoint', async () => {
  api.post.mockResolvedValueOnce({
    data: { token: 'abc123', user: { id: '1', email: 'new@example.com' } },
  });

  renderSignup();

  await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
      email: 'new@example.com',
      password: 'password123',
    });
  });
});

test('shows an error and skips the request when passwords do not match', async () => {
  renderSignup();

  await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'somethingelse');
  await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

  expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});

test('shows an error message when registration fails', async () => {
  api.post.mockRejectedValueOnce(new Error('Request failed'));

  renderSignup();

  await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

  expect(await screen.findByText(/could not create account/i)).toBeInTheDocument();
});
