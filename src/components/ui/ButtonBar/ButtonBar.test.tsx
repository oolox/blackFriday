import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonBar } from './ButtonBar';

const items = [
  { id: 'a', label: 'Alpha', ariaLabel: 'Model Alpha' },
  { id: 'b', label: 'Beta', ariaLabel: 'Model Beta' },
  { id: 'c', label: 'Gamma', ariaLabel: 'Model Gamma' },
];

describe('ButtonBar', () => {
  it('hides all option buttons when collapsed without showSelect', () => {
    render(
      <ButtonBar
        label="Model"
        labelIcon="model"
        defaultOpen={false}
        items={items}
        value="a"
        onChange={() => {}}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Model Alpha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Model Beta' })).not.toBeInTheDocument();
  });

  it('shows only the active option when collapsed with showSelect', () => {
    render(
      <ButtonBar
        label="Model"
        labelIcon="model"
        defaultOpen={false}
        showSelect
        items={items}
        value="b"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Model Beta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Model Alpha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Model Gamma' })).not.toBeInTheDocument();
  });

  it('shows all options when expanded with showSelect', async () => {
    const user = userEvent.setup();
    render(
      <ButtonBar
        label="Model"
        labelIcon="model"
        defaultOpen={false}
        showSelect
        items={items}
        value="a"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Model' }));

    expect(screen.getByRole('button', { name: 'Model Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Model Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Model Gamma' })).toBeInTheDocument();
  });

  it('opens the bar when the active option is clicked while collapsed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ButtonBar
        label="Model"
        labelIcon="model"
        defaultOpen={false}
        showSelect
        items={items}
        value="b"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Model Beta' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Model Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Model Gamma' })).toBeInTheDocument();
  });

  it('notifies onChange when an option is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ButtonBar
        label="Model"
        labelIcon="model"
        defaultOpen
        items={items}
        value="a"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Model Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
