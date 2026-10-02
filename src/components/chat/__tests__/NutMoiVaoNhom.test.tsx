import React from 'react';
import { Alert, Share } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NutMoiVaoNhom } from '../NutMoiVaoNhom';
import { layLoiMoi, taoLoiMoi, tatLoiMoi } from '../../../lib/api/loi-moi';
import type { Project, Workspace } from '../../../lib/types';

jest.mock('../../../lib/api/loi-moi');

const LOI_MOI = {
  code: '7K3M9QXA',
  url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA',
  expiresAt: '2026-10-09T03:30:00.000Z',
  useCount: 2,
};

function duAn(vaiTro: Record<string, 'LEADER' | 'MEMBER'>): Project {
  return {
    id: 'p1',
    name: 'Đồ án EXE',
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '',
    updatedAt: '',
    members: Object.entries(vaiTro).map(([id, role]) => ({
      id: `m-${id}`,
      role,
      user: { id, fullName: id, email: `${id}@wedo.vn` },
    })),
  } as Project;
}

const KHONG_GIAN = { id: 'w1', name: 'Lớp', ownerId: 'u-chu', createdAt: '', updatedAt: '' } as Workspace;

beforeEach(() => jest.clearAllMocks());

it('thành viên thường không thấy nút mời', async () => {
  const man = await render(
    <NutMoiVaoNhom meId="u-tv" project={duAn({ 'u-tv': 'MEMBER' })} workspace={KHONG_GIAN} />,
  );
  expect(man.queryByTestId('nut-moi-vao-nhom')).toBeNull();
});

it('Leader thấy nút mời', async () => {
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );
  expect(man.getByTestId('nut-moi-vao-nhom')).toBeTruthy();
});

it('chủ không gian thấy nút mời dù không ở trong dự án', async () => {
  const man = await render(<NutMoiVaoNhom meId="u-chu" project={duAn({})} workspace={KHONG_GIAN} />);
  expect(man.getByTestId('nut-moi-vao-nhom')).toBeTruthy();
});

it('chưa có link: Chia sẻ tạo link rồi mở bảng chia sẻ với đúng nội dung', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(null);
  (taoLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  const chiaSe = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => expect(layLoiMoi).toHaveBeenCalledWith('p1'));
  await fireEvent.press(man.getByTestId('nut-chia-se-loi-moi'));

  await waitFor(() =>
    expect(chiaSe).toHaveBeenCalledWith({
      message:
        'Tham gia dự án Đồ án EXE trên WeDo: https://wedofpt.com.vn/#/moi/7K3M9QXA. Hoặc nhập mã 7K3M-9QXA trong app.',
    }),
  );
  expect(taoLoiMoi).toHaveBeenCalledWith('p1');
  chiaSe.mockRestore();
});

it('có link: hiện mã; Tắt link hỏi xác nhận rồi mới gọi máy chủ', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  (tatLoiMoi as jest.Mock).mockResolvedValue({ ok: true });
  const hoi = jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => expect(man.getByTestId('ma-moi-hien-tai').props.children).toBe('7K3M-9QXA'));
  await fireEvent.press(man.getByTestId('nut-tat-link'));

  await waitFor(() => expect(tatLoiMoi).toHaveBeenCalledWith('p1'));
  expect(hoi).toHaveBeenCalledTimes(1);
  hoi.mockRestore();
});

it('có link: Tạo link mới hỏi xác nhận rồi thay mã đang hiện', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  (taoLoiMoi as jest.Mock).mockResolvedValue({ ...LOI_MOI, code: 'ABCD2345', useCount: 0 });
  const hoi = jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => man.getByTestId('ma-moi-hien-tai'));
  await fireEvent.press(man.getByTestId('nut-tao-link-moi'));

  await waitFor(() => expect(man.getByTestId('ma-moi-hien-tai').props.children).toBe('ABCD-2345'));
  hoi.mockRestore();
});
