import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { NhapMaMoiSheet } from '../NhapMaMoiSheet';
import { ApiError } from '../../../lib/api/client';
import { thamGiaLoiMoi, xemTruocLoiMoi } from '../../../lib/api/loi-moi';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { renderScreen } from '../../../test-utils/render';

jest.mock('../../../lib/api/loi-moi');

const XEM_TRUOC = {
  projectName: 'Đồ án EXE',
  workspaceName: 'Nhóm 3',
  leaderName: 'Lan',
  memberCount: 4,
  expiresAt: '2026-10-09T03:30:00.000Z',
};

function dung(onDaThamGia = jest.fn()) {
  return render(<NhapMaMoiSheet visible onDismiss={jest.fn()} onDaThamGia={onDaThamGia} />);
}

beforeEach(() => jest.clearAllMocks());

it('ô mã tự viết hoa và thêm gạch giữa khi gõ', async () => {
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9q');

  expect(man.getByTestId('o-ma-moi').props.value).toBe('7K3M-9Q');
});

it('chưa đủ 8 ký tự thì chưa hỏi máy chủ', async () => {
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9q');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));

  expect(xemTruocLoiMoi).not.toHaveBeenCalled();
});

it('xem trước rồi tham gia: báo đúng kết quả ra ngoài', async () => {
  (xemTruocLoiMoi as jest.Mock).mockResolvedValue(XEM_TRUOC);
  (thamGiaLoiMoi as jest.Mock).mockResolvedValue({
    projectId: 'p-moi',
    workspaceId: 'w2',
    alreadyMember: false,
  });
  const onDaThamGia = jest.fn();
  const man = await dung(onDaThamGia);

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m-9qxa');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
  await waitFor(() => man.getByText('Đồ án EXE'));

  expect(xemTruocLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
  expect(man.getByText('Không gian Nhóm 3 · Leader Lan · 4 thành viên')).toBeTruthy();

  await fireEvent.press(man.getByTestId('nut-tham-gia'));

  await waitFor(() =>
    expect(onDaThamGia).toHaveBeenCalledWith({ projectId: 'p-moi', workspaceId: 'w2', alreadyMember: false }),
  );
  expect(thamGiaLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
});

it('link hết hạn: hiện câu dịch theo mã lỗi', async () => {
  (xemTruocLoiMoi as jest.Mock).mockRejectedValue(new ApiError('Gone', 410, 'INVITE_EXPIRED'));
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7K3M9QXA');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));

  await waitFor(() =>
    expect(man.getByTestId('loi-ma-moi').props.children).toBe(
      'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
    ),
  );
});

describe('quét mã QR', () => {
  // Màn quét dùng useSafeAreaInsets nên phải dựng kèm SafeAreaProvider.
  const dungCoQuet = (onDaThamGia = jest.fn()) =>
    renderScreen(<NhapMaMoiSheet visible onDismiss={jest.fn()} onDaThamGia={onDaThamGia} />);


  it('chưa bấm Quét thì chưa bật máy ảnh', async () => {
    const man = await dungCoQuet();

    expect(man.getByLabelText('Quét mã QR')).toBeTruthy();
    expect(man.queryByTestId('may-anh-quet-qr')).toBeNull();
  });

  it('quét được mã: đóng màn quét, điền ô mã và tự xem trước, chưa tự tham gia', async () => {
    (xemTruocLoiMoi as jest.Mock).mockResolvedValue(XEM_TRUOC);
    const man = await dungCoQuet();

    await fireEvent.press(man.getByTestId('nut-quet-qr'));
    const mayAnh = man.getByTestId('may-anh-quet-qr');
    await act(async () => {
      mayAnh.props.onBarcodeScanned({ data: 'https://wedofpt.com.vn/#/moi/7k3m9qxa', type: 'qr' });
    });

    await waitFor(() => man.getByText('Đồ án EXE'));
    expect(xemTruocLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
    expect(man.getByTestId('o-ma-moi').props.value).toBe('7K3M-9QXA');
    expect(man.queryByTestId('may-anh-quet-qr')).toBeNull();
    expect(thamGiaLoiMoi).not.toHaveBeenCalled();
    expect(man.getByTestId('nut-tham-gia')).toBeTruthy();
  });

  it('QR lạ: vẫn ở màn quét, không hỏi máy chủ', async () => {
    const man = await dungCoQuet();

    await fireEvent.press(man.getByTestId('nut-quet-qr'));
    await act(async () => {
      man.getByTestId('may-anh-quet-qr').props.onBarcodeScanned({ data: 'https://example.com', type: 'qr' });
    });

    expect(man.getByTestId('loi-quet-qr')).toBeTruthy();
    expect(xemTruocLoiMoi).not.toHaveBeenCalled();
  });

  it('tiếng Anh: nút quét và bảng không còn chữ tiếng Việt', async () => {
    datNgonNguChoKiemThu('en');
    const man = await dungCoQuet();

    expect(man.getByText('Scan QR')).toBeTruthy();
    expect(man.getByLabelText('Scan QR code')).toBeTruthy();
    expect(chuVietConSot(JSON.stringify(man.toJSON()))).toEqual([]);
  });
});
