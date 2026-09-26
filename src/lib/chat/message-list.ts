import type { ChatMessage } from '../types';

/**
 * Gộp hai nguồn tin nhắn thành một danh sách đã sắp xếp và khử trùng.
 * Cùng một tin nhắn có thể đến từ cả REST lẫn socket, nên khử trùng theo id là bắt buộc.
 * Bản đến sau thắng vì nó mới hơn.
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export interface KetQuaTaiBu {
  danhSach: ChatMessage[];
  /**
   * `true` khi trang mới nhất không chạm vào danh sách đang hiện: giữa hai bên
   * có thể còn tin chưa tải. Danh sách khi đó bắt đầu lại từ trang mới nhất, và
   * con trỏ "tải tin cũ hơn" phải lùi về đầu trang đó.
   */
  khoangHo: boolean;
}

/**
 * Ghép trang tin MỚI NHẤT (tải bù sau khi mất kết nối) vào danh sách đang hiện.
 *
 * Hai bên chạm nhau (có chung ít nhất một tin) thì gộp như thường. Không chạm
 * nhau nghĩa là trong lúc mất kết nối đã có nhiều tin hơn một trang: gộp thẳng
 * sẽ để lại một khoảng hở không ai thấy, tin ở giữa biến mất lặng lẽ. Khi đó
 * danh sách bắt đầu lại từ trang mới nhất, và người dùng kéo lên để tải phần ở
 * giữa như tải tin cũ.
 *
 * Tin đang hiện mà mới hơn đầu trang (tin socket vừa tới trong lúc tải) luôn
 * được giữ.
 */
export function ghepTrangMoiNhat(dangHien: ChatMessage[], trangMoi: ChatMessage[]): KetQuaTaiBu {
  if (dangHien.length === 0 || trangMoi.length === 0) {
    return { danhSach: mergeMessages(dangHien, trangMoi), khoangHo: false };
  }

  const idDangHien = new Set(dangHien.map((message) => message.id));
  if (trangMoi.some((message) => idDangHien.has(message.id))) {
    return { danhSach: mergeMessages(dangHien, trangMoi), khoangHo: false };
  }

  const dauTrang = Math.min(...trangMoi.map((message) => new Date(message.createdAt).getTime()));
  const moiHonDauTrang = dangHien.filter(
    (message) => new Date(message.createdAt).getTime() >= dauTrang,
  );
  return { danhSach: mergeMessages(trangMoi, moiHonDauTrang), khoangHo: true };
}

/** Thay một tin nhắn bằng bản đã thu hồi. Trả nguyên danh sách nếu không tìm thấy. */
export function applyRecall(list: ChatMessage[], recalled: ChatMessage): ChatMessage[] {
  if (!list.some((message) => message.id === recalled.id)) {
    return list;
  }
  return list.map((message) => (message.id === recalled.id ? recalled : message));
}
