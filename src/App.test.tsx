import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.queryByText('Assets')).not.toBeInTheDocument();
    expect(screen.getByText('placeholder for sort/filter')).toBeInTheDocument();
    expect(screen.getByText('Stop Watch')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TILES' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'RULES' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'CONFIG' })).toHaveAttribute('aria-selected', 'false');
  });

  it('keeps a single asset section selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('tab', { name: 'RULES' }));
    expect(screen.getByRole('tab', { name: 'RULES' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'TILES' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('placeholder for rules')).toBeInTheDocument();
    expect(screen.queryByText('placeholder for sort/filter')).not.toBeInTheDocument();
    expect(screen.queryByText('Stop Watch')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'CONFIG' }));
    expect(screen.getByRole('tab', { name: 'CONFIG' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'RULES' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('placeholder for config')).toBeInTheDocument();
    expect(screen.queryByText('placeholder for rules')).not.toBeInTheDocument();
  });
});
