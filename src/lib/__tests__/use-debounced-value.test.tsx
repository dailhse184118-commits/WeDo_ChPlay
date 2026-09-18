import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useDebouncedValue } from '../use-debounced-value';

function Thu({ gia, cho }: { gia: string; cho: number }) {
  return <Text testID="ra">{useDebouncedValue(gia, cho)}</Text>;
}

/** Đẩy đồng hồ giả và để React chạy hết phần việc phát sinh. */
async function troiQua(mili: number) {
  await act(async () => {
    jest.advanceTimersByTime(mili);
  });
}

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('trả giá trị đầu ngay, không phải chờ', async () => {
    const { getByTestId } = await render(<Thu gia="a" cho={300} />);

    expect(getByTestId('ra').props.children).toBe('a');
  });

  it('chưa hết thời gian chờ thì giữ giá trị cũ', async () => {
    const { getByTestId, rerender } = await render(<Thu gia="a" cho={300} />);

    await rerender(<Thu gia="ab" cho={300} />);
    await troiQua(299);

    expect(getByTestId('ra').props.children).toBe('a');
  });

  it('hết thời gian chờ thì nhả giá trị mới', async () => {
    const { getByTestId, rerender } = await render(<Thu gia="a" cho={300} />);

    await rerender(<Thu gia="ab" cho={300} />);
    await troiQua(300);

    expect(getByTestId('ra').props.children).toBe('ab');
  });

  /*
    Đây là lý do tồn tại của hook. Gõ liên tục thì chỉ ký tự cuối được hỏi máy
    chủ; nếu mỗi lần đổi lại đặt một hẹn giờ mới mà không huỷ cái cũ thì mọi ký
    tự đều bắn một lượt gọi — đúng thứ cần tránh.
  */
  it('gõ liên tục chỉ nhả ký tự cuối', async () => {
    const { getByTestId, rerender } = await render(<Thu gia="a" cho={300} />);

    await rerender(<Thu gia="ab" cho={300} />);
    await troiQua(200);
    await rerender(<Thu gia="abc" cho={300} />);
    await troiQua(200);

    expect(getByTestId('ra').props.children).toBe('a');

    await troiQua(100);

    expect(getByTestId('ra').props.children).toBe('abc');
  });
});
