import { khaiBaoTuDien } from '../dich';

/**
 * Xuất báo cáo đóng góp (Tài khoản → Bảng đóng góp). Nội dung tệp PDF/Excel do
 * máy chủ dựng nên không nằm ở đây: app chỉ xin link tải rồi mở bằng trình duyệt.
 */
export const tuDienBaoCao = khaiBaoTuDien(
  {
    tieuDe: 'Xuất báo cáo đóng góp',
    moTa: 'Leader nhận báo cáo cả nhóm, thành viên nhận báo cáo của riêng mình. Số liệu tính từ ngày tạo dự án tới hôm nay.',
    khongTaiDuAn: 'Không tải được danh sách dự án.',
    chuaCoDuAn: 'Không gian này chưa có dự án nào.',
    duAn: 'Dự án',
    dinhDang: 'Định dạng',
    xuat: 'Xuất báo cáo',

    // Câu báo lỗi (lib/bao-cao.ts)
    loiQuaLon:
      'Báo cáo có hơn 3.000 việc, quá lớn để xuất trên điện thoại. Hãy xuất trên máy tính và chọn khoảng thời gian ngắn hơn.',
    loiKhoangThoiGian: 'Khoảng thời gian của báo cáo không hợp lệ. Thử lại sau ít phút.',
    loiLinkHetHan: 'Link tải đã hết hạn. Bấm Xuất báo cáo lần nữa.',
    loiKhongThayDuAn: 'Không tìm thấy dự án, hoặc bạn không còn trong dự án này.',
    loiQuaNhanh: 'Bạn xuất báo cáo quá nhanh. Đợi một phút rồi thử lại.',
    loiKhongMo: 'Không mở được báo cáo. Thử lại sau ít phút.',
  },
  {
    tieuDe: 'Export contribution report',
    moTa: 'Leaders get a report for the whole group, and members get a report for themselves. The figures run from the day the project was created until today.',
    khongTaiDuAn: 'Couldn’t load the project list.',
    chuaCoDuAn: 'This workspace doesn’t have any projects yet.',
    duAn: 'Project',
    dinhDang: 'Format',
    xuat: 'Export report',

    loiQuaLon:
      'This report has more than 3,000 tasks, which is too large to export on a phone. Export it on a computer and choose a shorter date range.',
    loiKhoangThoiGian: 'The report’s date range isn’t valid. Please try again in a few minutes.',
    loiLinkHetHan: 'The download link has expired. Tap Export report again.',
    loiKhongThayDuAn: 'Project not found, or you’re no longer in this project.',
    loiQuaNhanh: 'You’re exporting too fast. Wait a minute and try again.',
    loiKhongMo: 'Couldn’t open the report. Please try again in a few minutes.',
  },
);
