import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienNangCap } from '../../i18n/tu-dien/nang-cap';
import type { GoiHienTai } from '../api/entitlements';
import { ngayVN } from './mua-goi';

/** Tên thương hiệu của gói, giữ nguyên ở mọi ngôn ngữ. */
const TEN: Record<GoiHienTai['plan'], string> = {
  PERSONAL_PRO: 'Personal Pro',
  TEAM_GROWTH: 'Team Growth',
};

/** Dòng "gói hiện tại" ở tab Tài khoản: tên gói, hạn, và nơi đã mua (App Store hay web). */
export function dongGoiHienTai(goi: GoiHienTai | null, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienNangCap, ngonNgu);
  if (!goi) return t.mienPhi;
  return t.goiHienTai(
    TEN[goi.plan],
    ngayVN(goi.currentPeriodEnd, ngonNgu),
    goi.provider === 'APPLE' ? t.nguonApple : t.nguonWeb,
  );
}
