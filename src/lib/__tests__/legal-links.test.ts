import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import {
  PRIVACY_URL,
  SUPPORT_EMAIL,
  SUPPORT_URL,
  TERMS_URL,
  openLegalLink,
} from '../legal-links';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const mockedMoTrang = WebBrowser.openBrowserAsync as jest.MockedFunction<
  typeof WebBrowser.openBrowserAsync
>;

describe('đường dẫn pháp lý', () => {
  let moNgoai: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    moNgoai = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    moNgoai.mockRestore();
  });

  /*
    Reviewer của Apple bấm thử từng đường. Trỏ nhầm sang trang 404 là bị từ chối,
    nên chốt đúng địa chỉ đã công bố.
  */
  it('trỏ đúng các trang đã công bố', () => {
    expect(TERMS_URL).toBe('https://wedofpt.com.vn/dieu-khoan.html');
    expect(SUPPORT_URL).toBe('https://wedofpt.com.vn/ho-tro.html');
    expect(SUPPORT_EMAIL).toBe('wedosupport6886@gmail.com');
    // Luôn có giá trị: thiếu biến môi trường thì dùng trang chính thức.
    expect(PRIVACY_URL).toMatch(/^https:\/\/.+privacy\.html$/);
  });

  /*
    Trước đây thiếu `EXPO_PUBLIC_PRIVACY_URL` trên EAS là dòng chính sách biến
    mất khỏi app — mà Apple bắt buộc có (Guideline 5.1.1). Giờ phải rơi về trang
    chính thức, kể cả khi biến bị khai rỗng.
  */
  it.each([undefined, '', '   '])(
    'thiếu biến EXPO_PUBLIC_PRIVACY_URL (%p) thì dùng trang chính thức',
    (giaTri) => {
      const cu = process.env.EXPO_PUBLIC_PRIVACY_URL;
      if (giaTri === undefined) delete process.env.EXPO_PUBLIC_PRIVACY_URL;
      else process.env.EXPO_PUBLIC_PRIVACY_URL = giaTri;

      try {
        jest.isolateModules(() => {
          const { PRIVACY_URL: duongDan } = require('../legal-links') as typeof import('../legal-links');
          expect(duongDan).toBe('https://wedofpt.com.vn/privacy.html');
        });
      } finally {
        if (cu === undefined) delete process.env.EXPO_PUBLIC_PRIVACY_URL;
        else process.env.EXPO_PUBLIC_PRIVACY_URL = cu;
      }
    },
  );

  it('có biến EXPO_PUBLIC_PRIVACY_URL thì theo biến', () => {
    const cu = process.env.EXPO_PUBLIC_PRIVACY_URL;
    process.env.EXPO_PUBLIC_PRIVACY_URL = 'https://thu.example.vn/privacy.html';

    try {
      jest.isolateModules(() => {
        const { PRIVACY_URL: duongDan } = require('../legal-links') as typeof import('../legal-links');
        expect(duongDan).toBe('https://thu.example.vn/privacy.html');
      });
    } finally {
      if (cu === undefined) delete process.env.EXPO_PUBLIC_PRIVACY_URL;
      else process.env.EXPO_PUBLIC_PRIVACY_URL = cu;
    }
  });

  it('mở trong trình duyệt nhúng để người dùng quay lại đúng chỗ đang gõ', async () => {
    mockedMoTrang.mockResolvedValue({ type: 'opened' } as never);

    await openLegalLink(TERMS_URL);

    expect(mockedMoTrang).toHaveBeenCalledWith(TERMS_URL);
    expect(moNgoai).not.toHaveBeenCalled();
  });

  it('không mở được trình duyệt nhúng thì lùi về trình duyệt ngoài', async () => {
    mockedMoTrang.mockRejectedValue(new Error('No browser'));

    await openLegalLink(SUPPORT_URL);

    expect(moNgoai).toHaveBeenCalledWith(SUPPORT_URL);
  });

  it('không mở được gì cả thì thôi, không làm sập màn đang dùng', async () => {
    mockedMoTrang.mockRejectedValue(new Error('No browser'));
    moNgoai.mockRejectedValue(new Error('No handler'));

    await expect(openLegalLink(PRIVACY_URL)).resolves.toBeUndefined();
  });
});
