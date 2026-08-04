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

export function typingLabel(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} đang nhập…`;
  if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập…`;
  return `${names.length} người đang nhập…`;
}
