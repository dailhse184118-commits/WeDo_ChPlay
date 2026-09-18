import { capNhatAnhDaiDien } from '../account';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('capNhatAnhDaiDien', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('PATCH thẳng vào hồ sơ của chính mình', async () => {
    await capNhatAnhDaiDien('data:image/jpeg;base64,AAAA');

    expect(mockedRequest).toHaveBeenCalledWith('/users/me', {
      method: 'PATCH',
      body: { avatarUrl: 'data:image/jpeg;base64,AAAA' },
    });
  });

  /*
    `null` là gỡ ảnh. Gửi chuỗi rỗng thì máy chủ lưu một chuỗi rỗng, và giao
    diện phải tự đoán "rỗng nghĩa là chưa có" ở từng chỗ hiện avatar.
  */
  it('gỡ ảnh bằng null chứ không phải chuỗi rỗng', async () => {
    await capNhatAnhDaiDien(null);

    expect(mockedRequest.mock.calls[0][1]?.body).toEqual({ avatarUrl: null });
  });
});
