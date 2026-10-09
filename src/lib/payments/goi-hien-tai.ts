import type { GoiHienTai } from '../api/entitlements';
import { ngayVN } from './mua-goi';

const TEN: Record<GoiHienTai['plan'], string> = {
  PERSONAL_PRO: 'Personal Pro',
  TEAM_GROWTH: 'Team Growth',
};

/** Dòng "gói hiện tại" ở tab Tài khoản: tên gói, hạn, và nơi đã mua (App Store hay web). */
export function dongGoiHienTai(goi: GoiHienTai | null): string {
  if (!goi) return 'Miễn phí';
  return `${TEN[goi.plan]} · đến ${ngayVN(goi.currentPeriodEnd)} · qua ${goi.provider === 'APPLE' ? 'App Store' : 'web'}`;
}
