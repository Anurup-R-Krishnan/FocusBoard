import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ControlsPanel from './ControlsPanel';

describe('ControlsPanel - Button Interactions', () => {
  const defaultProps = {
    sessionState: 'IDLE' as const,
    isPlaying: true,
    speedMultiplier: 1,
    onTogglePlay: vi.fn(),
    onStartFocus: vi.fn(),
    onResumeFocus: vi.fn(),
    onTakeBreak: vi.fn(),
    onAddDistraction: vi.fn(),
    onTag: vi.fn(),
    onToggleSpeed: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('start focus button calls onStartFocus when clicked', async () => {
    render(<ControlsPanel {...defaultProps} />);
    
    const startButton = screen.getByText('Focus').closest('button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).not.toBeDisabled();
    
    await userEvent.click(startButton!);
    expect(defaultProps.onStartFocus).toHaveBeenCalledTimes(1);
  });

  it('pause button appears during FOCUS and calls onTakeBreak', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const pauseButton = screen.getByText('Pause').closest('button');
    expect(pauseButton).toBeInTheDocument();
    
    await userEvent.click(pauseButton!);
    expect(defaultProps.onTakeBreak).toHaveBeenCalledTimes(1);
  });

  it('resume button appears during BREAK and calls onResumeFocus', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="BREAK" />);
    
    const resumeButton = screen.getByText('Resume').closest('button');
    expect(resumeButton).toBeInTheDocument();
    
    await userEvent.click(resumeButton!);
    expect(defaultProps.onResumeFocus).toHaveBeenCalledTimes(1);
  });

  it('tag button calls onTag when clicked', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const tagButton = screen.getByTitle('Tag Segment');
    expect(tagButton).toBeInTheDocument();
    
    await userEvent.click(tagButton);
    expect(defaultProps.onTag).toHaveBeenCalledTimes(1);
  });

  it('play/pause toggle calls onTogglePlay', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const toggleButton = screen.getByTitle('Pause Simulation');
    expect(toggleButton).toBeInTheDocument();
    
    await userEvent.click(toggleButton);
    expect(defaultProps.onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('speed toggle calls onToggleSpeed', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const speedButton = screen.getByTitle('Demo Mode (60x Speed)');
    expect(speedButton).toBeInTheDocument();
    
    await userEvent.click(speedButton);
    expect(defaultProps.onToggleSpeed).toHaveBeenCalledTimes(1);
  });

  it('break button is disabled when not in FOCUS state', () => {
    render(<ControlsPanel {...defaultProps} sessionState="IDLE" />);
    
    const breakButton = screen.getByTitle('Take Break').closest('button');
    expect(breakButton).toBeDisabled();
    expect(breakButton).toHaveClass('opacity-30');
  });

  it('distraction button is disabled when not in FOCUS state', () => {
    render(<ControlsPanel {...defaultProps} sessionState="IDLE" />);
    
    const distractionButton = screen.getByTitle('Log Distraction').closest('button');
    expect(distractionButton).toBeDisabled();
  });

  it('break button is enabled during FOCUS state', () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const breakButton = screen.getByTitle('Take Break').closest('button');
    expect(breakButton).not.toBeDisabled();
    expect(breakButton).toHaveClass('cursor-pointer');
  });

  it('all buttons have accessible titles', () => {
    render(<ControlsPanel {...defaultProps} sessionState="FOCUS" />);
    
    const titledButtons = [
      'Tag Segment',
      'Take Break',
      'Log Distraction',
      'Pause Simulation',
      'Demo Mode (60x Speed)'
    ];
    
    titledButtons.forEach(title => {
      expect(screen.getByTitle(title)).toBeInTheDocument();
    });
  });

  it('clicking disabled button does not call handler', async () => {
    render(<ControlsPanel {...defaultProps} sessionState="IDLE" />);
    
    const breakButton = screen.getByTitle('Take Break').closest('button');
    expect(breakButton).toBeDisabled();
    
    await userEvent.click(breakButton!);
    expect(defaultProps.onTakeBreak).not.toHaveBeenCalled();
  });

  it('end session button appears during BREAK', () => {
    render(<ControlsPanel {...defaultProps} sessionState="BREAK" />);
    
    const endButton = screen.getByTitle('End Session');
    expect(endButton).toBeInTheDocument();
  });

  it('pause button is not shown in IDLE state', () => {
    render(<ControlsPanel {...defaultProps} sessionState="IDLE" />);
    
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    expect(screen.getByText('Focus')).toBeInTheDocument();
  });
});
