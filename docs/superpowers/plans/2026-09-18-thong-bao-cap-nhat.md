# Thông báo có bản cập nhật mới — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App biết mình đang chạy bản cũ và nói cho người dùng biết — gợi ý tắt được với bản thường, chặn hẳn với bản quá cũ.

**Architecture:** Backend thêm đúng một endpoint công khai trả về phiên bản mới nhất và phiên bản tối thiểu, đọc từ biến môi trường. Mobile so sánh bằng một hàm thuần rồi hiện dải băng ở màn Trò chuyện hoặc màn chặn ở layout gốc. Mọi nhánh không chắc chắn đều rơi về "không cần cập nhật".

**Tech Stack:** NestJS 11 (backend); Expo SDK 57, React Native 0.86, TanStack Query v5, AsyncStorage, expo-constants (mobile); Jest + jest-expo, @testing-library/react-native.

Thiết kế gốc: `docs/superpowers/specs/2026-09-18-thong-bao-cap-nhat-design.md`

## Global Constraints

- **Đọc tài liệu Expo đúng phiên bản** tại https://docs.expo.dev/versions/v57.0.0/ trước khi viết mã — `AGENTS.md` của repo yêu cầu.
- **Toàn bộ chữ hiển thị và bình luận viết bằng tiếng Việt.** Bình luận giải thích *tại sao*, không mô tả lại mã làm gì.
- **Không thêm thư viện mới.** Mọi thứ cần đã có trong `package.json`.
- **`render` của `@testing-library/react-native` trong repo này trả về Promise.** Mọi test component phải viết `const { getByText } = await render(...)` và callback của `it` phải `async`. Quên `await` thì báo `getByText is not a function`, không gợi ý gì tới nguyên nhân.
- **Màn hình trong `(tabs)` không viết test.** Hàm thuần và component thì bắt buộc có.
- **Style dùng token** từ `src/theme/tokens`: `colors`, `fontSize`, `lineHeight`, `radius`, `spacing`, `sizes`, `scale`, `scaleWithFont`.
- **Hỏng thì im lặng.** Mọi nhánh lỗi, quá hạn, dữ liệu rác, hoặc không đọc được phiên bản của chính app đều phải rơi về `'khong-can'`. Không bao giờ chặn người dùng vì một lượt gọi mạng thất bại.
- **Không tăng `versionCode`** trong bất kỳ task nào.
- Cổng nghiệm thu mỗi task: `npx tsc --noEmit` sạch và `npx jest` qua hết.

---

### Task 1: Endpoint `/app-version` ở backend

**Files:**
- Modify: `BE_WEDO/src/app.service.ts`
- Modify: `BE_WEDO/src/app.controller.ts`
- Modify: `BE_WEDO/.env.example`
- Test: `BE_WEDO/src/app.controller.spec.ts`

**Interfaces:**
- Consumes: `AppService` đã tiêm sẵn `PrismaService` (endpoint này không dùng tới database).
- Produces: `GET /app-version` trả `{ latest: string; minimum: string; notes: string }`.

Đường dẫn backend trên máy này: `D:\WEDO_PC\BE_WEDO`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `BE_WEDO/src/app.controller.spec.ts`, ngay trước dấu `});` đóng `describe('AppController', ...)`:

```ts
  describe('app-version', () => {
    const goc = { ...process.env };

    afterEach(() => {
      process.env = { ...goc };
    });

    it('trả về giá trị lấy từ biến môi trường', () => {
      process.env.MOBILE_LATEST_VERSION = '1.0.10';
      process.env.MOBILE_MINIMUM_VERSION = '1.0.0';
      process.env.MOBILE_UPDATE_NOTES = 'Thêm nhắn tin riêng.';

      expect(appController.getAppVersion()).toEqual({
        latest: '1.0.10',
        minimum: '1.0.0',
        notes: 'Thêm nhắn tin riêng.',
      });
    });

    /*
      Thiếu biến là chuyện bình thường ở máy dev và ở staging. Trả chuỗi rỗng
      để app hiểu là "không có thông tin" rồi im lặng, thay vì ném lỗi 500 làm
      app tưởng máy chủ hỏng.
    */
    it('trả chuỗi rỗng khi chưa khai biến môi trường', () => {
      delete process.env.MOBILE_LATEST_VERSION;
      delete process.env.MOBILE_MINIMUM_VERSION;
      delete process.env.MOBILE_UPDATE_NOTES;

      expect(appController.getAppVersion()).toEqual({
        latest: '',
        minimum: '',
        notes: '',
      });
    });
  });
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest src/app.controller.spec.ts`
Expected: FAIL — `appController.getAppVersion is not a function`

- [ ] **Step 3: Thêm hàm vào `AppService`**

Trong `BE_WEDO/src/app.service.ts`, thêm ngay sau `getHealth()`:

```ts
  /**
   * Phiên bản mobile mới nhất và phiên bản tối thiểu còn dùng được.
   *
   * Đọc từ biến môi trường chứ không từ cơ sở dữ liệu: backend tự deploy mỗi
   * lần push nhánh `backend`, nên đổi một biến mất khoảng năm phút. Dựng bảng
   * kèm màn quản trị cho việc này là thừa.
   *
   * Trả chuỗi rỗng khi thiếu biến. App hiểu chuỗi rỗng là "không có thông tin"
   * rồi im lặng — ném lỗi ở đây sẽ làm app tưởng máy chủ đang hỏng.
   */
  getAppVersion() {
    return {
      latest: process.env.MOBILE_LATEST_VERSION ?? '',
      minimum: process.env.MOBILE_MINIMUM_VERSION ?? '',
      notes: process.env.MOBILE_UPDATE_NOTES ?? '',
    };
  }
```

- [ ] **Step 4: Thêm route vào `AppController`**

Trong `BE_WEDO/src/app.controller.ts`, thêm sau `getReadiness()`:

```ts
  /*
    Công khai, KHÔNG qua JwtAuthGuard.

    App quá cũ phải biết điều đó trước cả màn đăng nhập — nếu API đã đổi kiểu
    phá vỡ thì chính lượt đăng nhập cũng hỏng, và bắt xác thực trước khi được
    biết "app của bạn quá cũ" là một vòng luẩn quẩn.
  */
  @Get('app-version')
  getAppVersion() {
    return this.appService.getAppVersion();
  }
```

- [ ] **Step 5: Chạy test, xác nhận qua**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest src/app.controller.spec.ts`
Expected: PASS

- [ ] **Step 6: Khai biến vào `.env.example`**

Thêm vào cuối `BE_WEDO/.env.example`:

```
# --- Phiên bản ứng dụng di động ---
# App đọc ba giá trị này qua GET /app-version để biết mình có cũ không.
#
# NHỚ: mỗi lần tăng `expo.version` trong app.json của WeDo_ChPlay thì phải đổi
# MOBILE_LATEST_VERSION ở đây rồi deploy lại. Hai chỗ, rất dễ quên một.
#
# MOBILE_MINIMUM_VERSION chỉ nâng khi backend đổi kiểu phá vỡ khiến app cũ
# không chạy nổi — nâng nó là CHẶN HẲN người dùng cũ, không phải nhắc nhở.
MOBILE_LATEST_VERSION="1.0.10"
MOBILE_MINIMUM_VERSION="1.0.0"
MOBILE_UPDATE_NOTES="Thêm nhắn tin riêng và sửa lỗi bàn phím."
```

- [ ] **Step 7: Chạy toàn bộ test backend**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest`
Expected: không bộ nào hỏng thêm so với trước

- [ ] **Step 8: Commit**

```bash
cd /d/WEDO_PC/BE_WEDO
git add src/app.service.ts src/app.controller.ts src/app.controller.spec.ts .env.example
git commit -m "feat(app): endpoint /app-version cho ung dung di dong"
```

---

### Task 2: Hàm thuần so sánh phiên bản

**Files:**
- Create: `src/lib/version/so-sanh.ts`
- Test: `src/lib/version/__tests__/so-sanh.test.ts`

**Interfaces:**
- Consumes: không gì.
- Produces:
  - `soSanhPhienBan(a: string, b: string): -1 | 0 | 1`
  - `type MucCapNhat = 'khong-can' | 'nen-cap-nhat' | 'bat-buoc'`
  - `mucCapNhat(input: { hienTai?: string; latest?: string; minimum?: string }): MucCapNhat`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/version/__tests__/so-sanh.test.ts`:

```ts
import { mucCapNhat, soSanhPhienBan } from '../so-sanh';

describe('soSanhPhienBan', () => {
  /*
    Cái bẫy của chính dự án này. So chuỗi thì '1.0.10' < '1.0.9' vì ký tự '1'
    nhỏ hơn '9'. Phải tách theo dấu chấm rồi so bằng số.
  */
  it('1.0.10 mới hơn 1.0.9, không so theo thứ tự chữ cái', () => {
    expect(soSanhPhienBan('1.0.10', '1.0.9')).toBe(1);
    expect(soSanhPhienBan('1.0.9', '1.0.10')).toBe(-1);
  });

  it('hai phiên bản giống nhau trả 0', () => {
    expect(soSanhPhienBan('1.0.10', '1.0.10')).toBe(0);
  });

  it('so từ bậc cao xuống bậc thấp', () => {
    expect(soSanhPhienBan('2.0.0', '1.99.99')).toBe(1);
    expect(soSanhPhienBan('1.1.0', '1.0.99')).toBe(1);
  });

  it('thiếu bậc thì coi bậc đó là 0', () => {
    expect(soSanhPhienBan('1.1', '1.1.0')).toBe(0);
    expect(soSanhPhienBan('1.1', '1.1.1')).toBe(-1);
  });

  it('bỏ qua phần đuôi không phải số', () => {
    expect(soSanhPhienBan('1.0.10-beta', '1.0.9')).toBe(1);
  });
});

describe('mucCapNhat', () => {
  it('không cần khi đang chạy đúng bản mới nhất', () => {
    expect(mucCapNhat({ hienTai: '1.0.10', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'khong-can',
    );
  });

  it('nên cập nhật khi có bản mới hơn', () => {
    expect(mucCapNhat({ hienTai: '1.0.9', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'nen-cap-nhat',
    );
  });

  it('bắt buộc khi thấp hơn phiên bản tối thiểu', () => {
    expect(mucCapNhat({ hienTai: '0.9.0', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'bat-buoc',
    );
  });

  it('bắt buộc thắng gợi ý khi dính cả hai', () => {
    expect(mucCapNhat({ hienTai: '0.5.0', latest: '1.0.10', minimum: '1.0.0' })).toBe(
      'bat-buoc',
    );
  });

  it('đúng bằng phiên bản tối thiểu thì không bị chặn', () => {
    expect(mucCapNhat({ hienTai: '1.0.0', latest: '1.0.0', minimum: '1.0.0' })).toBe(
      'khong-can',
    );
  });

  /*
    Nhóm "hỏng thì im lặng". Một cơ chế kiểm phiên bản mà khoá người dùng ra
    khỏi app đang chạy tốt thì tệ hơn hẳn việc không có nó.
  */
  it.each([
    ['thiếu phiên bản hiện tại', { hienTai: undefined, latest: '1.0.10', minimum: '1.0.0' }],
    ['phiên bản hiện tại rỗng', { hienTai: '', latest: '1.0.10', minimum: '1.0.0' }],
    ['thiếu cả latest lẫn minimum', { hienTai: '1.0.0', latest: '', minimum: '' }],
    ['dữ liệu rác', { hienTai: 'abc', latest: 'xyz', minimum: 'qqq' }],
    ['latest rỗng, minimum hợp lệ nhưng app mới hơn', { hienTai: '2.0.0', latest: '', minimum: '1.0.0' }],
  ])('không cần cập nhật khi %s', (_ten, input) => {
    expect(mucCapNhat(input)).toBe('khong-can');
  });

  it('vẫn chặn được khi chỉ khai minimum, không khai latest', () => {
    expect(mucCapNhat({ hienTai: '0.9.0', latest: '', minimum: '1.0.0' })).toBe('bat-buoc');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/lib/version/__tests__/so-sanh.test.ts`
Expected: FAIL — `Cannot find module '../so-sanh'`

- [ ] **Step 3: Viết `src/lib/version/so-sanh.ts`**

```ts
export type MucCapNhat = 'khong-can' | 'nen-cap-nhat' | 'bat-buoc';

/**
 * Tách "1.0.10" thành [1, 0, 10].
 *
 * Trả `null` khi không đọc nổi. Chỗ gọi dùng `null` làm tín hiệu "không biết",
 * và không biết thì không được phép kết luận gì.
 */
function tachBac(phienBan: string | undefined): number[] | null {
  if (!phienBan) return null;

  const bac = phienBan
    .trim()
    .split('.')
    // parseInt bỏ phần đuôi không phải số, nên "10-beta" ra 10.
    .map((phan) => Number.parseInt(phan, 10));

  if (bac.length === 0 || bac.some((so) => Number.isNaN(so))) return null;
  return bac;
}

/**
 * So hai chuỗi phiên bản. Trả 1 nếu `a` mới hơn, -1 nếu cũ hơn, 0 nếu bằng.
 *
 * KHÔNG so bằng phép so chuỗi. '1.0.10' < '1.0.9' theo thứ tự chữ cái vì ký tự
 * '1' nhỏ hơn '9' — mà 1.0.10 mới là bản mới hơn. Đúng cặp phiên bản dự án này
 * đang có, nên lỗi đó sẽ xảy ra ngay lần đầu chứ không phải chuyện lý thuyết.
 *
 * Chuỗi không đọc được thì coi là bằng nhau: không biết thì đừng kết luận.
 */
export function soSanhPhienBan(a: string, b: string): -1 | 0 | 1 {
  const x = tachBac(a);
  const y = tachBac(b);
  if (!x || !y) return 0;

  const soBac = Math.max(x.length, y.length);
  for (let i = 0; i < soBac; i += 1) {
    // Thiếu bậc thì coi là 0, để "1.1" bằng "1.1.0".
    const p = x[i] ?? 0;
    const q = y[i] ?? 0;
    if (p > q) return 1;
    if (p < q) return -1;
  }
  return 0;
}

/**
 * App đang ở mức nào so với máy chủ.
 *
 * Mọi thứ không chắc chắn đều rơi về `'khong-can'`. Đây là nguyên tắc bao trùm
 * của tính năng này: thà bỏ sót một lần nhắc còn hơn khoá người dùng ra khỏi
 * một app đang chạy tốt vì máy chủ trả về dữ liệu lạ.
 */
export function mucCapNhat(input: {
  hienTai?: string;
  latest?: string;
  minimum?: string;
}): MucCapNhat {
  const { hienTai, latest, minimum } = input;

  // Không biết mình là bản nào thì không so được với ai.
  if (!tachBac(hienTai)) return 'khong-can';

  if (tachBac(minimum) && soSanhPhienBan(hienTai as string, minimum as string) < 0) {
    return 'bat-buoc';
  }

  if (tachBac(latest) && soSanhPhienBan(hienTai as string, latest as string) < 0) {
    return 'nen-cap-nhat';
  }

  return 'khong-can';
}
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/lib/version/__tests__/so-sanh.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/version/so-sanh.ts src/lib/version/__tests__/so-sanh.test.ts
git commit -m "feat(mobile): ham thuan so sanh phien ban"
```

---

### Task 3: Tầng API, mở CH Play, và nhớ việc đã tắt

**Files:**
- Create: `src/lib/api/app-version.ts`
- Create: `src/lib/version/mo-ch-play.ts`
- Create: `src/lib/version/bo-qua.ts`
- Test: `src/lib/api/__tests__/app-version.test.ts`
- Test: `src/lib/version/__tests__/mo-ch-play.test.ts`
- Test: `src/lib/version/__tests__/bo-qua.test.ts`

**Interfaces:**
- Consumes: `apiRequest` từ `src/lib/api/client`; `Linking` từ `react-native`; `AsyncStorage` từ `@react-native-async-storage/async-storage`.
- Produces:
  - `getAppVersionInfo(): Promise<{ latest: string; minimum: string; notes: string }>`
  - `moChPlay(): Promise<void>`
  - `daBoQua(phienBan: string): Promise<boolean>`
  - `ghiNhoBoQua(phienBan: string): Promise<void>`

- [ ] **Step 1: Viết ba test thất bại**

Tạo `src/lib/api/__tests__/app-version.test.ts`:

```ts
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
```

Tạo `src/lib/version/__tests__/mo-ch-play.test.ts`:

```ts
import { Linking } from 'react-native';

import { moChPlay } from '../mo-ch-play';

describe('moChPlay', () => {
  afterEach(() => jest.restoreAllMocks());

  it('mở thẳng ứng dụng CH Play trước', async () => {
    const mo = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    await moChPlay();

    expect(mo).toHaveBeenCalledWith('market://details?id=vn.wedo.app');
  });

  /*
    Máy không có CH Play (máy ảo, ROM cọc cằn) sẽ ném lỗi ở lược đồ market://.
    Khi đó phải rơi về đường https, nếu không nút bấm im lặng không làm gì cả.
  */
  it('rơi về đường https khi không mở được market://', async () => {
    const mo = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('no handler'))
      .mockResolvedValueOnce(true as never);

    await moChPlay();

    expect(mo).toHaveBeenNthCalledWith(2, 'https://play.google.com/store/apps/details?id=vn.wedo.app');
  });

  it('không ném ra ngoài khi cả hai đường đều hỏng', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('hong'));

    await expect(moChPlay()).resolves.toBeUndefined();
  });
});
```

Tạo `src/lib/version/__tests__/bo-qua.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { daBoQua, ghiNhoBoQua } from '../bo-qua';

describe('nhớ việc bỏ qua nhắc cập nhật', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('chưa bỏ qua thì trả false', async () => {
    await expect(daBoQua('1.0.11')).resolves.toBe(false);
  });

  it('bỏ qua rồi thì trả true', async () => {
    await ghiNhoBoQua('1.0.11');
    await expect(daBoQua('1.0.11')).resolves.toBe(true);
  });

  /*
    Tắt nhắc của 1.0.11 không được làm im luôn 1.0.12. Mỗi bản mới là một lần
    đáng nhắc lại, nên khoá phải kèm số phiên bản.
  */
  it('bỏ qua bản này không làm im bản sau', async () => {
    await ghiNhoBoQua('1.0.11');
    await expect(daBoQua('1.0.12')).resolves.toBe(false);
  });

  it('bộ nhớ hỏng thì coi như chưa bỏ qua', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('hong'));

    await expect(daBoQua('1.0.11')).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Chạy ba test, xác nhận thất bại**

Run: `npx jest src/lib/api/__tests__/app-version.test.ts src/lib/version/__tests__/mo-ch-play.test.ts src/lib/version/__tests__/bo-qua.test.ts`
Expected: FAIL — `Cannot find module` cho cả ba

- [ ] **Step 3: Viết `src/lib/api/app-version.ts`**

```ts
import { apiRequest } from './client';

export interface ThongTinPhienBan {
  /** Phiên bản mới nhất trên CH Play. Rỗng nghĩa là máy chủ chưa khai. */
  latest: string;
  /** Phiên bản thấp nhất còn dùng được. Thấp hơn nó là bị chặn hẳn. */
  minimum: string;
  /** Một câu mô tả bản mới. Có thể rỗng. */
  notes: string;
}

/**
 * `skipAuth` là bắt buộc, không phải tối ưu.
 *
 * App quá cũ phải biết điều đó trước cả màn đăng nhập — nếu API đã đổi kiểu phá
 * vỡ thì chính lượt đăng nhập cũng hỏng.
 */
export function getAppVersionInfo(): Promise<ThongTinPhienBan> {
  return apiRequest<ThongTinPhienBan>('/app-version', { skipAuth: true });
}
```

- [ ] **Step 4: Viết `src/lib/version/mo-ch-play.ts`**

```ts
import { Linking } from 'react-native';

const GOI = 'vn.wedo.app';
const DUONG_UNG_DUNG = `market://details?id=${GOI}`;
const DUONG_WEB = `https://play.google.com/store/apps/details?id=${GOI}`;

/**
 * Mở trang WeDo trên CH Play.
 *
 * Thử lược đồ `market://` trước vì nó mở thẳng ứng dụng CH Play. Máy không có
 * CH Play — máy ảo, ROM cọc cằn — sẽ ném lỗi ở bước đó, khi ấy mới rơi về
 * đường https để trình duyệt lo.
 *
 * Không dùng `canOpenURL`: trên Android nó đòi khai sẵn lược đồ trong phần
 * `queries` của manifest, thêm một chỗ nữa để quên. Thử rồi bắt lỗi đơn giản
 * hơn và cho kết quả y hệt.
 *
 * Nuốt mọi lỗi. Nút này là một lời mời, không phải một thao tác bắt buộc; hỏng
 * thì không đáng dội một hộp thoại lỗi lên mặt người dùng.
 */
export async function moChPlay(): Promise<void> {
  try {
    await Linking.openURL(DUONG_UNG_DUNG);
    return;
  } catch {
    // Không có CH Play. Thử đường web.
  }

  try {
    await Linking.openURL(DUONG_WEB);
  } catch {
    // Không có cả trình duyệt. Đành chịu.
  }
}
```

- [ ] **Step 5: Viết `src/lib/version/bo-qua.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Khoá kèm số phiên bản, cố ý.
 *
 * Tắt nhắc của 1.0.11 không được làm im luôn 1.0.12 — mỗi bản mới là một lần
 * đáng nhắc lại. Dùng một khoá chung thì người dùng bấm tắt một lần là không
 * bao giờ được nhắc nữa.
 */
function khoa(phienBan: string): string {
  return `wedo.boQuaCapNhat.${phienBan}`;
}

/**
 * Người dùng đã tắt nhắc cho đúng phiên bản này chưa.
 *
 * Bộ nhớ hỏng thì trả `false` — thà nhắc thừa một lần còn hơn im lặng khi đáng
 * lẽ phải nhắc.
 */
export async function daBoQua(phienBan: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(khoa(phienBan))) === '1';
  } catch {
    return false;
  }
}

/** Ghi nhớ rằng người dùng đã tắt nhắc cho phiên bản này. */
export async function ghiNhoBoQua(phienBan: string): Promise<void> {
  try {
    await AsyncStorage.setItem(khoa(phienBan), '1');
  } catch {
    // Không ghi được thì lần mở sau sẽ nhắc lại. Phiền, nhưng không hỏng gì.
  }
}
```

- [ ] **Step 6: Chạy ba test, xác nhận qua**

Run: `npx jest src/lib/api/__tests__/app-version.test.ts src/lib/version/__tests__/mo-ch-play.test.ts src/lib/version/__tests__/bo-qua.test.ts`
Expected: PASS — 8 test

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/app-version.ts src/lib/api/__tests__/app-version.test.ts src/lib/version src/lib/version/__tests__
git commit -m "feat(mobile): tang API phien ban, mo CH Play, nho viec da tat"
```

---

### Task 4: Dải băng gợi ý cập nhật

**Files:**
- Create: `src/components/update/UpdateBanner.tsx`
- Test: `src/components/update/__tests__/UpdateBanner.test.tsx`

**Interfaces:**
- Consumes: `daBoQua`, `ghiNhoBoQua` từ `src/lib/version/bo-qua`; `moChPlay` từ `src/lib/version/mo-ch-play`.
- Produces: `UpdateBanner({ phienBanMoi, notes })` — tự lo việc đọc và ghi trạng thái đã tắt.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/components/update/__tests__/UpdateBanner.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { UpdateBanner } from '../UpdateBanner';
import { daBoQua, ghiNhoBoQua } from '../../../lib/version/bo-qua';
import { moChPlay } from '../../../lib/version/mo-ch-play';

jest.mock('../../../lib/version/bo-qua', () => ({
  daBoQua: jest.fn(),
  ghiNhoBoQua: jest.fn(),
}));
jest.mock('../../../lib/version/mo-ch-play', () => ({ moChPlay: jest.fn() }));

const mockDaBoQua = daBoQua as jest.MockedFunction<typeof daBoQua>;
const mockGhiNho = ghiNhoBoQua as jest.MockedFunction<typeof ghiNhoBoQua>;
const mockMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;

describe('UpdateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDaBoQua.mockResolvedValue(false);
    mockGhiNho.mockResolvedValue(undefined);
    mockMoChPlay.mockResolvedValue(undefined);
  });

  it('hiện ghi chú của bản mới', async () => {
    const { findByText } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Thêm nhắn tin riêng." />,
    );

    expect(await findByText('Thêm nhắn tin riêng.')).toBeTruthy();
  });

  it('dùng câu mặc định khi máy chủ không gửi ghi chú', async () => {
    const { findByText } = await render(<UpdateBanner phienBanMoi="1.0.11" notes="" />);

    expect(await findByText('Đã có phiên bản mới của WeDo.')).toBeTruthy();
  });

  it('chạm nút cập nhật thì mở CH Play', async () => {
    const { findByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    fireEvent.press(await findByTestId('update-banner-cap-nhat'));

    expect(mockMoChPlay).toHaveBeenCalled();
  });

  it('chạm nút tắt thì ghi nhớ và biến mất', async () => {
    const { findByTestId, queryByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    fireEvent.press(await findByTestId('update-banner-tat'));

    expect(mockGhiNho).toHaveBeenCalledWith('1.0.11');
    await waitFor(() => expect(queryByTestId('update-banner')).toBeNull());
  });

  it('không dựng gì khi người dùng đã tắt bản này từ trước', async () => {
    mockDaBoQua.mockResolvedValue(true);

    const { queryByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    await waitFor(() => expect(queryByTestId('update-banner')).toBeNull());
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/components/update/__tests__/UpdateBanner.test.tsx`
Expected: FAIL — `Cannot find module '../UpdateBanner'`

- [ ] **Step 3: Viết `src/components/update/UpdateBanner.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { daBoQua, ghiNhoBoQua } from '../../lib/version/bo-qua';
import { moChPlay } from '../../lib/version/mo-ch-play';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../theme/tokens';

interface UpdateBannerProps {
  /** Phiên bản mới nhất trên CH Play. Dùng làm khoá khi ghi nhớ việc tắt. */
  phienBanMoi: string;
  /** Câu mô tả bản mới do máy chủ gửi. Có thể rỗng. */
  notes: string;
}

const CAU_MAC_DINH = 'Đã có phiên bản mới của WeDo.';

/**
 * Dải băng nhắc cập nhật, tắt được.
 *
 * Tự lo phần nhớ việc đã tắt thay vì bắt màn hình gọi nó phải lo: chỗ nào cần
 * nhắc thì chỉ việc dựng component này lên, không phải chép lại logic đọc ghi.
 *
 * Bắt đầu ở trạng thái ẩn rồi mới hiện sau khi đọc xong bộ nhớ. Làm ngược lại
 * thì mỗi lần mở app dải băng sẽ chớp lên một nhịp trước khi biết là đã bị tắt.
 */
export function UpdateBanner({ phienBanMoi, notes }: UpdateBannerProps) {
  const [hien, setHien] = useState(false);

  useEffect(() => {
    let con = true;

    void daBoQua(phienBanMoi).then((daTat) => {
      if (con) setHien(!daTat);
    });

    return () => {
      con = false;
    };
  }, [phienBanMoi]);

  if (!hien) return null;

  const handleTat = () => {
    // Ẩn ngay, đừng chờ ghi xong. Người dùng bấm tắt thì nó phải biến mất tức
    // thì; việc ghi xuống đĩa là chuyện của lần mở app sau.
    setHien(false);
    void ghiNhoBoQua(phienBanMoi);
  };

  return (
    <View testID="update-banner" style={styles.bang}>
      <View style={styles.icon}>
        <Ionicons name="arrow-up-circle" size={sizes.icon} color={colors.primary} />
      </View>

      <View style={styles.than}>
        <Text style={styles.tieuDe}>Có bản cập nhật mới</Text>
        <Text style={styles.chu} numberOfLines={3}>
          {notes || CAU_MAC_DINH}
        </Text>
      </View>

      <View style={styles.nutDoc}>
        <Pressable
          testID="update-banner-cap-nhat"
          accessibilityRole="button"
          accessibilityLabel="Mở CH Play để cập nhật"
          onPress={() => void moChPlay()}
          style={({ pressed }) => [styles.nut, pressed ? styles.nutNhan : null]}
        >
          <Text style={styles.nutChu}>Cập nhật</Text>
        </Pressable>

        <Pressable
          testID="update-banner-tat"
          accessibilityRole="button"
          accessibilityLabel="Bỏ qua nhắc cập nhật này"
          onPress={handleTat}
          hitSlop={8}
          style={styles.tat}
        >
          <Text style={styles.tatChu}>Để sau</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  icon: { justifyContent: 'center' },
  than: { flex: 1 },
  tieuDe: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  chu: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  nutDoc: { alignItems: 'center', gap: spacing.xs },
  nut: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  nutNhan: { opacity: 0.7 },
  nutChu: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  tat: { paddingHorizontal: spacing.xs },
  tatChu: { color: colors.textMuted, fontSize: fontSize.xs },
});
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/components/update/__tests__/UpdateBanner.test.tsx`
Expected: PASS — 5 test

- [ ] **Step 5: Commit**

```bash
git add src/components/update/UpdateBanner.tsx src/components/update/__tests__/UpdateBanner.test.tsx
git commit -m "feat(mobile): dai bang nhac cap nhat"
```

---

### Task 5: Màn chặn bắt buộc cập nhật

**Files:**
- Create: `src/components/update/UpdateGate.tsx`
- Test: `src/components/update/__tests__/UpdateGate.test.tsx`

**Interfaces:**
- Consumes: `moChPlay` từ `src/lib/version/mo-ch-play`; `Button` từ `src/components/ui/Button` (`{ label, onPress, variant?, loading?, disabled?, testID? }`).
- Produces: `UpdateGate({ notes })` — màn toàn phần, không có đường thoát.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/components/update/__tests__/UpdateGate.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { UpdateGate } from '../UpdateGate';
import { moChPlay } from '../../../lib/version/mo-ch-play';

jest.mock('../../../lib/version/mo-ch-play', () => ({ moChPlay: jest.fn() }));

const mockMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;

describe('UpdateGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMoChPlay.mockResolvedValue(undefined);
  });

  it('nói rõ vì sao người dùng bị chặn', async () => {
    const { getByText } = await render(<UpdateGate notes="" />);

    expect(getByText('Cần cập nhật WeDo')).toBeTruthy();
  });

  it('hiện ghi chú khi máy chủ có gửi', async () => {
    const { getByText } = await render(<UpdateGate notes="Bản này sửa lỗi đăng nhập." />);

    expect(getByText('Bản này sửa lỗi đăng nhập.')).toBeTruthy();
  });

  it('chạm nút thì mở CH Play', async () => {
    const { getByTestId } = await render(<UpdateGate notes="" />);

    fireEvent.press(getByTestId('update-gate-cap-nhat'));

    expect(mockMoChPlay).toHaveBeenCalled();
  });

  /*
    Chốt chặn có chủ ý: màn này KHÔNG được có đường thoát. Thêm nút "để sau" vào
    đây là xoá sạch lý do nó tồn tại — app cũ sẽ chạy tiếp rồi hỏng giữa chừng.
  */
  it('không có nút nào để bỏ qua', async () => {
    const { queryByText } = await render(<UpdateGate notes="" />);

    expect(queryByText('Để sau')).toBeNull();
    expect(queryByText('Bỏ qua')).toBeNull();
    expect(queryByText('Đóng')).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/components/update/__tests__/UpdateGate.test.tsx`
Expected: FAIL — `Cannot find module '../UpdateGate'`

- [ ] **Step 3: Viết `src/components/update/UpdateGate.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { moChPlay } from '../../lib/version/mo-ch-play';
import { colors, fontSize, lineHeight, radius, scale, spacing } from '../../theme/tokens';

interface UpdateGateProps {
  /** Câu mô tả bản mới do máy chủ gửi. Có thể rỗng. */
  notes: string;
}

/**
 * Màn chặn khi app quá cũ so với máy chủ.
 *
 * KHÔNG có đường thoát, và đó là chủ ý. Màn này chỉ dựng lên khi backend đã đổi
 * kiểu phá vỡ khiến app cũ không chạy nổi — cho đi tiếp thì người dùng sẽ gặp
 * lỗi giữa chừng rồi báo "app hỏng" chứ không phải "app cũ".
 *
 * Nói rõ lý do thay vì chỉ ra lệnh. Người bị chặn mà không hiểu vì sao sẽ gỡ
 * app chứ không cập nhật.
 */
export function UpdateGate({ notes }: UpdateGateProps) {
  return (
    <View testID="update-gate" style={styles.man}>
      <View style={styles.icon}>
        <Ionicons name="arrow-up-circle" size={scale(48)} color={colors.primary} />
      </View>

      <Text style={styles.tieuDe}>Cần cập nhật WeDo</Text>

      <Text style={styles.than}>
        Phiên bản bạn đang dùng đã quá cũ so với máy chủ nên một số chức năng sẽ không chạy
        đúng. Cập nhật xong là dùng lại được bình thường.
      </Text>

      {notes ? <Text style={styles.ghiChu}>{notes}</Text> : null}

      <View style={styles.nut}>
        <Button
          testID="update-gate-cap-nhat"
          label="Mở CH Play để cập nhật"
          onPress={() => void moChPlay()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  man: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  icon: { marginBottom: spacing.sm },
  tieuDe: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  than: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  ghiChu: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  nut: { alignSelf: 'stretch', marginTop: spacing.lg },
});
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/components/update/__tests__/UpdateGate.test.tsx`
Expected: PASS — 4 test

- [ ] **Step 5: Commit**

```bash
git add src/components/update/UpdateGate.tsx src/components/update/__tests__/UpdateGate.test.tsx
git commit -m "feat(mobile): man chan khi app qua cu"
```

---

### Task 6: Gắn vào app và ghi lại quy trình vận hành

**Files:**
- Create: `src/lib/version/use-phien-ban.ts`
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/(tabs)/chat/index.tsx`
- Modify: `docs/superpowers/notes/2026-09-18-tin-nhan-rieng-ban-giao.md`

**Interfaces:**
- Consumes: `getAppVersionInfo` từ `src/lib/api/app-version`; `mucCapNhat` từ `src/lib/version/so-sanh`; `UpdateBanner`, `UpdateGate`.
- Produces: `usePhienBan(): { muc: MucCapNhat; latest: string; notes: string }`

- [ ] **Step 1: Viết hook dùng chung**

Tạo `src/lib/version/use-phien-ban.ts`:

```ts
import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';

import { getAppVersionInfo } from '../api/app-version';
import { mucCapNhat, type MucCapNhat } from './so-sanh';

/** Phiên bản của chính bản build này. Rỗng nghĩa là không đọc được. */
const PHIEN_BAN_HIEN_TAI = Constants.expoConfig?.version ?? '';

/**
 * Hỏi máy chủ xem app có cũ không.
 *
 * Màn chặn nằm ở layout gốc còn dải băng nằm trong màn Trò chuyện, nhưng chỉ có
 * MỘT lượt gọi mạng: cả hai chỗ dùng chung khoá `['app-version']` và react-query
 * gộp lại.
 *
 * `staleTime` 30 phút vì phiên bản mới không xuất hiện theo từng phút. Hỏi lại
 * mỗi lần đổi màn thì vừa tốn pin vừa dội tải máy chủ không vì lý do gì.
 *
 * Lượt gọi hỏng thì `data` vắng, và `mucCapNhat` nhận chuỗi rỗng rồi trả
 * `'khong-can'` — đúng nguyên tắc hỏng thì im lặng.
 */
export function usePhienBan(): { muc: MucCapNhat; latest: string; notes: string } {
  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: getAppVersionInfo,
    staleTime: 30 * 60 * 1000,
    // Không thử lại nhiều lần: đây là thông tin phụ, không đáng làm chậm app.
    retry: 1,
  });

  return {
    muc: mucCapNhat({
      hienTai: PHIEN_BAN_HIEN_TAI,
      latest: data?.latest,
      minimum: data?.minimum,
    }),
    latest: data?.latest ?? '',
    notes: data?.notes ?? '',
  };
}
```

- [ ] **Step 2: Gắn màn chặn vào layout gốc**

Trong `src/app/_layout.tsx`:

Thêm import:

```tsx
import { UpdateGate } from '../components/update/UpdateGate';
import { usePhienBan } from '../lib/version/use-phien-ban';
```

Thêm một component bọc, đặt ngay trên `export default function RootLayout()`:

```tsx
/**
 * Chặn cả app khi phiên bản quá cũ so với máy chủ.
 *
 * Phải nằm TRONG `PersistQueryClientProvider` vì nó dùng react-query, và phải
 * nằm TRÊN `<Stack>` để chặn được cả màn đăng nhập — app cũ thì chính lượt đăng
 * nhập cũng có thể hỏng.
 */
function CongPhienBan({ children }: { children: React.ReactNode }) {
  const { muc, notes } = usePhienBan();

  if (muc === 'bat-buoc') {
    return <UpdateGate notes={notes} />;
  }

  return <>{children}</>;
}
```

Rồi bọc phần thân trong `RootLayout`, thay:

```tsx
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
```

bằng:

```tsx
        <AuthProvider>
          <StatusBar style="dark" />
          <CongPhienBan>
            <Stack screenOptions={{ headerShown: false }} />
          </CongPhienBan>
        </AuthProvider>
```

- [ ] **Step 3: Gắn dải băng vào màn Trò chuyện**

Trong `src/app/(tabs)/chat/index.tsx`:

Thêm import:

```tsx
import { UpdateBanner } from '../../../components/update/UpdateBanner';
import { usePhienBan } from '../../../lib/version/use-phien-ban';
```

Thêm vào thân component, cạnh các hook khác:

```tsx
  const capNhat = usePhienBan();
```

> **Bẫy đặt tên — đọc kỹ.** Màn này ĐÃ CÓ một biến tên `muc` cho thanh chuyển
> Dự án / Tin nhắn (`const [muc, setMuc] = useState<'du-an' | 'tin-nhan'>(...)`).
> Hook mới cũng trả về một trường tên `muc`, nhưng là thứ hoàn toàn khác. Luôn
> viết đầy đủ `capNhat.muc`, đừng bao giờ hủy cấu trúc nó ra thành `muc` — trùng
> tên ở đây cho ra một lỗi im lặng mà TypeScript không bắt được, vì cả hai đều
> là chuỗi.

Rồi trong `<View style={styles.body}>`, chèn ngay TRƯỚC khối `{muc === 'du-an' && projectsQuery.isError ? (`:

```tsx
        {capNhat.muc === 'nen-cap-nhat' ? (
          <UpdateBanner phienBanMoi={capNhat.latest} notes={capNhat.notes} />
        ) : null}
```

Đặt trên cùng thân màn, cùng chỗ `ErrorBanner` vẫn hiện. Không đặt ở layout gốc: header gradient vẽ tràn lên tận thanh trạng thái theo chế độ edge-to-edge, chèn một dải phía trên sẽ phá bố cục đó ở mọi màn.

- [ ] **Step 4: Chạy typecheck và toàn bộ test**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

- [ ] **Step 5: Ghi quy trình vận hành vào ghi chú bàn giao**

Thêm vào `docs/superpowers/notes/2026-09-18-tin-nhan-rieng-ban-giao.md`, ngay trước mục "Đợt 2 — chưa động tới":

```markdown
## Mỗi lần tăng phiên bản, nhớ đổi ở HAI chỗ

Từ khi có tính năng nhắc cập nhật, số phiên bản nằm ở hai nơi và phải khớp nhau:

1. `app.json` của `WeDo_ChPlay` — `expo.version` và `expo.android.versionCode`
2. Biến `MOBILE_LATEST_VERSION` trên Azure của `BE_WEDO`

Quên cái thứ hai thì người dùng đã cập nhật rồi vẫn bị nhắc mãi, hoặc tệ hơn là
không ai được nhắc gì cả.

`MOBILE_MINIMUM_VERSION` chỉ nâng khi backend đổi kiểu phá vỡ khiến app cũ không
chạy nổi. Nâng nó là **chặn hẳn** người dùng cũ ra khỏi app, không phải nhắc nhở
— đừng nâng theo thói quen mỗi lần phát hành.
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/version/use-phien-ban.ts "src/app/_layout.tsx" "src/app/(tabs)/chat/index.tsx" docs/superpowers/notes
git commit -m "feat(mobile): gan nhac cap nhat vao app"
```

---

### Task 7: Nghiệm thu trên máy thật

**Files:** không sửa file nào. Task này là cổng chất lượng.

- [ ] **Step 1: Chạy toàn bộ cổng tự động**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest`
Expected: toàn bộ test backend qua

- [ ] **Step 2: Kiểm endpoint trên máy chủ thật**

Sau khi deploy backend, chạy:

```bash
curl -s https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/app-version
```

Expected: JSON có đủ ba khoá `latest`, `minimum`, `notes`. Nếu cả ba rỗng nghĩa là chưa khai biến môi trường trên Azure.

- [ ] **Step 3: Thử ba trạng thái trên máy thật**

Đổi `MOBILE_LATEST_VERSION` và `MOBILE_MINIMUM_VERSION` trên Azure rồi mở lại app. Vì `staleTime` là 30 phút, phải **tắt hẳn app rồi mở lại** mới thấy đổi.

- [ ] `latest` = phiên bản đang chạy → không hiện gì
- [ ] `latest` cao hơn phiên bản đang chạy → dải băng hiện ở màn Trò chuyện, có ghi chú đúng
- [ ] Bấm "Cập nhật" → mở đúng trang WeDo trên CH Play
- [ ] Bấm "Để sau" → dải băng biến mất, tắt app mở lại vẫn không hiện
- [ ] Nâng `latest` lên một bậc nữa → dải băng hiện lại (đã tắt bản cũ không làm im bản mới)
- [ ] `minimum` cao hơn phiên bản đang chạy → màn chặn hiện ngay, **kể cả khi chưa đăng nhập**, và không có đường thoát
- [ ] Hạ `minimum` xuống → app dùng lại bình thường

- [ ] **Step 4: Thử nhánh hỏng thì im lặng**

- [ ] Bật chế độ máy bay rồi mở app → không hiện gì, app chạy bình thường
- [ ] Xoá cả ba biến môi trường trên Azure → không hiện gì, app chạy bình thường

Đây là nhóm quan trọng nhất. Một cơ chế kiểm phiên bản mà khoá người dùng ra khỏi app đang chạy tốt thì tệ hơn hẳn việc không có nó.

- [ ] **Step 5: Ghi chú bàn giao**

Tạo `docs/superpowers/notes/2026-09-18-nhac-cap-nhat-ban-giao.md` ghi: những gì đã chạy được trên máy thật, những gì chưa thử, và bất cứ chỗ nào lệch so với kế hoạch này cùng lý do.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/notes
git commit -m "docs: ghi chu nghiem thu nhac cap nhat"
```

---

## Không nằm trong kế hoạch này

- `expo-updates` để đẩy bản sửa thẳng tới máy, không qua CH Play. Đây là thứ đáng làm nhất sau mốc 30/09 — nó sẽ biến một vòng build-duyệt-phát hành cả buổi thành vài phút.
- Play In-App Updates API của Google.
- Màn quản trị để đổi số phiên bản thay cho biến môi trường.
- Thông báo đẩy khi có bản mới.

Tăng `versionCode` và `version` trong `app.json` làm một lần khi chuẩn bị build, không nằm trong task nào.
