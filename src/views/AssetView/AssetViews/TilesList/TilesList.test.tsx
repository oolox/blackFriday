import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tiles } from '../../../../assets/tileSet/tileSet';
import { TilesList } from './TilesList';

describe('TilesList', () => {
  it('pins the sort placeholder and lists every tile name with a thumbnail', () => {
    render(<TilesList />);

    expect(screen.getByText('placeholder for sort/filter')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(tiles.length);
    expect(screen.getByText('Stop Watch')).toBeInTheDocument();

    const wall = screen.getByText('Wall 1').closest('li');
    expect(wall).toHaveTextContent('struct');
    expect(wall).toHaveTextContent('wall');
    expect(wall).toHaveTextContent('speed:0');

    const coffee = screen.getByText('Coffee').closest('li');
    expect(coffee).toHaveTextContent('characterSpeed');
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
});
