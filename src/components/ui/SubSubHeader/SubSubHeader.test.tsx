import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubSubHeader } from './SubSubHeader';

const ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'imagePrompt', label: 'Image' },
  { id: 'videoPrompt', label: 'Video' },
];

describe('SubSubHeader', () => {
  it('renders subtype tabs styled as a nested header', () => {
    render(
      <SubSubHeader items={ITEMS} value="all" onChange={() => {}} tabsLabel="Prompt types" />,
    );

    expect(screen.getByRole('tablist', { name: 'Prompt types' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('subtab-all')).toBeTruthy();
  });

  it('calls onChange when a subtype tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SubSubHeader items={ITEMS} value="all" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Video' }));
    expect(onChange).toHaveBeenCalledWith('videoPrompt');
  });

  it('renders trailing nav without subtype tabs', () => {
    render(
      <SubSubHeader
        navLabel="Gallery actions"
        nav={<button type="button">Add</button>}
      />,
    );

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Gallery actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('labels an empty placeholder header', () => {
    render(<SubSubHeader tabsLabel="Session subtypes" />);

    expect(screen.getByRole('banner', { name: 'Session subtypes' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});
