import { khaiBaoTuDien } from '../dich';

/** Chữ của bước khởi đầu: tạo không gian làm việc đầu tiên (và hộp thoại tạo thêm). */
export const tuDienKhoiDau = khaiBaoTuDien(
  {
    thieuTen: 'Vui lòng nhập tên không gian làm việc',
    khongTaoDuoc: 'Không tạo được không gian làm việc.',
    tieuDe: 'Tạo không gian làm việc',
    gioiThieu:
      'Không gian làm việc là nơi chứa các dự án và công việc của nhóm bạn. Tạo một cái để bắt đầu.',
    nhanTen: 'Tên không gian làm việc',
    tenMau: 'Nhóm đồ án tốt nghiệp',
    tao: 'Tạo',
    coMaMoi: 'Có mã mời? Nhập mã',
  },
  {
    thieuTen: 'Please enter a workspace name',
    khongTaoDuoc: 'Couldn’t create the workspace.',
    tieuDe: 'Create a workspace',
    gioiThieu: 'A workspace is where your team’s projects and tasks live. Create one to get started.',
    nhanTen: 'Workspace name',
    tenMau: 'Graduation project team',
    tao: 'Create',
    coMaMoi: 'Have an invite code? Enter it',
  },
);
