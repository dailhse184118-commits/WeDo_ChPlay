import React from 'react';
import { render } from '@testing-library/react-native';

import { TabLabel } from '../TabLabel';
import { GIOI_HAN_CO_CHU } from '../../../theme/responsive';

describe('TabLabel', () => {
  it('hiện nhãn của tab', async () => {
    const { getByText } = await render(<TabLabel color="#0055c7">Trò chuyện</TabLabel>);
    expect(getByText('Trò chuyện')).toBeTruthy();
  });

  it('nhận màu do thanh tab truyền vào, để tab đang chọn đổi màu được', async () => {
    const { getByText } = await render(<TabLabel color="#0055c7">Thông báo</TabLabel>);

    const style = getByText('Thông báo').props.style;
    expect(JSON.stringify(style)).toContain('#0055c7');
  });

  it('chặn cỡ chữ ở ngưỡng, vì thanh tab không cuộn được', async () => {
    const { getByText } = await render(<TabLabel color="#0055c7">Tài khoản</TabLabel>);
    expect(getByText('Tài khoản').props.maxFontSizeMultiplier).toBe(GIOI_HAN_CO_CHU);
  });

  it('giữ nhãn trong một dòng', async () => {
    const { getByText } = await render(<TabLabel color="#0055c7">Việc của tôi</TabLabel>);
    expect(getByText('Việc của tôi').props.numberOfLines).toBe(1);
  });
});
