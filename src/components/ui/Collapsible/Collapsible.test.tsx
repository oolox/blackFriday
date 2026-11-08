import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  it('starts open and hides children when the header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible title="Images">
        <p>Gallery body</p>
      </Collapsible>,
    );

    expect(screen.getByText('Gallery body')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse Images' }));
    expect(screen.queryByText('Gallery body')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Images' })).toBeInTheDocument();
  });

  it('toggles from the caret as part of the header', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Collapsible title="Video" open onOpenChange={onOpenChange}>
        <p>Clip</p>
      </Collapsible>,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse Video' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
