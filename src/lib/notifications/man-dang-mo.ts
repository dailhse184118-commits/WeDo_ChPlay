/**
 * Khung chat người dùng đang mở, để không báo lại thứ họ đang nhìn thấy.
 *
 * Máy chủ không biết người nhận đang mở màn nào, nên nó cứ đẩy. Thiếu chốt này
 * thì đang đọc đúng cuộc trò chuyện đó mà banner vẫn nhảy ra cho chính tin vừa
 * hiện trên màn hình — thừa, và trông cẩu thả.
 *
 * Để ở mô-đun chứ không ở React state: `setNotificationHandler` chạy ngoài cây
 * component, không đọc được context nào cả.
 *
 * Khoá dạng `dm:<conversationId>` hoặc `du-an:<projectId>`.
 */
let manDangMo: string | null = null;

export function datManDangMo(khoa: string): void {
  manDangMo = khoa;
}

export function quenManDangMo(): void {
  manDangMo = null;
}

/**
 * Có nên hiện banner cho thông báo này không.
 *
 * Chỉ im lặng với tin nhắn của đúng khung chat đang mở. Mọi thứ khác — nhắc hạn
 * công việc, lời mời kết bạn — luôn được hiện: chúng có hạn chót, bỏ lỡ là mất
 * việc thật.
 */
export function nenHienThongBao(data: unknown): boolean {
  if (!manDangMo || !data || typeof data !== 'object') return true;

  const kho = data as Record<string, unknown>;

  if (kho.type === 'DIRECT_MESSAGE') return manDangMo !== `dm:${kho.conversationId}`;
  if (kho.type === 'PROJECT_MESSAGE') return manDangMo !== `du-an:${kho.projectId}`;

  return true;
}
