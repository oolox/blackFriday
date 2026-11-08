import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImgContainer } from './ImgContainer';

describe('ImgContainer', () => {
  it('renders children without action controls when handlers are omitted', () => {
    const { container } = render(
      <ImgContainer size="md">
        <img src="blob:x" alt="Portrait" />
      </ImgContainer>,
    );

    expect(screen.getByRole('img', { name: 'Portrait' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove from gallery' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete from library' })).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    expect(container.firstElementChild).toHaveStyle({ width: '288px', height: '288px' });
  });

  it('applies 16:9 wide dimensions', () => {
    const { container } = render(
      <ImgContainer size="mdWide">
        <img src="blob:x" alt="Wide" />
      </ImgContainer>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-size', 'mdWide');
    expect(container.firstElementChild).toHaveStyle({ width: '512px', height: '288px' });
  });

  it('removes from gallery on X press', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    const { container } = render(
      <ImgContainer onDelete={onDelete}>
        <img src="blob:x" alt="Portrait" />
      </ImgContainer>,
    );

    await user.hover(container.firstElementChild!);
    await user.click(screen.getByRole('button', { name: 'Remove from gallery' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('deletes from library on trash press', async () => {
    const user = userEvent.setup();
    const onTrash = vi.fn();
    const onDelete = vi.fn();

    const { container } = render(
      <ImgContainer onDelete={onDelete} onTrash={onTrash}>
        <img src="blob:x" alt="Portrait" />
      </ImgContainer>,
    );

    await user.hover(container.firstElementChild!);
    await user.click(screen.getByRole('button', { name: 'Delete from library' }));

    expect(onTrash).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows load control when onLoad is set', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();

    const { container } = render(
      <ImgContainer onLoad={onLoad}>
        <img src="blob:x" alt="Portrait" />
      </ImgContainer>,
    );

    await user.hover(container.firstElementChild!);
    await user.click(screen.getByRole('button', { name: 'Load image' }));

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('shows model load control when onLoadModel is set', async () => {
    const user = userEvent.setup();
    const onLoadModel = vi.fn();

    const { container } = render(
      <ImgContainer onLoadModel={onLoadModel}>
        <img src="blob:x" alt="Portrait" />
      </ImgContainer>,
    );

    await user.hover(container.firstElementChild!);
    await user.click(screen.getByRole('button', { name: 'Load model' }));

    expect(onLoadModel).toHaveBeenCalledTimes(1);
  });
});
