import {
  datDongYAI,
  deleteAccount,
  dongYDieuKhoan,
  getDeletionBlockers,
  transferWorkspaceOwner,
} from '../account';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API xoá tài khoản', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('hỏi chỗ vướng bằng GET, không gây tác dụng phụ', async () => {
    await getDeletionBlockers();
    expect(mockedRequest).toHaveBeenCalledWith('/users/me/deletion-blockers');
  });

  it('xoá tài khoản bằng DELETE /users/me', async () => {
    await deleteAccount();
    expect(mockedRequest).toHaveBeenCalledWith('/users/me', { method: 'DELETE' });
  });

  it('chuyển quyền sở hữu bằng PATCH kèm id người nhận', async () => {
    await transferWorkspaceOwner('w1', 'u2');
    expect(mockedRequest).toHaveBeenCalledWith('/workspaces/w1/owner', {
      method: 'PATCH',
      body: { newOwnerId: 'u2' },
    });
  });

  /*
    Đường dẫn phải là /users/me, KHÔNG phải /users/:id. Xoá theo id là mở đường cho
    một tài khoản xoá tài khoản người khác nếu tầng phân quyền có sơ hở.
  */
  it('không bao giờ nhận id người dùng từ bên ngoài', () => {
    expect(deleteAccount.length).toBe(0);
  });
});

describe('API đồng ý', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('đồng ý điều khoản kèm xác nhận đủ 18 tuổi', async () => {
    await dongYDieuKhoan();
    expect(mockedRequest).toHaveBeenCalledWith('/users/me/accept-terms', {
      method: 'POST',
      body: { confirmAdult: true },
    });
  });

  it('cho phép dùng AI bằng POST, rút lại bằng DELETE', async () => {
    await datDongYAI(true);
    expect(mockedRequest).toHaveBeenLastCalledWith('/users/me/ai-consent', { method: 'POST' });

    await datDongYAI(false);
    expect(mockedRequest).toHaveBeenLastCalledWith('/users/me/ai-consent', { method: 'DELETE' });
  });
});
