import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const ITEMS = [
  { id: 'assets', label: 'Assets' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'workflows', label: 'Workflows' },
];

describe('Tabs', () => {
  it('renders a tablist with accessible roles', () => {
    render(<Tabs items={ITEMS} value="assets" onChange={() => {}} />);

    expect(screen.getByRole('tablist', { name: 'Tabs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Assets' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Prompts' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="assets" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Prompts' }));
    expect(onChange).toHaveBeenCalledWith('prompts');
  });

  it('moves selection with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs items={ITEMS} value="assets" onChange={onChange} />);

    screen.getByRole('tab', { name: 'Assets' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('prompts');
  });

  it('marks a busy tab with aria-busy', () => {
    render(
      <Tabs
        items={[
          { id: 'assets', label: 'Assets' },
          { id: 'prompts', label: 'Prompts', busy: true },
        ]}
        value="assets"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Prompts' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('tab', { name: 'Assets' })).not.toHaveAttribute('aria-busy');
  });
});
