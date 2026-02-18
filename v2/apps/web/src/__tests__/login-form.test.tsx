import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../app/login/page';

// Mock Next.js router
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock API client
vi.mock('../lib/api-client', () => ({
  api: {
    login: vi.fn(),
  },
}));

import { api } from '../lib/api-client';
const loginMock = vi.mocked(api.login);

describe('LoginPage', () => {
  it('renders the sign in form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    loginMock.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('redirects on successful login', async () => {
    loginMock.mockResolvedValueOnce({ ok: true, data: { user: { id: 'u1', email: 'a@b.com', display_name: 'Test', role: 'user', avatar_url: null }, token: 't' } } as any);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'goodpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for navigation
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/workspaces');
    });
  });
});
