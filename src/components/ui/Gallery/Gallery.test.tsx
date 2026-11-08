import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Gallery } from './Gallery';
import { GalleryTile } from './GalleryTile';
import type { GalleryItem } from './galleryTypes';

const items: GalleryItem[] = [
  { id: 'a', kind: 'text', label: 'Alpha' },
  { id: 'b', kind: 'text', label: 'Beta' },
];

describe('Gallery', () => {
  it('shows emptyLabel when there are no items', () => {
    render(
      <Gallery
        items={[]}
        emptyLabel="Nothing here"
        label="Saved items"
        renderTile={() => null}
      />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders a heading and tiles', () => {
    render(
      <Gallery
        items={items}
        heading="Texts"
        label="Saved texts"
        renderTile={({ item }) => (
          <GalleryTile item={item} onDelete={() => undefined} deleteLabel="Delete">
            {item.label}
          </GalleryTile>
        )}
      />,
    );
    expect(screen.getByText('Texts')).toBeInTheDocument();
    expect(screen.getByLabelText('Alpha')).toBeInTheDocument();
    expect(screen.getByLabelText('Beta')).toBeInTheDocument();
  });
});
