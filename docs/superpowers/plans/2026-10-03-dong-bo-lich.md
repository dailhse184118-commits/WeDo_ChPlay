# Đồng bộ lịch WeDo sang Google Calendar, Lịch Apple, Outlook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người dùng gói Pro/Team lấy một link riêng `https://wedofpt.com.vn/lich/<mã>.ics`, dán vào Google Calendar / Lịch Apple / Outlook một lần, rồi hạn chót việc đã nhận, cuộc họp và sự kiện cá nhân trên WeDo tự hiện và tự cập nhật; tạo/đổi/tắt link trên web (màn Lịch) và app Android (Tài khoản).

**Architecture:** Máy chủ thêm bảng `calendar_feeds` (mã 43 ký tự lưu nguyên văn, mỗi người một dòng) và module `src/lich-dong-bo/`: hàm thuần tính workspace được đồng bộ (đọc thẳng `Subscription`, không qua `EntitlementsService.resolve()` vì Lịch iPhone mang User-Agent CFNetwork), hàm thuần đổi mục lịch sang `MucLich`, bộ viết iCalendar RFC 5545 tự viết, service và hai controller (đăng nhập: `GET/POST/DELETE /calendar-feed`; công khai: `GET /calendar-feed/:tep`). Phần truy vấn của `EventsService.findCalendarItems` tách thành hàm nhận nhiều workspace để dùng chung. Web thêm hộp thoại "Đồng bộ với lịch của bạn" ở màn Lịch, sửa bảng giá + chính sách thanh toán, và rewrite `/lich/:tep` trong `vercel.json`. App Android thêm màn "Đồng bộ lịch" (ẩn trên iPhone) chia sẻ link bằng `Share` sẵn có — phát qua OTA.

**Tech Stack:** NestJS 11 + Prisma 7.8 + jest/ts-jest + supertest; Vite + React 19 + Tailwind 4 + node:test qua `tsx`; Expo SDK 57 + expo-router + TanStack Query v5 + jest-expo + @testing-library/react-native v14. Không thêm thư viện nào ở cả ba repo.

Thiết kế gốc (đã duyệt): `docs/superpowers/specs/2026-10-03-dong-bo-lich-design.md`

## Global Constraints

- **Gói:** chỉ người có PERSONAL_PRO hoặc là thành viên workspace có TEAM_GROWTH đang hiệu lực (`status = ACTIVE` **và** `currentPeriodEnd > bây giờ`) mới tạo được link; tính lại phạm vi mỗi lần lịch được lấy; KHÔNG gọi `EntitlementsService.resolve()` / `laYeuCauTuIPhone()` trong đường lấy lịch.
- **Tương thích ngược:** chỉ THÊM đường mới; `GET /events/calendar` trả kết quả giống hệt trước (có test giữ hành vi). Không đổi API, DTO hay hành vi nào app Android 1.0.13/1.0.14, iOS 1.0.14 và web cũ đang dùng.
- **Migration chỉ thêm:** đúng một thư mục migration mới tạo bảng `calendar_feeds` (+ khoá ngoại cascade); `git diff origin/backend -- prisma` chỉ gồm `schema.prisma` (thêm model + quan hệ ngược) và thư mục migration mới.
- **Biến môi trường:** `CALENDAR_FEED_BASE_URL` không bắt buộc, mặc định `https://wedofpt.com.vn/lich`.
- **Mã link:** `crypto.randomBytes(32).toString('base64url')` (43 ký tự `[A-Za-z0-9_-]`); đường công khai khớp `^[A-Za-z0-9_-]{43}\.ics$`, sai/thu hồi/tài khoản bị khoá (`suspendedAt`) → 404 dạng chữ.
- **Lịch:** từ 30 ngày trước tới 180 ngày sau; trần 2.000 mục (giữ mục sớm nhất); hạn chót = khối 30 phút kết thúc đúng giờ hạn; họp không có `endTime` = 60 phút; không `VALARM`; giờ UTC `YYYYMMDDTHHMMSSZ`; `DTSTAMP`/`LAST-MODIFIED` = `updatedAt` của bản ghi; UID `task-<id>@wedofpt.com.vn` / `meeting-<id>@wedofpt.com.vn` / `event-<id>@wedofpt.com.vn`; CRLF; gập dòng ở 75 byte UTF-8 không cắt đôi ký tự; NFC; mô tả cắt 1.000 ký tự; link về WeDo `https://wedofpt.com.vn/#/taskboard` | `#/meeting` | `#/calendar`.
- **Header công khai:** `Content-Type: text/calendar; charset=utf-8`, `Content-Disposition: inline; filename="wedo.ics"`, `Cache-Control: private, max-age=900`, `ETag` = `"<sha256 hex của nội dung>"`, `X-Robots-Tag: noindex`; `If-None-Match` trùng → 304; `lastFetchedAt` ghi tối đa 10 phút một lần.
- **Giới hạn tần suất:** POST/DELETE `/calendar-feed` 10/phút/người; GET `/calendar-feed/:tep` 30/phút theo mã + 600/phút/IP.
- **Mã lỗi:** `CALENDAR_FEED_NOT_IN_PLAN` (403), dịch ở web `src/i18n/loi.ts` và câu lỗi app.
- **Backend lint đầy đủ = 0:** `npm run lint -- --max-warnings 0` (không `any`, request đã đăng nhập dùng `YeuCauDaXacThuc`), `npx tsc --noEmit -p tsconfig.json`, `npx jest`, `npm run test:ops`, `npm run build` xanh. Chạy `npx eslint <thư mục> --fix` trước khi kiểm lint (prettier chỉ đổi khoảng trắng).
- **Web song ngữ:** mọi chữ giao diện trong `src/i18n/tu-dien` đủ vi + en; `npm run kiem-dich` = 0 (cả `npx tsx scripts/kiem-chuoi-chua-dich.ts --ca-ts`), `npm run lint`, toàn bộ `tsx --test`, `npm run build` sạch. Web không thêm thư viện.
- **Dấu vân tay OTA Android không đổi:** app không sửa `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `eas.json`, không thêm thư viện; `npx expo-updates fingerprint:generate --platform android` ở checkout thật của `main` phải ra `82cd990037afe065754c48a9a004f293c0d84be9`.
- **iPhone:** app ẩn hẳn mục và màn đồng bộ lịch khi `Platform.OS === 'ios'`; không có nút mua/nâng cấp trong app ở mọi nền tảng.
- **Commit:** tiền tố conventional + tiếng Việt KHÔNG dấu + dòng trống + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (dùng hai `-m`). Không `--no-verify`. Git máy có `core.autocrlf=true`: commit bằng `git -c core.autocrlf=false commit …`, không dùng `git checkout <tệp>` để hoàn tác.
- **Chữ giao diện, chữ trong lịch và bình luận:** tiếng Việt CÓ dấu, NFC (bình luận giải thích *vì sao*). Công cụ ghi tệp từng biến `\uXXXX` thành ký tự thật — kiểm lại bằng `od -c`/`xxd` sau khi ghi regex có escape.
- **Không gọi production hay dịch vụ ngoài.** KHÔNG chép `.env` backend vào worktree; kiểm thử backend dùng Prisma giả. Không chạy dev server web trỏ API thật.
- **Không push, không deploy, không `eas update`.** Chủ dự án làm (mục "Execution order and deploy").
- **Repo mobile:** không chạy `npx expo lint`; `render`/`fireEvent`/`act` của RNTL v14 luôn `await`; tệp kiểm thử KHÔNG đặt dưới `src/app/(tabs)/`; thêm màn expo-router mới thì sinh lại `.expo/types/router.d.ts` (chạy dev server một lần) — xoá tệp màn thì tsc báo sạch giả.
- **Worktree mobile có junction `node_modules`:** KHÔNG BAO GIỜ `Remove-Item -Recurse` hay `git worktree remove` khi junction còn; luôn `cmd /c rmdir D:\WEDO_PC\wt\mb-lich\node_modules` trước.

## Hợp đồng giữa các phần (tên và kiểu dùng chung — mọi task phải dùng đúng)

**Backend `src/lich-dong-bo/`:**
```ts
// hang-so.ts
export const NGAY_TRUOC = 30;
export const NGAY_SAU = 180;
export const TOI_DA_MUC = 2000;
export const PHUT_HAN = 30;
export const PHUT_HOP_MAC_DINH = 60;
export const DO_DAI_MO_TA = 1000;
export const GOC_WEB = 'https://wedofpt.com.vn';
export const GOC_LINK_MAC_DINH = 'https://wedofpt.com.vn/lich';
export const MA_HOP_LE = /^[A-Za-z0-9_-]{43}$/;
export const TEP_HOP_LE = /^([A-Za-z0-9_-]{43})\.ics$/;
export const PHUT_GHI_LAN_LAY = 10;
export type NgonNguLich = 'vi' | 'en';

// ics.ts — thuần, không phụ thuộc Nest/Prisma
export interface MucLich { uid: string; batDau: Date; ketThuc: Date; caNgay?: boolean; tieuDe: string; moTa: string; url: string; capNhatLuc: Date; }
export interface LichIcs { ten: string; mucs: MucLich[]; }
export function thoatChuIcs(chu: string): string;
export function gapDongIcs(dong: string): string;      // trả các dòng đã gập nối bằng CRLF
export function gioUtcIcs(luc: Date): string;          // YYYYMMDDTHHMMSSZ
export function ngayIcs(luc: Date): string;            // YYYYMMDD theo giờ VN (cho mục cả ngày)
export function vietIcs(lich: LichIcs): string;        // toàn bộ VCALENDAR, kết thúc bằng CRLF

// muc-lich.ts — thuần
export type MucNguon = /* đúng phần tử mảng của EventsService.layMucLichTheoWorkspace */;
export function doiSangMucLich(muc: MucNguon, lang: NgonNguLich): MucLich;
export function mucTamDung(lang: NgonNguLich, bayGio: Date): MucLich;
export function tenLich(hoTen: string): string;        // `WeDo · ${hoTen}`

// pham-vi-goi.ts
export async function workspaceDuocDongBo(prisma: PrismaService, userId: string, bayGio: Date): Promise<string[]>;

// lich-dong-bo.errors.ts
export const MA_LOI_NGOAI_GOI = 'CALENDAR_FEED_NOT_IN_PLAN';
export function loiNgoaiGoi(): ForbiddenException; // body { statusCode: 403, code: 'CALENDAR_FEED_NOT_IN_PLAN', message: 'Đồng bộ lịch dành cho gói Pro và Team.' }

// lich-dong-bo.service.ts
export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null; }
export class LichDongBoService {
  layTrangThai(userId: string): Promise<TrangThaiDongBoLich>;
  taoHoacDoiLink(userId: string, lang: NgonNguLich): Promise<TrangThaiDongBoLich>;
  tatDongBo(userId: string): Promise<void>;
  layTepLich(token: string, bayGio?: Date): Promise<{ noiDung: string; etag: string } | null>;
}
```
**Backend `src/events/events.service.ts`:** thêm `layMucLichTheoWorkspace(userId: string, workspaceIds: string[], from: Date, to: Date)` trả mảng giống hệt mảng `findCalendarItems` đang trả (cùng thứ tự sắp xếp); `findCalendarItems` gọi lại nó với `[workspaceId]`. Thêm `updatedAt` vào `select` của task và meeting (event đã `include` đủ) — đây là trường THÊM trong `task`/`meeting` lồng nhau, không đổi trường cũ.

**Web:**
```ts
// src/lib/api.ts
export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null; }
api.layDongBoLich(): Promise<TrangThaiDongBoLich>;
api.taoLinkDongBoLich(lang: 'vi' | 'en'): Promise<TrangThaiDongBoLich>;
api.tatDongBoLich(): Promise<void>;
// src/lib/dong-bo-lich.ts
export function linkThemGoogle(url: string): string;   // https://calendar.google.com/calendar/render?cid=<encodeURIComponent(url)>
export function linkWebcal(url: string): string;       // đổi https:/http: thành webcal:
// src/i18n/tu-dien/dong-bo-lich.ts → export const tuDienDongBoLich
// src/components/lich/DongBoLichDialog.tsx → export function DongBoLichDialog({ onClose }: { onClose: () => void })
```
**Mobile:**
```ts
// src/lib/api/dong-bo-lich.ts
export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null; }
export function layDongBoLich(): Promise<TrangThaiDongBoLich>;
export function taoLinkDongBoLich(): Promise<TrangThaiDongBoLich>;   // gửi { lang: 'vi' }
export function tatDongBoLich(): Promise<void>;
export function cauLoiDongBoLich(loi: unknown): string;
```


**Bổ sung đã chốt khi viết chi tiết (đã chạy thử trên bản sao mã thật):**
- Backend: `pham-vi-goi.ts` có thêm `phamViDongBo(prisma, userId, bayGio): Promise<{ coGoi: boolean; workspaceIds: string[] }>` — người có Pro nhưng chưa ở workspace nào vẫn `duocDung = true` và nhận lịch rỗng, không nhận mục "tạm dừng". `workspaceDuocDongBo` giữ đúng chữ ký, gọi lại hàm này. Thân `POST /calendar-feed` có `lang` không bắt buộc (mặc định `vi`); POST trả 200. "Tạo link mới" đặt lại `createdAt` và xoá `lastFetchedAt`. Tên tệp thêm: `dto/tao-link-dong-bo-lich.dto.ts`, `loi-tep-lich.ts`, `lich-dong-bo.controller.ts`, `lich-dong-bo.module.ts`. Luật giới hạn tần suất có thêm trường `khoaRieng`.
- Web: `DongBoLichDialog({ onClose, onNangCap? })` (không truyền `onNangCap` thì đổi `location.hash` sang `#/upgrade`; "Nâng cấp gói" khi đã đăng nhập đi tới màn `upgrade`, không phải `#/pricing` công khai). Phần vẽ thuần tách sang `src/components/lich/NoiDungDongBoLich.tsx` để kiểm bằng `renderToStaticMarkup` dưới node:test. `src/lib/dong-bo-lich.ts` có thêm `khoangDaQua`, `chonManDongBoLich`, `MA_LOI_NGOAI_GOI`, `laLoiNgoaiGoi`. Gói Team trên bảng giá cũng có dòng "Đồng bộ lịch" (chủ dự án quyết 03/10/2026).
- Mobile: màn `src/app/account/calendar-sync.tsx` (đường `/account/calendar-sync`, cùng chỗ các màn tài khoản khác, ngoài `(tabs)`); gói Miễn phí chỉ hiện "Tính năng của gói Pro và Team." (chủ dự án quyết bỏ vế "nâng cấp trên web" vì chính sách Google Play).
- **Lệnh chạy toàn bộ test web:** `npx tsx --test $(git ls-files 'src/*.test.ts' 'src/*.test.tsx')` — pathspec `'src/**/*.test.ts'` của git bỏ sót các tệp nằm thẳng trong `src/` (ví dụ `trang-cong-khai.test.ts`).
- **Worktree backend** tạo bằng `git -c core.autocrlf=false worktree add …` để mã nguồn là LF (bài `ten-tep.spec.ts` đòi không có `\r`).

---

## Backend

### File Structure — Backend

Worktree `D:\WEDO_PC\wt\be-lich`, nhánh `feat/dong-bo-lich` từ `origin/backend` (đỉnh lúc viết kế hoạch: `69ffb70 Merge pull request #4 … feat/bao-cao-dong-gop-backend`).

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `prisma/schema.prisma` | Sửa | Thêm `calendarFeed CalendarFeed?` vào `User` (sau dòng 216) và model `CalendarFeed` cuối tệp (`@@map("calendar_feeds")`) |
| `prisma/migrations/202610030001_calendar_feeds/migration.sql` | Tạo | Chỉ `CREATE TABLE` + 2 `CREATE UNIQUE INDEX` + 1 khoá ngoại `ON DELETE CASCADE` — đúng bản `prisma migrate diff` sinh ra |
| `src/lich-dong-bo/migration-calendar-feeds.spec.ts` | Tạo | Khẳng định migration chỉ thêm, chạy sau mọi migration cũ, schema khai đúng model |
| `src/lich-dong-bo/hang-so.ts` | Tạo | Hằng số của hợp đồng (`NGAY_TRUOC`, `TOI_DA_MUC`, `MA_HOP_LE`, `TEP_HOP_LE`, …) và `NgonNguLich` |
| `src/lich-dong-bo/ics.ts` (+ `ics.spec.ts`) | Tạo | Bộ viết RFC 5545 thuần: `thoatChuIcs`, `gapDongIcs`, `gioUtcIcs`, `ngayIcs`, `vietIcs` |
| `src/events/events.service.ts` | Sửa | Tách `layMucLichTheoWorkspace(userId, workspaceIds, from, to)`; `findCalendarItems` gọi lại với `[workspaceId]`; thêm `updatedAt` vào `select` của task và meeting |
| `src/events/events.service.spec.ts` | Sửa | Thêm bài giữ hành vi màn Lịch (viết trước khi tách) và bài cho hàm mới |
| `src/events/events.module.ts` | Sửa | `exports: [EventsService]` |
| `src/lich-dong-bo/muc-lich.ts` (+ spec) | Tạo | `MucNguon`, `doiSangMucLich` (bảng 2.3, vi/en), `mucTamDung`, `tenLich` |
| `src/lich-dong-bo/pham-vi-goi.ts` (+ spec) | Tạo | `phamViDongBo` (thêm, xem ghi chú dưới), `workspaceDuocDongBo` — đọc thẳng `Subscription`, chỉ đọc |
| `src/lich-dong-bo/lich-dong-bo.errors.ts` | Tạo | `MA_LOI_NGOAI_GOI`, `loiNgoaiGoi()` (403 `CALENDAR_FEED_NOT_IN_PLAN`) |
| `src/lich-dong-bo/lich-dong-bo.service.ts` (+ spec) | Tạo | `LichDongBoService`: trạng thái, tạo/đổi/tắt link, dựng tệp lịch + ETag, ghi `lastFetchedAt` tối đa 10 phút một lần |
| `.env.example` | Sửa | Ghi chú `CALENDAR_FEED_BASE_URL` (không bắt buộc) |
| `src/lich-dong-bo/dto/tao-link-dong-bo-lich.dto.ts` | Tạo | `TaoLinkDongBoLichDto { lang?: 'vi' | 'en' }` |
| `src/lich-dong-bo/loi-tep-lich.ts` (+ spec) | Tạo | `chuLoiTepLich`, `LoiTepLichFilter` (404/429/500 dạng chữ ngắn, 5xx gửi Sentry) |
| `src/lich-dong-bo/lich-dong-bo.controller.ts` | Tạo | `khopEtag`, `LichDongBoController` (GET/POST/DELETE `/calendar-feed`), `TepLichController` (GET `/calendar-feed/:tep`) |
| `src/lich-dong-bo/lich-dong-bo.http.spec.ts` | Tạo | Hợp đồng HTTP qua ValidationPipe + middleware nền tảng như `main.ts`, JwtStrategy thật, service thật |
| `src/lich-dong-bo/lich-dong-bo.module.ts`, `src/app.module.ts` | Tạo/Sửa | Đăng ký `LichDongBoModule` sau `BaoCaoDongGopModule` |
| `src/common/request-rate-limit.guard.ts` (+ `.spec.ts`) | Sửa | Trường `khoaRieng`; 30/phút theo mã + 600/phút/IP cho `GET /calendar-feed/:tep`; 10/phút/người cho `POST`/`DELETE /calendar-feed` |

Ghi chú về hợp đồng: `pham-vi-goi.ts` có thêm `phamViDongBo(prisma, userId, bayGio): Promise<{ coGoi: boolean; workspaceIds: string[] }>` bên cạnh `workspaceDuocDongBo` (giữ nguyên chữ ký). Lý do: người có Pro cá nhân mà chưa ở workspace nào thì `workspaceDuocDongBo` trả `[]`, nhưng họ vẫn đã trả tiền — `duocDung` phải là `true` và lịch phải rỗng chứ không phải mục "tạm dừng vì hết gói". Service dùng `phamViDongBo`; `workspaceDuocDongBo` là lớp mỏng gọi lại nó.

---

Mọi lệnh trong phần này chạy trong `D:\WEDO_PC\wt\be-lich` bằng Git Bash (công cụ Bash), trừ khi ghi khác. Kiểm thử một tệp: `npx jest <đường dẫn>`; lint một thư mục: `npx eslint <thư mục> --max-warnings 0`. Mã trong kế hoạch đã chạy qua prettier của repo; vẫn chạy `npx eslint <thư mục> --fix` trước bước kiểm lint nếu có lệch khoảng trắng.

**Ghi tệp:** dùng công cụ Write/Edit, KHÔNG dùng heredoc của Bash — heredoc trên máy này đã nuốt mất một nửa số dấu `\` khi viết thử kế hoạch (`/\\/g` thành `/\/g`). Sau khi ghi `ics.ts`, `ics.spec.ts`, `request-rate-limit.guard.ts` chạy `grep -n 'replace(/' src/lich-dong-bo/ics.ts` và đối chiếu từng dấu `\` với kế hoạch.

### Task R0: Tạo worktree backend và kiểm mốc xuất phát

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: `origin/backend` (đỉnh `69ffb70`).
- Produces: worktree `D:\WEDO_PC\wt\be-lich` trên nhánh `feat/dong-bo-lich`, `node_modules` riêng (KHÔNG junction), Prisma Client đã sinh.

- [ ] **Step 1: Tạo worktree với xuống dòng LF và cài thư viện**

```bash
git -C D:/WEDO_PC/BE_WEDO fetch origin
git -C D:/WEDO_PC/BE_WEDO -c core.autocrlf=false worktree add D:/WEDO_PC/wt/be-lich -b feat/dong-bo-lich origin/backend
cd D:/WEDO_PC/wt/be-lich && npm ci && npx prisma generate
git log --oneline -1
ls .env 2>&1
git status --short | head
```

Expected: `npm ci` xong (postinstall tự chạy `prisma generate`), lệnh `prisma generate` in "Generated Prisma Client (v7.8.0)"; `git log` in `69ffb70 Merge pull request #4 from dailhse184118-commits/feat/bao-cao-dong-gop-backend` (hoặc mới hơn nếu `origin/backend` đã tiến — ghi lại đỉnh thật); `ls .env` → "No such file"; `git status` rỗng. KHÔNG chép `.env`, KHÔNG tạo junction `node_modules`.

Vì sao `-c core.autocrlf=false`: Git trên máy để `core.autocrlf=true` ở cấp hệ thống, nên worktree thường ra CRLF — và bài `src/bao-cao-dong-gop/ten-tep.spec.ts › mã nguồn viết dải dấu kết hợp bằng escape…` đòi mã nguồn không có `\r`, sẽ đỏ ngay từ mốc. Cờ chỉ áp cho lần checkout này, không sửa cấu hình chung của repo.

- [ ] **Step 2: Kiểm mốc xanh trước khi sửa**

```bash
npx tsc --noEmit -p tsconfig.json && npx jest && npm run lint -- --max-warnings 0 && npm run test:ops
```

Expected: cả bốn sạch (`*.integration.spec.ts` tự bỏ qua — jest in "6 skipped"). Nếu chỉ `ten-tep.spec.ts` đỏ vì `\r`: worktree đã ra CRLF — `cd D:/WEDO_PC && git -C D:/WEDO_PC/BE_WEDO worktree remove --force D:/WEDO_PC/wt/be-lich && git -C D:/WEDO_PC/BE_WEDO branch -D feat/dong-bo-lich` (`node_modules` ở đây là thư mục thật, không phải junction) rồi làm lại Step 1 đúng lệnh. Đỏ chỗ khác thì dừng và báo người giao việc — không sửa lỗi có sẵn trong task này. Không commit.

---

### Task R1: Bảng `calendar_feeds` — model và migration chỉ thêm

**Files:**
- Modify: `prisma/schema.prisma` (model `User` sau dòng 216; cuối tệp sau model `AdminAuditLog`, dòng 1030)
- Create: `prisma/migrations/202610030001_calendar_feeds/migration.sql`
- Test: `src/lich-dong-bo/migration-calendar-feeds.spec.ts`

**Interfaces:**
- Consumes: không.
- Produces: model Prisma `CalendarFeed { id, userId @unique, token @unique, language @default("vi"), createdAt, lastFetchedAt? , user }` → bảng `calendar_feeds`; quan hệ ngược `User.calendarFeed CalendarFeed?`; Prisma Client có `prisma.calendarFeed` (dùng ở R6).

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lich-dong-bo/migration-calendar-feeds.spec.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Bảng `calendar_feeds` lên production qua cổng "Block destructive database
 * changes" của workflow deploy: cổng đó chỉ cho đi tự động khi thay đổi ở
 * `prisma/` toàn là THÊM. Bộ kiểm thử này giữ migration đúng như thế — chỉ tạo
 * bảng mới, chỉ mục trên bảng mới và khoá ngoại từ bảng mới — để không ai lỡ
 * tay nhét thêm một câu sửa bảng đang có dữ liệu vào cùng đợt.
 */
const THU_MUC = join(__dirname, '..', '..', 'prisma', 'migrations');
const TEN = '202610030001_calendar_feeds';
const SQL = readFileSync(join(THU_MUC, TEN, 'migration.sql'), 'utf8');

/** Câu lệnh SQL thật, bỏ chú thích và dòng trống, gộp khoảng trắng. */
const cauLenh = SQL.split(/\r?\n/)
  .filter((dong) => !dong.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((cau) => cau.replace(/\s+/g, ' ').trim())
  .filter(Boolean);

describe(`migration ${TEN} — chỉ thêm bảng calendar_feeds`, () => {
  it('chạy sau mọi migration đã có', () => {
    const tatCa = readdirSync(THU_MUC, { withFileTypes: true })
      .filter((muc) => muc.isDirectory())
      .map((muc) => muc.name)
      .sort();
    expect(tatCa[tatCa.length - 1]).toBe(TEN);
  });

  it('đúng bốn câu: tạo bảng, hai chỉ mục duy nhất, một khoá ngoại', () => {
    expect(cauLenh).toHaveLength(4);
    expect(cauLenh[0]).toMatch(/^CREATE TABLE "calendar_feeds" \(/);
    expect(cauLenh[1]).toBe(
      'CREATE UNIQUE INDEX "calendar_feeds_userId_key" ON "calendar_feeds"("userId")',
    );
    expect(cauLenh[2]).toBe(
      'CREATE UNIQUE INDEX "calendar_feeds_token_key" ON "calendar_feeds"("token")',
    );
    expect(cauLenh[3]).toBe(
      'ALTER TABLE "calendar_feeds" ADD CONSTRAINT "calendar_feeds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
  });

  it('bảng có đủ cột của spec 3.1, mã và ngôn ngữ không được rỗng', () => {
    expect(cauLenh[0]).toContain('"token" TEXT NOT NULL');
    expect(cauLenh[0]).toContain('"language" TEXT NOT NULL DEFAULT \'vi\'');
    expect(cauLenh[0]).toContain('"lastFetchedAt" TIMESTAMP(3),');
  });

  it('không xoá, đổi tên, sửa bảng khác hay viết lại dữ liệu nào', () => {
    for (const cau of cauLenh) {
      expect(cau).not.toMatch(/\b(DROP|RENAME|TRUNCATE)\b/i);
      expect(cau).not.toMatch(/^(UPDATE|DELETE|INSERT)\b/i);
      if (cau.startsWith('ALTER TABLE')) {
        expect(cau).toMatch(/^ALTER TABLE "calendar_feeds" ADD CONSTRAINT /);
      }
    }
  });

  it('schema.prisma khai đúng model, tên bảng và quan hệ ngược ở User', () => {
    const schema = readFileSync(
      join(__dirname, '..', '..', 'prisma', 'schema.prisma'),
      'utf8',
    );
    expect(schema).toMatch(
      /model CalendarFeed \{[^}]*@@map\("calendar_feeds"\)/,
    );
    expect(schema).toMatch(
      /user User @relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
    );
    expect(schema).toMatch(/^\s+calendarFeed\s+CalendarFeed\?\s*$/m);
  });
});
```

Run: `npx jest src/lich-dong-bo/migration-calendar-feeds.spec.ts`
Expected: FAIL — "ENOENT: no such file or directory, open '…202610030001_calendar_feeds\migration.sql'".

- [ ] **Step 2: Sửa schema**

Trong `prisma/schema.prisma`, model `User`, thêm đúng một dòng ngay sau `  projectInvites             ProjectInvite[]` (dòng 216), căn cột như các dòng quanh nó:

```prisma
  calendarFeed               CalendarFeed?
```

Thêm cuối tệp (sau dấu `}` đóng `model AdminAuditLog`, giữ một dòng trống ở giữa):

```prisma
/// Link đồng bộ lịch (iCalendar) của một người: Google Calendar, Lịch Apple,
/// Outlook lấy `/calendar-feed/<token>.ics` theo định kỳ. Mỗi người tối đa một
/// dòng. `token` lưu NGUYÊN VĂN (không băm) để lúc nào cũng hiện lại được link;
/// ai đọc được bảng này thì đã đọc được chính lịch và việc, băm không thêm an
/// toàn đáng kể. Tạo link mới là ghi đè `token` (link cũ chết ngay); tắt đồng
/// bộ là xoá dòng.
model CalendarFeed {
  id            String    @id @default(uuid())
  userId        String    @unique
  token         String    @unique
  language      String    @default("vi")
  createdAt     DateTime  @default(now())
  lastFetchedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_feeds")
}
```

KHÔNG chạy `prisma format` (không cần, và nó có thể căn lại cột của các dòng cũ).

- [ ] **Step 3: Viết migration**

`prisma/migrations/202610030001_calendar_feeds/migration.sql`:

```sql
-- Link dong bo lich (iCalendar) sang Google Calendar, Lich Apple, Outlook.
-- Spec 03/10/2026 (docs/superpowers/specs/2026-10-03-dong-bo-lich-design.md).
--
-- Chi THEM MOI: mot bang moi, hai chi muc duy nhat, mot khoa ngoai. Khong doi
-- hay xoa cot nao, nen ban Android 1.0.13/1.0.14, iOS 1.0.14 va web dang chay
-- khong bi anh huong. Bang moi rong nen tao chi muc va khoa ngoai la tuc thi.
-- Xoa tai khoan thi dong cua nguoi do xoa theo (ON DELETE CASCADE), link 404.

-- CreateTable
CREATE TABLE "calendar_feeds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFetchedAt" TIMESTAMP(3),

    CONSTRAINT "calendar_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_feeds_userId_key" ON "calendar_feeds"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_feeds_token_key" ON "calendar_feeds"("token");

-- AddForeignKey
ALTER TABLE "calendar_feeds" ADD CONSTRAINT "calendar_feeds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 4: Sinh client, đối chiếu với bản Prisma tự sinh, chạy lại bài kiểm**

```bash
npx prisma generate
git show origin/backend:prisma/schema.prisma > "$TEMP/schema-goc.prisma"
PRISMA_HIDE_UPDATE_MESSAGE=1 npx prisma migrate diff --from-schema "$TEMP/schema-goc.prisma" --to-schema prisma/schema.prisma --script 2>/dev/null > "$TEMP/lich-diff.sql"
diff <(grep -v '^--' prisma/migrations/202610030001_calendar_feeds/migration.sql | grep -v '^\s*$') <(grep -v '^--' "$TEMP/lich-diff.sql" | grep -v '^\s*$' | grep -v '[│┌└]') && echo "KHOP VOI PRISMA"
npx jest src/lich-dong-bo/migration-calendar-feeds.spec.ts
npx tsc --noEmit -p tsconfig.json
```

Expected: "Generated Prisma Client (v7.8.0)"; `diff` không in gì và in `KHOP VOI PRISMA` (`migrate diff` so hai tệp schema, không cần cơ sở dữ liệu); jest PASS (5 bài); tsc sạch.

- [ ] **Step 5: Tự chạy đúng cổng "Block destructive database changes" của workflow**

```bash
git add -N prisma/migrations/202610030001_calendar_feeds/migration.sql
git diff -w origin/backend -- prisma/schema.prisma prisma/migrations prisma.config.ts | grep '^-[^-]' || echo "KHONG CO DONG NAO BI GO"
git diff --name-only --diff-filter=D origin/backend -- prisma || true
git diff --stat origin/backend -- prisma
```

Expected: in `KHONG CO DONG NAO BI GO`; lệnh thứ hai không in gì; `--stat` chỉ có `prisma/schema.prisma` (+21 dòng) và `prisma/migrations/202610030001_calendar_feeds/migration.sql`.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/202610030001_calendar_feeds/migration.sql src/lich-dong-bo/migration-calendar-feeds.spec.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): bang calendar_feeds, migration chi them" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R2: Hằng số và bộ viết iCalendar RFC 5545

**Files:**
- Create: `src/lich-dong-bo/hang-so.ts`
- Create: `src/lich-dong-bo/ics.ts`
- Test: `src/lich-dong-bo/ics.spec.ts`

**Interfaces:**
- Consumes: không (thuần, không nhập Nest/Prisma).
- Produces (đúng hợp đồng):
  - `hang-so.ts`: `NGAY_TRUOC = 30`, `NGAY_SAU = 180`, `TOI_DA_MUC = 2000`, `PHUT_HAN = 30`, `PHUT_HOP_MAC_DINH = 60`, `DO_DAI_MO_TA = 1000`, `GOC_WEB`, `GOC_LINK_MAC_DINH`, `MA_HOP_LE`, `TEP_HOP_LE`, `PHUT_GHI_LAN_LAY = 10`, `type NgonNguLich = 'vi' | 'en'`
  - `ics.ts`: `interface MucLich { uid; batDau; ketThuc; caNgay?; tieuDe; moTa; url; capNhatLuc }`, `interface LichIcs { ten; mucs }`, `thoatChuIcs(chu): string`, `gapDongIcs(dong): string`, `gioUtcIcs(luc): string`, `ngayIcs(luc): string`, `vietIcs(lich): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lich-dong-bo/ics.spec.ts`:

```ts
import {
  gapDongIcs,
  gioUtcIcs,
  ngayIcs,
  thoatChuIcs,
  vietIcs,
  type LichIcs,
  type MucLich,
} from './ics';

const SU_KIEN: MucLich = {
  uid: 'event-e1@wedofpt.com.vn',
  batDau: new Date('2026-10-05T02:00:00Z'),
  ketThuc: new Date('2026-10-05T03:30:00Z'),
  tieuDe: 'Ôn thi, giữa kỳ; PRJ301',
  moTa: 'Phòng 304\nMở trong WeDo: https://wedofpt.com.vn/#/calendar',
  url: 'https://wedofpt.com.vn/#/calendar',
  capNhatLuc: new Date('2026-10-01T08:15:30.123Z'),
};

const CA_NGAY: MucLich = {
  uid: 'tam-dung@wedofpt.com.vn',
  // 00:00 ngày 03/10 giờ Việt Nam tới 00:00 ngày 04/10.
  batDau: new Date('2026-10-02T17:00:00Z'),
  ketThuc: new Date('2026-10-03T17:00:00Z'),
  caNgay: true,
  tieuDe: 'Tạm dừng',
  moTa: 'Gia hạn',
  url: 'https://wedofpt.com.vn/#/pricing',
  capNhatLuc: new Date('2026-10-02T17:00:00Z'),
};

/**
 * Bộ đọc iCalendar tối giản, chỉ để kiểm cấu trúc tệp vừa viết: mở gập dòng,
 * mọi dòng có dạng TÊN[;THAM SỐ]:GIÁ TRỊ, BEGIN/END lồng đúng, tệp kết thúc
 * bằng CRLF. Trả phần đầu lịch và từng VEVENT dưới dạng bảng tên → giá trị.
 */
function docIcs(noiDung: string) {
  const dong = noiDung.replace(/\r\n[ \t]/g, '').split('\r\n');
  expect(dong.pop()).toBe('');
  expect(dong[0]).toBe('BEGIN:VCALENDAR');
  const ngan: string[] = [];
  const dauLich: Record<string, string> = {};
  const suKien: Record<string, string>[] = [];
  let hienTai: Record<string, string> | null = null;
  for (const d of dong) {
    const hai = d.indexOf(':');
    expect(hai).toBeGreaterThan(0);
    const ten = d.slice(0, hai);
    const giaTri = d.slice(hai + 1);
    expect(ten).toMatch(/^[A-Z-]+(;[A-Z-]+=[^;:]+)*$/);
    if (ten === 'BEGIN') {
      ngan.push(giaTri);
      if (giaTri === 'VEVENT') hienTai = {};
    } else if (ten === 'END') {
      expect(ngan.pop()).toBe(giaTri);
      if (giaTri === 'VEVENT' && hienTai) {
        suKien.push(hienTai);
        hienTai = null;
      }
    } else {
      (hienTai ?? dauLich)[ten] = giaTri;
    }
  }
  expect(ngan).toEqual([]);
  return { dauLich, suKien };
}

/** Ngược của `thoatChuIcs` (trừ NFC và ký tự điều khiển). */
const moThoat = (chu: string) =>
  chu.replace(/\\([\\;,nN])/g, (_toanBo, kt: string) =>
    kt === 'n' || kt === 'N' ? '\n' : kt,
  );

describe('thoatChuIcs', () => {
  it('thoát gạch chéo ngược, chấm phẩy, phẩy; mọi kiểu xuống dòng thành \\n', () => {
    expect(thoatChuIcs('a\\b;c,d\ne\r\nf\rg')).toBe(
      'a\\\\b\\;c\\,d\\ne\\nf\\ng',
    );
  });

  it('chữ có dấu gõ dạng tổ hợp (NFD) ra dạng dựng sẵn (NFC)', () => {
    const nfd = 'Hạn chót Đồ án'.normalize('NFD');
    expect(nfd).not.toBe('Hạn chót Đồ án');
    expect(thoatChuIcs(nfd)).toBe('Hạn chót Đồ án');
  });

  it('bỏ ký tự điều khiển, giữ tab', () => {
    const chuong = String.fromCharCode(7);
    const xoa = String.fromCharCode(0x7f);
    expect(thoatChuIcs(`a${chuong}b\tc${xoa}`)).toBe('ab\tc');
  });
});

describe('gapDongIcs', () => {
  it('dòng ngắn giữ nguyên', () => {
    expect(gapDongIcs('SUMMARY:Họp nhóm')).toBe('SUMMARY:Họp nhóm');
  });

  it('chữ ASCII: 212 byte thành 75 + (1 + 74) + (1 + 63)', () => {
    const dong = `DESCRIPTION:${'x'.repeat(200)}`;
    const gap = gapDongIcs(dong).split('\r\n');
    expect(gap.map((d) => Buffer.byteLength(d))).toEqual([75, 75, 64]);
    expect(gap.slice(1).every((d) => d.startsWith(' '))).toBe(true);
    expect(gapDongIcs(dong).replace(/\r\n /g, '')).toBe(dong);
  });

  it('chữ có dấu 3 byte không bị cắt đôi: dòng dừng ở 74 byte thay vì 75', () => {
    const dong = `SUMMARY:${'ệ'.repeat(50)}`;
    expect(gapDongIcs(dong).split('\r\n')).toEqual([
      `SUMMARY:${'ệ'.repeat(22)}`, // 8 + 66 = 74 byte; thêm một "ệ" là 77
      ` ${'ệ'.repeat(24)}`, // 1 + 72 = 73 byte
      ` ${'ệ'.repeat(4)}`,
    ]);
  });

  it('emoji 4 byte (cặp UTF-16) cũng không bị cắt đôi', () => {
    const dong = `SUMMARY:${'🚀'.repeat(30)}`;
    const gap = gapDongIcs(dong).split('\r\n');
    expect(gap[0]).toBe(`SUMMARY:${'🚀'.repeat(16)}`); // 8 + 64 = 72 byte
    expect(gap[1]).toBe(` ${'🚀'.repeat(14)}`);
  });

  it('văn bản tiếng Việt dài: không dòng nào quá 75 byte, mở gập ra đúng chuỗi cũ', () => {
    const dong = `DESCRIPTION:${'Đồ án tốt nghiệp — chương “Thiết kế” '.repeat(12)}`;
    const gap = gapDongIcs(dong);
    for (const d of gap.split('\r\n')) {
      expect(Buffer.byteLength(d, 'utf8')).toBeLessThanOrEqual(75);
      // Ký tự bị cắt giữa chừng sẽ thành ký tự thay thế khi mã hoá rồi giải mã lại.
      expect(Buffer.from(d, 'utf8').toString('utf8')).toBe(d);
    }
    expect(gap.replace(/\r\n /g, '')).toBe(dong);
  });
});

describe('giờ', () => {
  it('gioUtcIcs: YYYYMMDDTHHMMSSZ theo UTC, bỏ phần nghìn giây', () => {
    expect(gioUtcIcs(new Date('2026-10-01T08:15:30.123Z'))).toBe(
      '20261001T081530Z',
    );
  });

  it('ngayIcs: theo ngày Việt Nam — 17:00 UTC đã là ngày hôm sau', () => {
    expect(ngayIcs(new Date('2026-10-02T16:59:59Z'))).toBe('20261002');
    expect(ngayIcs(new Date('2026-10-02T17:00:00Z'))).toBe('20261003');
  });
});

describe('vietIcs', () => {
  const LICH: LichIcs = { ten: 'WeDo · Lê Hữu Đại', mucs: [SU_KIEN, CA_NGAY] };

  it('đúng từng dòng của phần đầu và một sự kiện có giờ', () => {
    expect(vietIcs({ ten: LICH.ten, mucs: [SU_KIEN] })).toBe(
      [
        'BEGIN:VCALENDAR',
        'PRODID:-//WeDo//Dong bo lich//VI',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:WeDo · Lê Hữu Đại',
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H',
        'BEGIN:VEVENT',
        'UID:event-e1@wedofpt.com.vn',
        'DTSTAMP:20261001T081530Z',
        'LAST-MODIFIED:20261001T081530Z',
        'DTSTART:20261005T020000Z',
        'DTEND:20261005T033000Z',
        'SUMMARY:Ôn thi\\, giữa kỳ\\; PRJ301',
        'DESCRIPTION:Phòng 304\\nMở trong WeDo: https://wedofpt.com.vn/#/calendar',
        'URL:https://wedofpt.com.vn/#/calendar',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );
  });

  it('mục cả ngày viết VALUE=DATE theo ngày Việt Nam, ngày kết thúc không tính', () => {
    const noiDung = vietIcs({ ten: 'WeDo', mucs: [CA_NGAY] });
    expect(noiDung).toContain('\r\nDTSTART;VALUE=DATE:20261003\r\n');
    expect(noiDung).toContain('\r\nDTEND;VALUE=DATE:20261004\r\n');
  });

  it('chỉ xuống dòng bằng CRLF, kết thúc bằng CRLF, không có VALARM', () => {
    const noiDung = vietIcs(LICH);
    expect(noiDung.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(noiDung.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(noiDung).not.toContain('VALARM');
  });

  it('cùng dữ liệu thì cùng từng byte', () => {
    const banSao: LichIcs = {
      ten: LICH.ten,
      mucs: LICH.mucs.map((m) => ({
        ...m,
        batDau: new Date(m.batDau),
        ketThuc: new Date(m.ketThuc),
        capNhatLuc: new Date(m.capNhatLuc),
      })),
    };
    expect(Buffer.from(vietIcs(banSao))).toEqual(Buffer.from(vietIcs(LICH)));
  });

  it('đọc ngược được: cấu trúc hợp lệ, mã mục cố định, chữ về đúng như cũ', () => {
    const dai: MucLich = {
      ...SU_KIEN,
      uid: 'task-t9@wedofpt.com.vn',
      tieuDe: `Hạn: ${'Viết báo cáo, chương 3; phụ lục\\'.repeat(5)}`,
      moTa: 'Dòng một\nDòng hai, có phẩy; có chấm phẩy',
    };
    const { dauLich, suKien } = docIcs(
      vietIcs({ ten: LICH.ten, mucs: [dai, SU_KIEN, CA_NGAY] }),
    );

    expect(dauLich).toMatchObject({
      VERSION: '2.0',
      METHOD: 'PUBLISH',
      'X-WR-CALNAME': 'WeDo · Lê Hữu Đại',
    });
    expect(suKien.map((s) => s.UID)).toEqual([
      'task-t9@wedofpt.com.vn',
      'event-e1@wedofpt.com.vn',
      'tam-dung@wedofpt.com.vn',
    ]);
    expect(moThoat(suKien[0].SUMMARY)).toBe(dai.tieuDe);
    expect(moThoat(suKien[0].DESCRIPTION)).toBe(dai.moTa);
    for (const s of suKien) {
      expect(s.DTSTAMP).toMatch(/^\d{8}T\d{6}Z$/);
      expect(s.URL).toMatch(/^https:\/\/wedofpt\.com\.vn\/#\//);
    }
    expect(suKien[2]['DTSTART;VALUE=DATE']).toBe('20261003');
  });
});
```

Run: `npx jest src/lich-dong-bo/ics.spec.ts`
Expected: FAIL — "Cannot find module './ics'".

- [ ] **Step 2: Viết hằng số**

`src/lich-dong-bo/hang-so.ts`:

```ts
/** Lịch gồm các mục từ 30 ngày trước tới 180 ngày sau lúc lịch được lấy. */
export const NGAY_TRUOC = 30;
export const NGAY_SAU = 180;
/** Trần số mục của một tệp lịch; quá thì giữ các mục bắt đầu sớm nhất. */
export const TOI_DA_MUC = 2000;
/** Hạn chót hiện thành khối 30 phút KẾT THÚC đúng giờ hạn. */
export const PHUT_HAN = 30;
/** Cuộc họp chưa đặt giờ kết thúc thì coi như dài 60 phút. */
export const PHUT_HOP_MAC_DINH = 60;
/** Mô tả việc / chương trình họp / ghi chú cắt ở 1.000 ký tự. */
export const DO_DAI_MO_TA = 1000;
export const GOC_WEB = 'https://wedofpt.com.vn';
/** Gốc link trả cho người dùng khi không khai `CALENDAR_FEED_BASE_URL`. */
export const GOC_LINK_MAC_DINH = 'https://wedofpt.com.vn/lich';
/** Mã link: 32 byte ngẫu nhiên viết base64url, đúng 43 ký tự. */
export const MA_HOP_LE = /^[A-Za-z0-9_-]{43}$/;
/** Tên tệp ở đường công khai `GET /calendar-feed/:tep`. */
export const TEP_HOP_LE = /^([A-Za-z0-9_-]{43})\.ics$/;
/** `lastFetchedAt` chỉ ghi lại khi lần ghi trước đã cách quá 10 phút. */
export const PHUT_GHI_LAN_LAY = 10;
export type NgonNguLich = 'vi' | 'en';
```

- [ ] **Step 3: Viết bộ viết lịch**

`src/lich-dong-bo/ics.ts`:

```ts
/**
 * Bộ viết iCalendar (RFC 5545) tối giản cho link đồng bộ lịch. Thuần: không
 * phụ thuộc Nest hay Prisma, cùng đầu vào thì ra cùng từng byte (ETag dựa vào
 * điều đó để lịch của người dùng nhận 304 khi không có gì đổi).
 *
 * Không thêm thư viện: chỉ cần VCALENDAR + VEVENT, không lặp lại, không múi
 * giờ riêng (mọi giờ viết UTC), không báo thức.
 */

export interface MucLich {
  uid: string;
  batDau: Date;
  ketThuc: Date;
  /** Mục cả ngày: `batDau`/`ketThuc` là nửa đêm giờ Việt Nam, `ketThuc` không tính. */
  caNgay?: boolean;
  tieuDe: string;
  moTa: string;
  url: string;
  /** `updatedAt` của bản ghi gốc — làm DTSTAMP và LAST-MODIFIED. */
  capNhatLuc: Date;
}

export interface LichIcs {
  ten: string;
  mucs: MucLich[];
}

const CRLF = '\r\n';
const TRAN_BYTE_DONG = 75;
/*
  Việt Nam dùng UTC+7 quanh năm. Khai lại ở đây thay vì nhập `ngayVN` của
  src/common/ngay-vn.ts: tệp đó nhập @prisma/client, còn bộ viết lịch giữ
  thuần, không kéo Prisma vào.
*/
const LECH_VN_MS = 7 * 60 * 60 * 1000;

/** Bỏ ký tự điều khiển (RFC 5545 không cho trong TEXT), giữ dấu tab. */
function boKyTuDieuKhien(chu: string): string {
  let ra = '';
  for (const kt of chu) {
    const ma = kt.codePointAt(0) ?? 0;
    if ((ma < 0x20 && ma !== 0x09) || ma === 0x7f) continue;
    ra += kt;
  }
  return ra;
}

/**
 * Giá trị kiểu TEXT: chuẩn hoá NFC (chữ có dấu gõ dạng tổ hợp NFD thành một ký
 * tự), thoát `\`, `;`, `,` và đổi mọi kiểu xuống dòng thành `\n`.
 */
export function thoatChuIcs(chu: string): string {
  return boKyTuDieuKhien(
    chu
      .normalize('NFC')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n'),
  );
}

/**
 * Gập một dòng nội dung ở 75 BYTE UTF-8 (RFC 5545 mục 3.1). Dòng tiếp theo bắt
 * đầu bằng một dấu cách, nên chứa tối đa 74 byte nội dung. Cắt giữa hai ký tự,
 * không bao giờ giữa các byte của một ký tự có dấu ("ệ" 3 byte, emoji 4 byte):
 * `for…of` đi theo từng ký tự, không theo từng đơn vị UTF-16.
 */
export function gapDongIcs(dong: string): string {
  const doan: string[] = [];
  let hienTai = '';
  let soByte = 0;
  for (const kt of dong) {
    const byteKyTu = Buffer.byteLength(kt, 'utf8');
    const tran = doan.length === 0 ? TRAN_BYTE_DONG : TRAN_BYTE_DONG - 1;
    if (soByte + byteKyTu > tran) {
      doan.push(hienTai);
      hienTai = '';
      soByte = 0;
    }
    hienTai += kt;
    soByte += byteKyTu;
  }
  doan.push(hienTai);
  return doan.map((d, i) => (i === 0 ? d : ` ${d}`)).join(CRLF);
}

/** `YYYYMMDDTHHMMSSZ` theo UTC, bỏ phần nghìn giây. */
export function gioUtcIcs(luc: Date): string {
  return luc
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/[-:]/g, '');
}

/** `YYYYMMDD` theo ngày Việt Nam, cho mục cả ngày. */
export function ngayIcs(luc: Date): string {
  return new Date(luc.getTime() + LECH_VN_MS)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
}

function dongSuKien(muc: MucLich): string[] {
  const gio = muc.caNgay
    ? [
        `DTSTART;VALUE=DATE:${ngayIcs(muc.batDau)}`,
        `DTEND;VALUE=DATE:${ngayIcs(muc.ketThuc)}`,
      ]
    : [`DTSTART:${gioUtcIcs(muc.batDau)}`, `DTEND:${gioUtcIcs(muc.ketThuc)}`];
  return [
    'BEGIN:VEVENT',
    `UID:${muc.uid}`,
    `DTSTAMP:${gioUtcIcs(muc.capNhatLuc)}`,
    `LAST-MODIFIED:${gioUtcIcs(muc.capNhatLuc)}`,
    ...gio,
    `SUMMARY:${thoatChuIcs(muc.tieuDe)}`,
    `DESCRIPTION:${thoatChuIcs(muc.moTa)}`,
    // URL là kiểu URI, không thoát như TEXT.
    `URL:${muc.url}`,
    'END:VEVENT',
  ];
}

/** Toàn bộ VCALENDAR, mỗi dòng đã gập, xuống dòng CRLF, kết thúc bằng CRLF. */
export function vietIcs(lich: LichIcs): string {
  const dong = [
    'BEGIN:VCALENDAR',
    'PRODID:-//WeDo//Dong bo lich//VI',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${thoatChuIcs(lich.ten)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    // Apple và Outlook theo hai dòng này; Google tự quyết, thường vài giờ.
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...lich.mucs.flatMap(dongSuKien),
    'END:VCALENDAR',
  ];
  return dong.map(gapDongIcs).join(CRLF) + CRLF;
}
```

Kiểm dấu `\` sau khi ghi (công cụ ghi tệp có thể nuốt bớt):

```bash
grep -n "replace(/" src/lich-dong-bo/ics.ts
```

Expected đúng bảy dòng, trong đó bốn dòng của `thoatChuIcs` là:
```
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n'),
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/lich-dong-bo/ics.spec.ts && npx eslint src/lich-dong-bo --max-warnings 0`
Expected: PASS (15 bài); eslint sạch.

- [ ] **Step 5: Commit**

```bash
git add src/lich-dong-bo/hang-so.ts src/lich-dong-bo/ics.ts src/lich-dong-bo/ics.spec.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): bo viet iCalendar RFC 5545 khong them thu vien" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R3: Tách `EventsService.layMucLichTheoWorkspace`, màn Lịch giữ nguyên

**Files:**
- Modify: `src/events/events.service.ts` (`findCalendarItems`, dòng 32-167)
- Test: `src/events/events.service.spec.ts` (thêm hai `describe` cuối tệp, sau dòng 195)

**Interfaces:**
- Consumes: không.
- Produces:
  - `EventsService.layMucLichTheoWorkspace(userId: string, workspaceIds: string[], from: Date, to: Date)` → mảng giống hệt mảng `findCalendarItems` trả (cùng ba loại `EVENT`/`TASK_DEADLINE`/`MEETING`, cùng thứ tự sắp xếp). KHÔNG tự kiểm thành viên workspace.
  - `findCalendarItems` gọi lại nó với `[workspaceId]`; một workspace thì điều kiện vẫn là `workspaceId: '<id>'` (không phải `{ in: [...] }`).
  - Phần tử `task` và `meeting` có thêm `updatedAt: Date` (trường THÊM; `event` vốn đã có đủ cột).

- [ ] **Step 1: Viết bài giữ hành vi — phải XANH trên mã cũ**

Thêm cuối `src/events/events.service.spec.ts` (sau dấu `});` cuối cùng, dòng 195):

```ts
/*
  Giữ hành vi màn Lịch khi tách phần truy vấn ra `layMucLichTheoWorkspace`
  (link đồng bộ lịch dùng lại nó với nhiều workspace). Hai bài đầu viết TRƯỚC
  khi tách và phải xanh trên mã cũ: chúng chụp lại đúng kết quả và đúng điều
  kiện lọc mà `GET /events/calendar` đang trả cho web và app.
*/
describe('EventsService — màn Lịch giữ nguyên khi tách truy vấn', () => {
  const TU = '2026-07-01T00:00:00.000Z';
  const DEN = '2026-08-01T00:00:00.000Z';
  const EVENT = {
    id: 'event-1',
    title: 'Ôn thi',
    note: 'Phòng 304',
    startTime: new Date('2026-07-28T02:00:00.000Z'),
    endTime: new Date('2026-07-28T03:00:00.000Z'),
    workspaceId: 'workspace-1',
    creatorId: 'user-1',
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    workspace: { id: 'workspace-1', name: 'FPT HCM' },
    creator: {
      id: 'user-1',
      fullName: 'Người dùng',
      email: 'u1@wedo.vn',
      avatarUrl: null,
    },
  };
  const TASK = {
    id: 'task-1',
    title: 'Chuẩn bị slide',
    description: 'Mười trang',
    status: 'IN_PROGRESS',
    dueDate: new Date('2026-07-29T11:00:00.000Z'),
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    project: { id: 'project-1', name: 'Dss301' },
    assignee: {
      id: 'user-1',
      fullName: 'Người dùng',
      email: 'u1@wedo.vn',
      avatarUrl: null,
    },
  };
  const MEETING = {
    id: 'meeting-1',
    title: 'Họp chốt chủ đề',
    agenda: 'Chốt nội dung',
    startTime: new Date('2026-07-28T09:00:00.000Z'),
    endTime: null,
    status: 'SCHEDULED',
    roomUrl: null,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    creatorId: 'leader-1',
    updatedAt: new Date('2026-07-04T00:00:00.000Z'),
    project: { id: 'project-1', name: 'Dss301', status: 'ACTIVE' },
    creator: {
      id: 'leader-1',
      fullName: 'Leader',
      email: 'l@wedo.vn',
      avatarUrl: null,
    },
    participants: [],
  };

  function taoService() {
    const prisma = {
      workspace: {
        findFirst: jest.fn().mockResolvedValue({ id: 'workspace-1' }),
      },
      event: { findMany: jest.fn().mockResolvedValue([EVENT]) },
      task: { findMany: jest.fn().mockResolvedValue([TASK]) },
      meeting: { findMany: jest.fn().mockResolvedValue([MEETING]) },
    };
    return {
      prisma,
      service: new EventsService(prisma as unknown as PrismaService),
    };
  }

  it('một workspace: đúng từng mục, đúng thứ tự như trước khi tách', async () => {
    const { service } = taoService();
    const ketQua = await service.findCalendarItems(
      'user-1',
      'workspace-1',
      TU,
      DEN,
    );

    expect(ketQua).toEqual([
      {
        id: 'event-1',
        kind: 'EVENT',
        title: 'Ôn thi',
        description: 'Phòng 304',
        startTime: EVENT.startTime,
        endTime: EVENT.endTime,
        workspaceId: 'workspace-1',
        event: EVENT,
      },
      {
        id: 'meeting-1',
        kind: 'MEETING',
        title: 'Họp chốt chủ đề',
        description: 'Chốt nội dung',
        startTime: MEETING.startTime,
        // Không có endTime thì màn Lịch lấy startTime — giữ nguyên.
        endTime: MEETING.startTime,
        workspaceId: 'workspace-1',
        meeting: MEETING,
      },
      {
        id: 'task-1',
        kind: 'TASK_DEADLINE',
        title: 'Chuẩn bị slide',
        description: 'Mười trang',
        startTime: TASK.dueDate,
        endTime: TASK.dueDate,
        workspaceId: 'workspace-1',
        task: TASK,
      },
    ]);
  });

  it('một workspace: điều kiện lọc của cả ba truy vấn giữ nguyên từng khoá', async () => {
    const { prisma, service } = taoService();
    await service.findCalendarItems('user-1', 'workspace-1', TU, DEN);

    const khoang = { gte: new Date(TU), lt: new Date(DEN) };
    expect(prisma.workspace.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.event.findMany.mock.calls[0][0].where).toEqual({
      workspaceId: 'workspace-1',
      creatorId: 'user-1',
      startTime: { lt: new Date(DEN) },
      endTime: { gte: new Date(TU) },
    });
    expect(prisma.task.findMany.mock.calls[0][0].where).toEqual({
      workspaceId: 'workspace-1',
      assigneeId: 'user-1',
      assignmentStatus: 'ACCEPTED',
      status: { not: 'DONE' },
      dueDate: khoang,
    });
    expect(prisma.meeting.findMany.mock.calls[0][0].where).toEqual({
      workspaceId: 'workspace-1',
      status: { not: 'CANCELLED' },
      startTime: khoang,
      OR: [
        { project: { members: { some: { userId: 'user-1' } } } },
        { creatorId: 'user-1', workspace: { ownerId: 'user-1' } },
      ],
    });
  });
});
```

Run: `npx jest src/events/events.service.spec.ts`
Expected: PASS (6 bài: 4 cũ + 2 mới). Đây là ảnh chụp hành vi trước khi tách; đỏ ở bước này nghĩa là bài viết sai, không phải mã sai — sửa bài cho khớp mã cũ, KHÔNG sửa mã.

- [ ] **Step 2: Viết bài thất bại cho hàm mới**

Thêm tiếp cuối tệp:

```ts
describe('EventsService.layMucLichTheoWorkspace', () => {
  const TU = new Date('2026-09-03T00:00:00.000Z');
  const DEN = new Date('2027-03-02T00:00:00.000Z');

  function taoService() {
    const prisma = {
      workspace: { findFirst: jest.fn() },
      event: { findMany: jest.fn().mockResolvedValue([]) },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      meeting: { findMany: jest.fn().mockResolvedValue([]) },
    };
    return {
      prisma,
      service: new EventsService(prisma as unknown as PrismaService),
    };
  }

  it('nhiều workspace: cả ba truy vấn lọc workspaceId trong danh sách', async () => {
    const { prisma, service } = taoService();
    await service.layMucLichTheoWorkspace('user-1', ['w-1', 'w-2'], TU, DEN);

    for (const truyVan of [
      prisma.event.findMany,
      prisma.task.findMany,
      prisma.meeting.findMany,
    ]) {
      expect(truyVan.mock.calls[0][0].where.workspaceId).toEqual({
        in: ['w-1', 'w-2'],
      });
    }
    expect(prisma.task.findMany.mock.calls[0][0].where.dueDate).toEqual({
      gte: TU,
      lt: DEN,
    });
  });

  it('không tự kiểm thành viên workspace — người gọi đã kiểm', async () => {
    const { prisma, service } = taoService();
    await service.layMucLichTheoWorkspace('user-1', ['w-1'], TU, DEN);
    expect(prisma.workspace.findFirst).not.toHaveBeenCalled();
    expect(prisma.event.findMany.mock.calls[0][0].where.workspaceId).toBe(
      'w-1',
    );
  });

  it('chọn thêm updatedAt của việc và cuộc họp (DTSTAMP của lịch đồng bộ)', async () => {
    const { prisma, service } = taoService();
    await service.layMucLichTheoWorkspace('user-1', ['w-1'], TU, DEN);
    expect(prisma.task.findMany.mock.calls[0][0].select.updatedAt).toBe(true);
    expect(prisma.meeting.findMany.mock.calls[0][0].select.updatedAt).toBe(
      true,
    );
  });
});
```

Run: `npx jest src/events/events.service.spec.ts`
Expected: FAIL đúng 3 bài mới — "TypeError: service.layMucLichTheoWorkspace is not a function"; 6 bài trước vẫn xanh.

- [ ] **Step 3: Tách hàm**

Trong `src/events/events.service.ts`, thay toàn bộ phương thức `findCalendarItems` — từ dòng 32 (`  async findCalendarItems(`) tới dòng 167 (dấu `  }` đóng phương thức, ngay trước dòng trống và `  async create(` ở dòng 169) — bằng:

```ts
  async findCalendarItems(
    userId: string,
    workspaceId?: string,
    from?: string,
    to?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.ensureWorkspaceMember(userId, workspaceId);
    const range = this.parseCalendarRange(from, to);
    return this.layMucLichTheoWorkspace(
      userId,
      [workspaceId],
      range.from,
      range.to,
    );
  }

  /**
   * Mục lịch của một người trong một hoặc nhiều workspace: sự kiện mình tạo,
   * hạn chót việc đã nhận chưa xong, cuộc họp của dự án mình đang ở. Màn Lịch
   * gọi với một workspace (`findCalendarItems`); link đồng bộ lịch gọi với mọi
   * workspace gói cho phép. KHÔNG tự kiểm thành viên workspace — người gọi phải
   * kiểm trước.
   *
   * Một workspace thì điều kiện vẫn là `workspaceId: '<id>'` y như trước khi
   * tách: điều kiện lọc của màn Lịch không đổi một ký tự.
   */
  async layMucLichTheoWorkspace(
    userId: string,
    workspaceIds: string[],
    from: Date,
    to: Date,
  ) {
    const workspaceId =
      workspaceIds.length === 1 ? workspaceIds[0] : { in: workspaceIds };
    const range = { from, to };

    const [events, tasks, meetings] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          workspaceId,
          creatorId: userId,
          startTime: { lt: range.to },
          endTime: { gte: range.from },
        },
        include: this.eventInclude(),
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.task.findMany({
        where: {
          workspaceId,
          assigneeId: userId,
          assignmentStatus: 'ACCEPTED',
          status: { not: 'DONE' },
          dueDate: { gte: range.from, lt: range.to },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          workspaceId: true,
          projectId: true,
          // Thêm cho link đồng bộ lịch (DTSTAMP/LAST-MODIFIED); trường mới, không đổi trường cũ.
          updatedAt: true,
          project: { select: { id: true, name: true } },
          assignee: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.meeting.findMany({
        where: {
          workspaceId,
          status: { not: 'CANCELLED' },
          startTime: { gte: range.from, lt: range.to },
          /*
            Chỉ thành viên HIỆN TẠI của dự án. Người tạo đã bị gỡ khỏi dự án
            không được giữ đường vào phòng (roomUrl) qua trang Lịch. Chủ
            workspace tạo được họp mà không cần là thành viên nên giữ nhánh riêng.
          */
          OR: [
            { project: { members: { some: { userId } } } },
            { creatorId: userId, workspace: { ownerId: userId } },
          ],
        },
        select: {
          id: true,
          title: true,
          agenda: true,
          startTime: true,
          endTime: true,
          status: true,
          roomUrl: true,
          workspaceId: true,
          projectId: true,
          creatorId: true,
          updatedAt: true,
          project: { select: { id: true, name: true, status: true } },
          creator: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
          participants: {
            select: {
              id: true,
              meetingId: true,
              userId: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return [
      ...events.map((event) => ({
        id: event.id,
        kind: 'EVENT' as const,
        title: event.title,
        description: event.note,
        startTime: event.startTime,
        endTime: event.endTime,
        workspaceId: event.workspaceId,
        event,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        kind: 'TASK_DEADLINE' as const,
        title: task.title,
        description: task.description,
        startTime: task.dueDate,
        endTime: task.dueDate,
        workspaceId: task.workspaceId,
        task,
      })),
      ...meetings.map((meeting) => ({
        id: meeting.id,
        kind: 'MEETING' as const,
        title: meeting.title,
        description: meeting.agenda,
        startTime: meeting.startTime,
        endTime: meeting.endTime || meeting.startTime,
        workspaceId: meeting.workspaceId,
        meeting,
      })),
    ].sort(
      (left, right) =>
        new Date(left.startTime!).getTime() -
        new Date(right.startTime!).getTime(),
    );
  }
```

(Thân của ba truy vấn và phần ghép mảng giữ nguyên từng ký tự, chỉ khác: `workspaceId` giờ là biến cục bộ, `range` dựng từ tham số, và hai dòng `updatedAt: true`.)

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/events && npx tsc --noEmit -p tsconfig.json && npx eslint src/events --max-warnings 0`
Expected: PASS (9 bài); tsc, eslint sạch.

- [ ] **Step 5: Commit**

```bash
git add src/events/events.service.ts src/events/events.service.spec.ts
git -c core.autocrlf=false commit -m "refactor(events): tach layMucLichTheoWorkspace, giu nguyen man Lich" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R4: Đổi mục màn Lịch sang mục trong tệp `.ics`

**Files:**
- Create: `src/lich-dong-bo/muc-lich.ts`
- Test: `src/lich-dong-bo/muc-lich.spec.ts`

**Interfaces:**
- Consumes: `EventsService.layMucLichTheoWorkspace` (kiểu, R3); `MucLich` (R2); `DO_DAI_MO_TA`, `GOC_WEB`, `PHUT_HAN`, `PHUT_HOP_MAC_DINH`, `NgonNguLich` (R2); `dauNgayVN`, `NGAY_MS` (`src/common/ngay-vn.ts`, có sẵn).
- Produces:
  - `export type MucNguon = Awaited<ReturnType<EventsService['layMucLichTheoWorkspace']>>[number]`
  - `export function doiSangMucLich(muc: MucNguon, lang: NgonNguLich): MucLich`
  - `export function mucTamDung(lang: NgonNguLich, bayGio: Date): MucLich` — UID `tam-dung@wedofpt.com.vn`, cả ngày hôm nay theo giờ VN, link `#/pricing`
  - `export function tenLich(hoTen: string): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lich-dong-bo/muc-lich.spec.ts`:

```ts
import { MeetingStatus, ProjectStatus, TaskStatus } from '@prisma/client';
import { doiSangMucLich, mucTamDung, tenLich, type MucNguon } from './muc-lich';

type MucViec = Extract<MucNguon, { kind: 'TASK_DEADLINE' }>;
type MucHop = Extract<MucNguon, { kind: 'MEETING' }>;
type MucSuKien = Extract<MucNguon, { kind: 'EVENT' }>;

const NGUOI = {
  id: 'u-1',
  fullName: 'Lê Hữu Đại',
  email: 'u1@wedo.vn',
  avatarUrl: null,
};
const HAN = new Date('2026-10-10T16:59:00Z'); // 23:59 10/10 giờ Việt Nam
const SUA_LUC = new Date('2026-10-01T08:00:00Z');

function viec(ghiDe: Partial<MucViec['task']> = {}): MucViec {
  const task: MucViec['task'] = {
    id: 't-1',
    title: 'Thiết kế poster',
    description: 'Khổ A1, hai phương án',
    status: TaskStatus.IN_PROGRESS,
    dueDate: HAN,
    workspaceId: 'w-1',
    projectId: 'p-1',
    updatedAt: SUA_LUC,
    project: { id: 'p-1', name: 'EXE201' },
    assignee: NGUOI,
    ...ghiDe,
  };
  return {
    id: task.id,
    kind: 'TASK_DEADLINE',
    title: task.title,
    description: task.description,
    startTime: task.dueDate,
    endTime: task.dueDate,
    workspaceId: task.workspaceId,
    task,
  };
}

function hop(ghiDe: Partial<MucHop['meeting']> = {}): MucHop {
  const meeting: MucHop['meeting'] = {
    id: 'm-1',
    title: 'Chốt chủ đề',
    agenda: 'Bình chọn ba ý tưởng',
    startTime: new Date('2026-10-05T12:00:00Z'),
    endTime: new Date('2026-10-05T13:30:00Z'),
    status: MeetingStatus.SCHEDULED,
    roomUrl: 'https://wedo.daily.co/phong-bi-mat',
    workspaceId: 'w-1',
    projectId: 'p-1',
    creatorId: 'u-1',
    updatedAt: SUA_LUC,
    project: { id: 'p-1', name: 'EXE201', status: ProjectStatus.ACTIVE },
    creator: NGUOI,
    participants: [],
    ...ghiDe,
  };
  return {
    id: meeting.id,
    kind: 'MEETING',
    title: meeting.title,
    description: meeting.agenda,
    startTime: meeting.startTime,
    endTime: meeting.endTime || meeting.startTime,
    workspaceId: meeting.workspaceId,
    meeting,
  };
}

function suKien(): MucSuKien {
  const event: MucSuKien['event'] = {
    id: 'e-1',
    title: 'Ôn thi PRJ301',
    note: 'Thư viện tầng 3',
    startTime: new Date('2026-10-07T02:00:00Z'),
    endTime: new Date('2026-10-07T04:00:00Z'),
    workspaceId: 'w-1',
    creatorId: 'u-1',
    createdAt: new Date('2026-09-30T00:00:00Z'),
    updatedAt: SUA_LUC,
    workspace: { id: 'w-1', name: 'FPT HCM' },
    creator: NGUOI,
  };
  return {
    id: event.id,
    kind: 'EVENT',
    title: event.title,
    description: event.note,
    startTime: event.startTime,
    endTime: event.endTime,
    workspaceId: event.workspaceId,
    event,
  };
}

describe('doiSangMucLich — hạn chót', () => {
  it('khối 30 phút kết thúc đúng giờ hạn; tên, mô tả, link và UID theo spec', () => {
    expect(doiSangMucLich(viec(), 'vi')).toEqual({
      uid: 'task-t-1@wedofpt.com.vn',
      batDau: new Date('2026-10-10T16:29:00Z'),
      ketThuc: HAN,
      tieuDe: 'Hạn: Thiết kế poster · EXE201',
      moTa: 'Khổ A1, hai phương án\nDự án: EXE201\nMở trong WeDo: https://wedofpt.com.vn/#/taskboard',
      url: 'https://wedofpt.com.vn/#/taskboard',
      capNhatLuc: SUA_LUC,
    });
  });

  it('tiếng Anh: "Due:", "Project:", "Open in WeDo:"', () => {
    const muc = doiSangMucLich(viec({ description: null }), 'en');
    expect(muc.tieuDe).toBe('Due: Thiết kế poster · EXE201');
    expect(muc.moTa).toBe(
      'Project: EXE201\nOpen in WeDo: https://wedofpt.com.vn/#/taskboard',
    );
  });

  it('việc không thuộc dự án: không có "· <dự án>" và dòng dự án', () => {
    const muc = doiSangMucLich(viec({ projectId: null, project: null }), 'vi');
    expect(muc.tieuDe).toBe('Hạn: Thiết kế poster');
    expect(muc.moTa).not.toContain('Dự án:');
  });

  it('mô tả dài cắt ở 1.000 ký tự rồi thêm "…", đếm cả chữ có dấu là một ký tự', () => {
    const muc = doiSangMucLich(viec({ description: 'ệ'.repeat(1500) }), 'vi');
    const dongDau = muc.moTa.split('\n')[0];
    expect(Array.from(dongDau)).toHaveLength(1001);
    expect(dongDau.endsWith('ệ…')).toBe(true);
  });
});

describe('doiSangMucLich — cuộc họp', () => {
  it('từ startTime tới endTime; tên, link về màn họp; không đưa link phòng họp', () => {
    const muc = doiSangMucLich(hop(), 'vi');
    expect(muc).toMatchObject({
      uid: 'meeting-m-1@wedofpt.com.vn',
      batDau: new Date('2026-10-05T12:00:00Z'),
      ketThuc: new Date('2026-10-05T13:30:00Z'),
      tieuDe: 'Họp: Chốt chủ đề · EXE201',
      url: 'https://wedofpt.com.vn/#/meeting',
    });
    expect(muc.moTa).toBe(
      'Bình chọn ba ý tưởng\nDự án: EXE201\nMở trong WeDo: https://wedofpt.com.vn/#/meeting',
    );
    expect(JSON.stringify(muc)).not.toContain('daily.co');
  });

  it('không có endTime (hay endTime không sau startTime) thì dài 60 phút', () => {
    expect(doiSangMucLich(hop({ endTime: null }), 'en').ketThuc).toEqual(
      new Date('2026-10-05T13:00:00Z'),
    );
    expect(
      doiSangMucLich(hop({ endTime: new Date('2026-10-05T11:00:00Z') }), 'vi')
        .ketThuc,
    ).toEqual(new Date('2026-10-05T13:00:00Z'));
    expect(doiSangMucLich(hop(), 'en').tieuDe).toBe(
      'Meeting: Chốt chủ đề · EXE201',
    );
  });
});

describe('doiSangMucLich — sự kiện cá nhân', () => {
  it('giữ tên và giờ, ghi chú vào mô tả, link về màn Lịch', () => {
    expect(doiSangMucLich(suKien(), 'vi')).toEqual({
      uid: 'event-e-1@wedofpt.com.vn',
      batDau: new Date('2026-10-07T02:00:00Z'),
      ketThuc: new Date('2026-10-07T04:00:00Z'),
      tieuDe: 'Ôn thi PRJ301',
      moTa: 'Thư viện tầng 3\nMở trong WeDo: https://wedofpt.com.vn/#/calendar',
      url: 'https://wedofpt.com.vn/#/calendar',
      capNhatLuc: SUA_LUC,
    });
  });
});

describe('mucTamDung', () => {
  it('một mục cả ngày hôm nay theo giờ Việt Nam, đúng câu của spec', () => {
    // 01:30 ngày 04/10 giờ Việt Nam (UTC còn là 03/10).
    const muc = mucTamDung('vi', new Date('2026-10-03T18:30:00Z'));
    expect(muc).toMatchObject({
      uid: 'tam-dung@wedofpt.com.vn',
      caNgay: true,
      batDau: new Date('2026-10-03T17:00:00Z'),
      ketThuc: new Date('2026-10-04T17:00:00Z'),
      tieuDe:
        'Đồng bộ lịch WeDo đã tạm dừng vì gói đã hết hạn. Gia hạn tại wedofpt.com.vn để lịch tự có lại.',
      url: 'https://wedofpt.com.vn/#/pricing',
    });
  });

  it('trong cùng một ngày thì giống hệt nhau (ETag không đổi)', () => {
    expect(mucTamDung('en', new Date('2026-10-03T17:05:00Z'))).toEqual(
      mucTamDung('en', new Date('2026-10-04T16:55:00Z')),
    );
    expect(mucTamDung('en', new Date('2026-10-03T17:05:00Z')).tieuDe).toMatch(
      /^WeDo calendar sync is paused/,
    );
  });
});

describe('tenLich', () => {
  it('WeDo · <họ tên>, thiếu tên thì chỉ WeDo', () => {
    expect(tenLich('Lê Hữu Đại')).toBe('WeDo · Lê Hữu Đại');
    expect(tenLich('  ')).toBe('WeDo');
  });
});
```

Run: `npx jest src/lich-dong-bo/muc-lich.spec.ts`
Expected: FAIL — "Cannot find module './muc-lich'".

- [ ] **Step 2: Viết mã**

`src/lich-dong-bo/muc-lich.ts`:

```ts
import { dauNgayVN, NGAY_MS } from '../common/ngay-vn';
import type { EventsService } from '../events/events.service';
import {
  DO_DAI_MO_TA,
  GOC_WEB,
  PHUT_HAN,
  PHUT_HOP_MAC_DINH,
  type NgonNguLich,
} from './hang-so';
import type { MucLich } from './ics';

/** Đúng một phần tử của mảng mà màn Lịch đang dùng — không dựng kiểu thứ hai. */
export type MucNguon = Awaited<
  ReturnType<EventsService['layMucLichTheoWorkspace']>
>[number];

const PHUT_MS = 60 * 1000;

const CHU = {
  vi: {
    han: 'Hạn',
    hop: 'Họp',
    duAn: 'Dự án',
    moTrongWeDo: 'Mở trong WeDo',
    tamDung:
      'Đồng bộ lịch WeDo đã tạm dừng vì gói đã hết hạn. Gia hạn tại wedofpt.com.vn để lịch tự có lại.',
  },
  en: {
    han: 'Due',
    hop: 'Meeting',
    duAn: 'Project',
    moTrongWeDo: 'Open in WeDo',
    tamDung:
      'WeDo calendar sync is paused because your plan has expired. Renew at wedofpt.com.vn to bring your calendar back.',
  },
} as const;

/**
 * Link về đúng MÀN của WeDo. Web chưa có đường dẫn mở thẳng một việc hay một
 * cuộc họp (src/App.tsx chỉ đọc tên màn), nên không mở thẳng mục.
 */
const MAN = {
  TASK_DEADLINE: `${GOC_WEB}/#/taskboard`,
  MEETING: `${GOC_WEB}/#/meeting`,
  EVENT: `${GOC_WEB}/#/calendar`,
} as const;

/** Cắt ở 1.000 ký tự (đếm theo ký tự, không theo đơn vị UTF-16), thêm "…". */
function catMoTa(chu: string | null): string {
  const kyTu = Array.from((chu ?? '').normalize('NFC').trim());
  return kyTu.length > DO_DAI_MO_TA
    ? `${kyTu.slice(0, DO_DAI_MO_TA).join('')}…`
    : kyTu.join('');
}

function ghepMoTa(
  lang: NgonNguLich,
  noiDung: string | null,
  tenDuAn: string | null,
  url: string,
): string {
  const chu = CHU[lang];
  return [
    catMoTa(noiDung),
    tenDuAn ? `${chu.duAn}: ${tenDuAn}` : '',
    `${chu.moTrongWeDo}: ${url}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const ghepTieuDe = (tienTo: string, ten: string, tenDuAn: string | null) =>
  tenDuAn ? `${tienTo}: ${ten} · ${tenDuAn}` : `${tienTo}: ${ten}`;

/**
 * Đổi một mục của màn Lịch thành một mục trong tệp `.ics` (spec mục 2.3):
 * - hạn chót: khối 30 phút KẾT THÚC đúng giờ hạn, "Hạn: <việc> · <dự án>";
 * - cuộc họp: startTime tới endTime (không có thì 60 phút), "Họp: … · …";
 * - sự kiện: giữ tên và giờ.
 * UID cố định theo loại + id để lịch cập nhật đúng mục cũ chứ không nhân đôi.
 */
export function doiSangMucLich(muc: MucNguon, lang: NgonNguLich): MucLich {
  const chu = CHU[lang];
  if (muc.kind === 'TASK_DEADLINE') {
    const { task } = muc;
    // Truy vấn đã lọc `dueDate` trong khoảng, nên không bao giờ null ở đây.
    if (!task.dueDate) throw new Error(`Việc ${task.id} không có hạn chót`);
    const tenDuAn = task.project?.name ?? null;
    return {
      uid: `task-${task.id}@wedofpt.com.vn`,
      batDau: new Date(task.dueDate.getTime() - PHUT_HAN * PHUT_MS),
      ketThuc: task.dueDate,
      tieuDe: ghepTieuDe(chu.han, task.title, tenDuAn),
      moTa: ghepMoTa(lang, task.description, tenDuAn, MAN.TASK_DEADLINE),
      url: MAN.TASK_DEADLINE,
      capNhatLuc: task.updatedAt,
    };
  }
  if (muc.kind === 'MEETING') {
    const { meeting } = muc;
    const ketThuc =
      meeting.endTime && meeting.endTime > meeting.startTime
        ? meeting.endTime
        : new Date(meeting.startTime.getTime() + PHUT_HOP_MAC_DINH * PHUT_MS);
    return {
      uid: `meeting-${meeting.id}@wedofpt.com.vn`,
      batDau: meeting.startTime,
      ketThuc,
      tieuDe: ghepTieuDe(chu.hop, meeting.title, meeting.project.name),
      moTa: ghepMoTa(lang, meeting.agenda, meeting.project.name, MAN.MEETING),
      url: MAN.MEETING,
      capNhatLuc: meeting.updatedAt,
    };
  }
  const { event } = muc;
  return {
    uid: `event-${event.id}@wedofpt.com.vn`,
    batDau: event.startTime,
    ketThuc: event.endTime,
    tieuDe: event.title,
    moTa: ghepMoTa(lang, event.note, null, MAN.EVENT),
    url: MAN.EVENT,
    capNhatLuc: event.updatedAt,
  };
}

/**
 * Lịch của người không còn gói: đúng một mục cả ngày hôm nay (theo giờ Việt
 * Nam) báo đồng bộ đã tạm dừng, để dữ liệu cũ không nằm lại lỗi thời trong
 * lịch của họ. UID cố định nên mỗi ngày mục này dời sang hôm nay chứ không
 * chồng thêm; `capNhatLuc` là đầu ngày nên trong ngày tệp không đổi byte nào.
 */
export function mucTamDung(lang: NgonNguLich, bayGio: Date): MucLich {
  const dauNgay = dauNgayVN(bayGio);
  const url = `${GOC_WEB}/#/pricing`;
  return {
    uid: 'tam-dung@wedofpt.com.vn',
    batDau: dauNgay,
    ketThuc: new Date(dauNgay.getTime() + NGAY_MS),
    caNgay: true,
    tieuDe: CHU[lang].tamDung,
    moTa: `${CHU[lang].tamDung}\n${CHU[lang].moTrongWeDo}: ${url}`,
    url,
    capNhatLuc: dauNgay,
  };
}

/** Tên lịch hiện trong Google/Apple/Outlook: `WeDo · <họ tên>`. */
export function tenLich(hoTen: string): string {
  const ten = hoTen.trim();
  return ten ? `WeDo · ${ten}` : 'WeDo';
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/lich-dong-bo/muc-lich.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src/lich-dong-bo --max-warnings 0`
Expected: PASS (10 bài); tsc (kiểm cả việc các đối tượng giả trong bài khớp đúng kiểu `MucNguon` thật) và eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/lich-dong-bo/muc-lich.ts src/lich-dong-bo/muc-lich.spec.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): doi muc man Lich sang muc lich ics vi/en" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R5: Phạm vi gói — đọc thẳng `Subscription`, không theo nền tảng

**Files:**
- Create: `src/lich-dong-bo/pham-vi-goi.ts`
- Test: `src/lich-dong-bo/pham-vi-goi.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`; `SubscriptionPlan`, `SubscriptionStatus` (`@prisma/client`); `nguCanhNenTang` (`src/common/nen-tang-khach.ts`, chỉ trong bài kiểm).
- Produces:
  - `export interface PhamViDongBo { coGoi: boolean; workspaceIds: string[] }`
  - `export async function phamViDongBo(prisma: PrismaService, userId: string, bayGio: Date): Promise<PhamViDongBo>`
  - `export async function workspaceDuocDongBo(prisma: PrismaService, userId: string, bayGio: Date): Promise<string[]>` (đúng hợp đồng)
  - Truy vấn: `subscription.findFirst({ where: { userId, plan: PERSONAL_PRO, status: ACTIVE, currentPeriodEnd: { gt: bayGio } } })`, rồi `workspace.findMany` với `OR: [{ ownerId }, { members: { some: { userId } } }]` (+ `subscription: { is: { plan: TEAM_GROWTH, status: ACTIVE, currentPeriodEnd: { gt: bayGio } } }` khi không có Pro), `orderBy: { createdAt: 'asc' }`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lich-dong-bo/pham-vi-goi.spec.ts`:

```ts
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { nguCanhNenTang } from '../common/nen-tang-khach';
import { phamViDongBo, workspaceDuocDongBo } from './pham-vi-goi';

const BAY_GIO = new Date('2026-10-03T05:00:00Z');
const MAI = new Date('2026-10-04T05:00:00Z');
const HOM_QUA = new Date('2026-10-02T05:00:00Z');
const U = 'u-1';

interface Goi {
  userId?: string;
  workspaceId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
}
interface Workspace {
  id: string;
  ownerId: string;
  thanhVien: string[];
}
interface DieuKienGoi {
  status: SubscriptionStatus;
  currentPeriodEnd: { gt: Date };
}
interface TimGoi {
  where: DieuKienGoi & { userId: string; plan: SubscriptionPlan };
}
interface TimWorkspace {
  where: {
    OR: [{ ownerId: string }, { members: { some: { userId: string } } }];
    subscription?: { is: DieuKienGoi & { plan: SubscriptionPlan } };
  };
}

/**
 * Prisma giả có dữ liệu thật: đọc điều kiện `where` mà hàm gửi đi và lọc trên
 * mảng, để bài kiểm thử nói được "gói hết hạn theo currentPeriodEnd thì không
 * tính" chứ không chỉ "hàm gửi đúng một object".
 */
function prismaGia(goi: Goi[], workspaces: Workspace[]) {
  const conHieuLuc = (g: Goi, dk: DieuKienGoi) =>
    g.status === dk.status &&
    g.currentPeriodEnd.getTime() > dk.currentPeriodEnd.gt.getTime();
  return {
    subscription: {
      findFirst: jest.fn(({ where }: TimGoi) =>
        Promise.resolve(
          goi.find(
            (g) =>
              g.userId === where.userId &&
              g.plan === where.plan &&
              conHieuLuc(g, where),
          ) ?? null,
        ),
      ),
    },
    workspace: {
      findMany: jest.fn(({ where }: TimWorkspace) => {
        const userId = where.OR[0].ownerId;
        const dkGoi = where.subscription?.is;
        return Promise.resolve(
          workspaces
            .filter((w) => w.ownerId === userId || w.thanhVien.includes(userId))
            .filter(
              (w) =>
                !dkGoi ||
                goi.some(
                  (g) =>
                    g.workspaceId === w.id &&
                    g.plan === dkGoi.plan &&
                    conHieuLuc(g, dkGoi),
                ),
            )
            .map((w) => ({ id: w.id })),
        );
      }),
    },
  };
}

const WS: Workspace[] = [
  { id: 'w-chu', ownerId: U, thanhVien: [U] },
  { id: 'w-team', ownerId: 'u-khac', thanhVien: ['u-khac', U] },
  { id: 'w-mien-phi', ownerId: 'u-khac', thanhVien: ['u-khac', U] },
  { id: 'w-nguoi-la', ownerId: 'u-la', thanhVien: ['u-la'] },
];
const PRO: Goi = {
  userId: U,
  plan: SubscriptionPlan.PERSONAL_PRO,
  status: SubscriptionStatus.ACTIVE,
  currentPeriodEnd: MAI,
};
const TEAM: Goi = {
  workspaceId: 'w-team',
  plan: SubscriptionPlan.TEAM_GROWTH,
  status: SubscriptionStatus.ACTIVE,
  currentPeriodEnd: MAI,
};
const TEAM_NGUOI_LA: Goi = { ...TEAM, workspaceId: 'w-nguoi-la' };

const goi = (prisma: ReturnType<typeof prismaGia>) =>
  workspaceDuocDongBo(prisma as never, U, BAY_GIO);

describe('workspaceDuocDongBo', () => {
  it('có Pro cá nhân: mọi workspace mình là thành viên, không lấy của người lạ', async () => {
    await expect(goi(prismaGia([PRO, TEAM_NGUOI_LA], WS))).resolves.toEqual([
      'w-chu',
      'w-team',
      'w-mien-phi',
    ]);
  });

  it('chỉ có Team: đúng các workspace có TEAM_GROWTH mình đang ở', async () => {
    await expect(goi(prismaGia([TEAM, TEAM_NGUOI_LA], WS))).resolves.toEqual([
      'w-team',
    ]);
  });

  it('Team đã quá currentPeriodEnd nhưng status vẫn ACTIVE: không tính', async () => {
    const prisma = prismaGia([{ ...TEAM, currentPeriodEnd: HOM_QUA }], WS);
    await expect(goi(prisma)).resolves.toEqual([]);
    expect(
      prisma.workspace.findMany.mock.calls[0][0].where.subscription,
    ).toEqual({
      is: {
        plan: SubscriptionPlan.TEAM_GROWTH,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: BAY_GIO },
      },
    });
  });

  it('Pro đã quá hạn, hay đã EXPIRED/CANCELLED: rơi về luật Team', async () => {
    for (const proCu of [
      { ...PRO, currentPeriodEnd: HOM_QUA },
      { ...PRO, status: SubscriptionStatus.EXPIRED },
      { ...PRO, status: SubscriptionStatus.CANCELLED },
    ]) {
      await expect(goi(prismaGia([proCu, TEAM], WS))).resolves.toEqual([
        'w-team',
      ]);
    }
  });

  it('không có gói nào: rỗng', async () => {
    await expect(goi(prismaGia([], WS))).resolves.toEqual([]);
  });

  it('yêu cầu mang User-Agent CFNetwork (Lịch iPhone) vẫn tính đúng gói Pro', async () => {
    const ketQua = await nguCanhNenTang.run({ nenTang: 'ios' }, () =>
      goi(prismaGia([PRO], WS)),
    );
    expect(ketQua).toEqual(['w-chu', 'w-team', 'w-mien-phi']);
  });

  it('chỉ đọc: không ghi gì vào bảng Subscription', async () => {
    const prisma = prismaGia([{ ...PRO, currentPeriodEnd: HOM_QUA }], WS);
    await goi(prisma);
    expect(Object.keys(prisma.subscription)).toEqual(['findFirst']);
  });
});

describe('phamViDongBo', () => {
  it('Pro mà chưa ở workspace nào: vẫn có gói, danh sách rỗng', async () => {
    await expect(
      phamViDongBo(prismaGia([PRO], []) as never, U, BAY_GIO),
    ).resolves.toEqual({ coGoi: true, workspaceIds: [] });
  });

  it('không Pro, không Team: không có gói', async () => {
    await expect(
      phamViDongBo(prismaGia([], WS) as never, U, BAY_GIO),
    ).resolves.toEqual({ coGoi: false, workspaceIds: [] });
  });
});
```

Run: `npx jest src/lich-dong-bo/pham-vi-goi.spec.ts`
Expected: FAIL — "Cannot find module './pham-vi-goi'".

- [ ] **Step 2: Viết mã**

`src/lich-dong-bo/pham-vi-goi.ts`:

```ts
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PhamViDongBo {
  /** Người này đang được dùng đồng bộ lịch (Pro cá nhân, hay ở ít nhất một workspace Team). */
  coGoi: boolean;
  /** Các workspace có mục được đưa vào lịch. */
  workspaceIds: string[];
}

/**
 * Phạm vi đồng bộ lịch, tính lại MỖI LẦN lịch được lấy (spec mục 2.2):
 * - có PERSONAL_PRO đang hiệu lực → mọi workspace người đó là thành viên;
 * - không thì các workspace người đó là thành viên VÀ có TEAM_GROWTH đang
 *   hiệu lực.
 * "Đang hiệu lực" = `status = ACTIVE` VÀ `currentPeriodEnd > bayGio`: gói đã
 * quá hạn mà chưa ai chuyển sang EXPIRED vẫn không được tính.
 *
 * Chỉ ĐỌC bảng `Subscription`. KHÔNG dùng `EntitlementsService.resolve()`:
 * hàm đó ghi EXPIRED vào cơ sở dữ liệu, và gặp User-Agent CFNetwork (Lịch
 * iPhone lấy lịch đúng bằng User-Agent đó) thì trả gói Miễn phí, chặn nhầm
 * người có Pro. Hàm này không đọc ngữ cảnh nền tảng.
 *
 * Thành viên = chủ workspace hoặc có dòng WorkspaceMember, đúng như
 * `EventsService.ensureWorkspaceMember` của màn Lịch.
 */
export async function phamViDongBo(
  prisma: PrismaService,
  userId: string,
  bayGio: Date,
): Promise<PhamViDongBo> {
  const conHieuLuc = {
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: { gt: bayGio },
  };
  const laThanhVien = {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
  const pro = await prisma.subscription.findFirst({
    where: { userId, plan: SubscriptionPlan.PERSONAL_PRO, ...conHieuLuc },
    select: { id: true },
  });
  const workspaces = await prisma.workspace.findMany({
    where: pro
      ? laThanhVien
      : {
          ...laThanhVien,
          subscription: {
            is: { plan: SubscriptionPlan.TEAM_GROWTH, ...conHieuLuc },
          },
        },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  const workspaceIds = workspaces.map((w) => w.id);
  return { coGoi: pro !== null || workspaceIds.length > 0, workspaceIds };
}

/** Các workspace được đưa vào lịch đồng bộ của người này (rỗng: không có gói). */
export async function workspaceDuocDongBo(
  prisma: PrismaService,
  userId: string,
  bayGio: Date,
): Promise<string[]> {
  return (await phamViDongBo(prisma, userId, bayGio)).workspaceIds;
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/lich-dong-bo/pham-vi-goi.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src/lich-dong-bo --max-warnings 0`
Expected: PASS (9 bài); tsc (kiểm `subscription: { is: … }` hợp kiểu `WorkspaceWhereInput` thật) và eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/lich-dong-bo/pham-vi-goi.ts src/lich-dong-bo/pham-vi-goi.spec.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): pham vi goi doc thang Subscription, khong theo nen tang" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R6: Mã lỗi và `LichDongBoService`

**Files:**
- Create: `src/lich-dong-bo/lich-dong-bo.errors.ts`
- Create: `src/lich-dong-bo/lich-dong-bo.service.ts`
- Test: `src/lich-dong-bo/lich-dong-bo.service.spec.ts`
- Modify: `.env.example` (thêm cuối tệp)

**Interfaces:**
- Consumes: `PrismaService` (`calendarFeed` từ R1); `EventsService.layMucLichTheoWorkspace` (R3); `vietIcs`, `MucLich` (R2); hằng số (R2); `doiSangMucLich`, `mucTamDung`, `tenLich`, `MucNguon` (R4); `phamViDongBo` (R5); `NGAY_MS` (`src/common/ngay-vn.ts`).
- Produces:
  - `export const MA_LOI_NGOAI_GOI = 'CALENDAR_FEED_NOT_IN_PLAN'`
  - `export function loiNgoaiGoi(): ForbiddenException` — thân `{ statusCode: 403, code: 'CALENDAR_FEED_NOT_IN_PLAN', message: 'Đồng bộ lịch dành cho gói Pro và Team.' }`
  - `export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null }`
  - `export class LichDongBoService` với `layTrangThai(userId)`, `taoHoacDoiLink(userId, lang)`, `tatDongBo(userId)`, `layTepLich(token, bayGio?)` đúng chữ ký hợp đồng.
  - URL = `(process.env.CALENDAR_FEED_BASE_URL || GOC_LINK_MAC_DINH)` bỏ `/` cuối + `'/' + token + '.ics'`.
  - ETag = `"<sha256 hex của nội dung utf8>"` (có ngoặc kép).

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lich-dong-bo/lich-dong-bo.service.spec.ts`:

```ts
import { HttpException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { LichDongBoService } from './lich-dong-bo.service';
import type { MucNguon } from './muc-lich';

const U = 'u-1';
const BAY_GIO = new Date('2026-10-03T05:00:00Z');
const PHUT = 60 * 1000;
const NGAY = 24 * 60 * PHUT;
const LINK = /^https:\/\/wedofpt\.com\.vn\/lich\/([A-Za-z0-9_-]{43})\.ics$/;

type MucViec = Extract<MucNguon, { kind: 'TASK_DEADLINE' }>;

function viec(so: number, han: Date): MucViec {
  const task: MucViec['task'] = {
    id: `t-${so}`,
    title: `Việc ${so}`,
    description: null,
    status: TaskStatus.TODO,
    dueDate: han,
    workspaceId: 'w-1',
    projectId: 'p-1',
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    project: { id: 'p-1', name: 'EXE201' },
    assignee: {
      id: U,
      fullName: 'Lê Hữu Đại',
      email: 'u1@wedo.vn',
      avatarUrl: null,
    },
  };
  return {
    id: task.id,
    kind: 'TASK_DEADLINE',
    title: task.title,
    description: null,
    startTime: han,
    endTime: han,
    workspaceId: 'w-1',
    task,
  };
}

interface DongGia {
  id: string;
  userId: string;
  token: string;
  language: string;
  createdAt: Date;
  lastFetchedAt: Date | null;
}
interface ThamSoUpsert {
  where: { userId: string };
  create: { userId: string; token: string; language: string };
  update: Partial<DongGia>;
}

/**
 * Prisma giả giữ bảng `calendar_feeds` trong một mảng, để "đổi mã thì mã cũ
 * 404" hay "ghi lần lấy tối đa 10 phút một lần" được kiểm trên dữ liệu thật.
 * `goi` đổi được giữa chừng: hết gói sau khi đã tạo link.
 */
function taoService() {
  const goi = { pro: true, workspaces: ['w-1', 'w-2'], biKhoa: false };
  const dong: DongGia[] = [];
  const prisma = {
    subscription: {
      findFirst: jest.fn(() => Promise.resolve(goi.pro ? { id: 'sub' } : null)),
    },
    workspace: {
      findMany: jest.fn(() =>
        Promise.resolve(goi.workspaces.map((id) => ({ id }))),
      ),
    },
    calendarFeed: {
      findUnique: jest.fn(
        ({ where }: { where: { userId?: string; token?: string } }) => {
          const d = dong.find((x) =>
            where.userId ? x.userId === where.userId : x.token === where.token,
          );
          return Promise.resolve(
            d
              ? {
                  ...d,
                  user: {
                    fullName: 'Lê Hữu Đại',
                    suspendedAt: goi.biKhoa ? new Date() : null,
                  },
                }
              : null,
          );
        },
      ),
      upsert: jest.fn(({ where, create, update }: ThamSoUpsert) => {
        const cu = dong.find((x) => x.userId === where.userId);
        if (cu) {
          Object.assign(cu, update);
          return Promise.resolve({ ...cu });
        }
        const moi: DongGia = {
          id: `cf-${dong.length + 1}`,
          createdAt: new Date(),
          lastFetchedAt: null,
          ...create,
        };
        dong.push(moi);
        return Promise.resolve({ ...moi });
      }),
      deleteMany: jest.fn(({ where }: { where: { userId: string } }) => {
        const viTri = dong.findIndex((x) => x.userId === where.userId);
        if (viTri >= 0) dong.splice(viTri, 1);
        return Promise.resolve({ count: viTri >= 0 ? 1 : 0 });
      }),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { lastFetchedAt: Date };
        }) => {
          const d = dong.find((x) => x.id === where.id);
          if (d) d.lastFetchedAt = data.lastFetchedAt;
          return Promise.resolve({ count: d ? 1 : 0 });
        },
      ),
    },
  };
  const events = {
    layMucLichTheoWorkspace: jest
      .fn()
      .mockResolvedValue([viec(1, new Date('2026-10-10T16:59:00Z'))]),
  };
  const service = new LichDongBoService(prisma as never, events as never);
  return { service, prisma, events, goi, dong };
}

async function loiCua(viec: Promise<unknown>) {
  try {
    await viec;
  } catch (e) {
    if (e instanceof HttpException) {
      return { status: e.getStatus(), body: e.getResponse() };
    }
    throw e;
  }
  throw new Error('Không ném lỗi');
}

async function taoLink(service: LichDongBoService, lang: 'vi' | 'en' = 'vi') {
  const { url } = await service.taoHoacDoiLink(U, lang);
  return LINK.exec(url ?? '')?.[1] ?? '';
}

afterEach(() => {
  delete process.env.CALENDAR_FEED_BASE_URL;
});

describe('LichDongBoService — trạng thái, tạo, đổi, tắt link', () => {
  it('có gói, chưa có link', async () => {
    const { service } = taoService();
    await expect(service.layTrangThai(U)).resolves.toEqual({
      duocDung: true,
      coLink: false,
    });
  });

  it('gói Miễn phí: không được dùng; tạo link bị 403 đúng mã, không ghi gì', async () => {
    const { service, prisma, goi } = taoService();
    goi.pro = false;
    goi.workspaces = [];
    await expect(service.layTrangThai(U)).resolves.toEqual({
      duocDung: false,
      coLink: false,
    });
    expect(await loiCua(service.taoHoacDoiLink(U, 'vi'))).toEqual({
      status: 403,
      body: {
        statusCode: 403,
        code: 'CALENDAR_FEED_NOT_IN_PLAN',
        message: 'Đồng bộ lịch dành cho gói Pro và Team.',
      },
    });
    expect(prisma.calendarFeed.upsert).not.toHaveBeenCalled();
  });

  it('tạo link: mã 43 ký tự base64url, link đẹp mặc định, lưu ngôn ngữ', async () => {
    const { service, dong } = taoService();
    const trangThai = await service.taoHoacDoiLink(U, 'en');
    expect(trangThai).toEqual({
      duocDung: true,
      coLink: true,
      url: expect.stringMatching(LINK),
      taoLuc: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      layLanCuoi: null,
    });
    expect(dong).toHaveLength(1);
    expect(dong[0].language).toBe('en');
    await expect(service.layTrangThai(U)).resolves.toEqual(trangThai);
  });

  it('CALENDAR_FEED_BASE_URL đổi được gốc link, bỏ "/" cuối', async () => {
    process.env.CALENDAR_FEED_BASE_URL = 'https://staging.wedo.test/lich/';
    const { service, dong } = taoService();
    const { url } = await service.taoHoacDoiLink(U, 'vi');
    expect(url).toBe(`https://staging.wedo.test/lich/${dong[0].token}.ics`);
  });

  it('tạo link mới: mã cũ chết ngay (404), mã mới chạy, "lần cuối lấy" về null', async () => {
    const { service, dong } = taoService();
    const cu = await taoLink(service);
    await service.layTepLich(cu, BAY_GIO);
    expect(dong[0].lastFetchedAt).toEqual(BAY_GIO);

    const moi = await taoLink(service);
    expect(moi).not.toBe(cu);
    expect(dong).toHaveLength(1);
    expect(dong[0].lastFetchedAt).toBeNull();
    await expect(service.layTepLich(cu, BAY_GIO)).resolves.toBeNull();
    await expect(service.layTepLich(moi, BAY_GIO)).resolves.not.toBeNull();
  });

  it('tắt đồng bộ: xoá dòng, gọi lại không lỗi, link cũ 404', async () => {
    const { service } = taoService();
    const token = await taoLink(service);
    await service.tatDongBo(U);
    await expect(service.tatDongBo(U)).resolves.toBeUndefined();
    await expect(service.layTrangThai(U)).resolves.toEqual({
      duocDung: true,
      coLink: false,
    });
    await expect(service.layTepLich(token, BAY_GIO)).resolves.toBeNull();
  });
});

describe('LichDongBoService — tệp lịch', () => {
  it('mã sai dạng: null, không đọc cơ sở dữ liệu', async () => {
    const { service, prisma } = taoService();
    for (const sai of ['abc', `${'a'.repeat(43)}.ics`, `${'a'.repeat(42)}!`]) {
      await expect(service.layTepLich(sai, BAY_GIO)).resolves.toBeNull();
    }
    expect(prisma.calendarFeed.findUnique).not.toHaveBeenCalled();
  });

  it('mã không có, hay chủ tài khoản bị khoá: null', async () => {
    const { service, goi } = taoService();
    await expect(
      service.layTepLich('b'.repeat(43), BAY_GIO),
    ).resolves.toBeNull();
    const token = await taoLink(service);
    goi.biKhoa = true;
    await expect(service.layTepLich(token, BAY_GIO)).resolves.toBeNull();
  });

  it('có gói: lấy mục từ 30 ngày trước tới 180 ngày sau của mọi workspace được tính', async () => {
    const { service, events } = taoService();
    const tep = await service.layTepLich(await taoLink(service), BAY_GIO);

    expect(events.layMucLichTheoWorkspace).toHaveBeenCalledWith(
      U,
      ['w-1', 'w-2'],
      new Date(BAY_GIO.getTime() - 30 * NGAY),
      new Date(BAY_GIO.getTime() + 180 * NGAY),
    );
    expect(tep?.noiDung).toContain('\r\nX-WR-CALNAME:WeDo · Lê Hữu Đại\r\n');
    expect(tep?.noiDung).toContain('\r\nSUMMARY:Hạn: Việc 1 · EXE201\r\n');
    expect(tep?.noiDung).toContain('\r\nUID:task-t-1@wedofpt.com.vn\r\n');
  });

  it('link tạo bằng tiếng Anh thì lịch viết tiếng Anh', async () => {
    const { service } = taoService();
    const tep = await service.layTepLich(await taoLink(service, 'en'), BAY_GIO);
    expect(tep?.noiDung).toContain('\r\nSUMMARY:Due: Việc 1 · EXE201\r\n');
  });

  it('hết gói sau khi đã có link: lịch còn đúng một mục báo tạm dừng hôm nay', async () => {
    const { service, events, goi } = taoService();
    const token = await taoLink(service);
    goi.pro = false;
    goi.workspaces = [];

    const tep = await service.layTepLich(token, BAY_GIO);
    expect(tep?.noiDung.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(tep?.noiDung).toContain('UID:tam-dung@wedofpt.com.vn');
    expect(tep?.noiDung).toContain('DTSTART;VALUE=DATE:20261003');
    expect(events.layMucLichTheoWorkspace).not.toHaveBeenCalled();
  });

  it('Pro mà chưa ở workspace nào: lịch hợp lệ, rỗng, không báo tạm dừng', async () => {
    const { service, events, goi } = taoService();
    goi.workspaces = [];
    const tep = await service.layTepLich(await taoLink(service), BAY_GIO);
    expect(tep?.noiDung).toContain('BEGIN:VCALENDAR');
    expect(tep?.noiDung).not.toContain('BEGIN:VEVENT');
    expect(events.layMucLichTheoWorkspace).not.toHaveBeenCalled();
  });

  it('quá 2.000 mục: giữ 2.000 mục bắt đầu sớm nhất', async () => {
    const { service, events } = taoService();
    // Đưa vào theo thứ tự NGƯỢC để chắc là cắt theo giờ chứ không theo vị trí.
    events.layMucLichTheoWorkspace.mockResolvedValue(
      Array.from({ length: 2001 }, (_, i) =>
        viec(2000 - i, new Date(BAY_GIO.getTime() + (2000 - i) * 60 * PHUT)),
      ),
    );
    const tep = await service.layTepLich(await taoLink(service), BAY_GIO);
    expect(tep?.noiDung.match(/BEGIN:VEVENT/g)).toHaveLength(2000);
    expect(tep?.noiDung).toContain('UID:task-t-0@wedofpt.com.vn\r\n');
    expect(tep?.noiDung).toContain('UID:task-t-1999@wedofpt.com.vn\r\n');
    expect(tep?.noiDung).not.toContain('UID:task-t-2000@wedofpt.com.vn\r\n');
  });

  it('ETag là SHA-256 của nội dung; cùng dữ liệu lúc khác thì cùng byte, cùng ETag', async () => {
    const { service } = taoService();
    const token = await taoLink(service);
    const dau = await service.layTepLich(token, BAY_GIO);
    const sau = await service.layTepLich(
      token,
      new Date(BAY_GIO.getTime() + PHUT),
    );
    expect(dau?.etag).toBe(
      `"${createHash('sha256')
        .update(dau?.noiDung ?? '', 'utf8')
        .digest('hex')}"`,
    );
    expect(sau).toEqual(dau);
  });

  it('lastFetchedAt chỉ ghi khi lần ghi trước đã cách QUÁ 10 phút', async () => {
    const { service, prisma, dong } = taoService();
    const token = await taoLink(service);
    const luc = (phut: number, giay = 0) =>
      new Date(BAY_GIO.getTime() + phut * PHUT + giay * 1000);

    await service.layTepLich(token, luc(0));
    await service.layTepLich(token, luc(9));
    await service.layTepLich(token, luc(10));
    expect(prisma.calendarFeed.updateMany).toHaveBeenCalledTimes(1);
    expect(dong[0].lastFetchedAt).toEqual(luc(0));

    await service.layTepLich(token, luc(10, 1));
    expect(prisma.calendarFeed.updateMany).toHaveBeenCalledTimes(2);
    expect(dong[0].lastFetchedAt).toEqual(luc(10, 1));
  });
});
```

Run: `npx jest src/lich-dong-bo/lich-dong-bo.service.spec.ts`
Expected: FAIL — "Cannot find module './lich-dong-bo.service'".

- [ ] **Step 2: Viết mã lỗi**

`src/lich-dong-bo/lich-dong-bo.errors.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';

/**
 * Mã lỗi của đồng bộ lịch. Web dịch theo mã (src/i18n/loi.ts), app dịch theo
 * mã (cauLoiDongBoLich) — câu tiếng Việt dưới đây chỉ là câu mặc định.
 */
export const MA_LOI_NGOAI_GOI = 'CALENDAR_FEED_NOT_IN_PLAN';

/** Tạo link khi không có Pro cá nhân, cũng không ở workspace Team nào. */
export function loiNgoaiGoi(): ForbiddenException {
  return new ForbiddenException({
    statusCode: 403,
    code: MA_LOI_NGOAI_GOI,
    message: 'Đồng bộ lịch dành cho gói Pro và Team.',
  });
}
```

- [ ] **Step 3: Viết service**

`src/lich-dong-bo/lich-dong-bo.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { NGAY_MS } from '../common/ngay-vn';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  GOC_LINK_MAC_DINH,
  MA_HOP_LE,
  NGAY_SAU,
  NGAY_TRUOC,
  PHUT_GHI_LAN_LAY,
  TOI_DA_MUC,
  type NgonNguLich,
} from './hang-so';
import { vietIcs, type MucLich } from './ics';
import { loiNgoaiGoi } from './lich-dong-bo.errors';
import { doiSangMucLich, mucTamDung, tenLich } from './muc-lich';
import { phamViDongBo } from './pham-vi-goi';

export interface TrangThaiDongBoLich {
  /** Gói cho phép dùng (spec mục 2.2) — web/app hiện nút hay lời mời nâng cấp theo đây. */
  duocDung: boolean;
  coLink: boolean;
  url?: string;
  taoLuc?: string;
  layLanCuoi?: string | null;
}

interface DongLink {
  token: string;
  createdAt: Date;
  lastFetchedAt: Date | null;
}

/**
 * Gốc link trả cho người dùng. `CALENDAR_FEED_BASE_URL` không bắt buộc: thiếu
 * thì dùng `https://wedofpt.com.vn/lich` (Vercel chuyển tiếp `/lich/:tep` về
 * API), nên production không phải khai thêm gì. Bỏ `/` cuối nếu có.
 */
function gocLink(): string {
  return (process.env.CALENDAR_FEED_BASE_URL || GOC_LINK_MAC_DINH).replace(
    /\/+$/,
    '',
  );
}

const soSanhMuc = (a: MucLich, b: MucLich) =>
  a.batDau.getTime() - b.batDau.getTime() ||
  (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);

@Injectable()
export class LichDongBoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async layTrangThai(userId: string): Promise<TrangThaiDongBoLich> {
    const [phamVi, link] = await Promise.all([
      phamViDongBo(this.prisma, userId, new Date()),
      this.prisma.calendarFeed.findUnique({
        where: { userId },
        select: { token: true, createdAt: true, lastFetchedAt: true },
      }),
    ]);
    return this.trangThai(phamVi.coGoi, link);
  }

  /**
   * Chưa có link thì tạo, đã có thì đổi mã: link cũ chết ngay vì `token` là
   * khoá duy nhất. Đổi mã cũng đặt lại `taoLuc` và xoá "lần cuối lấy" — link
   * mới chưa được lịch nào lấy.
   */
  async taoHoacDoiLink(
    userId: string,
    lang: NgonNguLich,
  ): Promise<TrangThaiDongBoLich> {
    const phamVi = await phamViDongBo(this.prisma, userId, new Date());
    if (!phamVi.coGoi) throw loiNgoaiGoi();

    const token = randomBytes(32).toString('base64url');
    const link = await this.prisma.calendarFeed.upsert({
      where: { userId },
      create: { userId, token, language: lang },
      update: {
        token,
        language: lang,
        createdAt: new Date(),
        lastFetchedAt: null,
      },
      select: { token: true, createdAt: true, lastFetchedAt: true },
    });
    return this.trangThai(true, link);
  }

  /** Xoá dòng; chưa có cũng không lỗi (gọi lại nhiều lần vẫn 204). */
  async tatDongBo(userId: string): Promise<void> {
    await this.prisma.calendarFeed.deleteMany({ where: { userId } });
  }

  /**
   * Nội dung `.ics` cho đường công khai. `null` (→ 404) khi mã sai dạng, không
   * có, đã thu hồi, hay chủ tài khoản bị khoá. Phạm vi gói tính lại mỗi lần.
   */
  async layTepLich(
    token: string,
    bayGio: Date = new Date(),
  ): Promise<{ noiDung: string; etag: string } | null> {
    if (!MA_HOP_LE.test(token)) return null;
    const link = await this.prisma.calendarFeed.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        language: true,
        lastFetchedAt: true,
        user: { select: { fullName: true, suspendedAt: true } },
      },
    });
    if (!link || link.user.suspendedAt) return null;

    const lang: NgonNguLich = link.language === 'en' ? 'en' : 'vi';
    const mucs = await this.mucCuaLich(link.userId, lang, bayGio);
    const noiDung = vietIcs({ ten: tenLich(link.user.fullName), mucs });
    await this.ghiLanLay(link.id, link.lastFetchedAt, bayGio);
    return {
      noiDung,
      etag: `"${createHash('sha256').update(noiDung, 'utf8').digest('hex')}"`,
    };
  }

  private async mucCuaLich(
    userId: string,
    lang: NgonNguLich,
    bayGio: Date,
  ): Promise<MucLich[]> {
    const phamVi = await phamViDongBo(this.prisma, userId, bayGio);
    // Hết gói: một mục thông báo, để dữ liệu cũ không nằm lại lỗi thời.
    if (!phamVi.coGoi) return [mucTamDung(lang, bayGio)];
    if (phamVi.workspaceIds.length === 0) return [];

    const nguon = await this.events.layMucLichTheoWorkspace(
      userId,
      phamVi.workspaceIds,
      new Date(bayGio.getTime() - NGAY_TRUOC * NGAY_MS),
      new Date(bayGio.getTime() + NGAY_SAU * NGAY_MS),
    );
    /*
      Sắp lại theo giờ bắt đầu TRONG LỊCH (hạn chót lùi 30 phút) rồi theo UID:
      các truy vấn chỉ sắp theo một cột giờ, hai mục trùng giờ có thể đổi chỗ
      giữa hai lần đọc — tệp đổi byte, ETag đổi, lịch tải lại vô ích.
    */
    return nguon
      .map((muc) => doiSangMucLich(muc, lang))
      .sort(soSanhMuc)
      .slice(0, TOI_DA_MUC);
  }

  /**
   * Google lấy lịch nhiều lần mỗi giờ; ghi mỗi lần là một lượt ghi cơ sở dữ
   * liệu vô ích. Chỉ ghi khi lần trước đã cách quá 10 phút. `updateMany` để
   * link vừa bị đổi mã hay tắt giữa chừng không làm lượt lấy lịch lỗi 500.
   */
  private async ghiLanLay(
    id: string,
    lanTruoc: Date | null,
    bayGio: Date,
  ): Promise<void> {
    if (
      lanTruoc &&
      bayGio.getTime() - lanTruoc.getTime() <= PHUT_GHI_LAN_LAY * 60 * 1000
    ) {
      return;
    }
    await this.prisma.calendarFeed.updateMany({
      where: { id },
      data: { lastFetchedAt: bayGio },
    });
  }

  private trangThai(
    duocDung: boolean,
    link: DongLink | null,
  ): TrangThaiDongBoLich {
    if (!link) return { duocDung, coLink: false };
    return {
      duocDung,
      coLink: true,
      url: `${gocLink()}/${link.token}.ics`,
      taoLuc: link.createdAt.toISOString(),
      layLanCuoi: link.lastFetchedAt?.toISOString() ?? null,
    };
  }
}
```

- [ ] **Step 4: Ghi chú biến môi trường không bắt buộc**

Thêm cuối `.env.example` (một dòng trống phía trước):

```bash
# --- Đồng bộ lịch (link .ics cho Google Calendar, Lịch Apple, Outlook) ---
# Không bắt buộc. Gốc của link trả cho người dùng; để trống thì dùng
# https://wedofpt.com.vn/lich (Vercel chuyển tiếp /lich/<mã>.ics về máy chủ này).
CALENDAR_FEED_BASE_URL=""
```

- [ ] **Step 5: Chạy lại**

Run: `npx jest src/lich-dong-bo && npx tsc --noEmit -p tsconfig.json && npx eslint src/lich-dong-bo --max-warnings 0 && npm run test:ops`
Expected: PASS (5 bộ, 54 bài: 5 + 15 + 10 + 9 + 15); tsc, eslint sạch; `test:ops` 56 bài xanh (không bài ops nào đọc `.env.example` theo danh sách khoá).

- [ ] **Step 6: Commit**

```bash
git add src/lich-dong-bo/lich-dong-bo.errors.ts src/lich-dong-bo/lich-dong-bo.service.ts src/lich-dong-bo/lich-dong-bo.service.spec.ts .env.example
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): service tao, doi, tat link va dung tep lich co ETag" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R7: DTO, hai controller, bộ lọc lỗi dạng chữ và đăng ký module

**Files:**
- Create: `src/lich-dong-bo/dto/tao-link-dong-bo-lich.dto.ts`
- Create: `src/lich-dong-bo/loi-tep-lich.ts`
- Test: `src/lich-dong-bo/loi-tep-lich.spec.ts`
- Create: `src/lich-dong-bo/lich-dong-bo.controller.ts`
- Test: `src/lich-dong-bo/lich-dong-bo.http.spec.ts`
- Create: `src/lich-dong-bo/lich-dong-bo.module.ts`
- Modify: `src/events/events.module.ts` (dòng 9)
- Modify: `src/app.module.ts` (import sau dòng 25; mảng `imports` sau `BaoCaoDongGopModule,` dòng 53)

**Interfaces:**
- Consumes: `LichDongBoService`, `TrangThaiDongBoLich` (R6); `TEP_HOP_LE`, `NgonNguLich` (R2); `JwtAuthGuard`, `YeuCauDaXacThuc`; `EventsService` (export từ `EventsModule`); `@sentry/nestjs` (`captureException`, đã có trong `dependencies`).
- Produces:
  - `GET /calendar-feed` (đăng nhập) → 200 `TrangThaiDongBoLich`
  - `POST /calendar-feed` (đăng nhập) thân `{ lang?: 'vi' | 'en' }` → 200 `TrangThaiDongBoLich`; không có gói → 403 `CALENDAR_FEED_NOT_IN_PLAN`; khoá lạ/`lang` sai → 400
  - `DELETE /calendar-feed` (đăng nhập) → 204, gọi lại vẫn 204
  - `GET /calendar-feed/:tep` (công khai) → 200 `text/calendar; charset=utf-8` + `Content-Disposition: inline; filename="wedo.ics"` + `Cache-Control: private, max-age=900` + `ETag` + `X-Robots-Tag: noindex`; `If-None-Match` khớp → 304; sai/thu hồi/bị khoá → 404 `text/plain`; lỗi → 500 `text/plain` + `Sentry.captureException`
  - `export class TaoLinkDongBoLichDto`, `export function chuLoiTepLich(ma: number): string`, `export class LoiTepLichFilter`, `export function khopEtag(ifNoneMatch: string | undefined, etag: string): boolean`, `export class LichDongBoController`, `export class TepLichController`, `export class LichDongBoModule`

- [ ] **Step 1: Viết bài kiểm thất bại cho bộ lọc lỗi và `khopEtag`**

`src/lich-dong-bo/loi-tep-lich.spec.ts`:

```ts
import { HttpException, NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { khopEtag } from './lich-dong-bo.controller';
import { chuLoiTepLich, LoiTepLichFilter } from './loi-tep-lich';

jest.mock('@sentry/nestjs', () => ({ captureException: jest.fn() }));

function chay(loi: unknown) {
  const res = { status: jest.fn(), set: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  res.set.mockReturnValue(res);
  new LoiTepLichFilter().catch(loi, {
    switchToHttp: () => ({ getResponse: () => res }),
  } as never);
  return res;
}

describe('LoiTepLichFilter', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each<[unknown, number, RegExp]>([
    [new NotFoundException(), 404, /Không tìm thấy lịch WeDo/],
    [new HttpException('x', 429), 429, /Quá nhiều yêu cầu/],
    [new Error('mật khẩu cơ sở dữ liệu lộ ra đây'), 500, /WeDo đang gặp lỗi/],
  ])('trường hợp %#: chữ ngắn hai thứ tiếng, không JSON', (loi, ma, cau) => {
    const res = chay(loi);
    expect(res.status).toHaveBeenCalledWith(ma);
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    });
    const than = String(res.send.mock.calls[0][0]);
    expect(than).toMatch(cau);
    expect(than).not.toContain('mật khẩu');
  });

  it('lỗi 5xx gửi Sentry, lỗi 404/429 thì không', () => {
    const loi = new Error('db');
    chay(loi);
    chay(new NotFoundException());
    chay(new HttpException('x', 429));
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(loi);
  });

  it('câu nào cũng có cả tiếng Việt và tiếng Anh', () => {
    for (const ma of [404, 429, 500]) {
      expect(chuLoiTepLich(ma)).toMatch(/ \/ [A-Z]/);
    }
  });
});

describe('khopEtag', () => {
  const ETAG = '"abc"';
  it.each<[string | undefined, boolean]>([
    [undefined, false],
    ['"khac"', false],
    ['"abc"', true],
    ['W/"abc"', true],
    ['"x", "abc"', true],
    ['*', true],
  ])('If-None-Match %s → %s', (giaTri, mong) => {
    expect(khopEtag(giaTri, ETAG)).toBe(mong);
  });
});
```

Run: `npx jest src/lich-dong-bo/loi-tep-lich.spec.ts`
Expected: FAIL — "Cannot find module './lich-dong-bo.controller'".

- [ ] **Step 2: Viết bài kiểm HTTP thất bại**

`src/lich-dong-bo/lich-dong-bo.http.spec.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { TaskStatus } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { createHash } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtStrategy } from '../auth/jwt.strategy';
import { nenTangKhachMiddleware } from '../common/nen-tang-khach';
import { RequestRateLimitGuard } from '../common/request-rate-limit.guard';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  LichDongBoController,
  TepLichController,
} from './lich-dong-bo.controller';
import { LichDongBoService } from './lich-dong-bo.service';
import type { MucNguon } from './muc-lich';

jest.mock('@sentry/nestjs', () => ({ captureException: jest.fn() }));

/**
 * Hợp đồng HTTP của đồng bộ lịch: đường dẫn, mã HTTP, header, thân lỗi, và
 * việc thân yêu cầu ĐÚNG NHƯ web/app gửi qua được ValidationPipe cấu hình y
 * như `main.ts`. JwtStrategy thật, middleware nền tảng thật, guard hạn mức
 * thật (như AppModule), service thật; chỉ cơ sở dữ liệu và truy vấn màn Lịch
 * là giả.
 */
const BI_MAT = 'bi-mat-kiem-thu';
const U = 'u1';
const accessToken = new JwtService({ secret: BI_MAT }).sign({
  sub: U,
  email: 'u1@wedo.vn',
});
const MA = 'A'.repeat(43);
const UA_LICH_IPHONE =
  'iOS/18.0 (22A3354) dataaccessd/1.0 CFNetwork/1568.100.1 Darwin/24.0.0';

type MucViec = Extract<MucNguon, { kind: 'TASK_DEADLINE' }>;
const HAN = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const task: MucViec['task'] = {
  id: 't-1',
  title: 'Nộp slide',
  description: null,
  status: TaskStatus.TODO,
  dueDate: HAN,
  workspaceId: 'w-1',
  projectId: 'p-1',
  updatedAt: new Date('2026-10-01T00:00:00Z'),
  project: { id: 'p-1', name: 'EXE201' },
  assignee: {
    id: U,
    fullName: 'Người u1',
    email: 'u1@wedo.vn',
    avatarUrl: null,
  },
};
const VIEC: MucViec = {
  id: 't-1',
  kind: 'TASK_DEADLINE',
  title: task.title,
  description: null,
  startTime: HAN,
  endTime: HAN,
  workspaceId: 'w-1',
  task,
};

describe('HTTP đồng bộ lịch', () => {
  let app: INestApplication<App>;
  const goi = { pro: true, biKhoa: false };
  let dong: {
    id: string;
    userId: string;
    token: string;
    language: string;
    createdAt: Date;
    lastFetchedAt: Date | null;
  } | null;
  const events = { layMucLichTheoWorkspace: jest.fn() };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: U,
          email: 'u1@wedo.vn',
          fullName: 'Người u1',
          platformRole: 'USER',
          suspendedAt: null,
          passwordChangedAt: null,
        }),
      ),
    },
    subscription: {
      findFirst: jest.fn(() => Promise.resolve(goi.pro ? { id: 'sub' } : null)),
    },
    workspace: {
      findMany: jest.fn(() => Promise.resolve(goi.pro ? [{ id: 'w-1' }] : [])),
    },
    calendarFeed: {
      findUnique: jest.fn(
        ({ where }: { where: { userId?: string; token?: string } }) =>
          Promise.resolve(
            dong && (where.userId === dong.userId || where.token === dong.token)
              ? {
                  ...dong,
                  user: {
                    fullName: 'Người u1',
                    suspendedAt: goi.biKhoa ? new Date() : null,
                  },
                }
              : null,
          ),
      ),
      upsert: jest.fn(
        ({
          create,
          update,
        }: {
          create: { userId: string; token: string; language: string };
          update: { token: string; language: string };
        }) => {
          dong = dong
            ? { ...dong, ...update, lastFetchedAt: null }
            : {
                id: 'cf-1',
                createdAt: new Date(),
                lastFetchedAt: null,
                ...create,
              };
          return Promise.resolve(dong);
        },
      ),
      deleteMany: jest.fn(() => {
        dong = null;
        return Promise.resolve({ count: 1 });
      }),
      updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    goi.pro = true;
    goi.biKhoa = false;
    dong = {
      id: 'cf-1',
      userId: U,
      token: MA,
      language: 'vi',
      createdAt: new Date('2026-10-01T00:00:00Z'),
      lastFetchedAt: null,
    };
    events.layMucLichTheoWorkspace.mockResolvedValue([VIEC]);
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [LichDongBoController, TepLichController],
      providers: [
        JwtStrategy,
        { provide: APP_GUARD, useClass: RequestRateLimitGuard },
        LichDongBoService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: events },
        { provide: ConfigService, useValue: { get: () => BI_MAT } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Y hệt `main.ts`: middleware nền tảng (đọc User-Agent) và ValidationPipe.
    app.use(nenTangKhachMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('cần đăng nhập', () => {
    it('chưa đăng nhập: 401 cho cả GET, POST, DELETE', async () => {
      const may = request(app.getHttpServer());
      await may.get('/calendar-feed').expect(401);
      await may.post('/calendar-feed').send({ lang: 'vi' }).expect(401);
      await may.delete('/calendar-feed').expect(401);
      expect(prisma.calendarFeed.upsert).not.toHaveBeenCalled();
    });

    it('GET trả trạng thái có link', async () => {
      const res = await request(app.getHttpServer())
        .get('/calendar-feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body).toEqual({
        duocDung: true,
        coLink: true,
        url: `https://wedofpt.com.vn/lich/${MA}.ics`,
        taoLuc: '2026-10-01T00:00:00.000Z',
        layLanCuoi: null,
      });
    });

    it('POST { lang } đổi mã: 200, cùng hình như GET, mã mới khác mã cũ', async () => {
      const res = await request(app.getHttpServer())
        .post('/calendar-feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lang: 'en' })
        .expect(200);
      expect(res.body).toMatchObject({ duocDung: true, coLink: true });
      expect(res.body.url).toMatch(
        /^https:\/\/wedofpt\.com\.vn\/lich\/[A-Za-z0-9_-]{43}\.ics$/,
      );
      expect(res.body.url).not.toContain(MA);
      expect(prisma.calendarFeed.upsert.mock.calls[0][0].update.language).toBe(
        'en',
      );
    });

    it.each([{ lang: 'fr' }, { lang: 'vi', userId: 'u2' }])(
      'thân sai (%j) → 400',
      async (than) => {
        await request(app.getHttpServer())
          .post('/calendar-feed')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(than)
          .expect(400);
        expect(prisma.calendarFeed.upsert).not.toHaveBeenCalled();
      },
    );

    it('gói Miễn phí: POST 403 với mã CALENDAR_FEED_NOT_IN_PLAN', async () => {
      goi.pro = false;
      const res = await request(app.getHttpServer())
        .post('/calendar-feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lang: 'vi' })
        .expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        code: 'CALENDAR_FEED_NOT_IN_PLAN',
        message: 'Đồng bộ lịch dành cho gói Pro và Team.',
      });
    });

    it('DELETE: 204, gọi lại vẫn 204', async () => {
      for (let i = 0; i < 2; i += 1) {
        const res = await request(app.getHttpServer())
          .delete('/calendar-feed')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);
        expect(res.text).toBe('');
      }
    });
  });

  describe('công khai: GET /calendar-feed/:tep', () => {
    it('200 với đủ header; ETag là SHA-256 của nội dung', async () => {
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .expect(200);
      expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');
      expect(res.headers['content-disposition']).toBe(
        'inline; filename="wedo.ics"',
      );
      expect(res.headers['cache-control']).toBe('private, max-age=900');
      expect(res.headers['x-robots-tag']).toBe('noindex');
      expect(res.headers.etag).toBe(
        `"${createHash('sha256').update(res.text, 'utf8').digest('hex')}"`,
      );
      expect(res.text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
      expect(res.text).toContain('SUMMARY:Hạn: Nộp slide · EXE201');
    });

    it('If-None-Match trùng ETag → 304 không thân', async () => {
      const dau = await request(app.getHttpServer()).get(
        `/calendar-feed/${MA}.ics`,
      );
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .set('If-None-Match', String(dau.headers.etag))
        .expect(304);
      expect(res.text).toBe('');
      expect(res.headers.etag).toBe(dau.headers.etag);
    });

    it('Lịch iPhone (User-Agent CFNetwork) vẫn nhận lịch đầy đủ của người có Pro', async () => {
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .set('User-Agent', UA_LICH_IPHONE)
        .expect(200);
      expect(res.text).toContain('UID:task-t-1@wedofpt.com.vn');
      expect(res.text).not.toContain('tam-dung@wedofpt.com.vn');
    });

    it.each([
      'abc.ics',
      `${MA}.txt`,
      `${MA}`,
      `${'A'.repeat(42)}.ics`,
      `${'A'.repeat(42)}%2B.ics`,
    ])(
      'tên tệp sai dạng (%s) → 404 dạng chữ, không đọc cơ sở dữ liệu',
      async (tep) => {
        const res = await request(app.getHttpServer())
          .get(`/calendar-feed/${tep}`)
          .expect(404);
        expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
        expect(res.text).toContain('Không tìm thấy lịch WeDo');
        expect(prisma.calendarFeed.findUnique).not.toHaveBeenCalled();
      },
    );

    it('mã đã thu hồi → 404; tài khoản bị khoá → 404', async () => {
      const cu = await request(app.getHttpServer())
        .post('/calendar-feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lang: 'vi' })
        .expect(200);
      expect(cu.body.url).not.toContain(MA);
      await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .expect(404);

      goi.biKhoa = true;
      const moi = String(cu.body.url).split('/').pop();
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${moi}`)
        .expect(404);
      expect(res.text).toContain('WeDo calendar not found');
    });

    it('lỗi máy chủ → 500 dạng chữ ngắn, không lộ chi tiết, có báo Sentry', async () => {
      const loi = new Error('connect ECONNREFUSED 10.0.0.5:5432');
      events.layMucLichTheoWorkspace.mockRejectedValue(loi);
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .expect(500);
      expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toContain('WeDo đang gặp lỗi');
      expect(res.text).not.toContain('ECONNREFUSED');
      expect(Sentry.captureException).toHaveBeenCalledWith(loi);
    });
  });
});
```

(Guard hạn mức thật được gắn như `AppModule` ngay từ bây giờ; luật riêng của đồng bộ lịch tới R8 mới có, bài 429 cũng thêm ở R8.)

Run: `npx jest src/lich-dong-bo/lich-dong-bo.http.spec.ts`
Expected: FAIL — "Cannot find module './lich-dong-bo.controller'".

- [ ] **Step 3: Viết DTO và bộ lọc lỗi**

`src/lich-dong-bo/dto/tao-link-dong-bo-lich.dto.ts`:

```ts
import { IsIn, IsOptional } from 'class-validator';
import type { NgonNguLich } from '../hang-so';

/**
 * Thân của `POST /calendar-feed`. Ngôn ngữ của lịch theo ngôn ngữ giao diện
 * lúc tạo link; thiếu thì `vi` (app Android chỉ có tiếng Việt).
 */
export class TaoLinkDongBoLichDto {
  @IsOptional()
  @IsIn(['vi', 'en'], { message: 'Ngôn ngữ chỉ nhận vi hoặc en.' })
  lang?: NgonNguLich;
}
```

`src/lich-dong-bo/loi-tep-lich.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Response } from 'express';

/**
 * Câu lỗi ngắn hai thứ tiếng cho đường công khai `GET /calendar-feed/:tep`.
 * Người đọc là ứng dụng lịch (và người dán thử link vào trình duyệt): không
 * JSON, không chi tiết lỗi, không lộ mã có tồn tại hay không.
 */
export function chuLoiTepLich(ma: number): string {
  if (ma === 429) {
    return 'Quá nhiều yêu cầu, thử lại sau ít phút. / Too many requests, try again later.\n';
  }
  if (ma >= 500) {
    return 'WeDo đang gặp lỗi, lịch sẽ tự cập nhật lại sau. / WeDo had an error; your calendar will refresh later.\n';
  }
  return 'Không tìm thấy lịch WeDo này. / WeDo calendar not found.\n';
}

/**
 * Chỉ gắn vào đường lấy tệp lịch. Bắt MỌI lỗi (kể cả 429 của guard hạn mức):
 * lỗi 5xx gửi Sentry trước — bộ lọc riêng của đường này thay chỗ
 * SentryGlobalFilter, không gửi thì lỗi 500 biến mất lặng lẽ — rồi trả câu
 * ngắn, không lộ chi tiết. Lịch của người dùng giữ bản cũ và thử lại sau.
 */
@Catch()
export class LoiTepLichFilter implements ExceptionFilter {
  catch(loi: unknown, host: ArgumentsHost): void {
    const ma = loi instanceof HttpException ? loi.getStatus() : 500;
    if (ma >= 500) Sentry.captureException(loi);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(ma)
      .set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      })
      .send(chuLoiTepLich(ma));
  }
}
```

- [ ] **Step 4: Viết controller và module**

`src/lich-dong-bo/lich-dong-bo.controller.ts`:

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { YeuCauDaXacThuc } from '../auth/yeu-cau-da-xac-thuc';
import { TaoLinkDongBoLichDto } from './dto/tao-link-dong-bo-lich.dto';
import { TEP_HOP_LE } from './hang-so';
import {
  LichDongBoService,
  type TrangThaiDongBoLich,
} from './lich-dong-bo.service';
import { LoiTepLichFilter } from './loi-tep-lich';

/**
 * `If-None-Match` có khớp ETag hiện tại không. Nhận danh sách cách nhau bằng
 * dấu phẩy, dạng yếu `W/"…"` và `*` như RFC 9110 mục 13.1.2.
 */
export function khopEtag(
  ifNoneMatch: string | undefined,
  etag: string,
): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(',')
    .map((the) => the.trim().replace(/^W\//, ''))
    .some((the) => the === '*' || the === etag);
}

/** Tạo, đổi, tắt link — cần đăng nhập. */
@UseGuards(JwtAuthGuard)
@Controller('calendar-feed')
export class LichDongBoController {
  constructor(private readonly lich: LichDongBoService) {}

  @Get()
  layTrangThai(@Req() req: YeuCauDaXacThuc): Promise<TrangThaiDongBoLich> {
    return this.lich.layTrangThai(req.user.id);
  }

  /** 200 với cùng hình như GET, để web và app dùng chung một cách đọc. */
  @Post()
  @HttpCode(200)
  taoHoacDoiLink(
    @Req() req: YeuCauDaXacThuc,
    @Body() dto: TaoLinkDongBoLichDto,
  ): Promise<TrangThaiDongBoLich> {
    return this.lich.taoHoacDoiLink(req.user.id, dto.lang ?? 'vi');
  }

  @Delete()
  @HttpCode(204)
  async tatDongBo(@Req() req: YeuCauDaXacThuc): Promise<void> {
    await this.lich.tatDongBo(req.user.id);
  }
}

/**
 * Đường công khai mà Google Calendar, Lịch Apple, Outlook gọi định kỳ. Mã bí
 * mật trong tên tệp thay cho đăng nhập. Hai đoạn đường dẫn nên không đụng
 * `GET /calendar-feed` (cần đăng nhập) ở controller trên.
 */
@Controller('calendar-feed')
export class TepLichController {
  constructor(private readonly lich: LichDongBoService) {}

  @Get(':tep')
  @UseFilters(LoiTepLichFilter)
  async layTep(
    @Param('tep') tep: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const khop = TEP_HOP_LE.exec(tep);
    const tepLich = khop ? await this.lich.layTepLich(khop[1]) : null;
    if (!tepLich) throw new NotFoundException();

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="wedo.ics"',
      'Cache-Control': 'private, max-age=900',
      ETag: tepLich.etag,
      'X-Robots-Tag': 'noindex',
    });
    if (khopEtag(ifNoneMatch, tepLich.etag)) {
      res.status(304).end();
      return;
    }
    res.status(200).send(tepLich.noiDung);
  }
}
```

`src/lich-dong-bo/lich-dong-bo.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  LichDongBoController,
  TepLichController,
} from './lich-dong-bo.controller';
import { LichDongBoService } from './lich-dong-bo.service';

/** Link đồng bộ lịch (iCalendar). Dùng lại truy vấn của màn Lịch qua EventsModule. */
@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [LichDongBoController, TepLichController],
  providers: [LichDongBoService],
})
export class LichDongBoModule {}
```

Trong `src/events/events.module.ts`, thay dòng 9 `  providers: [EventsService],` bằng:

```ts
  providers: [EventsService],
  // Link đồng bộ lịch (src/lich-dong-bo) dùng lại truy vấn của màn Lịch.
  exports: [EventsService],
```

Trong `src/app.module.ts`: thêm `import { LichDongBoModule } from './lich-dong-bo/lich-dong-bo.module';` ngay sau dòng 25 (`import { BaoCaoDongGopModule } …`), và thêm `    LichDongBoModule,` ngay sau `    BaoCaoDongGopModule,` (dòng 53) trong mảng `imports`.

- [ ] **Step 5: Chạy lại, kể cả bài nối dây AppModule**

Run: `npx jest src/lich-dong-bo src/events src/common/request-rate-limit.wiring.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src --max-warnings 0`
Expected: PASS — `loi-tep-lich.spec.ts` 11 bài, `lich-dong-bo.http.spec.ts` 17 bài, toàn bộ `src/lich-dong-bo` 82 bài, `src/events` 9 bài; `request-rate-limit.wiring.spec.ts` vẫn thấy đúng một guard có JwtService (module mới không đăng ký JwtModule); tsc, eslint sạch.
- [ ] **Step 6: Commit**

```bash
git add src/lich-dong-bo/dto src/lich-dong-bo/loi-tep-lich.ts src/lich-dong-bo/loi-tep-lich.spec.ts src/lich-dong-bo/lich-dong-bo.controller.ts src/lich-dong-bo/lich-dong-bo.http.spec.ts src/lich-dong-bo/lich-dong-bo.module.ts src/events/events.module.ts src/app.module.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): API calendar-feed dang nhap va duong cong khai .ics" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R8: Giới hạn tần suất của đồng bộ lịch

**Files:**
- Modify: `src/common/request-rate-limit.guard.ts` (import dòng 10; `interface RateLimitRule` dòng 26; `resolveRules` dòng 135; `clientKey` dòng 148; `resolveRule` trước bình luận dòng 240)
- Test: `src/common/request-rate-limit.guard.spec.ts` (thêm `describe` trước dấu `});` đóng `describe('RequestRateLimitGuard')` ở dòng 510)
- Test: `src/lich-dong-bo/lich-dong-bo.http.spec.ts` (thêm một bài 429)

**Interfaces:**
- Consumes: `TEP_HOP_LE` (R2).
- Produces:
  - `RateLimitRule.khoaRieng?: string` — khoá đếm cố định thay cho người/IP (bucket `k:<khoaRieng>:<key>`).
  - `GET /calendar-feed/:tep`: luật `calendar-feed-ip` (600/phút/IP) + `calendar-feed-token` (30/phút cho mỗi mã; chỉ khi tên tệp đúng dạng; mã giữ nguyên hoa thường).
  - `POST`/`DELETE /calendar-feed`: luật `calendar-feed` (10/phút/người, chung cho cả hai).

- [ ] **Step 1: Viết bài kiểm thất bại**

Trong `src/common/request-rate-limit.guard.spec.ts`, bên trong `describe('RequestRateLimitGuard', …)`, ngay sau `describe('báo cáo đóng góp', …)` (trước dấu `});` ở dòng 510), thêm:

```ts
  describe('đồng bộ lịch', () => {
    const tokenCua = (sub: string) =>
      jwt.sign({ sub, email: `${sub}@wedo.vn` });
    /** Mã 43 ký tự base64url khác nhau theo `so`. */
    const ma = (so: number) => String(so).padStart(43, 'a');
    const tepLich = (m: string) => `/calendar-feed/${m}.ics`;

    it('lấy lịch: 30 lượt mỗi phút cho mỗi mã, dù đến từ nhiều IP', () => {
      for (let i = 0; i < 30; i += 1) {
        expect(
          goi(
            guard,
            { method: 'GET', url: tepLich(ma(1)), ip: `10.0.0.${i}` },
            1,
          ),
        ).toBe(0);
      }
      expect(
        goi(guard, { method: 'GET', url: tepLich(ma(1)), ip: '10.0.1.1' }, 1),
      ).toBe(1);
      // Mã khác không bị ảnh hưởng.
      expect(goi(guard, { method: 'GET', url: tepLich(ma(2)) }, 1)).toBe(0);
    });

    it('mã phân biệt hoa thường: hai mã chỉ khác hoa/thường đếm riêng', () => {
      goi(guard, { method: 'GET', url: tepLich('A'.repeat(43)) }, 30);
      expect(
        goi(guard, { method: 'GET', url: tepLich('a'.repeat(43)) }, 1),
      ).toBe(0);
      expect(
        goi(guard, { method: 'GET', url: tepLich('A'.repeat(43)) }, 1),
      ).toBe(1);
    });

    it('một IP của Google lấy lịch cho nhiều người: tới 600 lượt mỗi phút', () => {
      let biChan = 0;
      for (let i = 0; i < 601; i += 1) {
        biChan += goi(
          guard,
          { method: 'GET', url: tepLich(ma(i)), ip: '66.249.1.1' },
          1,
        );
      }
      expect(biChan).toBe(1);
      expect(
        goi(guard, { method: 'GET', url: tepLich(ma(1)), ip: '66.249.1.2' }, 1),
      ).toBe(0);
    });

    it('tên tệp sai dạng chỉ tính theo IP', () => {
      expect(
        goi(guard, { method: 'GET', url: '/calendar-feed/rac.ics' }, 600),
      ).toBe(0);
      expect(
        goi(guard, { method: 'GET', url: '/calendar-feed/rac-khac.ics' }, 1),
      ).toBe(1);
    });

    it('tạo/đổi và tắt link chung hạn mức 10 lượt mỗi phút mỗi người', () => {
      const token = tokenCua('u-1');
      expect(
        goi(guard, { method: 'POST', url: '/calendar-feed', token }, 5),
      ).toBe(0);
      expect(
        goi(guard, { method: 'DELETE', url: '/calendar-feed', token }, 5),
      ).toBe(0);
      expect(
        goi(guard, { method: 'POST', url: '/calendar-feed/', token }, 1),
      ).toBe(1);
      expect(
        goi(
          guard,
          { method: 'POST', url: '/calendar-feed', token: tokenCua('u-2') },
          1,
        ),
      ).toBe(0);
    });

    it('xem trạng thái (GET /calendar-feed) không bị hạn mức mới', () => {
      expect(
        goi(
          guard,
          { method: 'GET', url: '/calendar-feed', token: tokenCua('u-1') },
          50,
        ),
      ).toBe(0);
    });
  });
```

Trong `src/lich-dong-bo/lich-dong-bo.http.spec.ts`, thêm bài sau ngay TRƯỚC `    it('lỗi máy chủ → 500 dạng chữ ngắn, không lộ chi tiết, có báo Sentry', …` (trong `describe('công khai: GET /calendar-feed/:tep')`) — nó kiểm luật mới qua đúng đường HTTP, và kiểm rằng 429 do guard ném cũng đi qua bộ lọc riêng của đường lịch (ra chữ, không ra JSON):

```ts
    it('lượt thứ 31 trong một phút của cùng một mã → 429 dạng chữ (lỗi của guard cũng qua bộ lọc riêng)', async () => {
      for (let i = 0; i < 30; i += 1) {
        await request(app.getHttpServer())
          .get(`/calendar-feed/${MA}.ics`)
          .expect(200);
      }
      const res = await request(app.getHttpServer())
        .get(`/calendar-feed/${MA}.ics`)
        .expect(429);
      expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toContain('Too many requests');
    });
```

Run: `npx jest src/common/request-rate-limit.guard.spec.ts src/lich-dong-bo/lich-dong-bo.http.spec.ts`
Expected: FAIL đúng 6 bài: 5 bài trong "đồng bộ lịch" của guard — "30 lượt mỗi phút cho mỗi mã", "phân biệt hoa thường", "tới 600 lượt mỗi phút", "tên tệp sai dạng chỉ tính theo IP", "tạo/đổi và tắt link chung hạn mức" (đều nhận 0, mong 1) — và bài "lượt thứ 31…" của HTTP ("expected 429 "Too Many Requests", got 200 "OK""); "xem trạng thái" xanh; mọi bài cũ xanh.

- [ ] **Step 2: Thêm luật**

Trong `src/common/request-rate-limit.guard.ts`:

(a) Sau dòng 10 `import type { Request, Response } from 'express';` thêm:

```ts
import { TEP_HOP_LE } from '../lich-dong-bo/hang-so';
```

(b) Trong `interface RateLimitRule`, ngay sau `  perUser: boolean;` (dòng 26), thêm:

```ts
  /**
   * Khoá đếm cố định thay cho người/IP — ví dụ mã của link đồng bộ lịch: Google
   * lấy lịch của mọi người từ chung một nhóm IP, nên đếm theo mã mới công bằng.
   */
  khoaRieng?: string;
```

(c) Trong `resolveRules`, thay hai dòng cuối (dòng 135-136):

```ts
    const rule = this.resolveRule(request);
    return rule ? [rule] : [];
```

bằng:

```ts
    const lich = this.luatTepLich(request, method);
    if (lich) return lich;
    const rule = this.resolveRule(request);
    return rule ? [rule] : [];
```

và thêm phương thức mới ngay sau dấu `  }` đóng `resolveRules` (trước khối bình luận `/** Ai đang tiêu hạn mức này.`):

```ts

  /**
   * `GET /calendar-feed/:tep` — Google Calendar, Lịch Apple, Outlook gọi định
   * kỳ, không có access token. 30 lượt/phút cho MỖI MÃ (lấy từ đường dẫn gốc,
   * giữ hoa thường vì mã base64url phân biệt hoa thường) cộng một trần rộng
   * 600 lượt/phút/IP: Google lấy lịch của mọi người từ chung một nhóm IP, đếm
   * thuần theo IP sẽ chặn nhầm khi người dùng đông. Tên tệp sai dạng thì chỉ
   * tính theo IP, để chuỗi rác không đẻ ra vô số ô đếm.
   */
  private luatTepLich(
    request: Request,
    method: string,
  ): RateLimitRule[] | null {
    if (method !== 'GET') return null;
    const khop = /^\/calendar-feed\/([^/]+)\/?$/i.exec(
      request.originalUrl.split('?')[0],
    );
    if (!khop) return null;
    const ma = TEP_HOP_LE.exec(khop[1])?.[1];
    return [
      { key: 'calendar-feed-ip', max: 600, windowMs: 60_000, perUser: false },
      ...(ma
        ? [
            {
              key: 'calendar-feed-token',
              max: 30,
              windowMs: 60_000,
              perUser: false,
              khoaRieng: ma,
            },
          ]
        : []),
    ];
  }
```

(d) Trong `clientKey` (dòng 148), thêm dòng đầu thân hàm:

```ts
  private clientKey(request: Request, rule: RateLimitRule) {
    if (rule.khoaRieng) return `k:${rule.khoaRieng}`;
    if (rule.perUser) {
```

(e) Trong `resolveRule`, chèn ngay TRƯỚC dòng 240 `    // Tải bằng token: không có access token, chỉ IP nói được ai đang thử.` (tức là sau luật `contribution-report`, trước luật `write` chung):

```ts
    /*
      Tạo/đổi và tắt link đồng bộ lịch: mỗi lần tạo là một mã mới làm link cũ
      chết, không ai cần quá 10 lần mỗi phút. Theo người như mọi luật ghi.
    */
    if (
      (method === 'POST' || method === 'DELETE') &&
      /^\/calendar-feed\/?$/.test(path)
    ) {
      return {
        key: 'calendar-feed',
        max: 10,
        windowMs: 60_000,
        perUser: true,
      };
    }
```

Kiểm dấu `\` trong hai regex mới:

```bash
grep -n "calendar-feed" src/common/request-rate-limit.guard.ts
```

Expected có hai dòng `/^\/calendar-feed\/([^/]+)\/?$/i.exec(` và `/^\/calendar-feed\/?$/.test(path)`.

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/common src/lich-dong-bo && npx eslint src/common src/lich-dong-bo --max-warnings 0`
Expected: PASS (`request-rate-limit.guard.spec.ts` 46 bài, `lich-dong-bo.http.spec.ts` 18 bài; mọi bộ khác của `src/common` vẫn xanh, kể cả `request-rate-limit.wiring.spec.ts`); eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/common/request-rate-limit.guard.ts src/common/request-rate-limit.guard.spec.ts src/lich-dong-bo/lich-dong-bo.http.spec.ts
git -c core.autocrlf=false commit -m "feat(lich-dong-bo): han muc 30/phut moi ma, 600/phut moi IP, 10/phut moi nguoi" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R9: Cổng cuối của backend

**Files:** không sửa tệp nào (trừ khi một cổng đỏ — khi đó sửa đúng chỗ và commit riêng).

**Interfaces:**
- Consumes: R1–R8.
- Produces: bằng chứng nhánh đi qua được workflow deploy (lint đầy đủ, `test:ops`, build, jest) và cổng "Block destructive database changes".

- [ ] **Step 1: Các cổng của workflow**

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint -- --max-warnings 0
npm run test:ops
npm run build
npx jest
```

Expected: tất cả sạch. jest: không bộ nào đỏ (6 bộ `*.integration.spec.ts` bỏ qua); dòng `Tests:` tăng đúng 94 bài so với mốc R0 (R1 5 + R2 15 + R3 5 + R4 10 + R5 9 + R6 15 + R7 11 + 17 + R8 6 + 1). `ls dist/src/lich-dong-bo` có `lich-dong-bo.module.js`.

- [ ] **Step 2: Chỉ thêm ở cơ sở dữ liệu, không đụng workflow**

```bash
git diff -w origin/backend -- prisma/schema.prisma prisma/migrations prisma.config.ts | grep '^-[^-]' || echo "KHONG CO DONG NAO BI GO"
git diff --name-only --diff-filter=D origin/backend
git diff --name-only origin/backend -- prisma
git diff --stat origin/backend -- .github package.json package-lock.json
git diff --name-only origin/backend
```

Expected:
- lệnh 1 in `KHONG CO DONG NAO BI GO`;
- lệnh 2 không in gì (không xoá tệp nào);
- lệnh 3 in đúng hai dòng: `prisma/migrations/202610030001_calendar_feeds/migration.sql`, `prisma/schema.prisma`;
- lệnh 4 không in gì (không thêm thư viện, không sửa workflow);
- lệnh 5 chỉ có: `.env.example`, `prisma/migrations/202610030001_calendar_feeds/migration.sql`, `prisma/schema.prisma`, `src/app.module.ts`, `src/common/request-rate-limit.guard.ts`, `src/common/request-rate-limit.guard.spec.ts`, `src/events/events.module.ts`, `src/events/events.service.ts`, `src/events/events.service.spec.ts`, `src/lich-dong-bo/**`.

- [ ] **Step 3: Đọc bằng mắt một tệp lịch mẫu (không mạng, không cơ sở dữ liệu)**

```bash
cat > "$TEMP/mau-lich.cjs" <<'EOF'
const { writeFileSync } = require('fs');
const { join } = require('path');
const { vietIcs } = require('./dist/src/lich-dong-bo/ics.js');
const { mucTamDung, tenLich } = require('./dist/src/lich-dong-bo/muc-lich.js');
const bayGio = new Date();
const mucs = [
  {
    uid: 'event-mau@wedofpt.com.vn',
    batDau: new Date(bayGio.getTime() + 86400000),
    ketThuc: new Date(bayGio.getTime() + 90000000),
    tieuDe: 'Họp: Chốt đề tài, phân công; viết báo cáo chương 1 · Đồ án EXE201 — Nhóm 5',
    moTa: 'Dòng một\nDòng hai có dấu phẩy, chấm phẩy; hết',
    url: 'https://wedofpt.com.vn/#/meeting',
    capNhatLuc: bayGio,
  },
  mucTamDung('vi', bayGio),
];
const tep = join(process.env.TEMP, 'wedo-mau.ics');
writeFileSync(tep, vietIcs({ ten: tenLich('Lê Hữu Đại'), mucs }));
console.log('Đã ghi', tep);
EOF
node "$TEMP/mau-lich.cjs"
cat -A "$TEMP/wedo-mau.ics" | head -30
```

Expected: in "Đã ghi …"; `cat -A` cho thấy mọi dòng kết thúc bằng `^M$` (CRLF), dòng `SUMMARY` dài được gập thành dòng bắt đầu bằng một dấu cách, chữ có dấu không vỡ. Nếu máy có Outlook/Lịch Windows: mở `wedo-mau.ics` để thấy hai mục (một mục cả ngày hôm nay). Xoá `"$TEMP"/mau-lich.cjs` và `"$TEMP"/wedo-mau.ics` sau khi xem. Không commit gì ở task này. Không push — chủ dự án push và deploy (migration chạy trong workflow trước bước deploy).

---

## Web

### File Structure — Web

Worktree `D:\WEDO_PC\wt\fe-lich`, nhánh `feat/dong-bo-lich`, tạo từ `origin/main` của `D:\WEDO_PC\FE_WEDO` SAU khi nhánh `origin/fix/menu-chat-va-don-landing` đã vào `main` (lúc viết kế hoạch: `origin/main` = `12258e6`, đã có PR #6; nhánh còn `27509fc` — biểu tượng tab trang giới thiệu — chưa vào, xem Task W0).

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `src/lib/dong-bo-lich.ts` (+ `.test.ts`) | Tạo | Hàm thuần: `linkThemGoogle`, `linkWebcal`, `khoangDaQua` (dòng "Lần cuối… 2 giờ trước"), `chonManDongBoLich` (trạng thái hộp thoại), `MA_LOI_NGOAI_GOI`, `laLoiNgoaiGoi` |
| `src/lib/api.ts` | Sửa | Kiểu `TrangThaiDongBoLich`; `api.layDongBoLich`, `api.taoLinkDongBoLich`, `api.tatDongBoLich` |
| `src/i18n/tu-dien/dong-bo-lich.ts` | Tạo | `tuDienDongBoLich` (vi/en): nút, hộp thoại, mọi trạng thái, hướng dẫn, cảnh báo, xác nhận, toast, câu lỗi dự phòng |
| `src/i18n/loi.ts` (+ `loi.test.ts`) | Sửa | Dịch `CALENDAR_FEED_NOT_IN_PLAN` sang tiếng Anh |
| `src/components/lich/NoiDungDongBoLich.tsx` (+ `noi-dung-dong-bo-lich.test.tsx`) | Tạo | Phần vẽ thuần của hộp thoại (không gọi API, không portal) — dựng tĩnh được trong kiểm thử |
| `src/components/lich/DongBoLichDialog.tsx` | Tạo | Hộp thoại: gọi API, hỏi xác nhận, toast, khoá đóng khi đang gọi, `LopPhu` |
| `src/i18n/kiem-chuoi-chua-dich.test.ts` | Sửa | Thêm hai tệp giao diện mới vào `TEP_DA_DICH` |
| `src/views/CalendarView.tsx` | Sửa | Nút "Đồng bộ với lịch của bạn" cạnh "Tạo sự kiện"; mở `DongBoLichDialog`; `onNavigate` nhận thêm `'upgrade'` |
| `src/i18n/tu-dien/bang-gia.ts` | Sửa | "Export lịch/task" → "Đồng bộ lịch (Google, Apple, Outlook)" / "Calendar sync (Google, Apple, Outlook)", bỏ `sapRaMat`, ghi "Có"/"Included" |
| `src/views/pricing-plans.test.ts` | Sửa | Bỏ "Export lịch/task" khỏi danh sách "Sắp ra mắt"; kiểm mục mới đã có ở cả hai ngôn ngữ |
| `public/chinh-sach-thanh-toan.html` | Sửa | Gỡ "Export lịch/task" khỏi đoạn "chưa ra mắt"; cập nhật ngày |
| `src/trang-cong-khai.test.ts` | Sửa | Đoạn "nói thẳng tên tính năng chưa có" chỉ còn AI Daily Planner, Meeting Vote; cấm "Export lịch/task" |
| `vercel.json` | Sửa | `rewrites`: `/lich/:tep` → `…azurewebsites.net/calendar-feed/:tep` |
| `src/cau-hinh-vercel.test.ts` | Tạo | Đọc `vercel.json`: có rewrite `/lich/:tep`, vẫn còn redirect `/gioi-thieu`, vẫn còn cấu hình `api/gemini-proxy.ts` |

Mọi lệnh của phần này chạy trong `D:\WEDO_PC\wt\fe-lich` bằng Git Bash (công cụ Bash), trừ khi ghi khác. Kiểm thử một tệp: `npx tsx --test <tệp>`. Toàn bộ kiểm thử web: `npx tsx --test $(git ls-files 'src/*.test.ts' 'src/*.test.tsx')` — dùng MỘT dấu `*`: với pathspec mặc định của git, `*` khớp qua cả `/`, còn `'src/**/*.test.ts'` đòi ít nhất một thư mục con nên BỎ SÓT `src/trang-cong-khai.test.ts` và `src/cau-hinh-vercel.test.ts`. `git ls-files` chỉ thấy tệp đã `git add`, nên chạy toàn bộ sau khi commit (cổng W7). Không chạy dev server trỏ API thật. Commit luôn bằng `git -c core.autocrlf=false commit …`.

---

### Task W0: Tạo worktree web với `node_modules` riêng và kiểm mốc xanh

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: `origin/main` của FE đã chứa `origin/fix/menu-chat-va-don-landing` (sửa `src/trang-cong-khai.test.ts`, `src/App.tsx`, `scripts/chuoi-duoc-phep.ts`, `public/gioi-thieu/index.html`, xoá `LandingView`).
- Produces: worktree `D:\WEDO_PC\wt\fe-lich` (nhánh `feat/dong-bo-lich`) có `node_modules` thật của riêng nó; mốc xanh ghi lại.

- [ ] **Step 1: Kiểm nhánh dọn landing đã vào `main`**

```bash
git -C D:/WEDO_PC/FE_WEDO fetch origin
git -C D:/WEDO_PC/FE_WEDO merge-base --is-ancestor origin/fix/menu-chat-va-don-landing origin/main; echo "da merge: $?"
git -C D:/WEDO_PC/FE_WEDO log --oneline origin/main..origin/fix/menu-chat-va-don-landing
```

Expected: `da merge: 0` và lệnh `log` không in gì. Nếu ra `da merge: 1`: DỪNG, báo chủ dự án kèm danh sách commit lệnh `log` in ra (lúc viết kế hoạch còn `27509fc fix(web): bieu tuong tab cua trang gioi thieu la logo WeDo mau xanh` chưa vào `main`), chờ chủ dự án merge rồi chạy lại bước này. Không tự merge, không tự push.

- [ ] **Step 2: Tạo worktree và cài**

```bash
git -C D:/WEDO_PC/FE_WEDO branch --list feat/dong-bo-lich
git -C D:/WEDO_PC/FE_WEDO worktree add D:/WEDO_PC/wt/fe-lich -b feat/dong-bo-lich origin/main
cd D:/WEDO_PC/wt/fe-lich && npm ci
cmd //c "dir /AL D:\\WEDO_PC\\wt\\fe-lich" | grep -i junction; echo "ma thoat: $?"
git log --oneline -1
```

Expected: lệnh `branch --list` không in gì (nhánh chưa có); `npm ci` xong; không có dòng `<JUNCTION>` (`ma thoat: 1`); `git log` in `12258e6 …` hoặc mới hơn — ghi lại đỉnh thật.

- [ ] **Step 3: Kiểm mốc xanh**

```bash
npm run lint \
  && npm run kiem-dich \
  && npx tsx scripts/kiem-chuoi-chua-dich.ts --ca-ts --nghiem \
  && npx tsx --test $(git ls-files 'src/*.test.ts' 'src/*.test.tsx') \
  && npm run build
```

Expected: tsc sạch; hai lần kiem-dich in `Không còn chữ tiếng Việt nào nằm ngoài từ điển.`; mọi bài PASS (`# fail 0`); build xong. Không sạch thì dừng và báo người giao việc. Không commit.

---

### Task W1: Hàm thuần của đồng bộ lịch phía web

**Files:**
- Create: `src/lib/dong-bo-lich.ts`
- Test: `src/lib/dong-bo-lich.test.ts`

**Interfaces:**
- Consumes: `ApiError` (`src/lib/loi-api.ts`).
- Produces:
  - `export function linkThemGoogle(url: string): string` — `https://calendar.google.com/calendar/render?cid=<encodeURIComponent(url)>`
  - `export function linkWebcal(url: string): string` — đổi `https:`/`http:` đầu chuỗi thành `webcal:`; chuỗi khác giữ nguyên
  - `export type KhoangDaQua = { donVi: 'vuaXong' } | { donVi: 'phut' | 'gio' | 'ngay'; so: number }`
  - `export function khoangDaQua(luc: string, bayGio?: Date): KhoangDaQua | null`
  - `export type ManDongBoLich = 'dangTai' | 'loiTai' | 'ngoaiGoi' | 'chuaCoLink' | 'coLink'`
  - `export function chonManDongBoLich(p: { dangTai: boolean; trangThai: { duocDung: boolean; coLink: boolean; url?: string } | null }): ManDongBoLich`
  - `export const MA_LOI_NGOAI_GOI = 'CALENDAR_FEED_NOT_IN_PLAN'`
  - `export function laLoiNgoaiGoi(loi: unknown): boolean`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/dong-bo-lich.test.ts`:

```ts
/*
  Đồng bộ lịch phía web: link thêm vào Google Calendar, link webcal: cho Lịch
  Apple/Outlook, dòng "Lần cuối… 2 giờ trước", trạng thái nào của hộp thoại,
  và nhận ra lỗi "ngoài gói".

    npx tsx --test src/lib/dong-bo-lich.test.ts
*/
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError, loiTuPhanHoi } from './loi-api';
import {
  MA_LOI_NGOAI_GOI,
  chonManDongBoLich,
  khoangDaQua,
  laLoiNgoaiGoi,
  linkThemGoogle,
  linkWebcal,
} from './dong-bo-lich';

// Mã 43 ký tự base64url như máy chủ sinh (crypto.randomBytes(32).toString('base64url')).
const MA = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdE';
const URL_LICH = `https://wedofpt.com.vn/lich/${MA}.ics`;

describe('linkThemGoogle', () => {
  it('mã hoá toàn bộ URL vào tham số cid', () => {
    assert.equal(
      linkThemGoogle(URL_LICH),
      `https://calendar.google.com/calendar/render?cid=https%3A%2F%2Fwedofpt.com.vn%2Flich%2F${MA}.ics`,
    );
  });
});

describe('linkWebcal', () => {
  it('đổi https: và http: (kể cả viết hoa) thành webcal:', () => {
    assert.equal(linkWebcal(URL_LICH), `webcal://wedofpt.com.vn/lich/${MA}.ics`);
    assert.equal(linkWebcal('http://localhost:3000/calendar-feed/x.ics'), 'webcal://localhost:3000/calendar-feed/x.ics');
    assert.equal(linkWebcal('HTTPS://wedofpt.com.vn/lich/x.ics'), 'webcal://wedofpt.com.vn/lich/x.ics');
  });

  it('chỉ đổi phần giao thức ở đầu; chuỗi không phải http(s) giữ nguyên', () => {
    assert.equal(linkWebcal('webcal://wedofpt.com.vn/lich/x.ics'), 'webcal://wedofpt.com.vn/lich/x.ics');
    assert.equal(
      linkWebcal('https://wedofpt.com.vn/lich/https:x.ics'),
      'webcal://wedofpt.com.vn/lich/https:x.ics',
    );
  });
});

describe('khoangDaQua', () => {
  const bayGio = new Date('2026-10-03T10:00:00Z');

  it('dưới một phút, hoặc mốc ở tương lai vì đồng hồ máy lệch: vừa xong', () => {
    assert.deepEqual(khoangDaQua('2026-10-03T09:59:30Z', bayGio), { donVi: 'vuaXong' });
    assert.deepEqual(khoangDaQua('2026-10-03T10:05:00Z', bayGio), { donVi: 'vuaXong' });
  });

  it('phút, rồi giờ, rồi ngày — làm tròn xuống', () => {
    assert.deepEqual(khoangDaQua('2026-10-03T09:15:00Z', bayGio), { donVi: 'phut', so: 45 });
    assert.deepEqual(khoangDaQua('2026-10-03T09:00:01Z', bayGio), { donVi: 'phut', so: 59 });
    assert.deepEqual(khoangDaQua('2026-10-03T09:00:00Z', bayGio), { donVi: 'gio', so: 1 });
    assert.deepEqual(khoangDaQua('2026-10-03T08:00:00Z', bayGio), { donVi: 'gio', so: 2 });
    assert.deepEqual(khoangDaQua('2026-10-02T10:00:01Z', bayGio), { donVi: 'gio', so: 23 });
    assert.deepEqual(khoangDaQua('2026-10-02T10:00:00Z', bayGio), { donVi: 'ngay', so: 1 });
    assert.deepEqual(khoangDaQua('2026-10-01T09:00:00Z', bayGio), { donVi: 'ngay', so: 2 });
  });

  it('mốc hỏng hay rỗng thì null', () => {
    assert.equal(khoangDaQua('', bayGio), null);
    assert.equal(khoangDaQua('khong-phai-ngay', bayGio), null);
  });

  it('mặc định tính tới bây giờ', () => {
    assert.deepEqual(khoangDaQua(new Date().toISOString()), { donVi: 'vuaXong' });
  });
});

describe('chonManDongBoLich', () => {
  it('đang tải thắng mọi thứ; tải xong mà không có trạng thái là lỗi tải', () => {
    assert.equal(chonManDongBoLich({ dangTai: true, trangThai: null }), 'dangTai');
    assert.equal(chonManDongBoLich({ dangTai: true, trangThai: { duocDung: true, coLink: true, url: 'x' } }), 'dangTai');
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: null }), 'loiTai');
  });

  it('ngoài gói (kể cả còn link cũ), chưa có link, có link', () => {
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: { duocDung: false, coLink: false } }), 'ngoaiGoi');
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: { duocDung: false, coLink: true, url: 'x' } }), 'ngoaiGoi');
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: { duocDung: true, coLink: false } }), 'chuaCoLink');
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: { duocDung: true, coLink: true, url: URL_LICH } }), 'coLink');
    // Máy chủ nói có link mà thiếu url: không có gì để hiện, cho tạo lại.
    assert.equal(chonManDongBoLich({ dangTai: false, trangThai: { duocDung: true, coLink: true } }), 'chuaCoLink');
  });
});

describe('laLoiNgoaiGoi', () => {
  it('chỉ đúng mã CALENDAR_FEED_NOT_IN_PLAN của máy chủ', () => {
    assert.equal(MA_LOI_NGOAI_GOI, 'CALENDAR_FEED_NOT_IN_PLAN');
    const ngoaiGoi = loiTuPhanHoi(
      403,
      JSON.stringify({ statusCode: 403, code: 'CALENDAR_FEED_NOT_IN_PLAN', message: 'Đồng bộ lịch dành cho gói Pro và Team.' }),
    );
    assert.equal(laLoiNgoaiGoi(ngoaiGoi), true);
    assert.equal(laLoiNgoaiGoi(loiTuPhanHoi(403, JSON.stringify({ message: 'Forbidden' }))), false);
    assert.equal(laLoiNgoaiGoi(new ApiError('x', 0, 'NETWORK_ERROR')), false);
    assert.equal(laLoiNgoaiGoi(new Error('CALENDAR_FEED_NOT_IN_PLAN')), false);
    assert.equal(laLoiNgoaiGoi(null), false);
  });
});
```

Run: `npx tsx --test src/lib/dong-bo-lich.test.ts`
Expected: FAIL — "Cannot find module … dong-bo-lich".

- [ ] **Step 2: Viết mã**

`src/lib/dong-bo-lich.ts`:

```ts
import { ApiError } from './loi-api';

/*
  Đồng bộ lịch phía web. Không nhập './api': tệp đó đọc `import.meta.env` ngay
  khi nạp, chạy dưới node:test sẽ vỡ. Mọi thứ ở đây thuần, kiểm thử được.
*/

/** Mã lỗi máy chủ trả khi người dùng không có Pro/Team (BE src/lich-dong-bo/lich-dong-bo.errors.ts). */
export const MA_LOI_NGOAI_GOI = 'CALENDAR_FEED_NOT_IN_PLAN';

/**
 * Trang "Thêm lịch?" của Google Calendar. Chỉ chạy trên máy tính: app Google
 * Calendar trên điện thoại không thêm được lịch bằng link, nhưng lịch đã thêm
 * trên máy tính tự hiện trong app.
 */
export function linkThemGoogle(url: string): string {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url)}`;
}

/**
 * Cùng link nhưng giao thức `webcal:`: Lịch Apple (iPhone, iPad, Mac) và
 * Outlook trên máy tính bắt giao thức này và mở thẳng hộp "Đăng ký lịch".
 */
export function linkWebcal(url: string): string {
  return url.replace(/^https?:/i, 'webcal:');
}

export type KhoangDaQua = { donVi: 'vuaXong' } | { donVi: 'phut' | 'gio' | 'ngay'; so: number };

/**
 * Bao lâu kể từ `luc` — cho dòng "Lần cuối lịch của bạn lấy dữ liệu: 2 giờ
 * trước". Mốc ở tương lai (đồng hồ máy người dùng chạy chậm) tính là vừa xong.
 */
export function khoangDaQua(luc: string, bayGio: Date = new Date()): KhoangDaQua | null {
  const moc = new Date(luc).getTime();
  if (!luc || Number.isNaN(moc)) return null;
  const phut = Math.floor((bayGio.getTime() - moc) / 60_000);
  if (phut < 1) return { donVi: 'vuaXong' };
  if (phut < 60) return { donVi: 'phut', so: phut };
  const gio = Math.floor(phut / 60);
  if (gio < 24) return { donVi: 'gio', so: gio };
  return { donVi: 'ngay', so: Math.floor(gio / 24) };
}

export type ManDongBoLich = 'dangTai' | 'loiTai' | 'ngoaiGoi' | 'chuaCoLink' | 'coLink';

/**
 * Hộp thoại đang ở trạng thái nào (spec mục 4). Ngoài gói thì luôn là lời mời
 * nâng cấp, kể cả khi còn link cũ: link cũ lúc đó chỉ trả một mục "tạm dừng".
 */
export function chonManDongBoLich(p: {
  dangTai: boolean;
  trangThai: { duocDung: boolean; coLink: boolean; url?: string } | null;
}): ManDongBoLich {
  if (p.dangTai) return 'dangTai';
  if (!p.trangThai) return 'loiTai';
  if (!p.trangThai.duocDung) return 'ngoaiGoi';
  return p.trangThai.coLink && p.trangThai.url ? 'coLink' : 'chuaCoLink';
}

/** Lỗi 403 "ngoài gói" khi tạo link: gói vừa hết hạn giữa chừng, hộp thoại chuyển sang lời mời nâng cấp. */
export function laLoiNgoaiGoi(loi: unknown): boolean {
  return loi instanceof ApiError && loi.code === MA_LOI_NGOAI_GOI;
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx tsx --test src/lib/dong-bo-lich.test.ts && npm run lint && npx tsx scripts/kiem-chuoi-chua-dich.ts --ca-ts --nghiem`
Expected: PASS (10 bài, `# fail 0`); tsc sạch; kiem-dich `Không còn chữ tiếng Việt nào nằm ngoài từ điển.` (tệp mới không có chữ tiếng Việt ngoài bình luận).

- [ ] **Step 4: Commit**

```bash
git add src/lib/dong-bo-lich.ts src/lib/dong-bo-lich.test.ts
git -c core.autocrlf=false commit -m "feat(web): ham thuan dong bo lich - link Google, webcal, lan cuoi lay, trang thai hop thoai" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W2: Gọi API đồng bộ lịch, dịch mã lỗi `CALENDAR_FEED_NOT_IN_PLAN` và từ điển

**Files:**
- Modify: `src/lib/api.ts` (kiểu mới ngay sau `export type CalendarItem = …;`, trước `export type MeetingStatus`; ba hàm ngay sau `deleteEvent: …,`)
- Modify: `src/i18n/loi.ts` (`TIENG_ANH_THEO_MA`, ngay sau dòng `REPORT_LINK_INVALID: …`)
- Test: `src/i18n/loi.test.ts` (thêm `describe` cuối tệp)
- Create: `src/i18n/tu-dien/dong-bo-lich.ts`

**Interfaces:**
- Consumes: `request<T>` có sẵn trong `api.ts` (gia hạn phiên, `docPhanHoi` trả `null` với thân rỗng 204); `soNhieu`, `khaiBaoTuDien` (`src/i18n/dich.ts`).
- Produces:
  - `export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null }`
  - `api.layDongBoLich(): Promise<TrangThaiDongBoLich>` — `GET /calendar-feed`
  - `api.taoLinkDongBoLich(lang: 'vi' | 'en'): Promise<TrangThaiDongBoLich>` — `POST /calendar-feed` thân `{ lang }`
  - `api.tatDongBoLich(): Promise<void>` — `DELETE /calendar-feed` (204)
  - Bản dịch tiếng Anh cho `CALENDAR_FEED_NOT_IN_PLAN`
  - `export const tuDienDongBoLich` với khoá: `nut`, `hopThoai.{tieuDe, moTa, dong, dangTai, thuLai, ngoaiGoi.{gioiThieu, tamDung, nangCap}, chuaCoLink.{gioiThieu, chiDoc, taoLink}, coLink.{lienKet, saoChep, themGoogle, moApple, huongDanTieuDe, huongDan.{google, apple, outlook}.{ten, cach}, canhBao, lanCuoi(khi), chuaLay, thoiGian.{vuaXong, phut(so), gio(so), ngay(so)}, taoLinkMoi, xacNhanTaoMoi, tatDongBo, xacNhanTat}, daSaoChep, khongSaoChepDuoc, daTao, daDoi, daTat, loiTai, loiTao, loiTat}`

- [ ] **Step 1: Viết bài kiểm thất bại cho dịch lỗi**

Thêm cuối `src/i18n/loi.test.ts` (đã nhập sẵn `chuyenLoiMang`, `loiTuPhanHoi`, `dichThongBaoLoi`):

```ts
describe('đồng bộ lịch', () => {
  const cauMayChu = 'Đồng bộ lịch dành cho gói Pro và Team.';
  const ngoaiGoi = () =>
    loiTuPhanHoi(403, JSON.stringify({ statusCode: 403, code: 'CALENDAR_FEED_NOT_IN_PLAN', message: cauMayChu }));

  it('tiếng Anh: dịch CALENDAR_FEED_NOT_IN_PLAN', () => {
    assert.equal(
      dichThongBaoLoi(ngoaiGoi(), 'Fallback', 'en'),
      'Calendar sync is part of the Pro and Team plans. Upgrade your plan to turn it on.',
    );
  });

  it('tiếng Việt: giữ nguyên câu của máy chủ', () => {
    assert.equal(dichThongBaoLoi(ngoaiGoi(), 'Dự phòng', 'vi'), cauMayChu);
  });

  it('429 của bộ giới hạn tần suất và mất mạng đều có câu tiếng Anh', () => {
    const quaNhanh = loiTuPhanHoi(429, JSON.stringify({ statusCode: 429, message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' }));
    assert.match(dichThongBaoLoi(quaNhanh, 'Fallback', 'en'), /going too fast/);
    assert.match(dichThongBaoLoi(chuyenLoiMang(new TypeError('Failed to fetch')), 'Fallback', 'en'), /Can’t reach the WeDo server/);
  });
});
```

Run: `npx tsx --test src/i18n/loi.test.ts`
Expected: FAIL đúng một bài "tiếng Anh: dịch CALENDAR_FEED_NOT_IN_PLAN" (trả nguyên câu tiếng Việt của máy chủ); hai bài còn lại PASS (đường dịch 429 và mất mạng đã có — bài này giữ cho chúng không bị phá).

- [ ] **Step 2: Thêm bản dịch**

Trong `src/i18n/loi.ts`, thêm vào `TIENG_ANH_THEO_MA` ngay sau dòng `REPORT_LINK_INVALID: () => '…',`:

```ts
  // Đồng bộ lịch (BE src/lich-dong-bo/lich-dong-bo.errors.ts).
  CALENDAR_FEED_NOT_IN_PLAN: () => 'Calendar sync is part of the Pro and Team plans. Upgrade your plan to turn it on.',
```

Run: `npx tsx --test src/i18n/loi.test.ts`
Expected: PASS.

- [ ] **Step 3: Từ điển**

`src/i18n/tu-dien/dong-bo-lich.ts`:

```ts
import { khaiBaoTuDien, soNhieu } from '../dich';

/** Đồng bộ lịch WeDo sang Google Calendar, Lịch Apple, Outlook: nút ở màn Lịch và hộp thoại DongBoLichDialog. */
export const tuDienDongBoLich = khaiBaoTuDien(
  {
    nut: 'Đồng bộ với lịch của bạn',
    hopThoai: {
      tieuDe: 'Đồng bộ với lịch của bạn',
      moTa: 'Hạn chót việc bạn đã nhận, cuộc họp và sự kiện trên WeDo tự hiện trong Google Calendar, Lịch Apple hoặc Outlook, và tự cập nhật.',
      dong: 'Đóng',
      dangTai: 'Đang tải…',
      thuLai: 'Thử lại',
      ngoaiGoi: {
        gioiThieu:
          'Đồng bộ lịch dành cho gói Pro và Team. Nâng cấp để có một link riêng, dán vào lịch bạn đang dùng một lần là xong.',
        tamDung:
          'Link cũ của bạn vẫn còn, nhưng lịch đang tạm dừng cho tới khi gói được gia hạn. Không dùng nữa thì tắt đồng bộ.',
        nangCap: 'Nâng cấp gói',
      },
      chuaCoLink: {
        gioiThieu:
          'Tạo một link riêng rồi dán vào Google Calendar, Lịch Apple hoặc Outlook. Mọi workspace bạn được dùng tính năng này gộp chung vào một lịch.',
        chiDoc: 'Lịch chỉ để xem: sửa hay xoá trong Google, Apple, Outlook không đổi gì trên WeDo.',
        taoLink: 'Tạo link đồng bộ',
      },
      coLink: {
        lienKet: 'Link riêng của bạn',
        saoChep: 'Sao chép link',
        themGoogle: 'Thêm vào Google Calendar',
        moApple: 'Mở bằng Lịch Apple / Outlook',
        huongDanTieuDe: 'Cách thêm vào từng loại lịch',
        huongDan: {
          google: {
            ten: 'Google Calendar',
            cach: 'Trên máy tính, bấm “Thêm vào Google Calendar”, chọn đúng tài khoản Google rồi bấm Thêm. App Google Calendar trên điện thoại không thêm được lịch bằng link, nhưng lịch đã thêm sẽ tự hiện trong app. Google tự lấy dữ liệu mới vài giờ một lần.',
          },
          apple: {
            ten: 'Lịch Apple',
            cach: 'Trên iPhone, iPad hoặc Mac, bấm “Mở bằng Lịch Apple / Outlook” rồi chọn Đăng ký. Trên Mac cũng có thể mở ứng dụng Lịch → Tệp → Đăng ký lịch mới rồi dán link.',
          },
          outlook: {
            ten: 'Outlook',
            cach: 'Outlook trên web: mở Lịch → Thêm lịch → Đăng ký từ web, dán link. Outlook trên máy tính mở được bằng nút “Mở bằng Lịch Apple / Outlook”.',
          },
        },
        canhBao:
          'Ai có link này đều xem được lịch của bạn. Đừng dán link vào nhóm chat hay mạng xã hội; lỡ lộ thì bấm “Tạo link mới”.',
        lanCuoi: (khi: string) => `Lần cuối lịch của bạn lấy dữ liệu: ${khi}`,
        chuaLay: 'Lịch của bạn chưa lấy dữ liệu lần nào. Sau khi thêm link, Google có thể mất vài giờ mới lấy lần đầu.',
        thoiGian: {
          vuaXong: 'vừa xong',
          phut: (so: number) => `${so} phút trước`,
          gio: (so: number) => `${so} giờ trước`,
          ngay: (so: number) => `${so} ngày trước`,
        },
        taoLinkMoi: 'Tạo link mới',
        xacNhanTaoMoi:
          'Link cũ sẽ ngừng hoạt động ngay; lịch đã thêm bằng link cũ không cập nhật nữa và phải thêm lại bằng link mới. Tạo link mới?',
        tatDongBo: 'Tắt đồng bộ',
        xacNhanTat: 'Tắt đồng bộ thì link ngừng hoạt động ngay và lịch đã thêm không cập nhật nữa. Tắt đồng bộ?',
      },
      daSaoChep: 'Đã sao chép link đồng bộ lịch',
      khongSaoChepDuoc: 'Không sao chép được. Hãy chọn link rồi sao chép thủ công.',
      daTao: 'Đã tạo link đồng bộ lịch',
      daDoi: 'Đã tạo link mới. Link cũ đã ngừng hoạt động.',
      daTat: 'Đã tắt đồng bộ lịch',
      loiTai: 'Không tải được thông tin đồng bộ lịch',
      loiTao: 'Không tạo được link đồng bộ',
      loiTat: 'Không tắt được đồng bộ lịch',
    },
  },
  {
    nut: 'Sync with your calendar',
    hopThoai: {
      tieuDe: 'Sync with your calendar',
      moTa: 'Deadlines of tasks you have accepted, meetings and events on WeDo show up in Google Calendar, Apple Calendar or Outlook, and stay up to date.',
      dong: 'Close',
      dangTai: 'Loading…',
      thuLai: 'Try again',
      ngoaiGoi: {
        gioiThieu:
          'Calendar sync is part of the Pro and Team plans. Upgrade to get a private link that you paste into your calendar once.',
        tamDung:
          'Your old link still exists, but the calendar is paused until the plan is renewed. Turn sync off if you no longer need it.',
        nangCap: 'Upgrade plan',
      },
      chuaCoLink: {
        gioiThieu:
          'Create a private link and paste it into Google Calendar, Apple Calendar or Outlook. Every workspace where you can use this feature goes into one calendar.',
        chiDoc: 'The calendar is view-only: changing or deleting items in Google, Apple or Outlook changes nothing on WeDo.',
        taoLink: 'Create sync link',
      },
      coLink: {
        lienKet: 'Your private link',
        saoChep: 'Copy link',
        themGoogle: 'Add to Google Calendar',
        moApple: 'Open in Apple Calendar / Outlook',
        huongDanTieuDe: 'How to add it to each calendar',
        huongDan: {
          google: {
            ten: 'Google Calendar',
            cach: 'On a computer, click “Add to Google Calendar”, pick the right Google account, then click Add. The Google Calendar phone app can’t add a calendar from a link, but once added it shows up in the app. Google fetches new data every few hours.',
          },
          apple: {
            ten: 'Apple Calendar',
            cach: 'On iPhone, iPad or Mac, tap “Open in Apple Calendar / Outlook”, then Subscribe. On a Mac you can also open Calendar → File → New Calendar Subscription and paste the link.',
          },
          outlook: {
            ten: 'Outlook',
            cach: 'Outlook on the web: open Calendar → Add calendar → Subscribe from web and paste the link. Outlook for desktop opens it from the “Open in Apple Calendar / Outlook” button.',
          },
        },
        canhBao:
          'Anyone with this link can see your calendar. Don’t post it in group chats or on social media; if it leaks, click “Create new link”.',
        lanCuoi: (khi: string) => `Your calendar last fetched data: ${khi}`,
        chuaLay: 'Your calendar hasn’t fetched any data yet. After you add the link, Google can take a few hours to fetch it the first time.',
        thoiGian: {
          vuaXong: 'just now',
          phut: (so: number) => soNhieu('en', so, { mot: '{so} minute ago', nhieu: '{so} minutes ago' }),
          gio: (so: number) => soNhieu('en', so, { mot: '{so} hour ago', nhieu: '{so} hours ago' }),
          ngay: (so: number) => soNhieu('en', so, { mot: '{so} day ago', nhieu: '{so} days ago' }),
        },
        taoLinkMoi: 'Create new link',
        xacNhanTaoMoi:
          'The old link stops working right away; calendars added with it stop updating and must be added again with the new link. Create a new link?',
        tatDongBo: 'Turn off sync',
        xacNhanTat: 'Turning off sync stops the link right away, and calendars already added stop updating. Turn off sync?',
      },
      daSaoChep: 'Calendar sync link copied',
      khongSaoChepDuoc: 'Couldn’t copy. Select the link and copy it manually.',
      daTao: 'Calendar sync link created',
      daDoi: 'New link created. The old link no longer works.',
      daTat: 'Calendar sync turned off',
      loiTai: 'Couldn’t load calendar sync',
      loiTao: 'Couldn’t create the sync link',
      loiTat: 'Couldn’t turn off calendar sync',
    },
  },
);
```

- [ ] **Step 4: Ba hàm gọi API trong `api.ts`**

Trong `src/lib/api.ts`, ngay sau khối `export type CalendarItem = | {…} | {…} | {…};` (trước `export type MeetingStatus = …`), thêm:

```ts
/**
 * Đồng bộ lịch (GET/POST /calendar-feed), cùng hình với BE
 * src/lich-dong-bo/lich-dong-bo.service.ts. `duocDung` do máy chủ tính theo gói
 * (Pro cá nhân hoặc workspace có Team), web không tự đoán gói. `url` là link
 * riêng `https://wedofpt.com.vn/lich/<mã>.ics`; `layLanCuoi` là lần gần nhất lịch
 * của người dùng lấy dữ liệu (null nếu chưa lần nào).
 */
export interface TrangThaiDongBoLich {
  duocDung: boolean;
  coLink: boolean;
  url?: string;
  taoLuc?: string;
  layLanCuoi?: string | null;
}
```

và trong đối tượng `api`, ngay sau dòng `deleteEvent: (id: string) => request<{ ok: boolean }>(`/events/${id}`, { method: 'DELETE' }),` thêm:

```ts
  layDongBoLich: () => request<TrangThaiDongBoLich>('/calendar-feed'),
  /** Chưa có link thì tạo, đã có thì đổi mã (link cũ chết ngay). `lang` là ngôn ngữ chữ trong lịch. */
  taoLinkDongBoLich: (lang: 'vi' | 'en') =>
    request<TrangThaiDongBoLich>('/calendar-feed', {
      method: 'POST',
      body: JSON.stringify({ lang }),
    }),
  /** Máy chủ trả 204, gọi lại cũng không lỗi. */
  tatDongBoLich: async (): Promise<void> => {
    await request<null>('/calendar-feed', { method: 'DELETE' });
  },
```

Không viết câu tiếng Việt nào trong `api.ts` (bộ quét `--ca-ts` sẽ bắt); câu dự phòng lấy từ từ điển ở hộp thoại. `api.ts` đọc `import.meta.env` lúc nạp nên không kiểm thử bằng node:test được — cổng ở đây là tsc.

- [ ] **Step 5: Chạy lại**

Run: `npx tsx --test src/i18n/loi.test.ts src/i18n/tu-dien.test.ts && npm run lint && npm run kiem-dich && npx tsx scripts/kiem-chuoi-chua-dich.ts --ca-ts --nghiem`
Expected: PASS (`tu-dien.test.ts` tự quét từ điển mới: đủ khoá, cùng dạng, bản tiếng Anh không còn dấu); tsc sạch; hai lần kiem-dich sạch.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/i18n/tu-dien/dong-bo-lich.ts src/i18n/loi.ts src/i18n/loi.test.ts
git -c core.autocrlf=false commit -m "feat(web): goi API dong bo lich, tu dien va dich ma loi CALENDAR_FEED_NOT_IN_PLAN" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W3: Hộp thoại "Đồng bộ với lịch của bạn"

**Files:**
- Create: `src/components/lich/NoiDungDongBoLich.tsx`
- Test: `src/components/lich/noi-dung-dong-bo-lich.test.tsx`
- Create: `src/components/lich/DongBoLichDialog.tsx`
- Modify: `src/i18n/kiem-chuoi-chua-dich.test.ts` (`TEP_DA_DICH`, sau `'src/components/layout/Topbar.tsx',`)

**Interfaces:**
- Consumes: `TrangThaiDongBoLich`, `api.layDongBoLich`, `api.taoLinkDongBoLich`, `api.tatDongBoLich`, `tuDienDongBoLich` (W2); `chonManDongBoLich`, `khoangDaQua`, `linkThemGoogle`, `linkWebcal`, `laLoiNgoaiGoi` (W1); `LopPhu`; `useToast`; `useTuDien`, `useNgonNgu`, `useDichLoi`; `dinhDangNgayGio`.
- Produces:
  - `export type ViecDongBoLich = 'tao' | 'doi' | 'tat'`
  - `export interface NoiDungDongBoLichProps { trangThai: TrangThaiDongBoLich | null; dangTai: boolean; dangLam: ViecDongBoLich | null; loi: string | null; bayGio?: Date; onClose; onThuLai; onNangCap; onTaoLink; onDoiLink; onTatDongBo; onSaoChep: () => void }`
  - `export function NoiDungDongBoLich(props: NoiDungDongBoLichProps)`
  - `export function DongBoLichDialog({ onClose, onNangCap }: { onClose: () => void; onNangCap?: () => void })` — hợp đồng `{ onClose }` giữ nguyên, thêm `onNangCap` KHÔNG bắt buộc (xem ghi chú cuối task).

Tách hai tệp vì `DongBoLichDialog` nhập `api.ts` (đọc `import.meta.env`) và `LopPhu` (portal vào `document.body`), không dựng tĩnh được dưới node:test; phần vẽ thuần `NoiDungDongBoLich` thì dựng được bằng `renderToStaticMarkup` như `hop-thoai-dong-y-ai.test.tsx`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/components/lich/noi-dung-dong-bo-lich.test.tsx`:

```tsx
/*
  Hộp thoại "Đồng bộ với lịch của bạn": từng trạng thái (spec mục 4), link
  Google và webcal:, khoá mọi nút (kể cả nút đóng) khi đang gọi máy chủ, song ngữ.

    npx tsx --test src/components/lich/noi-dung-dong-bo-lich.test.tsx
*/
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TrangThaiDongBoLich } from '../../lib/api';
import { datNgonNguChoKiemThu } from '../../i18n/ngon-ngu';
import { chuVietConSot } from '../../i18n/chu-viet-con-sot';
import { NoiDungDongBoLich, type NoiDungDongBoLichProps } from './NoiDungDongBoLich';

const MA = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdE';
const URL_LICH = `https://wedofpt.com.vn/lich/${MA}.ics`;
const BAY_GIO = new Date('2026-10-03T10:00:00Z');
const khongLam = () => undefined;

const NGOAI_GOI: TrangThaiDongBoLich = { duocDung: false, coLink: false };
const NGOAI_GOI_CON_LINK: TrangThaiDongBoLich = { duocDung: false, coLink: true, url: URL_LICH, layLanCuoi: null };
const CHUA_CO_LINK: TrangThaiDongBoLich = { duocDung: true, coLink: false };
const CO_LINK: TrangThaiDongBoLich = {
  duocDung: true,
  coLink: true,
  url: URL_LICH,
  taoLuc: '2026-10-01T00:00:00.000Z',
  // Hai giờ trước BAY_GIO.
  layLanCuoi: '2026-10-03T08:00:00.000Z',
};

function dung(p: Partial<NoiDungDongBoLichProps> = {}) {
  return renderToStaticMarkup(
    <NoiDungDongBoLich
      trangThai={null}
      dangTai={false}
      dangLam={null}
      loi={null}
      bayGio={BAY_GIO}
      onClose={khongLam}
      onThuLai={khongLam}
      onNangCap={khongLam}
      onTaoLink={khongLam}
      onDoiLink={khongLam}
      onTatDongBo={khongLam}
      onSaoChep={khongLam}
      {...p}
    />,
  );
}

/** Các thẻ <button> (cả phần trong) có chứa `chu`. */
const nutCo = (html: string, chu: string) => (html.match(/<button[^>]*>.*?<\/button>/g) ?? []).filter((the) => the.includes(chu));

describe('NoiDungDongBoLich — tiếng Việt', () => {
  afterEach(() => datNgonNguChoKiemThu(null));

  it('đang tải: chỉ có dòng đang tải, chưa có nút hành động', () => {
    const html = dung({ dangTai: true });
    assert.match(html, /Đang tải…/);
    assert.doesNotMatch(html, /Tạo link đồng bộ|Nâng cấp gói|Tắt đồng bộ/);
  });

  it('tải hỏng: câu lỗi trong role="alert" và nút Thử lại', () => {
    const html = dung({ loi: 'Không kết nối được máy chủ WeDo.' });
    assert.match(html, /role="alert"[^>]*>Không kết nối được máy chủ WeDo\.</);
    assert.equal(nutCo(html, 'Thử lại').length, 1);
  });

  it('gói Miễn phí: lời mời nâng cấp, không có nút tạo link', () => {
    const html = dung({ trangThai: NGOAI_GOI });
    assert.match(html, /dành cho gói Pro và Team/);
    assert.equal(nutCo(html, 'Nâng cấp gói').length, 1);
    assert.doesNotMatch(html, /Tạo link đồng bộ|Tắt đồng bộ|calendar\.google\.com/);
  });

  it('hết gói mà còn link cũ: báo tạm dừng, cho tắt đồng bộ, không lộ link', () => {
    const html = dung({ trangThai: NGOAI_GOI_CON_LINK });
    assert.match(html, /tạm dừng cho tới khi gói được gia hạn/);
    assert.equal(nutCo(html, 'Tắt đồng bộ').length, 1);
    assert.equal(nutCo(html, 'Nâng cấp gói').length, 1);
    assert.ok(!html.includes(MA), 'ngoài gói thì không hiện link');
  });

  it('được dùng, chưa có link: giới thiệu và đúng một nút Tạo link đồng bộ', () => {
    const html = dung({ trangThai: CHUA_CO_LINK });
    assert.match(html, /Tạo một link riêng/);
    assert.equal(nutCo(html, 'Tạo link đồng bộ').length, 1);
    assert.doesNotMatch(html, /Nâng cấp gói|Tắt đồng bộ/);
  });

  it('có link: Google, webcal, sao chép, hướng dẫn ba loại lịch, cảnh báo, lần cuối, tạo mới và tắt', () => {
    const html = dung({ trangThai: CO_LINK });
    assert.ok(html.includes(`href="https://calendar.google.com/calendar/render?cid=${encodeURIComponent(URL_LICH)}"`));
    assert.ok(html.includes('target="_blank"'));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes(`href="webcal://wedofpt.com.vn/lich/${MA}.ics"`));
    assert.ok(html.includes(`value="${URL_LICH}"`));
    assert.match(html, /Thêm vào Google Calendar/);
    assert.match(html, /Mở bằng Lịch Apple \/ Outlook/);
    for (const ten of ['Google Calendar', 'Lịch Apple', 'Outlook']) assert.match(html, new RegExp(ten));
    assert.match(html, /Ai có link này đều xem được lịch của bạn/);
    assert.match(html, /Lần cuối lịch của bạn lấy dữ liệu: 2 giờ trước/);
    assert.equal(nutCo(html, 'Sao chép link').length, 1);
    assert.equal(nutCo(html, 'Tạo link mới').length, 1);
    assert.equal(nutCo(html, 'Tắt đồng bộ').length, 1);
  });

  it('có link nhưng lịch chưa lấy dữ liệu lần nào', () => {
    const html = dung({ trangThai: { ...CO_LINK, layLanCuoi: null } });
    assert.match(html, /chưa lấy dữ liệu lần nào/);
    assert.doesNotMatch(html, /Lần cuối lịch của bạn lấy dữ liệu/);
  });

  it('đang gọi máy chủ: mọi nút bị khoá, kể cả nút đóng', () => {
    for (const [trangThai, dangLam] of [
      [CO_LINK, 'doi'],
      [CO_LINK, 'tat'],
      [CHUA_CO_LINK, 'tao'],
      [NGOAI_GOI_CON_LINK, 'tat'],
    ] as const) {
      const html = dung({ trangThai, dangLam });
      const nut = html.match(/<button[^>]*>/g) ?? [];
      assert.ok(nut.length >= 3, `${dangLam}: phải có nút`);
      for (const the of nut) assert.match(the, /disabled=""/, `${dangLam}: ${the}`);
      assert.equal(nutCo(html, 'aria-label="Đóng"').length, 1);
    }
  });
});

describe('NoiDungDongBoLich — tiếng Anh', () => {
  afterEach(() => datNgonNguChoKiemThu(null));

  it('mọi trạng thái không còn chữ tiếng Việt', () => {
    datNgonNguChoKiemThu('en');
    const cacMan = [
      dung({ dangTai: true }),
      dung({ loi: 'Can’t reach the WeDo server.' }),
      dung({ trangThai: NGOAI_GOI }),
      dung({ trangThai: NGOAI_GOI_CON_LINK }),
      dung({ trangThai: CHUA_CO_LINK }),
      dung({ trangThai: CO_LINK }),
      dung({ trangThai: { ...CO_LINK, layLanCuoi: null } }),
      dung({ trangThai: CO_LINK, dangLam: 'doi' }),
    ];
    for (const html of cacMan) assert.deepEqual(chuVietConSot(html), []);
  });

  it('đúng chữ tiếng Anh ở các nút chính và dòng lần cuối', () => {
    datNgonNguChoKiemThu('en');
    assert.equal(nutCo(dung({ trangThai: NGOAI_GOI }), 'Upgrade plan').length, 1);
    assert.equal(nutCo(dung({ trangThai: CHUA_CO_LINK }), 'Create sync link').length, 1);
    const html = dung({ trangThai: CO_LINK });
    assert.match(html, /Add to Google Calendar/);
    assert.match(html, /Open in Apple Calendar \/ Outlook/);
    assert.match(html, /Anyone with this link can see your calendar/);
    assert.match(html, /Your calendar last fetched data: 2 hours ago/);
  });
});
```

Run: `npx tsx --test src/components/lich/noi-dung-dong-bo-lich.test.tsx`
Expected: FAIL — "Cannot find module … NoiDungDongBoLich".

- [ ] **Step 2: Phần vẽ thuần**

`src/components/lich/NoiDungDongBoLich.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { CalendarSync, Copy, ExternalLink, Link2Off, Loader2, Lock, RefreshCw, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { TrangThaiDongBoLich } from '../../lib/api';
import { chonManDongBoLich, khoangDaQua, linkThemGoogle, linkWebcal } from '../../lib/dong-bo-lich';
import { dinhDangNgayGio } from '../../i18n/dinh-dang';
import { useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDongBoLich } from '../../i18n/tu-dien/dong-bo-lich';

export type ViecDongBoLich = 'tao' | 'doi' | 'tat';

export interface NoiDungDongBoLichProps {
  trangThai: TrangThaiDongBoLich | null;
  dangTai: boolean;
  /** Việc đang chờ máy chủ. Khác `null` thì khoá mọi nút, kể cả nút đóng. */
  dangLam: ViecDongBoLich | null;
  /** Câu lỗi đã dịch theo ngôn ngữ đang dùng. */
  loi: string | null;
  /** Mốc "bây giờ" cho dòng "Lần cuối…"; kiểm thử truyền vào cho cố định. */
  bayGio?: Date;
  onClose: () => void;
  onThuLai: () => void;
  onNangCap: () => void;
  onTaoLink: () => void;
  onDoiLink: () => void;
  onTatDongBo: () => void;
  onSaoChep: () => void;
}

const NUT_CHINH =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60';
const NUT_PHU =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-3 font-bold text-on-surface hover:bg-surface-container disabled:opacity-60';
const NUT_NGUY_HIEM =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-error/40 px-4 py-3 font-bold text-error hover:bg-error/10 disabled:opacity-60';

const LOAI_LICH = ['google', 'apple', 'outlook'] as const;

/**
 * Phần vẽ của hộp thoại "Đồng bộ với lịch của bạn" (spec mục 4). Không gọi máy
 * chủ, không portal: dựng tĩnh được trong kiểm thử. Gọi API, hỏi xác nhận và
 * toast nằm ở DongBoLichDialog.
 */
export function NoiDungDongBoLich({
  trangThai,
  dangTai,
  dangLam,
  loi,
  bayGio,
  onClose,
  onThuLai,
  onNangCap,
  onTaoLink,
  onDoiLink,
  onTatDongBo,
  onSaoChep,
}: NoiDungDongBoLichProps) {
  const t = useTuDien(tuDienDongBoLich).hopThoai;
  const { ngonNgu } = useNgonNgu();
  const man = chonManDongBoLich({ dangTai, trangThai });
  const dangBan = dangLam !== null;
  const url = trangThai?.url ?? '';
  const layLanCuoi = trangThai?.layLanCuoi ?? null;

  const bieuTuong = (viec: ViecDongBoLich, Icon: LucideIcon) =>
    dangLam === viec ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />;

  const cauLanCuoi = () => {
    const khoang = layLanCuoi ? khoangDaQua(layLanCuoi, bayGio) : null;
    if (!khoang) return t.coLink.chuaLay;
    const khi = khoang.donVi === 'vuaXong' ? t.coLink.thoiGian.vuaXong : t.coLink.thoiGian[khoang.donVi](khoang.so);
    return t.coLink.lanCuoi(khi);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dong-bo-lich-tieu-de"
      aria-busy={dangTai || dangBan}
      className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/20 bg-surface-container-lowest p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="dong-bo-lich-tieu-de" className="flex items-center gap-2 text-2xl font-bold text-on-surface">
            <CalendarSync className="h-6 w-6 shrink-0 text-primary" />
            {t.tieuDe}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t.moTa}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={dangBan}
          aria-label={t.dong}
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loi && (
        <p role="alert" className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">
          {loi}
        </p>
      )}

      {man === 'dangTai' && (
        <div className="flex items-center gap-3 py-6 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          {t.dangTai}
        </div>
      )}

      {man === 'ngoaiGoi' && (
        <div className="grid gap-3">
          <p className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 text-sm leading-6 text-on-surface">
            <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>{t.ngoaiGoi.gioiThieu}</span>
          </p>
          {trangThai?.coLink && <p className="text-sm leading-6 text-on-surface-variant">{t.ngoaiGoi.tamDung}</p>}
        </div>
      )}

      {man === 'chuaCoLink' && (
        <div className="grid gap-2 text-sm leading-6">
          <p className="text-on-surface">{t.chuaCoLink.gioiThieu}</p>
          <p className="text-on-surface-variant">{t.chuaCoLink.chiDoc}</p>
        </div>
      )}

      {man === 'coLink' && (
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <a href={linkThemGoogle(url)} target="_blank" rel="noopener noreferrer" className={NUT_CHINH}>
              <ExternalLink className="h-4 w-4" />
              {t.coLink.themGoogle}
            </a>
            <a href={linkWebcal(url)} className={NUT_PHU}>
              <CalendarSync className="h-4 w-4" />
              {t.coLink.moApple}
            </a>
          </div>

          <div>
            <label htmlFor="dong-bo-lich-link" className="mb-1.5 block text-sm font-bold text-on-surface">
              {t.coLink.lienKet}
            </label>
            <div className="flex gap-2">
              <input
                id="dong-bo-lich-link"
                readOnly
                value={url}
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
              <button
                type="button"
                onClick={onSaoChep}
                disabled={dangBan}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-outline-variant px-3 py-2 text-sm font-bold text-on-surface hover:bg-surface-container disabled:opacity-60"
              >
                <Copy className="h-4 w-4" />
                {t.coLink.saoChep}
              </button>
            </div>
          </div>

          <p className="flex items-start gap-3 rounded-xl bg-warning-container p-3 text-sm leading-6 text-on-warning-container">
            <ShieldAlert className="mt-1 h-4 w-4 shrink-0" />
            <span>{t.coLink.canhBao}</span>
          </p>

          <div>
            <h3 className="mb-2 text-sm font-bold text-on-surface">{t.coLink.huongDanTieuDe}</h3>
            <ul className="grid gap-3 text-sm leading-6 text-on-surface-variant">
              {LOAI_LICH.map((loai) => (
                <li key={loai}>
                  <strong className="block text-on-surface">{t.coLink.huongDan[loai].ten}</strong>
                  {t.coLink.huongDan[loai].cach}
                </li>
              ))}
            </ul>
          </div>

          <p
            className="text-xs text-on-surface-variant"
            title={layLanCuoi ? dinhDangNgayGio(layLanCuoi, ngonNgu) : undefined}
          >
            {cauLanCuoi()}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={dangBan} className={NUT_PHU}>
          {t.dong}
        </button>
        {man === 'loiTai' && (
          <button type="button" onClick={onThuLai} disabled={dangBan} className={NUT_CHINH}>
            <RefreshCw className="h-4 w-4" />
            {t.thuLai}
          </button>
        )}
        {(man === 'coLink' || (man === 'ngoaiGoi' && trangThai?.coLink)) && (
          <button type="button" onClick={onTatDongBo} disabled={dangBan} className={NUT_NGUY_HIEM}>
            {bieuTuong('tat', Link2Off)}
            {t.coLink.tatDongBo}
          </button>
        )}
        {man === 'coLink' && (
          <button type="button" onClick={onDoiLink} disabled={dangBan} className={NUT_PHU}>
            {bieuTuong('doi', RefreshCw)}
            {t.coLink.taoLinkMoi}
          </button>
        )}
        {man === 'ngoaiGoi' && (
          <button type="button" onClick={onNangCap} disabled={dangBan} className={NUT_CHINH}>
            <Sparkles className="h-4 w-4" />
            {t.ngoaiGoi.nangCap}
          </button>
        )}
        {man === 'chuaCoLink' && (
          <button type="button" onClick={onTaoLink} disabled={dangBan} className={NUT_CHINH}>
            {bieuTuong('tao', CalendarSync)}
            {t.chuaCoLink.taoLink}
          </button>
        )}
      </div>
    </div>
  );
}
```

Run: `npx tsx --test src/components/lich/noi-dung-dong-bo-lich.test.tsx`
Expected: PASS (10 bài). Nếu bài "đang gọi máy chủ" đỏ vì một nút thiếu `disabled=""`, sửa nút đó (thêm `disabled={dangBan}`), KHÔNG nới bài kiểm.

- [ ] **Step 3: Hộp thoại gọi API**

`src/components/lich/DongBoLichDialog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { LopPhu } from '../LopPhu';
import { useToast } from '../../contexts/ToastContext';
import { api, type TrangThaiDongBoLich } from '../../lib/api';
import { laLoiNgoaiGoi } from '../../lib/dong-bo-lich';
import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDongBoLich } from '../../i18n/tu-dien/dong-bo-lich';
import { NoiDungDongBoLich, type ViecDongBoLich } from './NoiDungDongBoLich';

type KhoaLoi = 'loiTai' | 'loiTao' | 'loiTat';

interface DongBoLichDialogProps {
  onClose: () => void;
  /** Mở màn Nâng cấp của app (CalendarView truyền `onNavigate('upgrade')`). Không truyền thì đổi địa chỉ sang `#/upgrade`. */
  onNangCap?: () => void;
}

/**
 * Hộp thoại "Đồng bộ với lịch của bạn" ở màn Lịch: xem/tạo/đổi/tắt link lịch
 * riêng. Máy chủ quyết ai được dùng (`duocDung`); lịch viết theo ngôn ngữ đang
 * chọn trên web lúc tạo link.
 */
export function DongBoLichDialog({ onClose, onNangCap }: DongBoLichDialogProps) {
  const t = useTuDien(tuDienDongBoLich).hopThoai;
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  const { showToast } = useToast();
  const [trangThai, setTrangThai] = useState<TrangThaiDongBoLich | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangLam, setDangLam] = useState<ViecDongBoLich | null>(null);
  // Giữ nguồn lỗi, dịch lúc vẽ: đổi ngôn ngữ thì câu báo lỗi đổi theo.
  const [loi, setLoi] = useState<{ loi: unknown; khoa: KhoaLoi } | null>(null);
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(null);
    api
      .layDongBoLich()
      .then(
        (ketQua) => {
          if (!huy) setTrangThai(ketQua);
        },
        (e: unknown) => {
          if (!huy) setLoi({ loi: e ?? new Error(), khoa: 'loiTai' });
        },
      )
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [lanTai]);

  /*
    Không cho đóng khi đang chờ máy chủ: đóng giữa lúc "Tạo link mới" thì người
    dùng không biết link cũ đã chết hay chưa.
  */
  const dong = () => {
    if (dangLam === null) onClose();
  };

  const nangCap = () => {
    onClose();
    if (onNangCap) onNangCap();
    else window.location.hash = '#/upgrade';
  };

  const taoLink = async (doi: boolean) => {
    if (dangLam !== null) return;
    if (doi && !window.confirm(t.coLink.xacNhanTaoMoi)) return;
    setDangLam(doi ? 'doi' : 'tao');
    setLoi(null);
    try {
      setTrangThai(await api.taoLinkDongBoLich(ngonNgu));
      showToast(doi ? t.daDoi : t.daTao, undefined, 'success');
    } catch (e) {
      // Gói vừa hết hạn giữa chừng: chuyển sang lời mời nâng cấp, vẫn giữ câu báo lỗi.
      if (laLoiNgoaiGoi(e)) {
        setTrangThai((cu) => (cu ? { ...cu, duocDung: false } : { duocDung: false, coLink: false }));
      }
      setLoi({ loi: e ?? new Error(), khoa: 'loiTao' });
    } finally {
      setDangLam(null);
    }
  };

  const tatDongBo = async () => {
    if (dangLam !== null || !window.confirm(t.coLink.xacNhanTat)) return;
    setDangLam('tat');
    setLoi(null);
    try {
      await api.tatDongBoLich();
      setTrangThai((cu) => ({ duocDung: cu?.duocDung ?? false, coLink: false }));
      showToast(t.daTat, undefined, 'info');
    } catch (e) {
      setLoi({ loi: e ?? new Error(), khoa: 'loiTat' });
    } finally {
      setDangLam(null);
    }
  };

  const saoChep = async () => {
    if (!trangThai?.url) return;
    try {
      await navigator.clipboard.writeText(trangThai.url);
      showToast(t.daSaoChep, undefined, 'success');
    } catch {
      showToast(t.khongSaoChepDuoc, undefined, 'error');
    }
  };

  return (
    <LopPhu className="flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label={t.dong}
        disabled={dangLam !== null}
        className="absolute inset-0 cursor-default"
        onClick={dong}
      />
      <NoiDungDongBoLich
        trangThai={trangThai}
        dangTai={dangTai}
        dangLam={dangLam}
        loi={loi ? dichLoi(loi.loi, t[loi.khoa]) : null}
        onClose={dong}
        onThuLai={() => setLanTai((so) => so + 1)}
        onNangCap={nangCap}
        onTaoLink={() => void taoLink(false)}
        onDoiLink={() => void taoLink(true)}
        onTatDongBo={() => void tatDongBo()}
        onSaoChep={() => void saoChep()}
      />
    </LopPhu>
  );
}
```

Nền phủ dùng `bg-black/35` như các hộp thoại sẵn có của chính `CalendarView` (token `bg-scrim` mà `MoiVaoNhomDialog`/`XuatBaoCaoDialog` dùng KHÔNG được khai trong `src/index.css`, nên ở đó nền phủ trong suốt).

- [ ] **Step 4: Đưa hai tệp vào danh sách đã dịch**

Trong `src/i18n/kiem-chuoi-chua-dich.test.ts`, mảng `TEP_DA_DICH`, ngay sau dòng `'src/components/layout/Topbar.tsx',` thêm:

```ts
  'src/components/lich/DongBoLichDialog.tsx',
  'src/components/lich/NoiDungDongBoLich.tsx',
```

- [ ] **Step 5: Chạy lại**

Run: `npx tsx --test src/components/lich/noi-dung-dong-bo-lich.test.tsx src/i18n/kiem-chuoi-chua-dich.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS (hai bài mới trong `TEP_DA_DICH` xanh); tsc sạch (`DongBoLichDialog` chưa ai nhập — không sao, W4 gắn); kiem-dich sạch.

- [ ] **Step 6: Commit**

```bash
git add src/components/lich/NoiDungDongBoLich.tsx src/components/lich/noi-dung-dong-bo-lich.test.tsx src/components/lich/DongBoLichDialog.tsx src/i18n/kiem-chuoi-chua-dich.test.ts
git -c core.autocrlf=false commit -m "feat(web): hop thoai dong bo voi lich cua ban - nang cap, tao link, Google, webcal, tao moi, tat" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Ghi chú hợp đồng: khung kế hoạch ghi `DongBoLichDialog({ onClose }: { onClose: () => void })`. Thêm `onNangCap?: () => void` (không bắt buộc) vì "Nâng cấp gói" phải đi qua `handleNavigate` của `App.tsx` (đổi `activeView`, nhớ `previousView` cho nút Trở về) — hộp thoại tự đổi `location.hash` chỉ là đường dự phòng. Gọi `DongBoLichDialog({ onClose })` vẫn đúng kiểu.

---

### Task W4: Nút "Đồng bộ với lịch của bạn" ở màn Lịch

**Files:**
- Modify: `src/views/CalendarView.tsx` (import `lucide-react` dòng 3-17; import mới sau dòng 36; chữ ký dòng 165; state sau dòng 184; header dòng 404-406; cuối JSX trước `</div>` đóng của `return`)

**Interfaces:**
- Consumes: `DongBoLichDialog` (W3), `tuDienDongBoLich` (W2); `handleNavigate(view: NavItem)` của `App.tsx` (dòng 416) — `NavItem` có `'upgrade'` = màn Nâng cấp trong app (`#/upgrade`, `PricingView isDashboardMode`).
- Produces: `CalendarView({ onNavigate }: { onNavigate?: (view: 'taskboard' | 'meeting' | 'upgrade') => void })` — `App.tsx` không phải sửa (`handleNavigate` nhận mọi `NavItem`).

Task giao diện thuần: logic đã nằm ở W1-W3 có kiểm thử; cổng là `tsc` + `kiem-dich` + `kiem-chuoi-chua-dich.test.ts` (`CalendarView.tsx` có trong `TEP_DA_DICH`).

- [ ] **Step 1: Import**

Trong khối `import { … } from 'lucide-react';` (dòng 3-17) thêm `CalendarSync,` ngay sau `CalendarPlus,`.

Sau dòng `import { tuDienLich } from '../i18n/tu-dien/lich';` thêm:

```tsx
import { DongBoLichDialog } from '../components/lich/DongBoLichDialog';
import { tuDienDongBoLich } from '../i18n/tu-dien/dong-bo-lich';
```

- [ ] **Step 2: Chữ ký và state**

Thay dòng

```tsx
export function CalendarView({ onNavigate }: { onNavigate?: (view: 'taskboard' | 'meeting') => void }) {
```

bằng

```tsx
export function CalendarView({ onNavigate }: { onNavigate?: (view: 'taskboard' | 'meeting' | 'upgrade') => void }) {
```

Sau dòng `const [form, setForm] = useState(emptyForm);` thêm:

```tsx
  const [dongBoOpen, setDongBoOpen] = useState(false);
  const tDongBo = useTuDien(tuDienDongBoLich);
```

- [ ] **Step 3: Nút cạnh "Tạo sự kiện"**

Thay ba dòng

```tsx
          <button type="button" onClick={() => openCreateEvent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
            <CalendarPlus className="h-4 w-4" /> {t.taoSuKien}
          </button>
```

bằng

```tsx
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => setDongBoOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container">
              <CalendarSync className="h-4 w-4" /> {tDongBo.nut}
            </button>
            <button type="button" onClick={() => openCreateEvent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
              <CalendarPlus className="h-4 w-4" /> {t.taoSuKien}
            </button>
          </div>
```

- [ ] **Step 4: Hộp thoại**

Ngay SAU khối `{eventModalOpen && ( <LopPhu …> … </LopPhu> )}` (khối cuối cùng, trước dòng `    </div>` đóng của `return`), thêm:

```tsx
      {dongBoOpen && (
        <DongBoLichDialog onClose={() => setDongBoOpen(false)} onNangCap={() => onNavigate?.('upgrade')} />
      )}
```

- [ ] **Step 5: Kiểm**

Run: `npm run lint && npm run kiem-dich && npx tsx --test src/i18n/kiem-chuoi-chua-dich.test.ts`
Expected: tsc sạch (App.tsx truyền `handleNavigate: (view: NavItem) => void` vào prop hẹp hơn — hợp lệ); kiem-dich sạch; bài `src/views/CalendarView.tsx` trong "các màn đã dịch" xanh.

Kiểm bằng mắt (không bắt buộc, chỉ khi có backend cục bộ chạy nhánh `feat/dong-bo-lich` của BE với Postgres thử và `.env` tự soạn — KHÔNG chép `.env` production): `VITE_API_URL=http://localhost:3000 npm run dev`, mở `#/calendar`, bấm "Đồng bộ với lịch của bạn", thử đủ ba trạng thái (tài khoản Free / Pro chưa có link / có link), "Nâng cấp gói" phải sang màn Nâng cấp và nút Trở về quay lại Lịch. Không chạy dev server khi `VITE_API_URL` trỏ ra API thật.

- [ ] **Step 6: Commit**

```bash
git add src/views/CalendarView.tsx
git -c core.autocrlf=false commit -m "feat(web): nut dong bo voi lich cua ban o man Lich" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W5: Sửa lời hứa — bảng giá và chính sách thanh toán

**Files:**
- Modify: `src/i18n/tu-dien/bang-gia.ts` (vi dòng 103-104; en dòng 204-205)
- Test: `src/views/pricing-plans.test.ts` (dòng 70-75; thêm bài sau bài "tính năng chưa làm…"; thêm khẳng định sau dòng 144)
- Modify: `public/chinh-sach-thanh-toan.html` (dòng 91; dòng 143-145)
- Test: `src/trang-cong-khai.test.ts` (bài "nói thẳng tên tính năng chưa có…", dòng 195-202)

**Interfaces:**
- Consumes: `TINH_NANG_PRO`, `tinhNangCacGoi` (`src/views/pricing-plans.ts`, không sửa).
- Produces: mục bảng giá gói Pro VÀ gói Team `{ ten: 'Đồng bộ lịch (Google, Apple, Outlook)', giaTri: 'Có' }` / `{ ten: 'Calendar sync (Google, Apple, Outlook)', giaTri: 'Included' }`, đứng TRƯỚC "AI Daily Planner" (mục đã có lên trước, mục "Sắp ra mắt" xuống cuối) ở cả hai ngôn ngữ; chính sách thanh toán chỉ còn AI Daily Planner và Meeting Vote trong đoạn "chưa ra mắt".

- [ ] **Step 1: Sửa bài kiểm bảng giá (thất bại)**

Trong `src/views/pricing-plans.test.ts`:

1. Trong bài `'tính năng chưa làm vẫn hiện nhưng gắn "Sắp ra mắt", không bao giờ ghi "Có"'`, xoá dòng

```ts
      ['Personal Pro', TINH_NANG_PRO, 'Export lịch/task'],
```

2. Ngay sau bài đó (sau `});` đóng của nó) thêm:

```ts
  it('Đồng bộ lịch đã ra mắt: gói Pro ghi "Có", không còn "Sắp ra mắt" hay tên cũ "Export lịch/task"', () => {
    const muc = tim(TINH_NANG_PRO, 'Đồng bộ lịch (Google, Apple, Outlook)');
    assert.ok(muc, 'gói Pro phải có "Đồng bộ lịch (Google, Apple, Outlook)"');
    assert.equal(muc.sapRaMat, undefined);
    assert.equal(muc.giaTri, 'Có');
    const team = tim(TINH_NANG_TEAM, 'Đồng bộ lịch (Google, Apple, Outlook)');
    assert.ok(team && team.giaTri === 'Có' && !team.sapRaMat, 'gói Team cũng phải ghi Đồng bộ lịch: Có');
    for (const [goi, ds] of tatCa) {
      assert.ok(!ds.some((m) => /Export lịch/.test(m.ten)), `${goi}: còn tên cũ "Export lịch/task"`);
    }
  });
```

3. Trong bài `'mục chưa làm không ghi quyền lợi, có ghi chú "Coming soon"; …'`, ngay sau dòng `assert.ok(en.free.some((muc) => muc.ten === 'Contribution board' && muc.giaTri === 'Included'));` thêm:

```ts
    assert.ok(
      en.pro.some((muc) => muc.ten === 'Calendar sync (Google, Apple, Outlook)' && muc.giaTri === 'Included' && !muc.sapRaMat),
      'gói Pro (tiếng Anh) phải có Calendar sync đã ra mắt',
    );
    assert.ok(
      en.team.some((muc) => muc.ten === 'Calendar sync (Google, Apple, Outlook)' && muc.giaTri === 'Included' && !muc.sapRaMat),
      'gói Team (tiếng Anh) cũng phải có Calendar sync',
    );
    for (const goi of ['free', 'pro', 'team'] as const) {
      assert.ok(!en[goi].some((muc) => /Calendar\/task export/.test(muc.ten)), `${goi}: còn tên cũ`);
    }
```

Giữ nguyên dòng `assert.doesNotMatch(nguon, /AI Daily Planner: Có|Export lịch\/task: Có|Meeting Vote: Có/);` (PricingView vẫn không được viết tay dòng "Có" nào).

Run: `npx tsx --test src/views/pricing-plans.test.ts`
Expected: FAIL ở hai chỗ: bài "Đồng bộ lịch đã ra mắt…" (không thấy mục) và bài "mục chưa làm không ghi quyền lợi…" (không thấy Calendar sync).

- [ ] **Step 2: Sửa bài kiểm trang công khai (thất bại)**

Trong `src/trang-cong-khai.test.ts`, thay nguyên bài

```ts
  it('nói thẳng tên tính năng chưa có, không dựa vào nhãn "Sắp ra mắt" mà trang Bảng giá có thể chưa gắn', () => {
    const chinhSach = doc('public/chinh-sach-thanh-toan.html').replace(/\s+/g, ' ');
    const quyenLoi = chinhSach.match(/<p>[^<]*AI Daily Planner.*?<\/p>/)?.[0] ?? '';
    for (const tinhNang of ['AI Daily Planner', 'Export lịch/task', 'Meeting Vote']) {
      assert.ok(quyenLoi.includes(tinhNang), tinhNang);
    }
    assert.match(quyenLoi, /không nằm trong quyền lợi của gói/);
  });
```

bằng

```ts
  it('nói thẳng tên tính năng chưa có, không dựa vào nhãn "Sắp ra mắt" mà trang Bảng giá có thể chưa gắn', () => {
    const chinhSach = doc('public/chinh-sach-thanh-toan.html').replace(/\s+/g, ' ');
    const quyenLoi = chinhSach.match(/<p>[^<]*AI Daily Planner.*?<\/p>/)?.[0] ?? '';
    for (const tinhNang of ['AI Daily Planner', 'Meeting Vote']) {
      assert.ok(quyenLoi.includes(tinhNang), tinhNang);
    }
    assert.match(quyenLoi, /không nằm trong quyền lợi của gói/);
    // Đồng bộ lịch (trước đây "Export lịch/task") đã ra mắt cho Pro và Team: không được còn trong danh sách chưa có.
    assert.doesNotMatch(chinhSach, /Export lịch\/task/);
  });
```

Run: `npx tsx --test src/trang-cong-khai.test.ts`
Expected: FAIL đúng bài này (chính sách còn "Export lịch/task").

- [ ] **Step 3: Sửa từ điển bảng giá**

Trong `src/i18n/tu-dien/bang-gia.ts`, bản tiếng Việt, thay hai dòng

```ts
      { ten: 'AI Daily Planner', sapRaMat: true },
      { ten: 'Export lịch/task', sapRaMat: true },
```

bằng

```ts
      // Link đăng ký lịch tự đồng bộ (BE src/lich-dong-bo), ra mắt 10/2026 — trước đây là "Export lịch/task".
      { ten: 'Đồng bộ lịch (Google, Apple, Outlook)', giaTri: 'Có' },
      { ten: 'AI Daily Planner', sapRaMat: true },
```

Cũng trong bản tiếng Việt, ở `tinhNangTeam`, thay dòng

```ts
      { ten: 'Meeting Vote', sapRaMat: true },
```

bằng (gói Team có mọi quyền lợi của Pro; chủ dự án quyết ghi rõ ngày 03/10/2026)

```ts
      { ten: 'Đồng bộ lịch (Google, Apple, Outlook)', giaTri: 'Có' },
      { ten: 'Meeting Vote', sapRaMat: true },
```

và bản tiếng Anh, thay hai dòng

```ts
      { ten: 'AI Daily Planner', sapRaMat: true },
      { ten: 'Calendar/task export', sapRaMat: true },
```

bằng

```ts
      { ten: 'Calendar sync (Google, Apple, Outlook)', giaTri: 'Included' },
      { ten: 'AI Daily Planner', sapRaMat: true },
```

và ở `tinhNangTeam` tiếng Anh, thay dòng `      { ten: 'Meeting Vote', sapRaMat: true },` bằng

```ts
      { ten: 'Calendar sync (Google, Apple, Outlook)', giaTri: 'Included' },
      { ten: 'Meeting Vote', sapRaMat: true },
```

Run: `npx tsx --test src/views/pricing-plans.test.ts src/i18n/tu-dien.test.ts`
Expected: PASS (bài "cùng số dòng, cùng vị trí…" vẫn xanh vì hai ngôn ngữ đổi cùng vị trí).

- [ ] **Step 4: Sửa chính sách thanh toán**

Trong `public/chinh-sach-thanh-toan.html`:

1. Thay dòng `        Cập nhật ngày 30/09/2026.<br />` bằng `        Cập nhật ngày 03/10/2026.<br />` (nếu ngày đưa lên thật khác, chủ dự án sửa lại ngày này lúc deploy).
2. Thay ba dòng

```html
        AI Daily Planner, Export lịch/task và Meeting Vote có tên trên trang Bảng giá nhưng hiện
        chưa ra mắt, nên không nằm trong quyền lợi của gói bạn mua hôm nay. Tính năng nào trên trang
        Bảng giá hay trang chủ được ghi <strong>"Sắp ra mắt"</strong> cũng vậy.
```

bằng

```html
        AI Daily Planner và Meeting Vote có tên trên trang Bảng giá nhưng hiện chưa ra mắt, nên
        không nằm trong quyền lợi của gói bạn mua hôm nay. Tính năng nào trên trang Bảng giá hay
        trang chủ được ghi <strong>"Sắp ra mắt"</strong> cũng vậy.
```

Run: `npx tsx --test src/trang-cong-khai.test.ts src/views/pricing-plans.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS; tsc sạch; kiem-dich sạch.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/tu-dien/bang-gia.ts src/views/pricing-plans.test.ts public/chinh-sach-thanh-toan.html src/trang-cong-khai.test.ts
git -c core.autocrlf=false commit -m "fix(web): bang gia va chinh sach thanh toan - dong bo lich da ra mat, bo Sap ra mat cua Export lich/task" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W6: Chuyển tiếp `/lich/:tep` trên Vercel

**Files:**
- Modify: `vercel.json`
- Test: `src/cau-hinh-vercel.test.ts`

**Interfaces:**
- Consumes: đường công khai của máy chủ `GET /calendar-feed/:tep` (`:tep` = `<mã 43 ký tự>.ics`); `GOC_LINK_MAC_DINH = 'https://wedofpt.com.vn/lich'` của BE (link máy chủ trả = `https://wedofpt.com.vn/lich/<mã>.ics`).
- Produces: `https://wedofpt.com.vn/lich/<mã>.ics` → `https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/calendar-feed/<mã>.ics` (rewrite, địa chỉ trên thanh trình duyệt/lịch không đổi; header `Cache-Control: private` của máy chủ đi qua nguyên vẹn nên Vercel không lưu đệm lịch của ai).

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/cau-hinh-vercel.test.ts`:

```ts
/*
  vercel.json của web: link đồng bộ lịch đẹp `https://wedofpt.com.vn/lich/<mã>.ics`
  phải tới được máy chủ API, và sửa tệp này không được làm rơi cấu hình cũ.

    npx tsx --test src/cau-hinh-vercel.test.ts
*/
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

interface LuatDuongDan {
  source: string;
  destination: string;
  permanent?: boolean;
}

interface CauHinhVercel {
  functions?: Record<string, unknown>;
  rewrites?: LuatDuongDan[];
  redirects?: LuatDuongDan[];
}

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..');
const cauHinh = JSON.parse(readFileSync(join(GOC, 'vercel.json'), 'utf8')) as CauHinhVercel;

describe('vercel.json', () => {
  it('chuyển tiếp /lich/:tep tới đường lịch công khai của API production', () => {
    assert.deepEqual(
      cauHinh.rewrites?.filter((luat) => luat.source.startsWith('/lich')),
      [
        {
          source: '/lich/:tep',
          destination: 'https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/calendar-feed/:tep',
        },
      ],
    );
  });

  it('không có rewrite bắt-tất-cả nào nuốt mất /lich (web là SPA dùng #/, không cần)', () => {
    for (const luat of cauHinh.rewrites ?? []) {
      assert.doesNotMatch(luat.source, /^\/(\(\.\*\)|:path\*|\*)/, luat.source);
    }
  });

  it('vẫn giữ chuyển hướng /gioi-thieu → /gioi-thieu/ của trang giới thiệu', () => {
    assert.ok(
      cauHinh.redirects?.some(
        (luat) => luat.source === '/gioi-thieu' && luat.destination === '/gioi-thieu/' && luat.permanent === true,
      ),
    );
  });

  it('vẫn giữ cấu hình hàm api/gemini-proxy.ts', () => {
    assert.ok(cauHinh.functions?.['api/gemini-proxy.ts']);
  });
});
```

Run: `npx tsx --test src/cau-hinh-vercel.test.ts`
Expected: FAIL ở bài đầu (`rewrites` chưa có → `undefined` khác mảng mong đợi); ba bài còn lại PASS.

- [ ] **Step 2: Sửa `vercel.json`**

Ghi đè `vercel.json` bằng (giữ nguyên `functions` và `redirects`, thêm `rewrites`):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/gemini-proxy.ts": {
      "regions": [
        "iad1"
      ],
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/lich/:tep",
      "destination": "https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/calendar-feed/:tep"
    }
  ],
  "redirects": [
    {
      "source": "/gioi-thieu",
      "destination": "/gioi-thieu/",
      "permanent": true
    }
  ]
}
```

Bản staging dùng chung tệp này nên link staging cũng trỏ về API production; mã staging không có ở production nên trả 404 — chấp nhận được (spec mục 3.5).

- [ ] **Step 3: Chạy lại**

Run: `npx tsx --test src/cau-hinh-vercel.test.ts && node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))" && git diff --stat -- vercel.json`
Expected: PASS (4 bài); JSON hợp lệ (lệnh `node` không in gì); diff chỉ thêm khối `rewrites` (khoảng +6 dòng, không dòng nào bị xoá). Nếu `git diff` báo đổi cả tệp vì kết thúc dòng, chạy `git -c core.autocrlf=false diff --stat -- vercel.json` và ghi lại kiểu kết thúc dòng của bản gốc (`git show origin/main:vercel.json | od -c | head -3`) để giữ đúng.

- [ ] **Step 4: Commit**

```bash
git add vercel.json src/cau-hinh-vercel.test.ts
git -c core.autocrlf=false commit -m "feat(web): chuyen tiep /lich/:tep tren Vercel toi duong lich cong khai cua API" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W7: Cổng cuối của web

**Files:** không sửa tệp nào (chỉ sửa nếu một bước dưới đây đỏ, rồi commit riêng).

**Interfaces:**
- Consumes: toàn bộ W1-W6.
- Produces: nhánh `feat/dong-bo-lich` sẵn sàng để chủ dự án đẩy và mở PR (KHÔNG push, KHÔNG deploy).

- [ ] **Step 1: Toàn bộ cổng**

```bash
npm run lint
npm run kiem-dich
npx tsx scripts/kiem-chuoi-chua-dich.ts --ca-ts --nghiem; echo "kiem-dich ca-ts: $?"
npx tsx --test $(git ls-files 'src/*.test.ts' 'src/*.test.tsx')
npm run build
git diff --stat origin/main -- package.json package-lock.json
git diff --stat origin/main
git status --short
```

Expected:
- tsc sạch;
- hai lần kiem-dich in `Không còn chữ tiếng Việt nào nằm ngoài từ điển.`, `kiem-dich ca-ts: 0`;
- mọi bài PASS (`# fail 0`), trong đó có `src/lib/dong-bo-lich.test.ts`, `src/components/lich/noi-dung-dong-bo-lich.test.tsx`, `src/cau-hinh-vercel.test.ts`, `src/trang-cong-khai.test.ts` (kiểm bằng `… | grep -E "dong-bo-lich|cau-hinh-vercel|trang-cong-khai"` nếu cần);
- build xong;
- `git diff --stat origin/main -- package.json package-lock.json` không in gì (web không thêm thư viện);
- `git diff --stat origin/main` chỉ gồm đúng 17 tệp: `public/chinh-sach-thanh-toan.html`, `src/cau-hinh-vercel.test.ts`, `src/components/lich/DongBoLichDialog.tsx`, `src/components/lich/NoiDungDongBoLich.tsx`, `src/components/lich/noi-dung-dong-bo-lich.test.tsx`, `src/i18n/kiem-chuoi-chua-dich.test.ts`, `src/i18n/loi.test.ts`, `src/i18n/loi.ts`, `src/i18n/tu-dien/bang-gia.ts`, `src/i18n/tu-dien/dong-bo-lich.ts`, `src/lib/api.ts`, `src/lib/dong-bo-lich.test.ts`, `src/lib/dong-bo-lich.ts`, `src/trang-cong-khai.test.ts`, `src/views/CalendarView.tsx`, `src/views/pricing-plans.test.ts`, `vercel.json`; thêm tệp nào ngoài danh sách thì giải thích hoặc hoàn tác;
- `git status --short` không in gì (mọi thứ đã commit; `dist/` nằm trong `.gitignore`).

- [ ] **Step 2: Báo lại cho chủ dự án**

Ghi trong báo cáo: đỉnh nhánh `feat/dong-bo-lich`, số bài kiểm thử, và các việc chủ dự án làm theo thứ tự spec mục 9 — CHỈ sau khi backend đã lên Azure và `GET /calendar-feed/<mã sai>.ics` trả 404: đẩy nhánh, mở PR vào `main`, merge để Vercel deploy; rồi kiểm `https://wedofpt.com.vn/lich/<mã sai 43 ký tự>.ics` trả 404 dạng chữ (không phải trang SPA), tạo link thật trên màn Lịch, mở link `.ics` thấy `BEGIN:VCALENDAR`, dán vào Google Calendar trên máy tính và Lịch iPhone. Nếu ngày deploy khác 03/10/2026 thì sửa dòng "Cập nhật ngày" của `public/chinh-sach-thanh-toan.html` trước khi merge. Không có gì để commit ở bước này.

---

## Mobile

### File Structure — Mobile

Worktree `D:\WEDO_PC\wt\mb-lich`, nhánh `feat/dong-bo-lich` từ `main` (đỉnh lúc viết kế hoạch: `e5c80b6`, cộng commit kế hoạch nếu có).

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `src/lib/api/dong-bo-lich.ts` (+ `src/lib/api/__tests__/dong-bo-lich.test.ts`) | Tạo | `TrangThaiDongBoLich`, `layDongBoLich`, `taoLinkDongBoLich` (gửi `{ lang: 'vi' }`), `tatDongBoLich`, `cauLoiDongBoLich` |
| `src/app/account/calendar-sync.tsx` (+ `src/app/account/__tests__/calendar-sync.test.tsx`) | Tạo | Màn "Đồng bộ lịch": đang tải / lỗi tải / gói Miễn phí / chưa có link / có link; iPhone → `<Redirect href="/account" />` |
| `.expo/types/router.d.ts` | Sinh lại (không commit — thư mục `.expo` bị gitignore) | Kiểu đường dẫn có `/account/calendar-sync` |
| `src/app/(tabs)/account/index.tsx` | Sửa | Hàng "Đồng bộ lịch" ngay dưới "Bảng đóng góp", ẩn khi `Platform.OS === 'ios'` |
| `src/components/auth/__tests__/muc-dong-bo-lich.test.tsx` | Tạo | Hàng có trên Android và mở đúng màn; không có trên iPhone |

Vì sao màn mới nằm ở `src/app/account/` chứ không trong `src/app/(tabs)/account/`: màn KHÔNG gọi `useWorkspace()` (link là của cả người, gộp mọi workspace), nên được đặt trên ngăn xếp gốc như `profile`, `notification-settings`, `feedback`, `delete-account` — không phải khai `href: null` trong `(tabs)/_layout.tsx`, và `router.back()` về đúng màn Tài khoản. `src/lib/__tests__/pham-vi-workspace.test.ts` tự canh luật này (màn ngoài `(tabs)` gọi `useWorkspace()` là đỏ). Tệp kiểm thử của màn đặt ở `src/app/account/__tests__/` như `feedback.test.tsx` — KHÔNG đặt dưới `src/app/(tabs)/`.

Hai điều về môi trường kiểm thử phải biết trước:
- **jest-expo chạy với `Platform.OS === 'ios'` mặc định** (`@react-native/jest-preset` đặt `defaultPlatform: 'ios'`). Mọi ca cần Android phải `jest.replaceProperty(Platform, 'OS', 'android')` rồi `restore()` trong `afterEach`. `Platform.OS` là thuộc tính thường (không phải getter) nên `replaceProperty` thay được; các bài cũ (`man-tai-khoan.test.tsx`) vẫn chạy như iPhone và không đổi kết quả.
- **QueryClient trong bài kiểm màn phải đặt `gcTime: Infinity`** cho cả `queries` lẫn `mutations`. Để mặc định thì bộ hẹn giờ dọn cache 5 phút giữ tiến trình sống và `npx jest <tệp>` in "Jest did not exit" rồi treo (đã đo: `feedback.test.tsx` hiện có cũng treo như vậy khi chạy riêng).

Mọi lệnh dưới đây chạy trong `D:\WEDO_PC\wt\mb-lich` bằng Git Bash (công cụ Bash), trừ khi ghi PowerShell. Kiểm thử một tệp: `npx jest <tệp>`; kiểu: `npx tsc --noEmit`. KHÔNG chạy `npx expo lint`.

---

### Task M0: Tạo worktree mobile và đo mốc

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: nhánh `main` của `D:\WeDo_ChPlay`.
- Produces: worktree `D:\WEDO_PC\wt\mb-lich` (nhánh `feat/dong-bo-lich`), `node_modules` là junction sang `D:\WeDo_ChPlay\node_modules`, có `.env`, `google-services.json`, `.expo\types\router.d.ts`; số bộ/bài jest và dấu vân tay MỐC của worktree.

- [ ] **Step 1: Tạo worktree (PowerShell)**

```powershell
git -C D:\WeDo_ChPlay worktree add D:\WEDO_PC\wt\mb-lich -b feat/dong-bo-lich main
cmd /c mklink /J D:\WEDO_PC\wt\mb-lich\node_modules D:\WeDo_ChPlay\node_modules
Copy-Item D:\WeDo_ChPlay\.env D:\WEDO_PC\wt\mb-lich\.env
Copy-Item D:\WeDo_ChPlay\google-services.json D:\WEDO_PC\wt\mb-lich\google-services.json
New-Item -ItemType Directory -Force D:\WEDO_PC\wt\mb-lich\.expo\types
Copy-Item D:\WeDo_ChPlay\.expo\types\router.d.ts D:\WEDO_PC\wt\mb-lich\.expo\types\router.d.ts
(Get-Item D:\WEDO_PC\wt\mb-lich\node_modules).LinkType
git -C D:\WEDO_PC\wt\mb-lich status --short
```

Expected: `Junction created for ...`; dòng `LinkType` in `Junction`; `git status --short` không in gì (`.env`, `google-services.json`, `.expo/`, `node_modules` đều bị gitignore). Không in nội dung `.env` hay `google-services.json` ra màn hình hay vào báo cáo. `google-services.json` chép vào để vân tay đo trong worktree khớp cách EAS tính (thiếu nó thì vân tay lệch).

**CẢNH BÁO:** khi dọn worktree này về sau, KHÔNG `Remove-Item -Recurse` và KHÔNG `git worktree remove` khi junction còn đó — cả hai đi xuyên junction và xoá luôn `D:\WeDo_ChPlay\node_modules` (sự cố 02/10/2026). Luôn chạy `cmd /c rmdir D:\WEDO_PC\wt\mb-lich\node_modules` TRƯỚC, kiểm `Test-Path D:\WeDo_ChPlay\node_modules\expo` vẫn `True`, rồi mới `git -C D:\WeDo_ChPlay worktree remove D:\WEDO_PC\wt\mb-lich`.

- [ ] **Step 2: Kiểm mốc (Git Bash, trong `D:/WEDO_PC/wt/mb-lich`)**

```bash
cd /d/WEDO_PC/wt/mb-lich
npx tsc --noEmit && npx jest 2>&1 | grep -E "^(Tests|Test Suites):"
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: tsc sạch; jest `Test Suites: 126 passed, 126 total` và khoảng `Tests: 1020 passed` (ghi đúng số in ra làm mốc — M4 phải ra mốc + 3 bộ, + 22 bài). Ghi giá trị vân tay làm MỐC của worktree (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`; nếu worktree cho số khác vì đường dẫn/junction thì vẫn dùng chính số đó làm mốc so ở M4 — số chính thức đo lại ở checkout thật của `main` lúc deploy). Không commit.

---

### Task M1: API đồng bộ lịch và câu lỗi theo mã

**Files:**
- Create: `src/lib/api/dong-bo-lich.ts`
- Test: `src/lib/api/__tests__/dong-bo-lich.test.ts`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError`, `MA_PHAN_HOI_LA` (`src/lib/api/client.ts`; `ApiError` có `status`, `code?`; mất mạng là `status 0` với câu tiếng Việt sẵn; thân rỗng của 204 trả `undefined`); hợp đồng backend `GET/POST/DELETE /calendar-feed` (POST thân `{ lang }`, 403 `CALENDAR_FEED_NOT_IN_PLAN`, DELETE 204).
- Produces (đúng hợp đồng):
  - `export interface TrangThaiDongBoLich { duocDung: boolean; coLink: boolean; url?: string; taoLuc?: string; layLanCuoi?: string | null; }`
  - `export function layDongBoLich(): Promise<TrangThaiDongBoLich>`
  - `export function taoLinkDongBoLich(): Promise<TrangThaiDongBoLich>` — gửi `{ lang: 'vi' }`
  - `export function tatDongBoLich(): Promise<void>`
  - `export function cauLoiDongBoLich(loi: unknown): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/api/__tests__/dong-bo-lich.test.ts`:

```ts
import { ApiError, MA_PHAN_HOI_LA, apiRequest } from '../client';
import { cauLoiDongBoLich, layDongBoLich, taoLinkDongBoLich, tatDongBoLich } from '../dong-bo-lich';

// Giữ `ApiError` thật: `cauLoiDongBoLich` phân loại bằng `instanceof`.
jest.mock('../client', () => ({
  ...jest.requireActual<typeof import('../client')>('../client'),
  apiRequest: jest.fn(),
}));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const CO_LINK = {
  duocDung: true,
  coLink: true,
  url: 'https://wedofpt.com.vn/lich/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCd.ics',
  taoLuc: '2026-10-03T02:00:00.000Z',
  layLanCuoi: null,
};

describe('API đồng bộ lịch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET trạng thái', async () => {
    mockedRequest.mockResolvedValueOnce(CO_LINK as never);

    await expect(layDongBoLich()).resolves.toEqual(CO_LINK);
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed');
  });

  it('POST tạo/đổi link luôn gửi tiếng Việt', async () => {
    mockedRequest.mockResolvedValueOnce(CO_LINK as never);

    await expect(taoLinkDongBoLich()).resolves.toEqual(CO_LINK);
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed', {
      method: 'POST',
      body: { lang: 'vi' },
    });
  });

  it('DELETE tắt đồng bộ; thân rỗng của 204 không làm hỏng gì', async () => {
    mockedRequest.mockResolvedValueOnce(undefined as never);

    await expect(tatDongBoLich()).resolves.toBeUndefined();
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed', { method: 'DELETE' });
  });
});

describe('cauLoiDongBoLich', () => {
  it('403 ngoài gói: dịch theo mã, không theo câu của máy chủ', () => {
    expect(
      cauLoiDongBoLich(new ApiError('Đồng bộ lịch dành cho gói Pro và Team.', 403, 'CALENDAR_FEED_NOT_IN_PLAN')),
    ).toBe('Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.');
  });

  it('429 có câu riêng', () => {
    expect(cauLoiDongBoLich(new ApiError('ThrottlerException: Too Many Requests', 429))).toBe(
      'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.',
    );
  });

  it('mất mạng: giữ câu tiếng Việt của apiRequest', () => {
    expect(cauLoiDongBoLich(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))).toBe(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    );
  });

  it('5xx, trang lỗi của cổng, câu tiếng Anh của máy chủ: một câu Việt chung', () => {
    const chung = 'Chưa làm được lúc này. Thử lại sau ít phút.';
    expect(cauLoiDongBoLich(new ApiError('Internal server error', 500))).toBe(chung);
    expect(cauLoiDongBoLich(new ApiError('Máy chủ đang bận', 502, MA_PHAN_HOI_LA))).toBe(chung);
    expect(cauLoiDongBoLich(new ApiError('lang must be one of the following values: vi, en', 400))).toBe(chung);
    expect(cauLoiDongBoLich(new Error('Share failed'))).toBe(chung);
    expect(cauLoiDongBoLich(undefined)).toBe(chung);
  });

  it('mã trùng tên thuộc tính của Object.prototype không lọt thành hàm', () => {
    expect(cauLoiDongBoLich(new ApiError('x', 403, 'toString'))).toBe(
      'Chưa làm được lúc này. Thử lại sau ít phút.',
    );
    expect(cauLoiDongBoLich(new ApiError('x', 403, 'constructor'))).toBe(
      'Chưa làm được lúc này. Thử lại sau ít phút.',
    );
  });
});
```

Run: `npx jest src/lib/api/__tests__/dong-bo-lich.test.ts`
Expected: FAIL — "Cannot find module '../dong-bo-lich'".

- [ ] **Step 2: Viết mã**

`src/lib/api/dong-bo-lich.ts`:

```ts
import { ApiError, apiRequest } from './client';

/**
 * Trạng thái đồng bộ lịch của người đang đăng nhập (máy chủ: `src/lich-dong-bo`).
 *
 * Một link cho cả người, gộp mọi workspace người đó được dùng tính năng — nên
 * không gửi `workspaceId`.
 */
export interface TrangThaiDongBoLich {
  /** Máy chủ tự tính theo gói (Pro cá nhân, hoặc workspace có gói Team), app không tự đoán gói. */
  duocDung: boolean;
  coLink: boolean;
  /** `https://wedofpt.com.vn/lich/<mã>.ics`. Ai có link đều đọc được lịch. */
  url?: string;
  taoLuc?: string;
  /** Lần cuối một ứng dụng lịch lấy dữ liệu; `null` là chưa lần nào. */
  layLanCuoi?: string | null;
}

const DUONG_DAN = '/calendar-feed';

export function layDongBoLich(): Promise<TrangThaiDongBoLich> {
  return apiRequest<TrangThaiDongBoLich>(DUONG_DAN);
}

/**
 * Chưa có link thì tạo, có rồi thì đổi mã — link cũ chết ngay.
 *
 * Luôn `lang: 'vi'`: app chỉ có tiếng Việt, và ngôn ngữ của chữ trong lịch
 * ("Hạn: …", "Họp: …") chốt theo lúc tạo link.
 */
export function taoLinkDongBoLich(): Promise<TrangThaiDongBoLich> {
  return apiRequest<TrangThaiDongBoLich>(DUONG_DAN, { method: 'POST', body: { lang: 'vi' } });
}

/** Máy chủ trả 204 thân rỗng; gọi lại khi đã tắt cũng không lỗi. */
export async function tatDongBoLich(): Promise<void> {
  await apiRequest<unknown>(DUONG_DAN, { method: 'DELETE' });
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  CALENDAR_FEED_NOT_IN_PLAN:
    'Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.',
};

const CAU_CHUNG = 'Chưa làm được lúc này. Thử lại sau ít phút.';

export function cauLoiDongBoLich(loi: unknown): string {
  if (loi instanceof ApiError) {
    /*
      `Object.hasOwn`, không phải `CAU_THEO_MA[loi.code]`: mã lạ như `toString`
      hay `constructor` đọc trúng hàm của Object.prototype, và màn hình sẽ in
      ra mã nguồn của hàm thay vì một câu lỗi.
    */
    if (loi.code && Object.hasOwn(CAU_THEO_MA, loi.code)) return CAU_THEO_MA[loi.code];
    if (loi.status === 429) return 'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.';
    // Mất mạng: `apiRequest` đã viết sẵn câu tiếng Việt.
    if (loi.status === 0) return loi.message;
  }
  /*
    5xx, trang lỗi của cổng Azure, câu kiểm tra dữ liệu tiếng Anh của máy chủ,
    lỗi lúc mở bảng chia sẻ…: người dùng chỉ cần biết thử lại sau.
  */
  return CAU_CHUNG;
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/lib/api/__tests__/dong-bo-lich.test.ts && npx tsc --noEmit`
Expected: PASS (8 bài); tsc sạch. (`Object.hasOwn` có trong lib `ESNext` của `expo/tsconfig.base` và trong Hermes của RN 0.86.)

- [ ] **Step 4: Commit**

```bash
git -c core.autocrlf=false add src/lib/api/dong-bo-lich.ts src/lib/api/__tests__/dong-bo-lich.test.ts
git -c core.autocrlf=false commit -m "feat(mobile): API dong bo lich va cau loi theo ma" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M2: Màn "Đồng bộ lịch"

**Files:**
- Create: `src/app/account/calendar-sync.tsx`
- Test: `src/app/account/__tests__/calendar-sync.test.tsx`
- Sinh lại (không commit): `.expo/types/router.d.ts`

**Interfaces:**
- Consumes: `layDongBoLich`, `taoLinkDongBoLich`, `tatDongBoLich`, `cauLoiDongBoLich`, `TrangThaiDongBoLich` (M1); `ApiError` (`src/lib/api/client.ts`); `hienThiHanMoi(iso)` (`src/lib/loi-moi.ts` — `HH:mm dd/MM/yyyy` theo giờ Việt Nam, dùng lại cho "lần cuối lấy"); `Button` (`variant: 'primary' | 'secondary' | 'danger'`, `loading`, `disabled`, `testID`), `ErrorBanner`, `GradientHeader` (`onBack`, `dense`; nút quay lại có `testID="header-back"`); token `colors`, `fontSize`, `radius`, `spacing`; `Share.share`, `Alert.alert`, `Platform` của `react-native`; `Redirect`, `useRouter` của `expo-router`; TanStack Query v5 (`useQuery`, `useMutation`, `useQueryClient`).
- Produces:
  - Route `/account/calendar-sync` — `export default function ManDongBoLich(): React.JSX.Element`.
  - Khoá truy vấn `['calendar-feed']` (không màn nào khác dùng).
  - testID: `dong-bo-lich-dang-tai`, `nut-thu-lai-dong-bo-lich`, `nut-tao-link-dong-bo-lich`, `link-dong-bo-lich`, `nut-chia-se-link-lich`, `link-webcal`, `lan-cuoi-lay-lich`, `nut-tao-link-moi-lich`, `nut-tat-dong-bo-lich`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/app/account/__tests__/calendar-sync.test.tsx`:

```tsx
import React from 'react';
import { Alert, Platform, Share } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect } from 'expo-router';

import ManDongBoLich from '../calendar-sync';
import { ApiError } from '../../../lib/api/client';
import {
  layDongBoLich,
  taoLinkDongBoLich,
  tatDongBoLich,
  type TrangThaiDongBoLich,
} from '../../../lib/api/dong-bo-lich';
import { renderScreen } from '../../../test-utils/render';

/*
  Màn "Đồng bộ lịch" theo từng trạng thái.

  jest-expo chạy với Platform.OS = 'ios' mặc định, mà màn ẩn hẳn trên iPhone —
  nên mọi ca ở đây tự đặt 'android', trừ ca iPhone.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  Redirect: jest.fn(() => null),
}));
// Giữ `cauLoiDongBoLich` thật: màn phải hiện đúng câu theo mã lỗi.
jest.mock('../../../lib/api/dong-bo-lich', () => ({
  ...jest.requireActual<typeof import('../../../lib/api/dong-bo-lich')>('../../../lib/api/dong-bo-lich'),
  layDongBoLich: jest.fn(),
  taoLinkDongBoLich: jest.fn(),
  tatDongBoLich: jest.fn(),
}));

const mockedLay = layDongBoLich as jest.MockedFunction<typeof layDongBoLich>;
const mockedTao = taoLinkDongBoLich as jest.MockedFunction<typeof taoLinkDongBoLich>;
const mockedTat = tatDongBoLich as jest.MockedFunction<typeof tatDongBoLich>;
const mockedRedirect = Redirect as unknown as jest.Mock;

const MA_A = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCd';
const MA_B = 'ZyXwVuTsRqPoNmLkJiHgFeDcBa9876543210-_ZyXw';
const URL_A = `https://wedofpt.com.vn/lich/${MA_A}.ics`;
const URL_B = `https://wedofpt.com.vn/lich/${MA_B}.ics`;

const MIEN_PHI: TrangThaiDongBoLich = { duocDung: false, coLink: false };
const CHUA_CO_LINK: TrangThaiDongBoLich = { duocDung: true, coLink: false };
const CO_LINK: TrangThaiDongBoLich = {
  duocDung: true,
  coLink: true,
  url: URL_A,
  taoLuc: '2026-10-01T02:00:00.000Z',
  // 03:30 UTC = 10:30 giờ Việt Nam.
  layLanCuoi: '2026-10-02T03:30:00.000Z',
};

const CAU_MIEN_PHI = 'Tính năng của gói Pro và Team.';

let queryClient: QueryClient;
let thayHeDieuHanh: { restore: () => void };

beforeEach(() => {
  jest.clearAllMocks();
  thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  /*
    `gcTime: Infinity`: không hẹn giờ dọn cache. Để mặc định thì bộ hẹn giờ 5
    phút giữ tiến trình sống và Jest không thoát khi chạy riêng tệp này.
  */
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
});

afterEach(() => {
  queryClient.clear();
  thayHeDieuHanh.restore();
});

const moMan = () =>
  renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManDongBoLich />
    </QueryClientProvider>,
  );

/** Giả hộp thoại xác nhận: bấm nút "phá huỷ" (Tạo link mới / Tắt đồng bộ). */
function dongYHopThoai() {
  return jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
}

describe('màn Đồng bộ lịch', () => {
  it('đang tải: hiện vòng xoay, chưa có nút nào', async () => {
    mockedLay.mockReturnValue(new Promise(() => undefined));
    const man = await moMan();

    expect(man.getByTestId('dong-bo-lich-dang-tai')).toBeTruthy();
    expect(man.queryByText('Tạo link đồng bộ')).toBeNull();
  });

  it('gói Miễn phí: chỉ một câu, không nút mua, không nút tạo link', async () => {
    mockedLay.mockResolvedValue(MIEN_PHI);
    const man = await moMan();

    expect(await man.findByText(CAU_MIEN_PHI)).toBeTruthy();
    expect(man.queryByText('Tạo link đồng bộ')).toBeNull();
    expect(man.queryByText(/mua|nâng cấp gói/i)).toBeNull();
    // Nút duy nhất là mũi tên Quay lại trên đầu màn.
    expect(man.queryAllByRole('button').map((nut) => nut.props.testID)).toEqual(['header-back']);
  });

  it('gói Miễn phí mà link cũ còn: vẫn tắt được link', async () => {
    mockedLay.mockResolvedValue({ ...CO_LINK, duocDung: false });
    mockedTat.mockResolvedValue(undefined);
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByTestId('nut-tat-dong-bo-lich'));

    await waitFor(() => expect(mockedTat).toHaveBeenCalledTimes(1));
    expect(man.queryByTestId('link-dong-bo-lich')).toBeNull();
    hoi.mockRestore();
  });

  it('được dùng, chưa có link: bấm Tạo link đồng bộ thì hiện link', async () => {
    mockedLay.mockResolvedValue(CHUA_CO_LINK);
    mockedTao.mockResolvedValue({ ...CO_LINK, layLanCuoi: null });
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link đồng bộ'));

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_A));
    expect(mockedTao).toHaveBeenCalledTimes(1);
    expect(man.getByText('Chưa có ứng dụng lịch nào lấy dữ liệu từ link này.')).toBeTruthy();
  });

  it('có link: hiện link, link webcal, hướng dẫn, cảnh báo và lần cuối lấy theo giờ Việt Nam', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const man = await moMan();

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_A));
    expect(man.getByTestId('link-webcal').props.children).toBe(`webcal://wedofpt.com.vn/lich/${MA_A}.ics`);
    expect(man.getByText(/calendar\.google\.com/)).toBeTruthy();
    expect(man.getByText(/Thêm lịch → Từ URL/)).toBeTruthy();
    expect(man.getByText(/Ai có link này đều xem được lịch của bạn/)).toBeTruthy();
    expect(man.getByTestId('lan-cuoi-lay-lich').props.children).toBe(
      'Lần cuối lịch của bạn lấy dữ liệu: 10:30 02/10/2026',
    );
  });

  it('Chia sẻ link mở bảng chia sẻ của hệ điều hành với đúng link', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const chiaSe = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const man = await moMan();

    await fireEvent.press(await man.findByText('Chia sẻ link'));

    await waitFor(() => expect(chiaSe).toHaveBeenCalledWith({ title: 'Link lịch WeDo', message: URL_A }));
    chiaSe.mockRestore();
  });

  it('Tạo link mới: hỏi xác nhận rồi thay link đang hiện', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    mockedTao.mockResolvedValue({ ...CO_LINK, url: URL_B, layLanCuoi: null });
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link mới'));

    await waitFor(() => expect(man.getByTestId('link-dong-bo-lich').props.children).toBe(URL_B));
    expect(hoi).toHaveBeenCalledTimes(1);
    expect(hoi.mock.calls[0][0]).toBe('Tạo link mới?');
    hoi.mockRestore();
  });

  it('Tạo link mới mà bấm Huỷ: không gọi máy chủ', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    const hoi = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link mới'));

    expect(hoi).toHaveBeenCalledTimes(1);
    expect(mockedTao).not.toHaveBeenCalled();
    hoi.mockRestore();
  });

  it('Tắt đồng bộ: hỏi xác nhận, tắt xong quay về nút Tạo link đồng bộ', async () => {
    mockedLay.mockResolvedValue(CO_LINK);
    mockedTat.mockResolvedValue(undefined);
    const hoi = dongYHopThoai();
    const man = await moMan();

    await fireEvent.press(await man.findByTestId('nut-tat-dong-bo-lich'));

    expect(await man.findByText('Tạo link đồng bộ')).toBeTruthy();
    expect(mockedTat).toHaveBeenCalledTimes(1);
    expect(hoi.mock.calls[0][0]).toBe('Tắt đồng bộ lịch?');
    expect(man.queryByTestId('link-dong-bo-lich')).toBeNull();
    hoi.mockRestore();
  });

  it('tạo link bị 403 vì gói vừa hết hạn: báo đúng câu và chuyển sang câu giới thiệu gói', async () => {
    mockedLay.mockResolvedValueOnce(CHUA_CO_LINK).mockResolvedValueOnce(MIEN_PHI);
    mockedTao.mockRejectedValue(
      new ApiError('Đồng bộ lịch dành cho gói Pro và Team.', 403, 'CALENDAR_FEED_NOT_IN_PLAN'),
    );
    const man = await moMan();

    await fireEvent.press(await man.findByText('Tạo link đồng bộ'));

    expect(
      await man.findByText('Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.'),
    ).toBeTruthy();
    expect(await man.findByText(CAU_MIEN_PHI)).toBeTruthy();
    expect(mockedLay).toHaveBeenCalledTimes(2);
  });

  it('tải trạng thái lỗi vì mất mạng: báo câu tiếng Việt, bấm Thử lại thì nạp lại', async () => {
    mockedLay
      .mockRejectedValueOnce(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))
      .mockResolvedValueOnce(CHUA_CO_LINK);
    const man = await moMan();

    expect(await man.findByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
    await fireEvent.press(man.getByText('Thử lại'));

    expect(await man.findByText('Tạo link đồng bộ')).toBeTruthy();
  });

  it('iPhone: không gọi máy chủ, không vẽ gì, chuyển về Tài khoản', async () => {
    thayHeDieuHanh.restore();
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    expect(mockedRedirect).toHaveBeenCalled();
    expect(mockedRedirect.mock.calls[0][0]).toEqual({ href: '/account' });
    expect(mockedLay).not.toHaveBeenCalled();
    expect(man.queryByText('Đồng bộ lịch')).toBeNull();
  });
});
```

Run: `npx jest src/app/account/__tests__/calendar-sync.test.tsx`
Expected: FAIL — "Cannot find module '../calendar-sync'".

- [ ] **Step 2: Viết màn**

`src/app/account/calendar-sync.tsx`:

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { ApiError } from '../../lib/api/client';
import {
  cauLoiDongBoLich,
  layDongBoLich,
  taoLinkDongBoLich,
  tatDongBoLich,
  type TrangThaiDongBoLich,
} from '../../lib/api/dong-bo-lich';
import { hienThiHanMoi } from '../../lib/loi-moi';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const KHOA_TRANG_THAI = ['calendar-feed'] as const;

/** Lịch Apple và Outlook trên máy tính mở `webcal:` thẳng vào hộp thoại đăng ký lịch. */
function linkWebcal(url: string): string {
  return url.replace(/^https?:/i, 'webcal:');
}

/**
 * Màn "Đồng bộ lịch" (Tài khoản → Đồng bộ lịch).
 *
 * Đặt ở `src/app/account/` chứ không trong nhóm `(tabs)`: màn KHÔNG gọi
 * `useWorkspace()` — link là của cả người, gộp mọi workspace — nên nằm trên
 * ngăn xếp gốc như Thông tin cá nhân hay Góp ý, và `router.back()` về đúng
 * màn Tài khoản.
 */
export default function ManDongBoLich() {
  /*
    App iPhone luôn tính là gói Miễn phí (Apple 3.1.1) nên tính năng ẩn hẳn
    trên iPhone. Hàng ở màn Tài khoản đã ẩn; lỡ vào bằng đường dẫn thì quay về
    Tài khoản ngay, không gọi máy chủ, không vẽ gì.
  */
  if (Platform.OS === 'ios') return <Redirect href="/account" />;
  return <NoiDungDongBoLich />;
}

function NoiDungDongBoLich() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loi, setLoi] = useState<string | null>(null);

  const trangThai = useQuery({ queryKey: KHOA_TRANG_THAI, queryFn: layDongBoLich });

  const tao = useMutation({
    mutationFn: () => taoLinkDongBoLich(),
    onMutate: () => setLoi(null),
    onSuccess: (moi) => queryClient.setQueryData(KHOA_TRANG_THAI, moi),
    onError: (e) => {
      setLoi(cauLoiDongBoLich(e));
      // Gói vừa hết hạn giữa chừng: nạp lại để màn chuyển sang câu giới thiệu gói, không kẹt ở nút Tạo link.
      if (e instanceof ApiError && e.status === 403) {
        void queryClient.invalidateQueries({ queryKey: KHOA_TRANG_THAI });
      }
    },
  });

  const tat = useMutation({
    mutationFn: () => tatDongBoLich(),
    onMutate: () => setLoi(null),
    onSuccess: () =>
      queryClient.setQueryData<TrangThaiDongBoLich>(KHOA_TRANG_THAI, (cu) => ({
        duocDung: cu?.duocDung ?? true,
        coLink: false,
      })),
    onError: (e) => setLoi(cauLoiDongBoLich(e)),
  });

  const chiaSe = async (url: string) => {
    setLoi(null);
    try {
      // Android chỉ đọc `message`; `title` là tiêu đề của bảng chia sẻ.
      await Share.share({ title: 'Link lịch WeDo', message: url });
    } catch (e) {
      setLoi(cauLoiDongBoLich(e));
    }
  };

  const hoiTaoLinkMoi = () => {
    Alert.alert(
      'Tạo link mới?',
      'Link đang dùng sẽ ngừng chạy ngay. Lịch nào đã thêm link cũ sẽ không cập nhật nữa, bạn phải thêm lại bằng link mới.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Tạo link mới', style: 'destructive', onPress: () => tao.mutate() },
      ],
    );
  };

  const hoiTatDongBo = () => {
    Alert.alert(
      'Tắt đồng bộ lịch?',
      'Link sẽ ngừng chạy ngay. Lịch đã thêm không nhận thêm thay đổi nào từ WeDo; bạn có thể xoá lịch đó trong ứng dụng lịch.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Tắt đồng bộ', style: 'destructive', onPress: () => tat.mutate() },
      ],
    );
  };

  const duLieu = trangThai.data;
  const dangBan = tao.isPending || tat.isPending;

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Đồng bộ lịch"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      <ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>
        <Text style={styles.gioiThieu}>
          Hạn chót việc bạn đã nhận, cuộc họp và sự kiện của bạn trên WeDo tự hiện trong Google
          Calendar, Lịch Apple hoặc Outlook, và tự cập nhật.
        </Text>

        {loi ? <ErrorBanner message={loi} /> : null}

        {trangThai.isPending ? (
          <ActivityIndicator testID="dong-bo-lich-dang-tai" color={colors.primary} />
        ) : !duLieu ? (
          <>
            <ErrorBanner message={cauLoiDongBoLich(trangThai.error)} />
            <Button
              label="Thử lại"
              variant="secondary"
              onPress={() => void trangThai.refetch()}
              testID="nut-thu-lai-dong-bo-lich"
            />
          </>
        ) : !duLieu.duocDung ? (
          <>
            {/*
              Chỉ một câu chữ, KHÔNG có nút mua hay link sang trang giá: chính
              sách Google Play cấm dẫn người dùng ra ngoài để mua hàng hoá số
              (xem `src/lib/web-link.ts`).
            */}
            <View style={styles.the}>
              <Text style={styles.theChu}>
                Tính năng của gói Pro và Team.
              </Text>
            </View>
            {/* Gói hết hạn khi link còn: vẫn cho tắt hẳn link. */}
            {duLieu.coLink ? (
              <Button
                label="Tắt đồng bộ"
                variant="danger"
                onPress={hoiTatDongBo}
                loading={tat.isPending}
                testID="nut-tat-dong-bo-lich"
              />
            ) : null}
          </>
        ) : !duLieu.coLink || !duLieu.url ? (
          <Button
            label="Tạo link đồng bộ"
            onPress={() => tao.mutate()}
            loading={tao.isPending}
            testID="nut-tao-link-dong-bo-lich"
          />
        ) : (
          <CoLink
            url={duLieu.url}
            layLanCuoi={duLieu.layLanCuoi ?? null}
            onChiaSe={() => void chiaSe(duLieu.url!)}
            onTaoLinkMoi={hoiTaoLinkMoi}
            onTat={hoiTatDongBo}
            dangTao={tao.isPending}
            dangTat={tat.isPending}
            dangBan={dangBan}
          />
        )}
      </ScrollView>
    </View>
  );
}

interface CoLinkProps {
  url: string;
  layLanCuoi: string | null;
  onChiaSe: () => void;
  onTaoLinkMoi: () => void;
  onTat: () => void;
  dangTao: boolean;
  dangTat: boolean;
  dangBan: boolean;
}

function CoLink({ url, layLanCuoi, onChiaSe, onTaoLinkMoi, onTat, dangTao, dangTat, dangBan }: CoLinkProps) {
  return (
    <>
      <View style={styles.the}>
        <Text style={styles.nhan}>Link của bạn</Text>
        <Text selectable style={styles.link} testID="link-dong-bo-lich">
          {url}
        </Text>
        <Button label="Chia sẻ link" onPress={onChiaSe} testID="nut-chia-se-link-lich" />
        <Text style={styles.canhBao}>
          Ai có link này đều xem được lịch của bạn. Chỉ gửi cho chính bạn; lỡ gửi nhầm thì bấm Tạo link
          mới.
        </Text>
      </View>

      <View style={styles.the}>
        <Text style={styles.nhan}>Thêm vào lịch</Text>

        <Text style={styles.buocTieuDe}>Google Calendar</Text>
        <Text style={styles.buoc}>
          Ứng dụng Google Calendar trên điện thoại không thêm được lịch bằng link. Chia sẻ link sang máy
          tính, mở calendar.google.com, chọn “Thêm lịch → Từ URL” rồi dán link. Sau đó lịch tự
          hiện cả trên điện thoại.
        </Text>

        <Text style={styles.buocTieuDe}>Lịch Apple (máy Mac, iPhone)</Text>
        <Text style={styles.buoc}>Gửi link sang máy đó rồi mở link webcal dưới đây, chọn Đăng ký:</Text>
        <Text selectable style={styles.link} testID="link-webcal">
          {linkWebcal(url)}
        </Text>

        <Text style={styles.buocTieuDe}>Outlook</Text>
        <Text style={styles.buoc}>
          Trên outlook.com, chọn “Thêm lịch → Đăng ký từ web” rồi dán link.
        </Text>

        <Text style={styles.phu}>
          Google cập nhật lịch vài giờ một lần; Lịch Apple và Outlook khoảng mỗi giờ.
        </Text>
      </View>

      <Text style={styles.phu} testID="lan-cuoi-lay-lich">
        {layLanCuoi
          ? `Lần cuối lịch của bạn lấy dữ liệu: ${hienThiHanMoi(layLanCuoi)}`
          : 'Chưa có ứng dụng lịch nào lấy dữ liệu từ link này.'}
      </Text>

      <Button
        label="Tạo link mới"
        variant="secondary"
        onPress={onTaoLinkMoi}
        loading={dangTao}
        disabled={dangBan}
        testID="nut-tao-link-moi-lich"
      />
      <Button
        label="Tắt đồng bộ"
        variant="danger"
        onPress={onTat}
        loading={dangTat}
        disabled={dangBan}
        testID="nut-tat-dong-bo-lich"
      />
    </>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.background },
  than: { flex: 1 },
  thanNoiDung: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  gioiThieu: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.6 },
  the: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  theChu: { fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.6 },
  nhan: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  link: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  canhBao: { fontSize: fontSize.xs, color: colors.warningText, lineHeight: fontSize.xs * 1.6 },
  buocTieuDe: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  buoc: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
  phu: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
});
```

Ghi chú cho người làm:
- Dấu ngoặc kép trong JSX là ký tự “ ” thật (không phải `&quot;`). Sau khi ghi tệp, kiểm `grep -c '“Thêm lịch' src/app/account/calendar-sync.tsx` ra `2`.
- Link nằm trong cache react-query, mà cache được ghi xuống AsyncStorage (`src/lib/query.ts`). Chấp nhận: kho riêng của app, bị xoá lúc đăng xuất (`xoaCacheBenBi`), và cache đó vốn đã chứa chính việc/lịch mà link cho xem.

- [ ] **Step 3: Chạy lại bài kiểm của màn**

Run: `npx jest src/app/account/__tests__/calendar-sync.test.tsx src/lib/__tests__/pham-vi-workspace.test.ts`
Expected: PASS (12 bài của màn + bài cấu trúc cũ); Jest tự thoát (không có dòng "Jest did not exit").

- [ ] **Step 4: Sinh lại kiểu đường dẫn**

Đây là màn expo-router mới: `.expo/types/router.d.ts` chỉ được sinh khi dev server chạy. Dùng cổng riêng 8095 để không đụng dev server nào khác (cổng bận thì `expo start` không tương tác in "Skipping dev server" rồi thoát êm mà không sinh tệp).

```bash
netstat -ano | grep ':8095 ' ; echo "cong 8095 ranh neu khong in gi o tren"
```

Chạy ở NỀN (công cụ Bash với `run_in_background: true`), KHÔNG đặt `CI=1` (chế độ CI không theo dõi tệp mới):

```bash
cd /d/WEDO_PC/wt/mb-lich && npx expo start --port 8095 > /d/WEDO_PC/wt/expo-mb-lich.log 2>&1
```

Rồi đợi tới khi tệp có đường mới (một lệnh foreground tự thoát):

```bash
cd /d/WEDO_PC/wt/mb-lich
for i in $(seq 1 120); do grep -q 'account/calendar-sync' .expo/types/router.d.ts && { echo DA_SINH; break; }; grep -qiE 'Skipping|error' /d/WEDO_PC/wt/expo-mb-lich.log && { echo LOI_DEV_SERVER; break; }; sleep 1; done
```

Expected: `DA_SINH`. Dừng dev server: dừng tác vụ nền (TaskStop), rồi giết tiến trình node còn giữ cổng — dừng tác vụ nền KHÔNG giết nó (đã gặp khi thử):

```bash
netstat -ano | grep ':8095 .*LISTENING'
taskkill //F //T //PID <PID ở cột cuối dòng trên>
netstat -ano | grep ':8095 ' ; echo "da tat neu khong in gi"
rm /d/WEDO_PC/wt/expo-mb-lich.log
```

Kiểm tệp sinh ra đúng:

```bash
grep -o '`/account/calendar-sync[^`]*`' .expo/types/router.d.ts | sort -u
grep -c '/\.\./' .expo/types/router.d.ts
git status --short
```

Expected: in `` `/account/calendar-sync` `` và `` `/account/calendar-sync${` ``; lệnh hai in `0` (có số khác 0 là tệp bị dev server cũ ghi bẩn — sinh lại); `git status --short` chỉ có hai tệp mới của task này (`.expo/` bị gitignore). LƯU Ý: thiếu hẳn `router.d.ts` thì `tsc` báo sạch GIẢ — luôn kiểm bằng `grep` trên trước khi tin `tsc`.

- [ ] **Step 5: Kiểu**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 6: Commit**

```bash
git -c core.autocrlf=false add src/app/account/calendar-sync.tsx src/app/account/__tests__/calendar-sync.test.tsx
git -c core.autocrlf=false commit -m "feat(mobile): man Dong bo lich chia se link, an tren iPhone" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M3: Hàng "Đồng bộ lịch" ở màn Tài khoản

**Files:**
- Modify: `src/app/(tabs)/account/index.tsx` (import `react-native` dòng 2-12; sau `MenuRow` "Bảng đóng góp" kết thúc ở dòng 263)
- Test: `src/components/auth/__tests__/muc-dong-bo-lich.test.tsx` (tạo mới, cạnh `man-tai-khoan.test.tsx` — không đặt dưới `src/app/(tabs)/`)

**Interfaces:**
- Consumes: route `/account/calendar-sync` (M2, đã có trong `.expo/types/router.d.ts`); `MenuRow` sẵn trong `index.tsx`; `Platform` của `react-native`.
- Produces: hàng `testID="account-calendar-sync"`, nhãn "Đồng bộ lịch", chỉ hiện khi `Platform.OS !== 'ios'`, chạm vào `router.push('/account/calendar-sync')`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/components/auth/__tests__/muc-dong-bo-lich.test.tsx`:

```tsx
import React from 'react';
import { Platform } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

import ManTaiKhoan from '../../../app/(tabs)/account/index';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { renderScreen } from '../../../test-utils/render';

/*
  Hàng "Đồng bộ lịch" trên tab Tài khoản: có trên Android, ẩn hẳn trên iPhone.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều thành
  một tab, kể cả tệp kiểm thử.
*/

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('../../../lib/api/account', () => ({
  capNhatAnhDaiDien: jest.fn(),
  datDongYAI: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/images/anh-dai-dien', () => ({ chonAnhDaiDien: jest.fn() }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

let thayHeDieuHanh: { restore: () => void } | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
  mockedAuth.mockReturnValue({
    status: 'signedIn',
    user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại', aiConsentAt: null },
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    capNhatHoSo: jest.fn(),
  });
});

afterEach(() => {
  thayHeDieuHanh?.restore();
  thayHeDieuHanh = null;
});

describe('hàng Đồng bộ lịch ở Tài khoản', () => {
  it('Android: có hàng, chạm vào mở màn Đồng bộ lịch', async () => {
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await renderScreen(<ManTaiKhoan />);

    expect(man.getByText('Đồng bộ lịch')).toBeTruthy();
    await fireEvent.press(man.getByTestId('account-calendar-sync'));

    expect(mockPush).toHaveBeenCalledWith('/account/calendar-sync');
  });

  it('iPhone: không có hàng, các hàng khác vẫn đủ', async () => {
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await renderScreen(<ManTaiKhoan />);

    expect(man.queryByTestId('account-calendar-sync')).toBeNull();
    expect(man.queryByText('Đồng bộ lịch')).toBeNull();
    expect(man.getByTestId('account-contributions')).toBeTruthy();
  });
});
```

Run: `npx jest src/components/auth/__tests__/muc-dong-bo-lich.test.tsx`
Expected: FAIL đúng bài Android — "Unable to find an element with text: Đồng bộ lịch"; bài iPhone đã PASS (hàng chưa có).

- [ ] **Step 2: Thêm hàng**

Trong `src/app/(tabs)/account/index.tsx` (dùng công cụ Edit — tệp đang CRLF, Edit giữ nguyên):

1. Trong khối import `react-native`, sau dòng `  Linking,` thêm:

```tsx
  Platform,
```

2. Ngay sau `MenuRow` "Bảng đóng góp" (khối kết thúc bằng `onPress={() => router.push('/account/contributions')}` rồi `/>`), trước `MenuRow` `testID="account-feedback"`, thêm:

```tsx
          {/*
            Ẩn hẳn trên iPhone: app iPhone luôn tính là gói Miễn phí (Apple
            3.1.1), hiện ra chỉ để thấy một tính năng bị khoá. Màn đích cũng tự
            quay về đây nếu lỡ mở trên iPhone.
          */}
          {Platform.OS !== 'ios' ? (
            <MenuRow
              testID="account-calendar-sync"
              icon="calendar-outline"
              tone="info"
              label="Đồng bộ lịch"
              hint="Đưa hạn chót và cuộc họp sang Google Calendar, Lịch Apple"
              onPress={() => router.push('/account/calendar-sync')}
            />
          ) : null}
```

- [ ] **Step 3: Chạy lại**

```bash
grep -c 'account/calendar-sync' .expo/types/router.d.ts
npx jest src/components/auth/__tests__/muc-dong-bo-lich.test.tsx src/components/auth/__tests__/man-tai-khoan.test.tsx src/lib/__tests__/pham-vi-workspace.test.ts
npx tsc --noEmit
```

Expected: lệnh đầu ra số ≥ 1 (không thì quay lại M2 Step 4 — tsc sẽ báo sạch giả hoặc báo `'"/account/calendar-sync"' is not assignable`); jest PASS (2 bài mới + 5 bài công tắc AI cũ + bài cấu trúc; các dòng `console.warn` của expo-notifications là có sẵn); tsc sạch.

- [ ] **Step 4: Commit**

```bash
git -c core.autocrlf=false add "src/app/(tabs)/account/index.tsx" src/components/auth/__tests__/muc-dong-bo-lich.test.tsx
git -c core.autocrlf=false commit -m "feat(mobile): hang Dong bo lich o Tai khoan, an tren iPhone" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M4: Cổng cuối của mobile — kiểu, toàn bộ kiểm thử, dấu vân tay

**Files:** không sửa tệp nào.

**Interfaces:**
- Consumes: M1–M3, các mốc ghi ở M0 Step 2.
- Produces: bằng chứng nhánh phát được qua OTA.

- [ ] **Step 1: Kiểu và kiểm thử**

```bash
cd /d/WEDO_PC/wt/mb-lich
grep -c 'account/calendar-sync' .expo/types/router.d.ts
npx tsc --noEmit
npx jest 2>&1 | grep -E "^(Tests|Test Suites):|FAIL"
```

Expected: số ≥ 1; tsc sạch; `Test Suites: <mốc M0 + 3> passed` (đã đo trên bản sao: `129 passed, 129 total`, `Tests: 1042 passed`), không dòng `FAIL`.

- [ ] **Step 2: Không đụng cấu hình native**

```bash
git diff --name-only main...HEAD -- package.json package-lock.json app.json app.config.js eas.json plugins
git diff --name-only main...HEAD | grep -v '^src/'; echo "ma thoat grep: $?"
git diff --name-only main...HEAD
```

Expected: lệnh đầu không in gì; lệnh hai không in gì (`ma thoat grep: 1`); lệnh ba in đúng 6 tệp: `src/app/(tabs)/account/index.tsx`, `src/app/account/__tests__/calendar-sync.test.tsx`, `src/app/account/calendar-sync.tsx`, `src/components/auth/__tests__/muc-dong-bo-lich.test.tsx`, `src/lib/api/__tests__/dong-bo-lich.test.ts`, `src/lib/api/dong-bo-lich.ts`.

- [ ] **Step 3: Dấu vân tay Android**

```bash
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: đúng bằng MỐC ghi ở M0 Step 2 (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`). Khác mốc → có thứ ngoài `src/` bị đổi: tìm và hoàn lại, không đưa lên OTA.

- [ ] **Step 4: Báo cáo, không commit, không push**

Ghi vào báo cáo cho người giao việc: ba commit, kết quả `tsc`/`jest` (số bộ, số bài), giá trị vân tay. Gộp vào `main`, đo lại vân tay ở checkout thật `D:\WeDo_ChPlay` và `eas update` là việc của chủ dự án, SAU khi backend đã deploy (spec mục 9). Dọn worktree theo cảnh báo ở M0 (gỡ junction trước).

---

## Self-Review

**Độ phủ spec** (mục spec → task):
- 1 (quyết định: link tự đồng bộ, Pro/Team, một link gộp, web + Android, mã lưu nguyên văn, link đẹp) → R1, R5, R6, R7, W3, W6, M2, M3.
- 2.1 (ba loại mục, luật cũ, 30/180 ngày, trần 2.000) → R3, R6.
- 2.2 (phạm vi gói đọc thẳng Subscription, ACTIVE + currentPeriodEnd, mục tạm dừng, không qua resolve) → R5, R4 (`mucTamDung`), R6, R7 (bài CFNetwork).
- 2.3 (tên vi/en, khối 30 phút, họp 60 phút, mô tả 1.000, link về màn, UID, DTSTAMP = updatedAt, UTC, không VALARM, phần đầu lịch, RFC 5545) → R2, R4.
- 3.1 (bảng calendar_feeds, mã 32 byte base64url, đổi/tắt) → R1, R6.
- 3.2 (GET/POST/DELETE, 403 CALENDAR_FEED_NOT_IN_PLAN, đường công khai, header, 304, lastFetchedAt 10 phút, CALENDAR_FEED_BASE_URL) → R6, R7.
- 3.3 (tách truy vấn, màn Lịch giữ nguyên) → R3.
- 3.4 (giới hạn tần suất theo mã + IP, theo người) → R8.
- 3.5 (rewrite Vercel) → W6.
- 4 (hộp thoại web, các trạng thái, lỗi, hàm thuần, từ điển, API) → W1, W2, W3, W4.
- 5 (Android, ẩn iPhone, Share, không thư viện) → M1, M2, M3, M4.
- 6 (bảng giá, chính sách, test) → W5.
- 7 (tình huống: rời dự án, hết gói, bị khoá, bị xoá cascade, đổi mật khẩu, lỗi 500, quá 2.000) → R1 (cascade), R3, R5, R6, R7.
- 8 (kiểm thử) → mọi task; nghiệm thu tay ở mục dưới.
- 9 (thứ tự đưa lên) → mục "Execution order and deploy".

**Quét chỗ trống:** không có TBD/TODO/"tương tự task trước"; hai chuỗi `TaskStatus.TODO` trong R6/R7 là giá trị enum thật.

**Nhất quán tên và kiểu:** `TrangThaiDongBoLich` giống nhau ở backend, web, mobile (`duocDung, coLink, url?, taoLuc?, layLanCuoi?`); mã lỗi `CALENDAR_FEED_NOT_IN_PLAN` giống nhau ở R6, W1/W2, M1; đường `/calendar-feed` và `/lich/:tep` khớp giữa R7 và W6; tên mục bảng giá "Đồng bộ lịch (Google, Apple, Outlook)" / "Calendar sync (Google, Apple, Outlook)" khớp giữa W5 và spec mục 6.

## Execution order and deploy

Chủ dự án làm (không agent nào push hay deploy):

1. **Trước khi chạy W0:** merge PR biểu tượng tab (`fix/menu-chat-va-don-landing` còn commit `27509fc` chưa vào `main`), vì W0 dừng nếu nhánh đó chưa vào `main`.
2. **Backend:** push `feat/dong-bo-lich` của `D:\WEDO_PC\wt\be-lich` lên nhánh remote `feat/dong-bo-lich-backend` (backend và web chung repo GitHub), mở PR vào `backend`, merge (Create a merge commit). Migration chỉ thêm nên qua cổng "Block destructive database changes". Chờ workflow deploy Azure xanh. Kiểm: `GET https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/calendar-feed/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.ics` trả 404 dạng chữ; `GET /calendar-feed` không đăng nhập trả 401.
3. **Web:** push lên `feat/dong-bo-lich-web`, PR vào `main`, merge. Chờ Vercel. Kiểm: màn Lịch có nút "Đồng bộ với lịch của bạn"; tài khoản Pro tạo được link; mở `https://wedofpt.com.vn/lich/<mã>.ics` thấy tệp lịch; bảng giá không còn "Sắp ra mắt" ở Đồng bộ lịch.
4. **Android:** push `feat/dong-bo-lich` (repo WeDo_ChPlay), PR vào `main`, merge. Ở `D:\WeDo_ChPlay`: `git pull origin main`, `git log --oneline -1` phải là commit merge; `npx expo-updates fingerprint:generate --platform android` phải ra `82cd990037afe065754c48a9a004f293c0d84be9`; rồi `npx eas-cli@latest update --branch production --platform android --environment production --message "Dong bo lich"` và đối chiếu dòng Commit trong kết quả.
5. **Nghiệm thu tay:** dán link vào Google Calendar (máy tính: Thêm lịch → Từ URL) và Lịch iPhone; chờ đồng bộ (Google có thể mất vài giờ); đối chiếu với màn Lịch WeDo; bấm "Tạo link mới" thì lịch cũ ngừng cập nhật (lần lấy sau trả 404).
