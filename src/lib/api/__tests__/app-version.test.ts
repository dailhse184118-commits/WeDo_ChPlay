import { getAppVersionInfo } from '../app-version';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API phiên bản ứng dụng', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET /app-version và không gửi kèm token', async () => {
    await getAppVersionInfo();
    expect(mockedRequest).toHaveBeenCalledWith('/app-version', { skipAuth: true });
  });
});
