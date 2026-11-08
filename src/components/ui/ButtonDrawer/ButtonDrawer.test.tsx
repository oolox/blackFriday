import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonDrawer } from './ButtonDrawer';

describe('ButtonDrawer', () => {
  it('renders icon, input, and trailing buttons', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onLock = vi.fn();

    render(
      <ButtonDrawer
        icon="dice"
        iconLabel="Seed options"
        label="Seed"
        open={false}
        onToggle={onToggle}
        input={{
          'aria-label': 'Seed',
          value: '42',
          readOnly: true,
          disabled: true,
        }}
        buttons={[
          {
            key: 'lock',
            icon: 'unlock',
            label: 'Lock seed',
            onClick: onLock,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Seed options' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: 'Seed' })).toHaveValue('42');
    await user.click(screen.getByRole('button', { name: 'Lock seed' }));
    expect(onLock).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles when clicking the closed value', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <ButtonDrawer
        icon="dice"
        iconLabel="Seed options"
        label="Seed"
        open={false}
        onToggle={onToggle}
        input={{
          'aria-label': 'Seed',
          value: '42',
          readOnly: true,
          disabled: true,
        }}
        buttons={[]}
      />,
    );

    await user.click(screen.getByRole('group', { name: 'Seed' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
