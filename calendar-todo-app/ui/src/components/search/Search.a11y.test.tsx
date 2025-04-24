import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Search } from './Search';

expect.extend(toHaveNoViolations);

describe('Search Component Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Search />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
