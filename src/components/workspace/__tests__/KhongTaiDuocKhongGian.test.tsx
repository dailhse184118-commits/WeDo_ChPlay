import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { KhongTaiDuocKhongGian } from '../KhongTaiDuocKhongGian';
import { useWorkspace } from '../../../lib/workspace/workspace-context';

jest.mock('../../../lib/workspace/workspace-context');

const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

describe('KhongTaiDuocKhongGian', () => {
  it('nói rõ chưa kết nối được và có nút Thử lại gọi nạp lại', async () => {
    const refresh = jest.fn(async () => undefined);
    mockedWorkspace.mockReturnValue({ refresh } as never);

    const man = await render(<KhongTaiDuocKhongGian />);

    expect(man.getByText('Chưa kết nối được máy chủ')).toBeTruthy();
    await fireEvent.press(man.getByTestId('workspace-retry'));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
