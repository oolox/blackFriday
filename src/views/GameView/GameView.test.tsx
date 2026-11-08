import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SandboxSessionProvider } from '../../features/sandbox/sandboxSession';
import { GameView } from './GameView';

function renderGame() {
  return render(
    <SandboxSessionProvider>
      <GameView />
    </SandboxSessionProvider>,
  );
}

describe('GameView', () => {
  it('waits for Generate before drawing a map', async () => {
    const user = userEvent.setup();
    renderGame();

    expect(screen.getByRole('dialog', { name: 'Generate New Map' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('application', { name: 'Shop floor' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(screen.queryByRole('dialog', { name: 'Generate New Map' })).not.toBeInTheDocument();
    expect(screen.getByRole('application', { name: 'Shop floor' })).toBeInTheDocument();
  });

  it('toggles the rooms overlay after a map exists', async () => {
    const user = userEvent.setup();
    renderGame();
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    const rooms = screen.getByRole('checkbox', { name: 'Rooms' });
    expect(rooms).not.toBeChecked();
    await user.click(rooms);
    expect(rooms).toBeChecked();
  });
});
