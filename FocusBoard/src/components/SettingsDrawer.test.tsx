import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsDrawer from './SettingsDrawer';

describe('SettingsDrawer - Open/Close Interactions', () => {
  it('renders nothing when isOpen is false', () => {
    render(<SettingsDrawer isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByText('Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Customize Your Flow')).not.toBeInTheDocument();
  });

  it('renders drawer when isOpen is true', () => {
    render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Customize Your Flow')).toBeInTheDocument();
  });

  it('close button calls onClose when clicked', async () => {
    const handleClose = vi.fn();
    render(<SettingsDrawer isOpen={true} onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', async () => {
    const handleClose = vi.fn();
    render(<SettingsDrawer isOpen={true} onClose={handleClose} />);
    
    // The backdrop is a div, find it by its fixed position class
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    
    await userEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays Focus Session settings', () => {
    render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Focus Session')).toBeInTheDocument();
    expect(screen.getByText('Focus Duration')).toBeInTheDocument();
    expect(screen.getByText('50 min')).toBeInTheDocument();
  });

  it('displays Notifications settings', () => {
    render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Break Reminders')).toBeInTheDocument();
    expect(screen.getByText('Sound Effects')).toBeInTheDocument();
    expect(screen.getByText('Block Notifications')).toBeInTheDocument();
  });

  it('setting rows are clickable and have hover effect', () => {
    render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);
    
    const focusDurationRow = screen.getByText('Focus Duration').closest('.group');
    expect(focusDurationRow).toHaveClass('cursor-pointer', 'hover:bg-white/5');
  });

  it('toggles are displayed with correct state', () => {
    render(<SettingsDrawer isOpen={true} onClose={vi.fn()} />);
    
    // Break Reminders should be toggled ON (green)
    const breakRemindersRow = screen.getByText('Break Reminders').closest('.group');
    expect(breakRemindersRow).toBeInTheDocument();
    
    // Sound Effects should be toggled OFF
    const soundEffectsRow = screen.getByText('Sound Effects').closest('.group');
    expect(soundEffectsRow).toBeInTheDocument();
  });
});
