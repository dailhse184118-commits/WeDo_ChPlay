let counter = 0;

/**
 * Sinh chuỗi định danh duy nhất trong phạm vi một phiên chạy app.
 *
 * Dùng cho hai việc: khoá `Idempotency-Key` khi xin đề xuất AI, và khoá tạm cho
 * tin nhắn đang gửi trong FlatList. Cả hai chỉ cần DUY NHẤT, không cần khó đoán,
 * nên không dùng `expo-crypto`.
 *
 * Lý do tránh `expo-crypto`: nó là module native, mà thêm module native đòi hỏi
 * build lại APK development client. Với nhu cầu ở đây thì cái giá đó là vô ích.
 */
export function createLocalId(): string {
  counter += 1;
  const time = Date.now().toString(36);
  const seq = counter.toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${seq}-${rand}`;
}
