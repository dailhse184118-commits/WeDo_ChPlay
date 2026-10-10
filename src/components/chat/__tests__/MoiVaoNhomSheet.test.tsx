import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { MoiVaoNhomSheet } from '../MoiVaoNhomSheet';
import { layLoiMoi } from '../../../lib/api/loi-moi';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';

jest.mock('../../../lib/api/loi-moi');
// react-native-qrcode-svg được mock chung trong jest.setup.js: View testID "ma-qr" giữ `value`.

const LOI_MOI = {
  code: '7K3M9QXA',
  url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA',
  expiresAt: '2026-10-31T07:05:00.000Z',
  useCount: 2,
};

const dung = () =>
  render(<MoiVaoNhomSheet visible projectId="p1" projectName="Nhóm EXE" onDismiss={jest.fn()} />);

beforeEach(() => jest.clearAllMocks());

it('có link mời: vẽ QR của đúng link, kèm hướng dẫn quét', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  const man = await dung();

  await waitFor(() => man.getByTestId('ma-qr'));
  expect(man.getByTestId('ma-qr').props.value).toBe(LOI_MOI.url);
  expect(man.getByLabelText('Mã QR mời vào nhóm')).toBeTruthy();
  expect(man.getByText('Bạn bè mở WeDo → Nhập mã mời → Quét mã QR')).toBeTruthy();
  expect(man.getByTestId('ma-moi-hien-tai').props.children).toBe('7K3M-9QXA');
  expect(man.queryByText(/chờ bản build mới/)).toBeNull();
});

it('chưa có link: không vẽ QR', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(null);
  const man = await dung();

  await waitFor(() => man.getByText('Dự án chưa có link mời đang dùng.'));
  expect(man.queryByTestId('ma-qr')).toBeNull();
  expect(man.queryByTestId('qr-loi-moi')).toBeNull();
});

it('tải link lỗi: không vẽ QR của link cũ', async () => {
  (layLoiMoi as jest.Mock).mockRejectedValue(new Error('mạng'));
  const man = await dung();

  await waitFor(() => man.getByText('Có lỗi xảy ra. Thử lại sau ít phút.'));
  expect(man.queryByTestId('ma-qr')).toBeNull();
});

it('tiếng Anh: QR có nhãn và hướng dẫn tiếng Anh, không còn chữ tiếng Việt', async () => {
  datNgonNguChoKiemThu('en');
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  const man = await dung();

  await waitFor(() => man.getByTestId('ma-qr'));
  expect(man.getByLabelText('Team invite QR code')).toBeTruthy();
  expect(man.getByText('Friends open WeDo → Enter invite code → Scan QR code')).toBeTruthy();
  expect(chuVietConSot(JSON.stringify(man.toJSON()), ['Nhóm EXE'])).toEqual([]);
});
