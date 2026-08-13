import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenContainer } from '../ScreenContainer';
import { CHIEU_RONG_NOI_DUNG_TOI_DA } from '../../../theme/responsive';
import { TEST_SAFE_AREA } from '../../../test-utils/render';

function renderOMay(width: number) {
  // `useWindowDimensions` lấy số đo ban đầu từ `Dimensions.get('window')`.
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height: 900, scale: 3, fontScale: 1 } as never);

  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <ScreenContainer>
        <Text>nội dung</Text>
      </ScreenContainer>
    </SafeAreaProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ScreenContainer', () => {
  it('để nội dung chiếm hết bề rộng trên điện thoại', async () => {
    const { getByTestId } = await renderOMay(411);

    const style = StyleSheet.flatten(getByTestId('screen-content').props.style);
    expect(style.maxWidth).toBeUndefined();
  });

  it('kẹp bề rộng và căn giữa nội dung trên tablet', async () => {
    const { getByTestId } = await renderOMay(1024);

    const style = StyleSheet.flatten(getByTestId('screen-content').props.style);
    expect(style.maxWidth).toBe(CHIEU_RONG_NOI_DUNG_TOI_DA);
    expect(style.alignSelf).toBe('center');
    // Kẹp mà không căn giữa thì nội dung dồn hết sang mép trái.
  });

  it('không kẹp ở đúng ngưỡng, chỉ kẹp khi vượt qua', async () => {
    const { getByTestId } = await renderOMay(CHIEU_RONG_NOI_DUNG_TOI_DA);

    const style = StyleSheet.flatten(getByTestId('screen-content').props.style);
    expect(style.maxWidth).toBeUndefined();
  });
});
