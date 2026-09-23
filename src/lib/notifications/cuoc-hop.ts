/**
 * Nhận diện thông báo cuộc họp và lấy id cuộc họp từ `actionUrl`.
 *
 * Máy chủ ghi `actionUrl` của thông báo cuộc họp là `#/meeting?meetingId=<id>`
 * (từ 23/09/2026). Đó là một đường dẫn của WEB — mobile chỉ mượn nó để lấy id,
 * vì cột `Notification` không có `meetingId` riêng như `taskId`. Thông báo cũ
 * hơn chỉ có `#/meeting`, không kèm id: vẫn nhận ra là thông báo cuộc họp, chỉ
 * là không biết mở cuộc họp nào.
 *
 * Web có một bản song sinh ở `FE_WEDO/src/lib/thong-bao-cuoc-hop.ts`. Đổi định
 * dạng `actionUrl` thì phải đổi cả hai bên, và cả máy chủ.
 */

const TIEN_TO = '#/meeting';

export function laThongBaoCuocHop(actionUrl?: string | null): boolean {
  if (!actionUrl) return false;
  /*
    Khớp đúng `#/meeting` hoặc `#/meeting?…`. Chỉ `startsWith('#/meeting')` thì
    `#/meetings` hay `#/meeting-room` cũng bị nhận nhầm.
  */
  return actionUrl === TIEN_TO || actionUrl.startsWith(`${TIEN_TO}?`);
}

export function meetingIdTuActionUrl(actionUrl?: string | null): string | null {
  if (!laThongBaoCuocHop(actionUrl)) return null;
  const dauHoi = actionUrl!.indexOf('?');
  if (dauHoi < 0) return null;
  const id = new URLSearchParams(actionUrl!.slice(dauHoi + 1)).get('meetingId');
  return id && id.trim() ? id.trim() : null;
}
