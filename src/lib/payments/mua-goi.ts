import { QUYEN_LOI } from './quyen-loi';

export type MaGoi = 'pro_monthly' | 'pro_yearly' | 'team_monthly' | 'team_yearly';
export const MA_GOI: readonly MaGoi[] = ['pro_monthly', 'pro_yearly', 'team_monthly', 'team_yearly'];

export interface TheGoi {
  ten: 'Personal Pro' | 'Team Growth';
  plan: 'PERSONAL_PRO' | 'TEAM_GROWTH';
  thang: { sku: MaGoi; gia: string } | null;
  nam: { sku: MaGoi; gia: string } | null;
  quyenLoi: readonly string[];
}

/** Ghép sản phẩm StoreKit (giá đã định dạng theo cửa hàng) thành hai thẻ. Thiếu sản phẩm thì ô đó null. */
export function ghepTheGoi(sanPham: Array<{ id: string; displayPrice: string }>): TheGoi[] {
  const gia = (sku: MaGoi) => {
    const sp = sanPham.find((p) => p.id === sku);
    return sp ? { sku, gia: sp.displayPrice } : null;
  };
  return [
    { ten: 'Personal Pro', plan: 'PERSONAL_PRO', thang: gia('pro_monthly'), nam: gia('pro_yearly'), quyenLoi: QUYEN_LOI.PERSONAL_PRO },
    { ten: 'Team Growth', plan: 'TEAM_GROWTH', thang: gia('team_monthly'), nam: gia('team_yearly'), quyenLoi: QUYEN_LOI.TEAM_GROWTH },
  ];
}

export function workspaceMinhLamChu(
  workspaces: Array<{ id: string; name: string; ownerId: string }>,
  userId: string,
): Array<{ id: string; name: string }> {
  return workspaces.filter((w) => w.ownerId === userId).map((w) => ({ id: w.id, name: w.name }));
}

/**
 * dd/mm/yyyy theo giờ Việt Nam (UTC+7). Tự tính, không dùng Intl: Hermes trên máy có thể thiếu ICU.
 */
export function ngayVN(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Dịch lỗi mua thành một câu; rỗng nghĩa là không cần báo (người dùng tự huỷ). */
export function loiNhanMua(loi: unknown): string {
  const l = (loi ?? {}) as { code?: string; currentPeriodEnd?: string; chiTiet?: unknown };
  const conHan = l.currentPeriodEnd ?? (l.chiTiet as { currentPeriodEnd?: string } | undefined)?.currentPeriodEnd;
  switch (l.code) {
    case 'user-cancelled':
      return '';
    case 'SUBSCRIPTION_CONFLICT':
      return conHan
        ? `Gói hiện tại mua trên web còn đến ${ngayVN(conHan)}. Mua trên iPhone sau ngày đó nhé.`
        : 'Bạn đang có gói khác còn hạn.';
    case 'TRANSACTION_OWNED_BY_OTHER_USER':
      return 'Đăng ký App Store này đang gắn với một tài khoản WeDo khác.';
    case 'WORKSPACE_OWNER_REQUIRED':
      return 'Chỉ chủ workspace mới mua được gói Team cho workspace đó.';
    case 'APPLE_IAP_DISABLED':
      return 'Thanh toán qua App Store tạm chưa mở. Bạn thử lại sau nhé.';
    default:
      return 'Chưa mua được. Bạn thử lại sau nhé.';
  }
}
