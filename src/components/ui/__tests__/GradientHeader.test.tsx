import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { GradientHeader } from '../GradientHeader';
import { GIOI_HAN_CO_CHU } from '../../../theme/responsive';
import { renderScreen } from '../../../test-utils/render';

describe('GradientHeader', () => {
  it('hiện tiêu đề và phụ đề', async () => {
    const { getByText } = await renderScreen(
      <GradientHeader title="Chào Đại" subtitle="Nhóm đồ án" />,
    );

    expect(getByText('Chào Đại')).toBeTruthy();
    expect(getByText('Nhóm đồ án')).toBeTruthy();
  });

  it('chặn cỡ chữ tiêu đề, vì header không cuộn được', async () => {
    const { getByText } = await renderScreen(<GradientHeader title="Chào Đại" />);

    expect(getByText('Chào Đại').props.maxFontSizeMultiplier).toBe(GIOI_HAN_CO_CHU);
  });

  it('không có gì bấm được ở phụ đề khi không truyền onPressSubtitle', async () => {
    const { queryByTestId } = await renderScreen(
      <GradientHeader title="Chào Đại" subtitle="Nhóm đồ án" />,
    );

    expect(queryByTestId('header-subtitle-button')).toBeNull();
  });

  it('biến phụ đề thành nút khi có onPressSubtitle', async () => {
    const onPressSubtitle = jest.fn();
    const { getByTestId } = await renderScreen(
      <GradientHeader title="Chào Đại" subtitle="Nhóm đồ án" onPressSubtitle={onPressSubtitle} />,
    );

    await fireEvent.press(getByTestId('header-subtitle-button'));

    expect(onPressSubtitle).toHaveBeenCalledTimes(1);
  });
});
