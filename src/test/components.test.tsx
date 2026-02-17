import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { JSX } from 'react';
import { ErrorBoundary } from '../app/components/enterprise/ErrorBoundary';

function BrokenComponent(): JSX.Element {
  throw new Error('Test error');
}

function GoodComponent() {
  return <div>Working component</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('renders fallback when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallbackTitle="Custom error title">
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error title')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('recovers after clicking Try again', () => {
    let shouldThrow = true;
    function MaybeBreaks() {
      if (shouldThrow) throw new Error('Conditional error');
      return <div>Recovered</div>;
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <MaybeBreaks />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
