# App mobile WeDo song ngữ vi/en — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người dùng không đọc tiếng Việt dùng trọn WeDo mobile bằng tiếng Anh (giao diện, câu lỗi, thông báo đẩy); người dùng Việt Nam không thấy gì thay đổi.

**Architecture:** App chép lõi i18n của web (`khaiBaoTuDien`/`useTuDien`/`soNhieu`/`dinh-dang`/`loi`), ngôn ngữ chọn theo máy qua `expo-localization` hoặc lựa chọn lưu `AsyncStorage`. Máy chủ thêm `User.language`; mọi thông báo (bản ghi + push) được dựng theo ngôn ngữ người nhận từ một module mẫu `vi`/`en`.

**Tech Stack:** Expo SDK 57 / React Native / Expo Router (typedRoutes) / TanStack Query / Jest + RNTL v14 (mobile); NestJS 11 / Prisma 7 / Jest (máy chủ).

Spec: `docs/superpowers/specs/2026-10-09-song-ngu-mobile-design.md`.

## Global Constraints

- Mobile: nhánh `feat/song-ngu` tách từ `hop-ios-vao-main` (worktree mới `D:\WeDo_ChPlay-songngu`, chép `google-services.json` vào). KHÔNG làm trên `main`, `ios`, hay worktree `D:\WeDo_ChPlay-hop`.
- Máy chủ: repo `D:\WEDO_PC\BE_WEDO-ios`, nhánh `feat/ngon-ngu-nguoi-dung` tách từ `origin/backend`.
- Ngôn ngữ hiệu lực chỉ là `'vi' | 'en'`. Lựa chọn người dùng: `'he-thong' | 'vi' | 'en'`, mặc định `'he-thong'`. Máy có mã ngôn ngữ bắt đầu bằng `vi` → `vi`; còn lại → `en`.
- Khoá AsyncStorage: `wedo:ngon-ngu-chon`.
- Chữ tiếng Việt chép NGUYÊN VĂN từ mã hiện tại vào từ điển (giao diện tiếng Việt không đổi một chữ). Bản tiếng Anh không được còn dấu tiếng Việt (trừ tên riêng trong danh sách `TEN_RIENG`).
- Ngày giờ luôn theo giờ Việt Nam (`Asia/Ho_Chi_Minh`); tiếng Anh `en-US`, tiếng Việt `vi-VN`. Hermes có thể thiếu ICU đầy đủ: không dựa vào `toLocaleDateString` với `timeZone` trong mã mới; dùng `Intl.DateTimeFormat` qua `dinh-dang.ts` và giữ các hàm tự tính UTC+7 đang có (ví dụ `ngayVN`) cho tiếng Việt.
- Hook là `useTuDien(tuDien)` (giống web, thay cho tên `useDich` trong spec). Ngoài React: `theoNgonNgu(tuDien, ngonNgu?)`.
- Câu lỗi: `useDichLoi()(err, cauDuPhong)`; dịch theo `code`, rồi theo câu tiếng Việt cố định đã biết, không nhận ra thì tiếng Việt giữ nguyên câu máy chủ, tiếng Anh hiện `cauDuPhong`.
- Không chạy `npx expo lint`. RNTL v14: `render`/`act`/`fireEvent` phải `await`. Thêm màn hình/đổi route thì sinh lại `.expo/types/router.d.ts` bằng `CI=1 npx expo start --port 8096` ~40 s.
- Commit tiếng Việt không dấu kiểu `feat(i18n): ...`, kết bằng dòng `Co-Authored-By` của model thực hiện. Không push nếu chủ dự án chưa đồng ý.
- Máy chủ: identifier tiếng Việt không dấu, chú thích có dấu, prettier (singleQuote, trailingComma); lint `npm run lint -- --max-warnings 0` phải sạch (CI chặn deploy nếu lint đỏ); migration chỉ thêm, có `SET LOCAL lock_timeout = '5s'`.

---

## Phần A — Máy chủ

### Task 1: `User.language` và `PATCH /users/me/language`

**Files:**
- Modify: `prisma/schema.prisma` (model `User`)
- Create: `prisma/migrations/202610091200_user_language/migration.sql`
- Create: `src/users/dto/cap-nhat-ngon-ngu.dto.ts`
- Modify: `src/users/users.controller.ts`, `src/users/users.service.ts`
- Test: `src/users/ngon-ngu-nguoi-dung.spec.ts`

**Interfaces:**
- Produces: `type NgonNguNguoiDung = 'vi' | 'en'` exported from `src/users/ngon-ngu.ts`; `UsersService.capNhatNgonNgu(userId: string, language: NgonNguNguoiDung): Promise<{ language: NgonNguNguoiDung }>`; `GET /users/me` (hoặc endpoint hồ sơ hiện có) trả thêm `language`.

- [ ] **Step 1: Schema** — trong `model User` thêm `language String @default("vi")` (đặt cạnh các cột hồ sơ).

- [ ] **Step 2: Migration**

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'vi';
COMMIT;
```

- [ ] **Step 3: `src/users/ngon-ngu.ts`**

```ts
/** Ngôn ngữ app của người dùng: chọn chữ cho thông báo đẩy và thông báo trong app. */
export type NgonNguNguoiDung = 'vi' | 'en';
export const CAC_NGON_NGU_NGUOI_DUNG: readonly NgonNguNguoiDung[] = ['vi', 'en'];
export function laNgonNguNguoiDung(v: unknown): v is NgonNguNguoiDung {
  return v === 'vi' || v === 'en';
}
/** Giá trị lạ trong DB (dữ liệu cũ) coi như tiếng Việt. */
export function chuanHoaNgonNgu(v: unknown): NgonNguNguoiDung {
  return laNgonNguNguoiDung(v) ? v : 'vi';
}
```

- [ ] **Step 4: DTO**

```ts
import { IsIn } from 'class-validator';
import { CAC_NGON_NGU_NGUOI_DUNG, type NgonNguNguoiDung } from '../ngon-ngu';

export class CapNhatNgonNguDto {
  @IsIn(CAC_NGON_NGU_NGUOI_DUNG)
  language!: NgonNguNguoiDung;
}
```

- [ ] **Step 5: Test đỏ** (`src/users/ngon-ngu-nguoi-dung.spec.ts`): `UsersService.capNhatNgonNgu('u1','en')` gọi `prisma.user.update({ where: { id: 'u1' }, data: { language: 'en' }, select: { language: true } })` và trả `{ language: 'en' }`; DTO `{ language: 'fr' }` lỗi validate (dùng `validate` của class-validator); `chuanHoaNgonNgu(null) === 'vi'`. Chạy `npx jest src/users/ngon-ngu-nguoi-dung.spec.ts` → FAIL.

- [ ] **Step 6: Cài đặt** — service:

```ts
async capNhatNgonNgu(userId: string, language: NgonNguNguoiDung) {
  return this.prisma.user.update({ where: { id: userId }, data: { language }, select: { language: true } }) as Promise<{ language: NgonNguNguoiDung }>;
}
```

controller (theo đúng guard và kiểu `YeuCauDaXacThuc` các route `me` khác dùng):

```ts
@Patch('me/language')
capNhatNgonNgu(@Req() req: YeuCauDaXacThuc, @Body() body: CapNhatNgonNguDto) {
  return this.usersService.capNhatNgonNgu(req.user.id, body.language);
}
```

Thêm `language: true` vào select của endpoint hồ sơ `me` hiện có.

- [ ] **Step 7:** `npx jest src/users`, `npx tsc --noEmit`, `npm run lint -- --max-warnings 0` sạch. Commit `feat(users): luu ngon ngu app cua nguoi dung`.

### Task 2: Thông báo theo ngôn ngữ người nhận

**Files:**
- Create: `src/notifications/mau-thong-bao.ts`, test `src/notifications/mau-thong-bao.spec.ts`
- Modify: `src/notifications/notifications.service.ts` (`createSystemNotification`), `src/notifications/expo-push.service.ts` (`sendToUser`), và mọi nơi gọi: `src/tasks/tasks.service.ts`, `src/projects/projects.service.ts`, `src/projects/loi-moi/project-invites.service.ts`, `src/meetings/meetings.service.ts`, `src/notifications/task-deadline-reminders.service.ts`, `src/payments/payments.service.ts`, `src/payments/billing-operations.service.ts`, `src/chat/chat-push.service.ts`
- Test: cập nhật spec hiện có của các service trên

**Interfaces:**
- Consumes: `NgonNguNguoiDung`, `chuanHoaNgonNgu` (Task 1).
- Produces: `type NoiDungHaiNgu = Record<NgonNguNguoiDung, { title: string; message: string }>`; `MAU_THONG_BAO` (các hàm dựng `NoiDungHaiNgu`); `createSystemNotification({ ..., noiDung: NoiDungHaiNgu })` thay cho cặp `title/message`; `ExpoPushService.sendToUser(userId, { noiDung: NoiDungHaiNgu, data? }, opts?)`.

- [ ] **Step 1: Kiểm kê** — `grep -rn "title:" src --include=*.ts | grep -v spec | grep -v generated` và mọi lời gọi `createSystemNotification`, `createNotification(`, `sendToUser(`. Ghi bảng (tệp:dòng → loại thông báo → câu vi hiện tại) vào báo cáo task. Prompt AI (`'Tên task ngắn gọn…'` trong chat/meetings) KHÔNG phải thông báo — để Task 3.

- [ ] **Step 2: Test đỏ cho mẫu** — `mau-thong-bao.spec.ts`: với mỗi khoá của `MAU_THONG_BAO`, gọi với tham số mẫu → bản `vi` đúng NGUYÊN VĂN câu cũ (ví dụ `MAU_THONG_BAO.giaoViec({ tenViec: 'A' }).vi` = `{ title: 'Bạn được giao task mới', message: 'Leader vừa giao cho bạn task "A". Hãy chấp nhận hoặc từ chối để team biết trạng thái nhận việc.' }`), bản `en` không rỗng và không có dấu tiếng Việt (regex `/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i`, bỏ qua tham số người dùng).

- [ ] **Step 3: `mau-thong-bao.ts`** — một hàm cho mỗi loại trong bảng kiểm kê, ví dụ:

```ts
import type { NgonNguNguoiDung } from '../users/ngon-ngu';

export type NoiDungHaiNgu = Record<NgonNguNguoiDung, { title: string; message: string }>;

export const MAU_THONG_BAO = {
  giaoViec: ({ tenViec }: { tenViec: string }): NoiDungHaiNgu => ({
    vi: {
      title: 'Bạn được giao task mới',
      message: `Leader vừa giao cho bạn task "${tenViec}". Hãy chấp nhận hoặc từ chối để team biết trạng thái nhận việc.`,
    },
    en: {
      title: 'You have a new task',
      message: `Your Leader assigned you "${tenViec}". Accept or decline it so the team knows where it stands.`,
    },
  }),
  // ... mỗi loại trong bảng kiểm kê: lamLai, themVaoDuAn, cuocHopMoi, cuocHopHuy, cuocHopDoiGio,
  // sapDenHan({ tenViec, khoang }), thanhToanThanhCong, goiSapHetHan({ tenGoi, ... }), loiMoiKetBan, daLaBanBe, ...
} as const;
```

Khoảng thời gian nhắc hạn (`window.label` trong task-deadline-reminders) phải có nhãn hai ngôn ngữ (ví dụ `{ vi: '24 giờ', en: '24 hours' }`).

- [ ] **Step 4: Chọn ngôn ngữ ở một chỗ** — `createSystemNotification` và `ExpoPushService.sendToUser` nhận `noiDung: NoiDungHaiNgu`, đọc `user.language` của người nhận (một truy vấn `select: { language: true }`, `chuanHoaNgonNgu`), lưu/đẩy `noiDung[lang]`. Gửi cho nhiều người: đọc ngôn ngữ một lần cho cả danh sách (`findMany where id in`). Tin nhắn chat (chat-push): tiêu đề là tên dự án/người gửi, nội dung là tin nhắn — chỉ dịch các nhãn cố định (ví dụ "[Ảnh]", "đã gửi một ảnh") qua `MAU_THONG_BAO`.

- [ ] **Step 5: Chuyển mọi nơi gọi** trong bảng kiểm kê sang `MAU_THONG_BAO.*`. Spec hiện có kiểm `title`/`message` tiếng Việt vẫn phải xanh với người nhận `language: 'vi'`; thêm một test mỗi service cho người nhận `en` (ví dụ tasks: người được giao có `language: 'en'` → bản ghi `title: 'You have a new task'`).

- [ ] **Step 6:** `npx jest src/notifications src/tasks src/meetings src/projects src/payments src/chat`, `npx tsc --noEmit`, lint sạch. Commit `feat(notifications): thong bao theo ngon ngu nguoi nhan`.

### Task 3: AI gợi ý việc theo ngôn ngữ người gọi

**Files:**
- Modify: `src/chat/chat.service.ts` (prompt quanh dòng ~1529 và ~1657), `src/meetings/meetings.service.ts` (prompt quanh ~1875 và ~1988)
- Test: spec AI hiện có của chat/meetings

- [ ] **Step 1: Test đỏ** — người gọi `language: 'en'` → prompt gửi nhà cung cấp AI chứa chỉ dẫn viết bằng tiếng Anh (ví dụ chuỗi `Write the task title and description in English.`) và schema mẫu tiếng Anh (`title: 'Short task title in English'`); `vi` giữ NGUYÊN prompt cũ (so khớp chuỗi cũ).
- [ ] **Step 2: Cài đặt** — đọc `language` của người gọi (đã có `userId`), truyền vào hàm dựng prompt; nhánh `vi` không đổi một ký tự.
- [ ] **Step 3:** test + tsc + lint sạch. Commit `feat(ai): goi y viec theo ngon ngu nguoi dung`.

---

## Phần B — Mobile

### Task 4: Lõi i18n

**Files:**
- Create: `src/i18n/ngon-ngu.ts`, `src/i18n/dich.ts`, `src/i18n/dinh-dang.ts`, `src/i18n/loi.ts`, `src/i18n/NgonNguProvider.tsx`, `src/i18n/tu-dien/chung.ts`
- Test: `src/i18n/__tests__/ngon-ngu.test.ts`, `dich.test.ts`, `dinh-dang.test.ts`, `loi.test.ts`
- Modify: `package.json` (`npx expo install expo-localization`), `app.json`, `src/app/_layout.tsx`
- Create: `locales/en.json`

**Interfaces:**
- Produces:
  - `type NgonNgu = 'vi' | 'en'`; `type LuaChonNgonNgu = 'he-thong' | NgonNgu`; `KHOA_LUA_CHON = 'wedo:ngon-ngu-chon'`; `MA_VUNG: Record<NgonNgu, string>`; `TEN_NGON_NGU: Record<NgonNgu, string>` (`Tiếng Việt` / `English`).
  - `ngonNguTheoMay(ma: string | null | undefined): NgonNgu`; `layNgonNgu(): NgonNgu`; `layLuaChon(): LuaChonNgonNgu`; `datLuaChon(l: LuaChonNgonNgu): Promise<void>`; `napLuaChonDaLuu(): Promise<void>`; `docLaiNgonNguMay(): void`; `dangKyNgonNgu(nghe: () => void): () => void`; `datNgonNguChoKiemThu(n: NgonNgu | null): void`.
  - `khaiBaoTuDien<T>(vi: T, en: NoInfer<T>): TuDien<T>`, `theoNgonNgu`, `noiSuy`, `soNhieu` (chép nguyên từ web `FE_WEDO-ios/src/i18n/dich.ts`).
  - `dinhDangThoiGian`, `dinhDangNgay`, `dinhDangNgayGio`, `dinhDangGio`, `dinhDangSo`, `dinhDangTien` (chép từ web `dinh-dang.ts`).
  - `dichThongBaoLoi(loi: unknown, duPhong: string, ngonNgu: NgonNgu): string`.
  - `NgonNguProvider`, `useNgonNgu(): { ngonNgu: NgonNgu; luaChon: LuaChonNgonNgu; datLuaChon(l): Promise<void> }`, `useTuDien<T>(t: TuDien<T>): T`, `useDichLoi(): (loi: unknown, duPhong: string) => string`.

- [ ] **Step 1: Cài** — `npx expo install expo-localization`; kiểm `npx expo install --check` sạch.

- [ ] **Step 2: Test đỏ `ngon-ngu.test.ts`** (mock `expo-localization` và AsyncStorage bằng mock có sẵn của `@react-native-async-storage/async-storage/jest/async-storage-mock`):

```ts
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ngonNguTheoMay, layNgonNgu, layLuaChon, datLuaChon, napLuaChonDaLuu, docLaiNgonNguMay, datNgonNguChoKiemThu, KHOA_LUA_CHON } from '../ngon-ngu';

jest.mock('expo-localization', () => ({ getLocales: jest.fn(() => [{ languageCode: 'vi' }]) }));
const mockLocales = Localization.getLocales as jest.Mock;

beforeEach(async () => { await AsyncStorage.clear(); datNgonNguChoKiemThu(null); mockLocales.mockReturnValue([{ languageCode: 'vi' }]); });

it('máy tiếng Việt → vi; ngôn ngữ khác → en; rỗng → en', () => {
  expect(ngonNguTheoMay('vi')).toBe('vi');
  expect(ngonNguTheoMay('vi-VN')).toBe('vi');
  expect(ngonNguTheoMay('fr')).toBe('en');
  expect(ngonNguTheoMay(undefined)).toBe('en');
});
it('mặc định theo máy', async () => {
  mockLocales.mockReturnValue([{ languageCode: 'ja' }]);
  await napLuaChonDaLuu();
  expect(layLuaChon()).toBe('he-thong');
  expect(layNgonNgu()).toBe('en');
});
it('chọn tay được lưu và thắng ngôn ngữ máy', async () => {
  await datLuaChon('vi');
  mockLocales.mockReturnValue([{ languageCode: 'en' }]);
  docLaiNgonNguMay();
  expect(layNgonNgu()).toBe('vi');
  expect(await AsyncStorage.getItem(KHOA_LUA_CHON)).toBe('vi');
});
it('theo máy thì đổi ngôn ngữ máy là đổi theo', async () => {
  await datLuaChon('he-thong');
  mockLocales.mockReturnValue([{ languageCode: 'en' }]);
  docLaiNgonNguMay();
  expect(layNgonNgu()).toBe('en');
});
```

Chạy `npx jest src/i18n/__tests__/ngon-ngu.test.ts` → FAIL (module chưa có).

- [ ] **Step 3: `ngon-ngu.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

/** Ngôn ngữ hiển thị của app. Lựa chọn của người dùng thêm 'he-thong' = theo ngôn ngữ máy. */
export type NgonNgu = 'vi' | 'en';
export type LuaChonNgonNgu = 'he-thong' | NgonNgu;
export const KHOA_LUA_CHON = 'wedo:ngon-ngu-chon';
export const MA_VUNG: Record<NgonNgu, string> = { vi: 'vi-VN', en: 'en-US' };
/** Tên viết bằng chính ngôn ngữ đó. */
export const TEN_NGON_NGU: Record<NgonNgu, string> = { vi: 'Tiếng Việt', en: 'English' };

export function laLuaChon(v: unknown): v is LuaChonNgonNgu {
  return v === 'he-thong' || v === 'vi' || v === 'en';
}
/** Máy dùng tiếng Việt thì tiếng Việt; mọi ngôn ngữ khác (và không đọc được) là tiếng Anh. */
export function ngonNguTheoMay(ma: string | null | undefined): NgonNgu {
  return (ma ?? '').trim().toLowerCase().startsWith('vi') ? 'vi' : 'en';
}
function maMay(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    return null;
  }
}

let luaChon: LuaChonNgonNgu = 'he-thong';
let hienTai: NgonNgu | null = null;
const nguoiNghe = new Set<() => void>();

function tinh(): NgonNgu {
  return luaChon === 'he-thong' ? ngonNguTheoMay(maMay()) : luaChon;
}
function capNhat() {
  const moi = tinh();
  if (moi === hienTai) return;
  hienTai = moi;
  for (const nghe of [...nguoiNghe]) nghe();
}

export function layNgonNgu(): NgonNgu {
  if (hienTai === null) hienTai = tinh();
  return hienTai;
}
export function layLuaChon(): LuaChonNgonNgu {
  return luaChon;
}
/** Đọc lựa chọn đã lưu lúc mở app. Kho hỏng thì theo máy. */
export async function napLuaChonDaLuu(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(KHOA_LUA_CHON);
    luaChon = laLuaChon(v) ? v : 'he-thong';
  } catch {
    luaChon = 'he-thong';
  }
  capNhat();
}
export async function datLuaChon(l: LuaChonNgonNgu): Promise<void> {
  luaChon = l;
  capNhat();
  try {
    await AsyncStorage.setItem(KHOA_LUA_CHON, l);
  } catch {
    // Không lưu được thì vẫn đổi cho phiên này.
  }
}
/** Gọi khi app trở lại foreground: người dùng có thể vừa đổi ngôn ngữ máy. */
export function docLaiNgonNguMay() {
  capNhat();
}
export function dangKyNgonNgu(nghe: () => void): () => void {
  nguoiNghe.add(nghe);
  return () => {
    nguoiNghe.delete(nghe);
  };
}
/** Chỉ cho kiểm thử. `null` = tính lại từ lựa chọn hiện tại. */
export function datNgonNguChoKiemThu(n: NgonNgu | null) {
  if (n === null) {
    luaChon = 'he-thong';
    hienTai = null;
  } else {
    luaChon = n;
    hienTai = n;
  }
  for (const nghe of [...nguoiNghe]) nghe();
}
```

- [ ] **Step 4: `dich.ts` và `dinh-dang.ts`** — chép nguyên `D:\WEDO_PC\FE_WEDO-ios\src\i18n\dich.ts` và `dinh-dang.ts`; chỉ đổi import `./ngon-ngu` cho khớp (`MA_VUNG`, `layNgonNgu`, `NgonNgu`) và sửa đoạn chú thích hướng dẫn cho đúng app (`useTuDien`, `npm test`). Chép các test tương ứng của web (`dich.test.ts`, `dinh-dang.test.ts`) chuyển sang Jest (`describe/it/expect`).

- [ ] **Step 5: `loi.ts`** — chép cấu trúc web `loi.ts` (bảng `TIENG_ANH_THEO_MA`, `TIENG_ANH_THEO_CAU`), đổi phụ thuộc sang `ApiError` của `src/lib/api/client.ts` (`code`, `message`, `chiTiet`). Thêm mã IAP: `SUBSCRIPTION_CONFLICT`, `TRANSACTION_OWNED_BY_OTHER_USER`, `WORKSPACE_OWNER_REQUIRED`, `APPLE_IAP_DISABLED`, `APPLE_TRANSACTION_INVALID`. Luật:

```ts
export function dichThongBaoLoi(loi: unknown, duPhong: string, ngonNgu: NgonNgu): string {
  const cau = loi instanceof Error ? loi.message.normalize('NFC').trim() : '';
  if (ngonNgu === 'vi') return cau || duPhong;
  const ma = loi instanceof ApiError ? loi.code : undefined;
  if (ma && TIENG_ANH_THEO_MA[ma]) return TIENG_ANH_THEO_MA[ma](layChiTiet(loi), cau);
  if (cau && TIENG_ANH_THEO_CAU[cau]) return TIENG_ANH_THEO_CAU[cau];
  return duPhong;
}
```

(`layChiTiet` đọc `loi.chiTiet` nếu là object.) Test: mã đã biết → câu tiếng Anh; câu tiếng Việt cố định → câu tiếng Anh; câu lạ → `duPhong` ở `en`, nguyên câu ở `vi`; lỗi không phải Error → `duPhong`.

- [ ] **Step 6: `NgonNguProvider.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { TuDien } from './dich';
import { dichThongBaoLoi } from './loi';
import { dangKyNgonNgu, datLuaChon, docLaiNgonNguMay, layLuaChon, layNgonNgu, napLuaChonDaLuu, type LuaChonNgonNgu, type NgonNgu } from './ngon-ngu';

interface GiaTri { ngonNgu: NgonNgu; luaChon: LuaChonNgonNgu; datLuaChon: (l: LuaChonNgonNgu) => Promise<void> }
const Ctx = createContext<GiaTri | null>(null);

function useKho() {
  const ngonNgu = useSyncExternalStore(dangKyNgonNgu, layNgonNgu, layNgonNgu);
  const luaChon = useSyncExternalStore(dangKyNgonNgu, layLuaChon, layLuaChon);
  return { ngonNgu, luaChon };
}

export function NgonNguProvider({ children }: { children: ReactNode }) {
  const { ngonNgu, luaChon } = useKho();
  useEffect(() => {
    void napLuaChonDaLuu();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') docLaiNgonNguMay();
    });
    return () => sub.remove();
  }, []);
  const giaTri = useMemo(() => ({ ngonNgu, luaChon, datLuaChon }), [ngonNgu, luaChon]);
  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>;
}

export function useNgonNgu(): GiaTri {
  const g = useContext(Ctx);
  const kho = useKho();
  return g ?? { ...kho, datLuaChon };
}
export function useTuDien<T>(t: TuDien<T>): T {
  return t[useNgonNgu().ngonNgu];
}
export function useDichLoi() {
  const { ngonNgu } = useNgonNgu();
  return useCallback((loi: unknown, duPhong: string) => dichThongBaoLoi(loi, duPhong, ngonNgu), [ngonNgu]);
}
```

Bọc ngoài cùng trong `src/app/_layout.tsx` (ngoài QueryClientProvider/AuthProvider). Test: dựng một component dùng `useTuDien(khaiBaoTuDien({ a: 'Xin chào' }, { a: 'Hello' }))`, `datNgonNguChoKiemThu('en')` → hiện `Hello`; đổi về `'vi'` trong `act` → `Xin chào`.

- [ ] **Step 7: `app.json`** — `"locales": { "vi": "./locales/vi.json", "en": "./locales/en.json" }`; `ios.infoPlist.CFBundleLocalizations: ["vi", "en"]` (giữ `CFBundleDevelopmentRegion: "vi"`). `locales/en.json`: cùng khoá với `locales/vi.json`, giá trị tiếng Anh (chuỗi quyền camera/ảnh/thông báo, `CFBundleDisplayName: "WeDo"`).

- [ ] **Step 8:** `npx jest src/i18n`, `npx tsc --noEmit`, `npm test -- --silent` sạch. Commit `feat(i18n): loi song ngu vi/en cho app mobile`.

### Task 5: Bài kiểm chống sót chữ + kiểm từ điển

**Files:**
- Create: `scripts/kiem-chuoi-chua-dich.ts`, `scripts/chuoi-duoc-phep.ts`, `src/i18n/__tests__/kiem-chuoi-chua-dich.test.ts`, `src/i18n/__tests__/tu-dien.test.ts`, `src/i18n/chu-viet-con-sot.ts`
- Modify: `package.json` (script `"kiem-dich": "tsx scripts/kiem-chuoi-chua-dich.ts"` hoặc `node --experimental-strip-types`, theo công cụ repo đã có)

**Interfaces:**
- Produces: `timChuoiChuaDich(maNguon: string): string[]`; `quetTatCa(goc: string, tep: string[]): Record<string, string[]>`; hằng `TEP_DA_DICH: string[]` trong test (task sau thêm tệp vào); `chuVietConSot(cayDaDung: string, boQua?: string[]): string[]` cho test hiển thị tiếng Anh.

- [ ] **Step 1:** Chép logic web `FE_WEDO-ios/scripts/kiem-chuoi-chua-dich.ts` (bỏ chú thích `//`, `/* */`; tìm chuỗi `'…'`, `"…"`, `` `…` `` và chữ JSX giữa `>…<` có dấu tiếng Việt; bỏ qua tệp test, `src/i18n/tu-dien/**`, `locales/**`). Ngoại lệ có lý do ghi `scripts/chuoi-duoc-phep.ts`.
- [ ] **Step 2:** `tu-dien.test.ts` chép từ web sang Jest: quét `src/i18n/tu-dien/*.ts`, mỗi export `{vi,en}` cùng hình dạng, không rỗng, bản `en` không dấu (trừ `TEN_RIENG = ['Lê Hữu Đại', 'Đại', 'Trang Nguyễn']`), hàm gọi với tham số mẫu ra chuỗi không rỗng.
- [ ] **Step 3:** `kiem-chuoi-chua-dich.test.ts`: `TEP_DA_DICH` ban đầu chỉ gồm tệp của Task 4 và `src/i18n/tu-dien/chung.ts` không áp dụng (từ điển bị loại khỏi quét); phép kiểm: mọi tệp trong `TEP_DA_DICH` quét ra rỗng; thêm một phép kiểm in số chuỗi còn lại toàn repo (không fail) để theo dõi tiến độ.
- [ ] **Step 4:** `chu-viet-con-sot.ts`: hàm nhận cây đã dựng của RNTL (`JSON.stringify(screen.toJSON())`) hoặc danh sách chữ từ `screen.root.findAll`, trả các đoạn chữ còn dấu tiếng Việt (trừ `boQua`).
- [ ] **Step 5:** test xanh. Commit `test(i18n): bai kiem chu chua dich va tu dien`.

### Task 6: Chọn ngôn ngữ trong Tài khoản + đồng bộ máy chủ

**Files:**
- Create: `src/i18n/tu-dien/tai-khoan.ts` (khởi tạo với các khoá của hàng ngôn ngữ; Task 8 bổ sung phần còn lại của màn)
- Create: `src/components/account/BangChonNgonNgu.tsx`, test `src/components/account/__tests__/bang-chon-ngon-ngu.test.tsx`
- Create: `src/lib/i18n/dong-bo-ngon-ngu.ts`, test `src/lib/i18n/__tests__/dong-bo-ngon-ngu.test.ts`
- Modify: `src/lib/api/account.ts` (thêm `capNhatNgonNgu`), `src/app/(tabs)/account/index.tsx` (hàng mới), `src/app/_layout.tsx` (gắn đồng bộ)

**Interfaces:**
- Consumes: `useNgonNgu`, `LuaChonNgonNgu`, `TEN_NGON_NGU`, `dangKyNgonNgu`, `layNgonNgu` (Task 4); `PATCH /users/me/language` (Task 1).
- Produces: `capNhatNgonNgu(language: NgonNgu): Promise<{ language: NgonNgu }>`; `batDongBoNgonNgu(daDangNhap: () => boolean): () => void` — gửi ngôn ngữ hiệu lực khi đăng nhập/khởi động (đã đăng nhập) và mỗi lần đổi; nhớ giá trị đã gửi (AsyncStorage `wedo:ngon-ngu-da-gui`) để không gửi trùng; lỗi mạng thì thử lại lần đổi/khởi động sau.

- [ ] **Step 1: Test đỏ đồng bộ** — mock `capNhatNgonNgu`: đã đăng nhập + `layNgonNgu()==='en'` + chưa gửi → gọi `capNhatNgonNgu('en')` một lần; gọi lại khi giá trị không đổi → không gọi; `datNgonNguChoKiemThu('vi')` → gọi `'vi'`; chưa đăng nhập → không gọi; lỗi mạng → không ghi "đã gửi".
- [ ] **Step 2:** Cài đặt `dong-bo-ngon-ngu.ts`, gọi `batDongBoNgonNgu` trong `_layout.tsx` sau khi AuthProvider có trạng thái (dùng hook auth hiện có); cũng gọi khi trạng thái chuyển sang đã đăng nhập.
- [ ] **Step 3: Test đỏ bảng chọn** — `BangChonNgonNgu` hiện 3 lựa chọn: "Theo máy" (`en`: "Use device language"), `Tiếng Việt`, `English` (hai tên này giữ nguyên ở mọi ngôn ngữ), đánh dấu lựa chọn hiện tại (`accessibilityState.selected`), bấm `English` → `datLuaChon('en')` và giao diện chuyển tiếng Anh.
- [ ] **Step 4:** Cài đặt bảng chọn (Modal/bottom sheet giống các sheet hiện có, ví dụ `RejectTaskSheet`); hàng trong tab Tài khoản: `MenuRow` testID `account-ngon-ngu`, nhãn luôn là `Ngôn ngữ / Language` (đặt trong `chuoi-duoc-phep.ts` với lý do "nhãn song ngữ cố ý"), hint là tên lựa chọn hiện tại.
- [ ] **Step 5:** test + tsc + toàn bộ test. Commit `feat(i18n): chon ngon ngu trong Tai khoan, dong bo may chu`.

### Task 7–13: Chuyển giao diện từng khu vực

Mỗi task dưới đây làm cùng một quy trình (lặp lại đầy đủ ở đây để implementer đọc riêng một task vẫn đủ):

1. Liệt kê chuỗi còn sót của các tệp trong task: `npx tsx scripts/kiem-chuoi-chua-dich.ts <tệp...>` (hoặc lệnh `kiem-dich` của Task 5).
2. Tạo/bổ sung `src/i18n/tu-dien/<khu-vuc>.ts` bằng `khaiBaoTuDien(vi, en)`. Bản `vi` chép NGUYÊN VĂN chuỗi cũ. Câu có biến → hàm `(x: string) => \`...${x}...\``; số nhiều tiếng Anh dùng `soNhieu('en', n, { mot, nhieu })`. Hàm trả một trong vài chuỗi cố định phải khai `: string`.
3. Trong component: `const t = useTuDien(tuDienKhuVuc)`; thay mọi chuỗi bằng `t.khoa`. Hàm thuần trong `src/lib` có chữ: thêm tham số `ngonNgu: NgonNgu = layNgonNgu()` và dùng `theoNgonNgu(tuDien, ngonNgu)`. Ngày giờ/số/tiền → `dinh-dang.ts`; giữ hàm tự tính UTC+7 hiện có cho tiếng Việt nếu đang dùng.
4. Lỗi: thay `err.message`/`loiNhan…` hiển thị bằng `dichLoi(err, t.cauDuPhong…)`. Lỗi giữ trong state thì giữ đối tượng lỗi, dịch lúc vẽ.
5. Thêm các tệp đã xong vào `TEP_DA_DICH` trong `kiem-chuoi-chua-dich.test.ts`.
6. Test hiện có tìm chữ tiếng Việt vẫn phải xanh ở `vi` (mặc định test là `vi`: thêm `beforeEach(() => datNgonNguChoKiemThu('vi'))` vào setup chung `jest.setup` nếu chưa có). Mỗi màn chính thêm một test dựng ở `en`: `datNgonNguChoKiemThu('en')`, dựng màn, `expect(chuVietConSot(...)).toEqual([])` (truyền `boQua` cho dữ liệu mẫu tiếng Việt như tên người/việc).
7. `npx tsc --noEmit`, `npm test -- --silent` xanh. Commit `feat(i18n): dich khu vuc <ten>`.

Văn phong tiếng Anh: câu ngắn, giọng thân thiện như `docs/app-store-ios/14-app-store-tieng-anh.md`; thuật ngữ cố định: Leader = "Leader", workspace = "workspace", dự án = "project", công việc/task = "task", nộp bài = "submit", duyệt = "approve", trả bài = "return", cuộc họp = "meeting", bảng đóng góp = "Contribution board", gói = "plan", Nâng cấp gói = "Upgrade plan", Khôi phục mua hàng = "Restore purchases", Quản lý đăng ký = "Manage subscription".

### Task 7: Đăng nhập, đăng ký, khởi đầu
**Files:** `src/app/(auth)/login.tsx`, `register.tsx`, `forgot-password.tsx`, `src/app/(onboarding)/**`, `src/components/auth/**` (CongDieuKhoan, VeDangNhapKhiDangXuat, nút Apple/Google), `src/lib/auth/**` có chữ hiển thị (ví dụ lý do hết phiên `docLyDoHetPhien`), từ điển `tu-dien/dang-nhap.ts`, `tu-dien/khoi-dau.ts`. Test en: màn đăng nhập, đăng ký, cổng điều khoản.

### Task 8: Tài khoản và Nâng cấp gói
**Files:** `src/app/(tabs)/account/index.tsx`, `nang-cap.tsx`, `contributions.tsx`, `src/app/account/profile.tsx`, `delete-account.tsx`, `notification-settings.tsx`, `feedback.tsx`, `blocked.tsx`, `src/lib/payments/mua-goi.ts` (`loiNhanMua`, `ghepTheGoi` quyền lợi) và `quyen-loi.ts`, `goi-hien-tai.ts` (`dongGoiHienTai`: 'Miễn phí', 'qua App Store', 'qua web'), `src/lib/ai/han-muc.ts`; từ điển `tu-dien/tai-khoan.ts`, `tu-dien/nang-cap.ts`. Đoạn pháp lý tự gia hạn trên màn Nâng cấp phải có bản tiếng Anh tương đương nghĩa (auto-renew, charged to Apple ID, cancel 24 h before, Settings > [your name] > Subscriptions). Test en: tab Tài khoản, Nâng cấp, Xoá tài khoản.

### Task 9: Trò chuyện, bạn bè, kiểm duyệt
**Files:** `src/app/(tabs)/chat/**`, `src/components/chat/**` (MessageBubble, TaskSuggestionSheet, ...), `src/components/moderation/**`, `src/lib/moderation/noi-dung.ts`, `src/lib/ai/dong-y-ai.ts`; từ điển `tu-dien/chat.ts`, `tu-dien/kiem-duyet.ts`. Test en: danh sách chat, chat dự án, phiếu báo cáo.

### Task 10: Công việc
**Files:** `src/app/(tabs)/tasks/**`, `src/components/tasks/**`, `src/lib/tasks/**` có chữ; từ điển `tu-dien/cong-viec.ts`. Test en: danh sách việc, chi tiết việc, tạo việc, từ chối việc.

### Task 11: Cuộc họp, Lịch, Đồng bộ lịch
**Files:** `src/app/(tabs)/meetings/**`, `src/app/(tabs)/calendar/**`, `src/lib/calendar/**` (`nhom-theo-ngay.ts`: nhãn Hôm nay/Ngày mai/thứ…), màn/sheet đồng bộ lịch có từ `main`; từ điển `tu-dien/cuoc-hop.ts`, `tu-dien/lich.ts`, `tu-dien/dong-bo-lich.ts`. Thứ trong tuần và tháng tiếng Anh lấy từ `Intl` qua `dinh-dang.ts`. Test en: danh sách họp, chi tiết họp, lịch.

### Task 12: Thông báo, báo cáo đóng góp, phần còn lại
**Files:** `src/app/(tabs)/notifications/**`, `src/lib/notifications/**` (chữ hiển thị cục bộ, lời xin quyền), màn/xuất báo cáo đóng góp (PDF/Excel) có từ `main`, `src/app/(tabs)/_layout.tsx` (tên tab), `src/components/**` còn lại (empty state, nhắc cập nhật `src/lib/version/**`, header…); từ điển `tu-dien/thong-bao.ts`, `tu-dien/bao-cao.ts`, `tu-dien/chung.ts`. Sau task này `npx tsx scripts/kiem-chuoi-chua-dich.ts` trên toàn `src/` ra rỗng (trừ `chuoi-duoc-phep.ts`), và `TEP_DA_DICH` được thay bằng phép kiểm "toàn bộ src sạch". Test en: thông báo, tab bar.

### Task 13: Phiên bản và tài liệu ra mắt
**Files:** `app.json` (`version` `1.0.16`, `ios.buildNumber` `"6"`, `android.versionCode` = giá trị trên `hop-ios-vao-main` + 1), `D:\WeDo_ChPlay\docs\app-store-ios\14-app-store-tieng-anh.md` (bỏ câu "The app interface is currently in Vietnamese…", thêm What's New tiếng Anh/tiếng Việt cho bản song ngữ), tài liệu ra mắt ngắn trong `docs/` (thứ tự: deploy máy chủ → build iOS + Android từ cùng nhánh; build mới bắt buộc vì `locales`/`CFBundleLocalizations` đổi vân tay).
- [ ] Kiểm vân tay iOS/Android mới (`npx @expo/fingerprint fingerprint:generate --platform ios|android`) và ghi vào tài liệu ra mắt.
- [ ] `npx expo install --check`, `npx tsc --noEmit`, `npm test -- --silent` xanh. Commit `chore(release): 1.0.16 song ngu`.
