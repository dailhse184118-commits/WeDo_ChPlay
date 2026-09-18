import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SegmentedTabs } from '../SegmentedTabs';

const OPTIONS = [
  { key: 'du-an', label: 'Dự án' },
  { key: 'tin-nhan', label: 'Tin nhắn' },
];

describe('SegmentedTabs', () => {
  it('dựng đủ các mục', async () => {
    const { getByText } = await render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={jest.fn()} />,
    );

    expect(getByText('Dự án')).toBeTruthy();
    expect(getByText('Tin nhắn')).toBeTruthy();
  });

  it('đánh dấu mục đang chọn', async () => {
    const { getByTestId } = await render(
      <SegmentedTabs options={OPTIONS} value="tin-nhan" onChange={jest.fn()} />,
    );

    expect(getByTestId('segment-tin-nhan').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('segment-du-an').props.accessibilityState.selected).toBe(false);
  });

  it('báo key khi chạm mục khác', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={onChange} />,
    );

    fireEvent.press(getByTestId('segment-tin-nhan'));

    expect(onChange).toHaveBeenCalledWith('tin-nhan');
  });

  /*
    Chạm lại mục đang chọn không có gì để đổi. Báo ra ngoài chỉ tổ khiến chỗ gọi
    dựng lại danh sách không vì lý do gì.
  */
  it('chạm lại mục đang chọn thì không báo gì', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={onChange} />,
    );

    fireEvent.press(getByTestId('segment-du-an'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
