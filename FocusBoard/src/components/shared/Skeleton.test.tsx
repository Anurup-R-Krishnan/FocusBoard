import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Skeleton', () => {
  it('renders with default sizing', () => {
    const { container } = render(<Skeleton />);
    const element = container.firstChild as HTMLElement;
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('supports circle mode', () => {
    const { container } = render(<Skeleton circle />);
    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain('rounded-full');
  });
});
