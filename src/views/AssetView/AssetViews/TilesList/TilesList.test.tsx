import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tiles } from '../../../../assets/tileSet/tileSet';
import { TilesList } from './TilesList';

describe('TilesList', () => {
  it('pins sort and filter controls and lists every tile name with a thumbnail', () => {
    render(<TilesList />);

    expect(screen.getByRole('combobox', { name: 'Sort ascending' })).toHaveTextContent('NAME');
    expect(screen.getByRole('combobox', { name: 'Filter type' })).toHaveTextContent('ALL TYPES');
    expect(screen.getByRole('combobox', { name: 'Filter action' })).toHaveTextContent('ALL ACTIONS');
    expect(screen.getAllByRole('listitem')).toHaveLength(tiles.length);
    expect(screen.getByText('Stop Watch')).toBeInTheDocument();

    const wall = screen.getByText('Wall 1').closest('li');
    expect(wall).toHaveTextContent('struct');
    expect(wall).toHaveTextContent('wall');
    expect(wall).toHaveTextContent('speed:0');

    const coffee = screen.getByText('Coffee').closest('li');
    expect(coffee).toHaveTextContent('speedUp');
    expect(coffee).toHaveTextContent('speed:2');
    expect(coffee).toHaveTextContent('duration:10');

    const drill = screen.getByText('Drill').closest('li');
    expect(drill).toHaveTextContent('product');
    expect(drill).toHaveTextContent('purchase');
    expect(drill).toHaveTextContent('cost:90');

    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(tiles.length);
    for (const tile of tiles) {
      const fileName = tile.file.split('/').pop() ?? '';
      const matched = [...images].some((img) => img.getAttribute('src')?.endsWith(fileName));
      expect(matched).toBe(true);
    }
  });

  it('filters by type and action and toggles sort direction', async () => {
    const user = userEvent.setup();
    render(<TilesList />);

    await user.click(screen.getByRole('combobox', { name: 'Filter type' }));
    await user.click(screen.getByRole('option', { name: 'PRODUCT' }));
    expect(screen.queryByText('Wall 1')).not.toBeInTheDocument();
    expect(screen.getByText('Drill')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(
      tiles.filter((tile) => tile.type === 'product').length,
    );

    await user.click(screen.getByRole('combobox', { name: 'Filter type' }));
    await user.click(screen.getByRole('option', { name: 'ALL TYPES' }));
    await user.click(screen.getByRole('combobox', { name: 'Filter action' }));
    await user.click(screen.getByRole('option', { name: 'WALL' }));
    expect(screen.getByText('Wall 1')).toBeInTheDocument();
    expect(screen.queryByText('Drill')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(
      tiles.filter((tile) => tile.actAs?.action === 'wall').length,
    );

    await user.click(screen.getByRole('combobox', { name: 'Filter action' }));
    await user.click(screen.getByRole('option', { name: 'ALL ACTIONS' }));
    await user.click(screen.getByRole('combobox', { name: 'Sort ascending' }));
    await user.click(screen.getByRole('option', { name: 'NAME' }));

    const descending = [...tiles].sort((a, b) => b.name.localeCompare(a.name));
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(descending[0]?.name ?? '');
    expect(screen.getByRole('combobox', { name: 'Sort descending' })).toBeInTheDocument();
  });
});
