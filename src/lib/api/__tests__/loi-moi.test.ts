import { apiRequest } from '../client';
import { layLoiMoi, taoLoiMoi, tatLoiMoi, thamGiaLoiMoi, xemTruocLoiMoi } from '../loi-moi';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API lời mời vào nhóm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET link mời của dự án; thân rỗng nghĩa là chưa có link', async () => {
    mockedRequest.mockResolvedValueOnce(undefined as never);

    await expect(layLoiMoi('p 1')).resolves.toBeNull();
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p%201/invite');
  });

  it('POST tạo link mới, DELETE tắt link', async () => {
    await taoLoiMoi('p1');
    await tatLoiMoi('p1');

    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/projects/p1/invite', { method: 'POST' });
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/projects/p1/invite', { method: 'DELETE' });
  });

  it('xem trước và tham gia theo mã', async () => {
    await xemTruocLoiMoi('7K3M9QXA');
    await thamGiaLoiMoi('7K3M9QXA');

    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/invites/7K3M9QXA');
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/invites/7K3M9QXA/join', { method: 'POST' });
  });
});
