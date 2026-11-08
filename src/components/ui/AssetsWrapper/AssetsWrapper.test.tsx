import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/test-utils';
import { AssetsWrapper } from './AssetsWrapper';

describe('AssetsWrapper', () => {
  it('shows an empty generator SubSubHeader in bare generator views', () => {
    renderWithProviders(
      <AssetsWrapper
        generatorOpen
        bare
        generator={<p>Generator body</p>}
        gallery={<p>Gallery body</p>}
      />,
    );

    expect(screen.getByRole('banner', { name: 'Generator' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Generator' })).not.toBeInTheDocument();
    expect(screen.getByText('Generator body')).toBeInTheDocument();
  });

  it('omits the generator SubSubHeader in character (non-bare) views', () => {
    renderWithProviders(
      <AssetsWrapper
        generatorOpen
        generator={<p>Portrait generator</p>}
        gallery={<p>Portraits</p>}
      />,
    );

    expect(screen.queryByRole('banner', { name: 'Generator' })).not.toBeInTheDocument();
  });
});
