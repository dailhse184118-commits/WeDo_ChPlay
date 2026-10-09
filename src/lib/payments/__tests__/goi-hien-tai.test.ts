import { dongGoiHienTai } from '../goi-hien-tai';

describe('dongGoiHienTai', () => {
  it('không gói → Miễn phí', () => {
    expect(dongGoiHienTai(null)).toBe('Miễn phí');
  });

  it('gói Apple → tên · đến ngày · qua App Store', () => {
    expect(
      dongGoiHienTai({
        provider: 'APPLE',
        plan: 'PERSONAL_PRO',
        billingCycle: 'MONTHLY',
        currentPeriodEnd: '2026-11-08T10:00:00.000Z',
      }),
    ).toBe('Personal Pro · đến 08/11/2026 · qua App Store');
  });

  it('gói web → qua web', () => {
    expect(
      dongGoiHienTai({
        provider: 'PAYOS',
        plan: 'TEAM_GROWTH',
        billingCycle: 'YEARLY',
        currentPeriodEnd: '2027-10-08T10:00:00.000Z',
      }),
    ).toBe('Team Growth · đến 08/10/2027 · qua web');
  });
});
