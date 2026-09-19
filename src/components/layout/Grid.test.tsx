import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid } from './Grid';

describe('Grid component', () => {
  it('renders children with default grid columns', () => {
    render(<Grid data-testid="grid-box">Grid Content</Grid>);
    const el = screen.getByTestId('grid-box');
    expect(el).toHaveClass('grid', 'grid-cols-1');
  });

  it('applies columns, responsive columns, gap and padding props', () => {
    render(
      <Grid
        data-testid="grid-box"
        columns={2}
        smColumns={4}
        gap="md"
        padding="sm"
        fullWidth
      >
        <div>Col 1</div>
        <div>Col 2</div>
      </Grid>,
    );

    const el = screen.getByTestId('grid-box');
    expect(el).toHaveClass(
      'grid',
      'grid-cols-2',
      'sm:grid-cols-4',
      'gap-3',
      'p-2',
      'w-full',
    );
  });

  it('supports custom templateColumns style', () => {
    render(
      <Grid data-testid="grid-box" templateColumns="1fr 2fr">
        <div>Col 1</div>
        <div>Col 2</div>
      </Grid>,
    );

    const el = screen.getByTestId('grid-box');
    expect(el.style.gridTemplateColumns).toBe('1fr 2fr');
  });
});
