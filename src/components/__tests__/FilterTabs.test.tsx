import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterTabs } from '@/components/FilterTabs';

describe('FilterTabs', () => {
  const defaultProps = {
    activeFilter: 'all' as const,
    onFilterChange: vi.fn(),
    counts: { all: 36, regular: 30, visitor: 6 },
  };

  it('renders all filter tabs', () => {
    render(<FilterTabs {...defaultProps} />);
    expect(screen.getByText(/All/)).toBeInTheDocument();
    expect(screen.getByText(/Regulars/)).toBeInTheDocument();
    expect(screen.getByText(/Visitors/)).toBeInTheDocument();
  });

  it('displays correct counts', () => {
    render(<FilterTabs {...defaultProps} />);
    expect(screen.getByText('(36)')).toBeInTheDocument();
    expect(screen.getByText('(30)')).toBeInTheDocument();
    expect(screen.getByText('(6)')).toBeInTheDocument();
  });

  it('calls onFilterChange when tab is clicked', () => {
    const onFilterChange = vi.fn();
    render(<FilterTabs {...defaultProps} onFilterChange={onFilterChange} />);
    
    fireEvent.click(screen.getByText(/Regulars/));
    expect(onFilterChange).toHaveBeenCalledWith('regular');

    fireEvent.click(screen.getByText(/Visitors/));
    expect(onFilterChange).toHaveBeenCalledWith('visitor');
  });
});
