import type { NguoiDaChan } from '../api/moderation';
import type { DirectConversation } from '../types';

/** Tập id người đã chặn, để tra từng tin nhắn trong O(1). */
export function tapNguoiDaChan(ds: ReadonlyArray<NguoiDaChan> | null | undefined): Set<string> {
  return new Set((ds ?? []).map((nguoi) => nguoi.userId).filter(Boolean));
}

/**
 * Bỏ những tin do người mình đã chặn viết.
 *
 * Máy chủ đã lọc sẵn ở các lượt GET, nhưng tin tới qua socket thì không — và
 * chặn xong phải thấy tác dụng NGAY, không đợi lượt nạp lại. Nên app lọc lại ở
 * đây, cho cả chat dự án lẫn tin nhắn riêng.
 *
 * Tin không rõ người gửi thì giữ: bỏ nhầm tin của người không liên quan tệ hơn
 * sót một tin.
 *
 * Chưa chặn ai thì trả lại đúng mảng cũ, để `useMemo` phía sau không phải tính lại.
 */
export function locTinNguoiDaChan<T>(
  ds: T[],
  daChan: ReadonlySet<string>,
  nguoiGui: (tin: T) => string | null | undefined,
): T[] {
  if (daChan.size === 0) return ds;

  return ds.filter((tin) => {
    const id = nguoiGui(tin);
    return !id || !daChan.has(id);
  });
}

/**
 * Bỏ những hội thoại riêng với người mình đã chặn khỏi danh sách Tin nhắn.
 *
 * Hội thoại vẫn còn trên máy chủ — bỏ chặn là nó quay lại, kèm lịch sử cũ.
 */
export function locHoiThoaiNguoiDaChan(
  ds: DirectConversation[],
  daChan: ReadonlySet<string>,
  userId: string | undefined,
): DirectConversation[] {
  if (daChan.size === 0) return ds;

  return ds.filter(
    (hoiThoai) =>
      !(hoiThoai.participants ?? []).some(
        (nguoi) => nguoi.userId !== userId && daChan.has(nguoi.userId),
      ),
  );
}
