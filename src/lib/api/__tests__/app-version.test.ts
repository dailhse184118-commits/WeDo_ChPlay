import { Platform } from 'react-native';

import { getAppVersionInfo } from '../app-version';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API phiên bản ứng dụng', () => {
  let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  afterEach(() => {
    heDieuHanh?.restore();
    heDieuHanh = undefined;
  });

  it('GET /app-version và không gửi kèm token', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');

    await getAppVersionInfo();

    expect(mockedRequest).toHaveBeenCalledWith('/app-version?platform=android', {
      skipAuth: true,
    });
  });

  /*
    iPhone có bộ số phiên bản riêng. Hỏi chung với Android là bắt người dùng
    iPhone cập nhật một bản App Store chưa duyệt xong.
  */
  it('iPhone hỏi đúng bộ số của iOS', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');

    await getAppVersionInfo();

    expect(mockedRequest).toHaveBeenCalledWith('/app-version?platform=ios', { skipAuth: true });
  });
});
