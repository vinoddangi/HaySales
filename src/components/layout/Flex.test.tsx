import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Flex } from './Flex';

describe('Flex component', () => {
  it('renders children with default flex row classes', () => {
    render(<Flex data-testid="flex-box">Test Content</Flex>);
    const el = screen.getByTestId('flex-box');
    expect(el).toHaveClass('flex', 'flex-row');
    expect(el).toHaveTextContent('Test Content');
  });

  it('applies explicit direction, alignment, justification, and gap props', () => {
    render(
      <Flex
        data-testid="flex-box"
        direction="column"
        align="center"
        justify="between"
        gap="md"
        padding="lg"
        margin="sm"
        fullWidth
      >
        <span>Item 1</span>
        <span>Item 2</span>
      </Flex>,
    );

    const el = screen.getByTestId('flex-box');
    expect(el).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-between',
      'gap-3',
      'p-4',
      'm-2',
      'w-full',
    );
  });

  it('renders as custom HTML element', () => {
    render(
      <Flex as="section" data-testid="flex-section">
        Section
      </Flex>,
    );
    const el = screen.getByTestId('flex-section');
    expect(el.tagName.toLowerCase()).toBe('section');
  });
});
