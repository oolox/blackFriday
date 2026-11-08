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
    expect(screen.queryByRole('link', { name: 'Play' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'SANDBOX' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'GAME' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'ALGO' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'LLM' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Generate New Map' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('application', { name: 'Shop floor' })).not.toBeInTheDocument();
    expect(screen.queryByText('Assets')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sort ascending' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter type' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filter action' })).toBeInTheDocument();
    expect(screen.getByText('Stop Watch')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'TILES' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'RULES' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'CONFIG' })).toHaveAttribute('aria-selected', 'false');
  });

  it('generates a map and lets New cancel back to it', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('application', { name: 'Shop floor' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New' }));
    expect(screen.getByRole('dialog', { name: 'Generate New Map' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Generate New Map' })).not.toBeInTheDocument();
    expect(screen.getByRole('application', { name: 'Shop floor' })).toBeInTheDocument();
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
    expect(screen.queryByRole('combobox', { name: 'Sort ascending' })).not.toBeInTheDocument();
    expect(screen.queryByText('Stop Watch')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'CONFIG' }));
    expect(screen.getByRole('tab', { name: 'CONFIG' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'RULES' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('placeholder for config')).toBeInTheDocument();
    expect(screen.queryByText('placeholder for rules')).not.toBeInTheDocument();
  });
});
