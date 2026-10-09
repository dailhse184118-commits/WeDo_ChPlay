import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienChat } from '../../i18n/tu-dien/chat';

/** Thời gian một dấu hiệu đang gõ còn hiệu lực, tính bằng mili giây. */
export const TYPING_TTL_MS = 5000;

/**
 * Lưu dấu THỜI GIAN chứ không lưu cờ boolean.
 * Nếu người kia mất mạng giữa lúc gõ, sự kiện `typing: false` sẽ không bao giờ tới;
 * dùng cờ boolean thì chữ "đang nhập" treo vĩnh viễn, dùng dấu thời gian thì tự hết hạn.
 */
export function applyTyping(
  current: Record<string, number>,
  userId: string,
  typing: boolean,
  now: number,
): Record<string, number> {
  const next = { ...current };
  if (typing) {
    next[userId] = now;
  } else {
    delete next[userId];
  }
  return next;
}

export function activeTypers(
  state: Record<string, number>,
  now: number,
  ttlMs: number = TYPING_TTL_MS,
): string[] {
  return Object.entries(state)
    .filter(([, at]) => now - at < ttlMs)
    .map(([userId]) => userId);
}

export function typingLabel(names: string[], ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienChat, ngonNgu);
  if (names.length === 0) return '';
  if (names.length === 1) return t.dangNhap1(names[0]);
  if (names.length === 2) return t.dangNhap2(names[0], names[1]);
  return t.dangNhapNhieu(names.length);
}
