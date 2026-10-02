import { apiRequest } from '../client';
import { xinLinkBaoCao } from '../bao-cao';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API báo cáo đóng góp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST xin link: định dạng + tiếng Việt, không gửi khoảng ngày (dùng mặc định)', async () => {
    const link = { url: 'https://api.wedo.test/contribution-report/download?token=abc', expiresAt: '2026-10-02T03:05:00.000Z' };
    mockedRequest.mockResolvedValueOnce(link as never);

    await expect(xinLinkBaoCao('p 1', 'xlsx')).resolves.toEqual(link);
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p%201/contribution-report/link', {
      method: 'POST',
      body: { format: 'xlsx', lang: 'vi' },
    });
  });
});
