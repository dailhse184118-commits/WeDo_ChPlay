import { khaiBaoTuDien } from '../dich';

/** Chữ dùng ở nhiều nơi trong app. Các khu vực khác thêm từ điển riêng cạnh tệp này. */
export const tuDienChung = khaiBaoTuDien(
  {
    huy: 'Huỷ',
    luu: 'Lưu',
    dong: 'Đóng',
    thuLai: 'Thử lại',
    troVe: 'Quay lại',
    dangTai: 'Đang tải…',
    loiChung: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    ngonNgu: 'Ngôn ngữ',
    theoMay: 'Theo ngôn ngữ máy',
    chamDeDoi: (ten: string) => `${ten}. Chạm để đổi`,
  },
  {
    huy: 'Cancel',
    luu: 'Save',
    dong: 'Close',
    thuLai: 'Try again',
    troVe: 'Back',
    dangTai: 'Loading…',
    loiChung: 'Something went wrong. Please try again.',
    ngonNgu: 'Language',
    theoMay: 'Use device language',
    chamDeDoi: (ten: string) => `${ten}. Tap to change`,
  },
);
