import React from 'react';
import { ActionSheetIOS, Platform, Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BangThaoTac, useBangThaoTac, type ThaoTac } from '../BangThaoTac';

function thaoTacMau(): ThaoTac[] {
  return [
    { khoa: 'bao-cao', nhan: 'Báo cáo tin nhắn', onChon: jest.fn() },
    { khoa: 'chan', nhan: 'Chặn người này', nguyHiem: true, onChon: jest.fn() },
  ];
}

describe('BangThaoTac (bản Android)', () => {
  it('hiện đủ các thao tác kèm nút Huỷ', async () => {
    const man = await render(<BangThaoTac visible thaoTac={thaoTacMau()} onDong={jest.fn()} />);

    expect(man.getByText('Báo cáo tin nhắn')).toBeTruthy();
    expect(man.getByText('Chặn người này')).toBeTruthy();
    expect(man.getByTestId('thao-tac-huy')).toBeTruthy();
  });

  /* Đóng trước rồi mới chạy: thao tác thường mở tiếp một Modal khác. */
  it('chọn một thao tác thì đóng bảng trước, rồi mới chạy thao tác', async () => {
    const thuTu: string[] = [];
    const onDong = jest.fn(() => thuTu.push('dong'));
    const thaoTac = thaoTacMau();
    (thaoTac[1].onChon as jest.Mock).mockImplementation(() => thuTu.push('chan'));

    const man = await render(<BangThaoTac visible thaoTac={thaoTac} onDong={onDong} />);
    await fireEvent.press(man.getByTestId('thao-tac-chan'));

    expect(thuTu).toEqual(['dong', 'chan']);
    expect(thaoTac[0].onChon).not.toHaveBeenCalled();
  });

  it('Huỷ chỉ đóng, không chạy thao tác nào', async () => {
    const onDong = jest.fn();
    const thaoTac = thaoTacMau();
    const man = await render(<BangThaoTac visible thaoTac={thaoTac} onDong={onDong} />);

    await fireEvent.press(man.getByTestId('thao-tac-huy'));

    expect(onDong).toHaveBeenCalledTimes(1);
    thaoTac.forEach((viec) => expect(viec.onChon).not.toHaveBeenCalled());
  });
});

/** Dựng hook trong một màn tối giản, có một nút để mở bảng. */
function ManThu({ thaoTac }: { thaoTac: ThaoTac[] }) {
  const { moBang, bang } = useBangThaoTac();
  return (
    <>
      <Pressable testID="mo" onPress={() => moBang({ tieuDe: 'Tuấn', thaoTac })}>
        <Text>mở</Text>
      </Pressable>
      {bang}
    </>
  );
}

describe('useBangThaoTac', () => {
  /*
    Khôi phục từng thứ đã thay, không dùng `jest.restoreAllMocks()` — nó gỡ luôn
    cả những mock dùng chung khác trong bộ kiểm thử.
  */
  let heDieuHanh: { restore: () => void } | null = null;
  function dat(os: 'ios' | 'android') {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', os);
  }
  afterEach(() => {
    heDieuHanh?.restore();
    heDieuHanh = null;
  });

  it('iOS: dùng ActionSheetIOS gốc, Huỷ ở cuối, dòng nguy hiểm tô đỏ', async () => {
    dat('ios');
    const spy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_tuyChon, goiLai) => goiLai(1));
    const thaoTac = thaoTacMau();

    const man = await render(<ManThu thaoTac={thaoTac} />);
    await fireEvent.press(man.getByTestId('mo'));

    expect(spy).toHaveBeenCalledWith(
      {
        options: ['Báo cáo tin nhắn', 'Chặn người này', 'Huỷ'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: [1],
        title: 'Tuấn',
      },
      expect.any(Function),
    );
    expect(thaoTac[1].onChon).toHaveBeenCalledTimes(1);
    expect(thaoTac[0].onChon).not.toHaveBeenCalled();
    // Không dựng Modal riêng trên iOS.
    expect(man.queryByTestId('bang-thao-tac')).toBeNull();

    spy.mockRestore();
  });

  it('iOS: bấm Huỷ không chạy thao tác nào', async () => {
    dat('ios');
    const spy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_tuyChon, goiLai) => goiLai(2));
    const thaoTac = thaoTacMau();

    const man = await render(<ManThu thaoTac={thaoTac} />);
    await fireEvent.press(man.getByTestId('mo'));

    thaoTac.forEach((viec) => expect(viec.onChon).not.toHaveBeenCalled());

    spy.mockRestore();
  });

  it('Android: mở bảng trượt, chọn xong thì bảng đóng', async () => {
    dat('android');
    const thaoTac = thaoTacMau();

    const man = await render(<ManThu thaoTac={thaoTac} />);
    expect(man.queryByText('Báo cáo tin nhắn')).toBeNull();

    await fireEvent.press(man.getByTestId('mo'));
    expect(man.getByText('Tuấn')).toBeTruthy();

    await fireEvent.press(man.getByTestId('thao-tac-bao-cao'));
    expect(thaoTac[0].onChon).toHaveBeenCalledTimes(1);
    expect(man.queryByText('Báo cáo tin nhắn')).toBeNull();

  });

  it('không có thao tác nào thì không mở gì cả', async () => {
    dat('ios');
    const spy = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});

    const man = await render(<ManThu thaoTac={[]} />);
    await act(async () => {
      await fireEvent.press(man.getByTestId('mo'));
    });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
