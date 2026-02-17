// ─── Tests: Toast & Error Components ─────────────────────────
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../app/components/shared/ToastProvider';

// Test helper component to trigger toasts
function ToastTrigger() {
  const { success, error, warning, info } = useToast();
  return (
    <div>
      <button onClick={() => success('Success msg')}>show-success</button>
      <button onClick={() => error('Error msg')}>show-error</button>
      <button onClick={() => warning('Warning msg')}>show-warning</button>
      <button onClick={() => info('Info msg')}>show-info</button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(
      <ToastProvider>
        <div>child content</div>
      </ToastProvider>
    );
    expect(screen.getByText('child content')).toBeDefined();
  });

  it('shows a success toast when triggered', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('show-success'));
    expect(screen.getByText('Success msg')).toBeDefined();
  });

  it('shows an error toast when triggered', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('show-error'));
    expect(screen.getByText('Error msg')).toBeDefined();
  });

  it('shows multiple toasts', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('show-success'));
    fireEvent.click(screen.getByText('show-warning'));
    expect(screen.getByText('Success msg')).toBeDefined();
    expect(screen.getByText('Warning msg')).toBeDefined();
  });
});

describe('useToast outside provider', () => {
  it('throws when used outside ToastProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BadComponent() {
      try {
        useToast();
      } catch (e: any) {
        return <div>{e.message}</div>;
      }
      return null;
    }
    render(<BadComponent />);
    expect(screen.getByText(/useToast must be used within/)).toBeDefined();
    spy.mockRestore();
  });
});
