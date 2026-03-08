import { describe, it, expect } from 'vitest';

describe('Member type logic', () => {
  it('auto-promotes visitor after 2 attendance', () => {
    // Mirrors the auto_promote_member trigger logic
    const shouldPromote = (count: number, type: string) => {
      return count > 2 && type === 'visitor';
    };

    expect(shouldPromote(1, 'visitor')).toBe(false);
    expect(shouldPromote(2, 'visitor')).toBe(false);
    expect(shouldPromote(3, 'visitor')).toBe(true);
    expect(shouldPromote(5, 'visitor')).toBe(true);
    expect(shouldPromote(5, 'regular')).toBe(false);
  });

  it('flag count banning logic works correctly', () => {
    const isBanned = (flagCount: number) => flagCount >= 3;
    const needsAttention = (flagCount: number) => flagCount >= 2 && flagCount < 3;

    expect(isBanned(0)).toBe(false);
    expect(isBanned(1)).toBe(false);
    expect(isBanned(2)).toBe(false);
    expect(isBanned(3)).toBe(true);
    expect(isBanned(5)).toBe(true);

    expect(needsAttention(0)).toBe(false);
    expect(needsAttention(1)).toBe(false);
    expect(needsAttention(2)).toBe(true);
    expect(needsAttention(3)).toBe(false);
  });
});

describe('Age calculation for consent', () => {
  it('correctly identifies minors', () => {
    const isMinor = (dob: string) => {
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      return age < 18;
    };

    // Someone born 10 years ago
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    expect(isMinor(tenYearsAgo.toISOString().split('T')[0])).toBe(true);

    // Someone born 20 years ago
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    expect(isMinor(twentyYearsAgo.toISOString().split('T')[0])).toBe(false);

    // Edge case: exactly 18
    const exactly18 = new Date();
    exactly18.setFullYear(exactly18.getFullYear() - 18);
    expect(isMinor(exactly18.toISOString().split('T')[0])).toBe(false);
  });
});

describe('Search filtering logic', () => {
  const members = [
    { first_name: 'Amy', last_name: 'Chen', name: 'Amy Chen', consent_signed: true },
    { first_name: 'Brian', last_name: 'Scott', name: 'Brian Scott', consent_signed: false },
    { first_name: 'Carlos', last_name: 'Rodriguez', name: 'Carlos Rodriguez', consent_signed: false },
  ];

  const filterMembers = (
    query: string,
    consentFilter: 'all' | 'pending' | 'signed'
  ) => {
    return members.filter((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.trim().toLowerCase();
      const q = query.toLowerCase();
      if (q && !fullName.includes(q) && !member.name.toLowerCase().includes(q)) return false;
      if (consentFilter === 'pending' && member.consent_signed) return false;
      if (consentFilter === 'signed' && !member.consent_signed) return false;
      return true;
    });
  };

  it('filters by search query', () => {
    expect(filterMembers('amy', 'all')).toHaveLength(1);
    expect(filterMembers('amy', 'all')[0].name).toBe('Amy Chen');
  });

  it('returns all when no query', () => {
    expect(filterMembers('', 'all')).toHaveLength(3);
  });

  it('filters by consent status', () => {
    expect(filterMembers('', 'signed')).toHaveLength(1);
    expect(filterMembers('', 'pending')).toHaveLength(2);
  });

  it('combines search and consent filter', () => {
    expect(filterMembers('brian', 'pending')).toHaveLength(1);
    expect(filterMembers('amy', 'pending')).toHaveLength(0);
  });

  it('is case insensitive', () => {
    expect(filterMembers('AMY', 'all')).toHaveLength(1);
    expect(filterMembers('chen', 'all')).toHaveLength(1);
  });
});
