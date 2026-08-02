import { login, register, getMe } from '../auth';
import { apiRequest } from '../client';

jest.mock('../client', () => ({
  apiRequest: jest.fn(),
}));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('POST /auth/login và bỏ qua header auth', async () => {
    await login('a@b.c', 'matkhau');
    expect(mockedRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau' },
      skipAuth: true,
    });
  });

  it('POST /auth/register chỉ gửi trường có giá trị', async () => {
    await register({ email: 'a@b.c', password: 'matkhau', fullName: 'Đại' });
    expect(mockedRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau', fullName: 'Đại' },
      skipAuth: true,
    });
  });

  it('POST /auth/register kèm số điện thoại khi được cung cấp', async () => {
    await register({
      email: 'a@b.c',
      password: 'matkhau',
      fullName: 'Đại',
      phone: '0900000000',
    });
    expect(mockedRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau', fullName: 'Đại', phone: '0900000000' },
      skipAuth: true,
    });
  });

  it('GET /users/me', async () => {
    await getMe();
    expect(mockedRequest).toHaveBeenCalledWith('/users/me');
  });
});
