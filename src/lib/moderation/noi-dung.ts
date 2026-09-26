import type { LyDoBaoCao } from '../api/moderation';

/*
  Chữ trên giao diện của báo cáo và chặn, gom một chỗ.

  Điều khoản sử dụng hứa với người dùng đúng những lời này, và reviewer của
  Apple đọc chúng khi thử luồng báo cáo. Để rải trong từng màn thì sớm muộn hai
  màn sẽ nói hai kiểu.
*/

/** Thứ tự hiện trên phiếu báo cáo. "Lý do khác" luôn nằm cuối. */
export const LY_DO_BAO_CAO: ReadonlyArray<{ ma: LyDoBaoCao; nhan: string }> = [
  { ma: 'SPAM', nhan: 'Spam, quảng cáo' },
  { ma: 'HARASSMENT', nhan: 'Quấy rối, bắt nạt' },
  { ma: 'HATE', nhan: 'Thù ghét, phân biệt đối xử' },
  { ma: 'SEXUAL', nhan: 'Nội dung tình dục' },
  { ma: 'VIOLENCE', nhan: 'Bạo lực, đe doạ' },
  { ma: 'OTHER', nhan: 'Lý do khác' },
];

export const CAU_DA_BAO_CAO = 'Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.';

/**
 * Máy chủ giới hạn 30 báo cáo mỗi người mỗi 24 giờ. Nói thẳng là phải đợi, đừng
 * để người dùng tưởng app hỏng rồi bấm gửi lại mãi.
 */
export const CAU_QUA_NHIEU_BAO_CAO =
  'Bạn đã gửi nhiều báo cáo trong 24 giờ qua. Vui lòng thử lại sau.';

export function tieuDeXacNhanChan(ten: string): string {
  return `Chặn ${ten.trim() || 'người này'}?`;
}

export const NOI_DUNG_XAC_NHAN_CHAN =
  'Bạn sẽ không thấy tin nhắn của người này nữa, và hai người không thể nhắn tin riêng hay kết bạn với nhau. Bạn có thể bỏ chặn trong Tài khoản → Người đã chặn.';
