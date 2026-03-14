import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MetricCard from './MetricCard';

describe('MetricCard - Click Interactions', () => {
  it('clicking card triggers onClick handler', async () => {
    const handleClick = vi.fn();
    render(<MetricCard label="Focus Score" value={85} unit="%" onClick={handleClick} />);
    
    const card = screen.getByRole('radio');
    expect(card).toBeInTheDocument();
    expect(card).not.toBeDisabled();
    
    await userEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays value and label correctly', () => {
    render(<MetricCard label="Deep Work" value={120} unit="min" />);
    
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('DEEP WORK')).toBeInTheDocument();
  });

  it('is selected when isSelected is true', () => {
    render(<MetricCard label="Score" value={90} isSelected={true} />);
    
    const card = screen.getByRole('radio');
    expect(card).toHaveAttribute('aria-checked', 'true');
  });

  it('is not selected when isSelected is false', () => {
    render(<MetricCard label="Score" value={90} isSelected={false} />);
    
    const card = screen.getByRole('radio');
    expect(card).toHaveAttribute('aria-checked', 'false');
  });

  it('has accessible label with value and unit', () => {
    render(<MetricCard label="Context Switches" value={5} unit="times" />);
    
    const card = screen.getByLabelText('Context Switches: 5 times. Click to view trends.');
    expect(card).toBeInTheDocument();
  });

  it('clicking works without onClick handler (no error)', async () => {
    render(<MetricCard label="Score" value={75} />);
    
    const card = screen.getByRole('radio');
    await userEvent.click(card);
    
    // Should not throw error
    expect(card).toBeInTheDocument();
  });

  it('keyboard Enter key triggers click', async () => {
    const handleClick = vi.fn();
    render(<MetricCard label="Score" value={85} onClick={handleClick} />);
    
    const card = screen.getByRole('radio');
    card.focus();
    
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('keyboard Space key triggers click', async () => {
    const handleClick = vi.fn();
    render(<MetricCard label="Score" value={85} onClick={handleClick} />);
    
    const card = screen.getByRole('radio');
    card.focus();
    
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
