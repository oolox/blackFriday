import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { renderWithProviders } from './test/test-utils';

describe('AppRoutes', () => {
  it('renders the play view', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Black Friday' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Game' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Assets' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Resize game and assets' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'View navigation' })).toBeInTheDocument();
  });
});
