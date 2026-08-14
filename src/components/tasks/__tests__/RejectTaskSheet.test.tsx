import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { RejectTaskSheet, QUICK_REASONS } from '../RejectTaskSheet';

describe('RejectTaskSheet', () => {
  it('hiện đủ ba chip lý do nhanh', async () => {
    const { getByText } = await render(
      <RejectTaskSheet visible onConfirm={() => {}} onDismiss={() => {}} />,
    );

    for (const reason of QUICK_REASONS) {
      expect(getByText(reason)).toBeTruthy();
    }
  });

  it('chạm chip thì điền sẵn vào ô nhập', async () => {
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={() => {}} onDismiss={() => {}} />,
    );

    await fireEvent.press(getByTestId('quick-reason-0'));

    await waitFor(() =>
      expect(getByTestId('reject-reason').props.value).toBe(QUICK_REASONS[0]),
    );
  });

  it('sửa được nội dung sau khi chạm chip', async () => {
    const onConfirm = jest.fn();
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={onConfirm} onDismiss={() => {}} />,
    );

    await fireEvent.press(getByTestId('quick-reason-1'));
    await fireEvent.changeText(getByTestId('reject-reason'), 'Đang quá tải, tuần sau mình nhận');
    await fireEvent.press(getByTestId('reject-confirm'));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith('Đang quá tải, tuần sau mình nhận'),
    );
  });

  it('chặn gửi khi lý do quá ngắn', async () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByText } = await render(
      <RejectTaskSheet visible onConfirm={onConfirm} onDismiss={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('reject-reason'), 'ok');
    await fireEvent.press(getByTestId('reject-confirm'));

    await waitFor(() => expect(getByText('Lý do từ chối phải có ít nhất 3 ký tự')).toBeTruthy());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('gửi lý do đã cắt khoảng trắng', async () => {
    const onConfirm = jest.fn();
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={onConfirm} onDismiss={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('reject-reason'), '  Bận thi cuối kỳ  ');
    await fireEvent.press(getByTestId('reject-confirm'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Bận thi cuối kỳ'));
  });

  it('hiện bộ đếm ký tự', async () => {
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={() => {}} onDismiss={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('reject-reason'), 'Bận');
    await waitFor(() => expect(getByTestId('reject-counter').props.children.join('')).toBe('3/200'));
  });

  it('hiện lỗi từ máy chủ khi được truyền vào', async () => {
    const { getByText } = await render(
      <RejectTaskSheet
        visible
        error="Task này không còn ở trạng thái chờ phản hồi"
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Task này không còn ở trạng thái chờ phản hồi')).toBeTruthy();
  });

  it('dùng lại được cho việc trả bài, với chữ và lý do gợi ý riêng', async () => {
    /*
      Leader trả bài cũng cần đúng cái phiếu này, chỉ khác nội dung. Nhân bản cả
      component chỉ để đổi mấy dòng chữ thì hai bản sẽ trôi khỏi nhau.
    */
    const { getByText, queryByText } = await render(
      <RejectTaskSheet
        visible
        heading="Trả bài lại"
        confirmLabel="Gửi yêu cầu sửa"
        quickReasons={['Thiếu số liệu', 'Sai định dạng']}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Trả bài lại')).toBeTruthy();
    expect(getByText('Gửi yêu cầu sửa')).toBeTruthy();
    expect(getByText('Thiếu số liệu')).toBeTruthy();
    expect(queryByText(QUICK_REASONS[0])).toBeNull();
  });

  it('gọi onDismiss khi bấm huỷ', async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={() => {}} onDismiss={onDismiss} />,
    );

    await fireEvent.press(getByTestId('reject-cancel'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
