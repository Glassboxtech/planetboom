import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventHeader } from '@/components/EventHeader';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe('EventHeader', () => {
  it('renders the title', () => {
    renderWithRouter(<EventHeader date="2026-03-08" title="Friday Youth Night" />);
    expect(screen.getByText('Friday Youth Night')).toBeInTheDocument();
  });

  it('renders formatted date', () => {
    renderWithRouter(<EventHeader date="2026-03-08" title="Test" />);
    // March 8, 2026 is a Sunday
    expect(screen.getByText(/March 8, 2026/)).toBeInTheDocument();
  });

  it('shows "Today" badge when date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    renderWithRouter(<EventHeader date={today} title="Test" />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('does not show "Today" badge for other dates', () => {
    renderWithRouter(<EventHeader date="2025-01-01" title="Test" />);
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
  });

  it('shows Change Date button when onDateChange is provided', () => {
    const onDateChange = vi.fn();
    renderWithRouter(<EventHeader date="2026-03-08" title="Test" onDateChange={onDateChange} />);
    expect(screen.getByText('Change Date')).toBeInTheDocument();
  });

  it('does not show Change Date button when onDateChange is not provided', () => {
    renderWithRouter(<EventHeader date="2026-03-08" title="Test" />);
    expect(screen.queryByText('Change Date')).not.toBeInTheDocument();
  });
});
