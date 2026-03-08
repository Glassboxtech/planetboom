import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsCards } from '@/components/StatsCards';

describe('StatsCards', () => {
  const defaultProps = {
    totalMembers: 36,
    regulars: 30,
    visitors: 6,
    checkedInToday: 18,
  };

  it('renders all stat values correctly', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders all stat labels', () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('Regulars')).toBeInTheDocument();
    expect(screen.getByText('New Visitors')).toBeInTheDocument();
    expect(screen.getByText('Checked In Today')).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    render(<StatsCards totalMembers={0} regulars={0} visitors={0} checkedInToday={0} />);
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });
});
