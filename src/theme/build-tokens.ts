import { cappedFontScale, lineHeightFor, scaleForWidth, widthStep } from './responsive';

/**
 * Dựng các nhóm token phụ thuộc kích cỡ máy.
 *
 * Hàm thuần: nhận bề rộng màn hình và cỡ chữ hệ thống, trả về số. `tokens.ts`
 * là nơi duy nhất đọc số đo thật rồi gọi xuống đây — nhờ vậy kiểm được mọi kích
 * cỡ mà không phải nạp lại module hay giả lập `react-native`.
 */
export function buildTokens(width: number, systemFontScale: number) {
  const heSoBeRong = scaleForWidth(widthStep(width));
  const coChuDaChan = cappedFontScale(systemFontScale);

  /** Khoảng cách và kích cỡ hình học: chỉ theo bề rộng máy. */
  const theoBeRong = (giaTri: number) => Math.round(giaTri * heSoBeRong);

  /** Hộp chứa chữ: theo cả bề rộng máy lẫn cỡ chữ, vì chữ bên trong phóng to lên. */
  const theoBeRongVaCoChu = (giaTri: number) =>
    Math.round(giaTri * heSoBeRong * coChuDaChan);

  const spacing = {
    /** Khoảng hở giữa hai dòng chữ dính nhau, ví dụ tiêu đề và dòng phụ dưới nó. */
    xxs: theoBeRong(2),
    xs: theoBeRong(4),
    sm: theoBeRong(8),
    md: theoBeRong(16),
    lg: theoBeRong(24),
    xl: theoBeRong(32),
  };

  /*
    Cỡ chữ chỉ nhân theo bề rộng máy, KHÔNG nhân theo cỡ chữ hệ thống: React
    Native đã tự phóng lúc dựng chữ. Nhân thêm lần nữa là phóng bình phương —
    mức 200% của Android sẽ thành 400%.
  */
  const fontSize = {
    /** Nhãn thanh tab, dấu thời gian, chip độ tin cậy. */
    xxs: theoBeRong(11),
    xs: theoBeRong(12),
    sm: theoBeRong(14),
    md: theoBeRong(16),
    lg: theoBeRong(20),
    xl: theoBeRong(26),
  };

  /**
   * Chiều cao dòng, một bậc cho mỗi bậc cỡ chữ.
   *
   * Phải là token chứ không phải số nhúng cứng trong `StyleSheet`: `lineHeight`
   * của React Native là dp cố định, không phóng theo cỡ chữ hệ thống. Để số
   * cứng thì ở cỡ chữ 200% chữ cao gấp đôi mà khoảng dòng đứng yên, chữ chồng
   * lên nhau rồi bị cắt.
   */
  const lineHeight = {
    xxs: lineHeightFor(fontSize.xxs, systemFontScale),
    xs: lineHeightFor(fontSize.xs, systemFontScale),
    sm: lineHeightFor(fontSize.sm, systemFontScale),
    md: lineHeightFor(fontSize.md, systemFontScale),
    lg: lineHeightFor(fontSize.lg, systemFontScale),
    xl: lineHeightFor(fontSize.xl, systemFontScale),
  };

  /**
   * Hai nhóm kích cỡ khác nhau. Nhóm hình vuông/tròn chỉ nhân theo bề rộng máy —
   * nhân theo cỡ chữ sẽ làm avatar phình méo so với hàng chữ bên cạnh. Riêng
   * `control` nhân cả hai, vì thứ phóng to là chữ nằm bên trong nó.
   */
  const sizes = {
    /** Ô icon vuông bo góc, tô màu nhạt theo ý nghĩa. */
    iconTile: theoBeRong(40),
    /** Avatar dự án trong danh sách. */
    projectAvatar: theoBeRong(48),
    /** Avatar lớn trên thẻ danh tính màn Tài khoản. */
    profileAvatar: theoBeRong(80),
    /** Icon Lucide/Ionicons mặc định. */
    icon: theoBeRong(24),
    /** Phần thẻ trắng đè lên gradient phía trên nó. */
    cardOverlap: theoBeRong(12),

    /** Chiều cao ô nhập và nút. Dùng làm `minHeight`, không phải `height`. */
    control: theoBeRongVaCoChu(48),
  };

  return { spacing, fontSize, lineHeight, sizes };
}
