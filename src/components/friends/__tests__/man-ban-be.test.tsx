import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManBanBe from '../../../app/(tabs)/chat/friends';
import { listFriends, searchUsers } from '../../../lib/api/friends';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/api/friends', () => ({
  ...jest.requireActual('../../../lib/api/friends'),
  listFriends: jest.fn(),
  searchUsers: jest.fn(),
  sendFriendRequest: jest.fn(),
  respondToRequest: jest.fn(),
}));
jest.mock('../../../lib/api/direct-chat');
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/use-debounced-value', () => ({ useDebouncedValue: (gia: unknown) => gia }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const mockedDanhSach = listFriends as jest.MockedFunction<typeof listFriends>;
const mockedTim = searchUsers as jest.MockedFunction<typeof searchUsers>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

let queryClient: QueryClient;

async function moMan() {
  return renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManBanBe />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedAuth.mockReturnValue({ user: { id: 'u-toi' } } as never);
  mockedDanhSach.mockResolvedValue({ friends: [], incoming: [], outgoing: [] });
  mockedTim.mockResolvedValue([]);
});

afterEach(() => queryClient.clear());

/*
  Máy chủ trả rỗng cho mọi từ khoá dưới 3 ký tự. Trước đây gõ "Vy" là app hỏi
  máy chủ rồi nói chắc nịch "Không tìm thấy ai khớp" — trong khi bạn Vy có thật.
*/
describe('tìm bạn với từ khoá ngắn', () => {
  it('gõ 2 ký tự thì nhắc gõ thêm, không hỏi máy chủ, không nói "không tìm thấy"', async () => {
    const man = await moMan();

    await fireEvent.changeText(man.getByTestId('tim-nguoi'), 'Vy');

    expect(man.getByText('Gõ ít nhất 3 ký tự để tìm.')).toBeTruthy();
    expect(man.queryByText(/Không tìm thấy ai khớp/)).toBeNull();
    expect(mockedTim).not.toHaveBeenCalled();
  });

  it('đủ 3 ký tự thì tìm như thường', async () => {
    const man = await moMan();

    await fireEvent.changeText(man.getByTestId('tim-nguoi'), 'Văn');

    await waitFor(() => expect(mockedTim).toHaveBeenCalledWith('Văn'));
    expect(man.queryByText('Gõ ít nhất 3 ký tự để tìm.')).toBeNull();
  });
});
