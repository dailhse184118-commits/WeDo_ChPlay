import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { useHeaderTep } from '../use-header-tep';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../auth/token-storage', () => ({ loadToken: jest.fn() }));

const mockedLoad = loadToken as jest.MockedFunction<typeof loadToken>;

function Thu() {
  const headers = useHeaderTep();
  return <Text testID="ra">{headers ? headers.Authorization : 'chua-co'}</Text>;
}

describe('useHeaderTep', () => {
  beforeEach(() => jest.clearAllMocks());

  it('trả header Bearer khi đã có token', async () => {
    mockedLoad.mockResolvedValue('abc123');

    const { getByTestId } = await render(<Thu />);

    await waitFor(() => expect(getByTestId('ra').props.children).toBe('Bearer abc123'));
  });

  /*
    Chưa đăng nhập hoặc keystore hỏng thì `loadToken` trả null. Dựng
    `Bearer null` cho ra một yêu cầu chắc chắn 401 — tệ hơn là không gửi header.
  */
  it('không dựng header khi chưa có token', async () => {
    mockedLoad.mockResolvedValue(null);

    const { getByTestId } = await render(<Thu />);

    await waitFor(() => expect(getByTestId('ra').props.children).toBe('chua-co'));
  });

  it('không ngã khi đọc token ném lỗi', async () => {
    mockedLoad.mockRejectedValue(new Error('keystore hỏng'));

    const { getByTestId } = await render(<Thu />);

    await waitFor(() => expect(getByTestId('ra').props.children).toBe('chua-co'));
  });
});
