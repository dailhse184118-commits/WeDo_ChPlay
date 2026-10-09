import {
  capNhatThongTinCaNhan,
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

/*
  Máy chủ phân biệt ba trạng thái: KHÔNG gửi `dob` = giữ nguyên, gửi `null` = gỡ,
  gửi chuỗi = đặt ngày mới. Trước đây app bỏ hẳn khoá khi ô ngày sinh trống,
  nên xoá ngày sinh rồi bấm Lưu thì màn báo "Đã lưu thay đổi" mà ngày cũ vẫn còn.
*/
describe('sửa thông tin cá nhân', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('xoá trống ngày sinh thì gửi dob: null để máy chủ gỡ đi', async () => {
    await capNhatThongTinCaNhan({ fullName: 'Lê Hữu Đại', phone: '', dob: null });

    const [, tuyChon] = mockedRequest.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect(tuyChon.body).toHaveProperty('dob', null);
  });

  it('có ngày sinh thì gửi đúng ngày đó', async () => {
    await capNhatThongTinCaNhan({ fullName: 'Lê Hữu Đại', phone: '', dob: '1999-08-14' });

    expect(mockedRequest).toHaveBeenCalledWith('/users/me', {
      method: 'PATCH',
      body: { fullName: 'Lê Hữu Đại', phone: '', dob: '1999-08-14' },
    });
  });
});
