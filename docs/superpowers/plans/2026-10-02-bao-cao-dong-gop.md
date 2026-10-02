# Xuất báo cáo đóng góp (PDF và Excel) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leader/chủ workspace xuất báo cáo đóng góp cả nhóm, thành viên thường xuất báo cáo của riêng mình, dạng PDF (có khung ký xác nhận) hoặc Excel (lọc và tính điểm được), miễn phí trên web, Android và iPhone — số liệu khớp đúng bảng đóng góp đang có.

**Architecture:** Máy chủ thêm module `src/bao-cao-dong-gop/`: một hàm thuần dựng dữ liệu báo cáo (`dungBaoCao`, dùng lại `tinhDongGop`/`mocHoanThanh` của `src/tasks/contributions.ts`), hai hàm thuần vẽ tệp (`veBaoCaoExcel` bằng `exceljs`, `veBaoCaoPdf` bằng `pdfkit` + phông Be Vietnam Pro nhúng), một service lo quyền (`loaiBaoCaoTheoVaiTro` → `NHOM`/`CA_NHAN`/404), đọc cơ sở dữ liệu, giới hạn 3.000 việc và token tải ký bằng khoá dẫn xuất từ `JWT_SECRET`; hai controller: `/projects/:id/contribution-report` (+ `/link`) cần đăng nhập và `/contribution-report/download?token=` công khai, lỗi trả trang HTML hai thứ tiếng. Web thêm hộp thoại "Xuất báo cáo đóng góp" ở đầu Bảng công việc và trong tab Bảng đóng góp của Cài đặt, tải bằng `fetch` có đăng nhập → blob → `<a download>`. App chỉ thêm phần phát được qua OTA: khối "Xuất báo cáo đóng góp" ở màn Tài khoản → Bảng đóng góp, xin link rồi mở bằng `WebBrowser.openBrowserAsync`.

**Tech Stack:** NestJS 11 + Prisma 7.8 + jest/ts-jest + supertest; thư viện mới (chỉ backend) `exceljs@4.4.0` (tự mang kiểu), `pdfkit@0.17.2` + `@types/pdfkit@0.17.6`; phông Be Vietnam Pro Regular/SemiBold (SIL OFL 1.1) từ kho `google/fonts`; Vite + React 19 + Tailwind 4 + node:test qua `tsx`; Expo SDK 57 + expo-router + TanStack Query v5 + jest-expo + @testing-library/react-native v14.

Thiết kế gốc (đã duyệt): `docs/superpowers/specs/2026-10-02-bao-cao-dong-gop-design.md`

## Global Constraints

- **Tương thích ngược:** chỉ THÊM đường mới; không đổi API, trường, DTO hay hành vi nào mà Android 1.0.13/1.0.14, iOS 1.0.14 và web cũ đang dùng (`GET /tasks/contributions` giữ nguyên từng byte). DTO mới chỉ gắn vào đường mới.
- **Không migration, không biến môi trường mới:** `git diff origin/backend -- prisma` phải rỗng; khoá ký token dẫn xuất từ `JWT_SECRET` sẵn có.
- **Backend lint đầy đủ = 0:** `npm run lint -- --max-warnings 0` (không `any`, request đã đăng nhập dùng `YeuCauDaXacThuc`), cộng `npx tsc --noEmit -p tsconfig.json`, `npx jest`, `npm run test:ops` và `npm run build` xanh.
- **Web song ngữ:** mọi chữ giao diện nằm trong `src/i18n/tu-dien` (đủ vi + en), `npm run kiem-dich` = 0, `npm run lint` (tsc) và `npm run build` sạch; mã lỗi mới dịch ở `src/i18n/loi.ts`. Web không thêm thư viện.
- **Dấu vân tay OTA Android không đổi:** app không sửa `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `eas.json`, không thêm thư viện; `npx expo-updates fingerprint:generate --platform android` ở checkout thật của `main` phải ra `82cd990037afe065754c48a9a004f293c0d84be9`.
- **Commit:** tiền tố conventional + tiếng Việt KHÔNG dấu + dòng trống + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (dùng hai `-m`). Không `--no-verify`.
- **Chữ giao diện, chữ trong báo cáo và bình luận:** tiếng Việt CÓ dấu, chuẩn NFC (bình luận giải thích *vì sao*). Mã lỗi máy đọc bằng tiếng Anh viết hoa (`REPORT_BAD_RANGE`, `REPORT_TOO_LARGE`, `REPORT_LINK_INVALID`).
- **Không gọi production hay dịch vụ ngoài**, trừ MỘT lần tải phông ở Task R1 (raw.githubusercontent.com, có kiểm SHA-256). KHÔNG chép `.env` của backend vào worktree; kiểm thử backend không cần cơ sở dữ liệu (Prisma giả). Không chạy dev server web trỏ vào API thật.
- **Không push, không deploy, không `eas update`.** Chủ dự án làm các bước đó (mục "Execution order and deploy").
- **Prettier:** lint backend có luật `prettier/prettier`; mã trong kế hoạch có thể lệch cách xuống dòng — chạy `npx eslint <thư mục> --fix` trước bước kiểm lint (chỉ đổi khoảng trắng, không đổi nội dung).
- **Repo mobile:** không chạy `npx expo lint` (tự sửa `package.json`); `render`/`fireEvent`/`act` của RNTL v14 luôn `await`; tệp kiểm thử KHÔNG đặt dưới `src/app/(tabs)/` (mọi tệp ở đó thành một tab).
- **Worktree mobile có junction `node_modules`:** KHÔNG BAO GIỜ `Remove-Item -Recurse` hay `git worktree remove` khi junction còn đó — sẽ xoá luôn `D:\WeDo_ChPlay\node_modules`. Luôn `cmd /c rmdir D:\WEDO_PC\wt\mb-bao-cao\node_modules` trước.

---

## File Structure

### Backend — `D:\WEDO_PC\wt\be-bao-cao` (nhánh `feat/bao-cao-dong-gop` từ `origin/backend` = `cd6943b`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `package.json`, `package-lock.json` | Sửa | `exceljs`, `pdfkit`, `@types/pdfkit` |
| `assets/fonts/BeVietnamPro-Regular.ttf`, `BeVietnamPro-SemiBold.ttf`, `OFL.txt` | Tạo | Phông nhúng vào PDF và giấy phép SIL OFL |
| `nest-cli.json` | Sửa | `compilerOptions.assets`: chép `assets/fonts` vào `dist/assets/fonts` (workflow deploy chỉ đóng gói `dist`) |
| `scripts/ops/phong-chu-bao-cao.test.mjs` | Tạo | Ghim SHA-256 của phông, có `OFL.txt`, có mục assets trong `nest-cli.json` |
| `src/common/ngay-vn.ts` (+ `.spec.ts`) | Sửa | `laNgayCoThat`, `dauNgayVNTuChuoi`, `soNgayLichVN` |
| `src/tasks/contributions.ts` (+ `.spec.ts`) | Sửa | Tách `lucNopDeTinh` ra khỏi `mocHoanThanh` (cột "Ngày nộp") |
| `src/projects/dieu-kien-xem-du-an.ts` | Tạo | `dieuKienXemDuAn(userId)` — điều kiện "thấy được dự án", dùng chung |
| `src/projects/projects.service.ts` | Sửa | `projectAccessWhere` gọi `dieuKienXemDuAn` (dòng 753-763) |
| `src/common/content-disposition.ts` (+ `.spec.ts`) | Tạo | Header `Content-Disposition` có `filename*` UTF-8 (RFC 5987), tách từ controller tệp chat |
| `src/chat/chat-attachments.controller.ts` | Sửa | Dùng `contentDisposition` chung (dòng 37-49) |
| `src/bao-cao-dong-gop/kieu-bao-cao.ts` | Tạo | Kiểu dữ liệu báo cáo dùng chung |
| `src/bao-cao-dong-gop/bao-cao.errors.ts` | Tạo | Mã lỗi `REPORT_*`, `TOI_DA_VIEC_BAO_CAO = 3000` |
| `src/bao-cao-dong-gop/khoang-ngay.ts` (+ spec) | Tạo | Khoảng ngày mặc định, kiểm `from`/`to`, mốc truy vấn theo giờ VN |
| `src/bao-cao-dong-gop/chu-bao-cao.ts` (+ spec) | Tạo | Chữ vi/en của báo cáo, nhãn kết quả, định dạng ngày giờ VN, lọc ký tự cho PDF |
| `src/bao-cao-dong-gop/dung-bao-cao.ts` (+ spec) | Tạo | Hàm thuần `dungBaoCao`, `ketQuaViec` |
| `src/bao-cao-dong-gop/ten-tep.ts` (+ spec) | Tạo | Tên tệp `Bao-cao-dong-gop_<ten>_<ngay>[_ca-nhan].pdf|xlsx`, MIME |
| `src/bao-cao-dong-gop/phong-chu.ts` (+ spec) | Tạo | Tìm thư mục phông ở cả `src` (jest) lẫn `dist` (máy chủ) |
| `src/bao-cao-dong-gop/ve-excel.ts` (+ spec) | Tạo | Hai sheet "Tổng hợp"/"Chi tiết việc" |
| `src/bao-cao-dong-gop/ve-pdf.ts` (+ spec) | Tạo | A4, bảng tổng hợp, mục từng người, lặp tiêu đề cột, khung xác nhận, chân trang |
| `src/bao-cao-dong-gop/quyen-bao-cao.ts` (+ spec) | Tạo | `loaiBaoCaoTheoVaiTro` |
| `src/bao-cao-dong-gop/token-tai.ts` (+ spec) | Tạo | Khoá dẫn xuất, ký/đọc token tải 5 phút |
| `src/bao-cao-dong-gop/bao-cao-dong-gop.service.ts` (+ spec) | Tạo | Quyền, đọc DB, 413, tạo tệp, tạo link, tải bằng token |
| `src/bao-cao-dong-gop/dto/yeu-cau-bao-cao.dto.ts` | Tạo | `TruyVanBaoCaoDto`, `TaoLinkBaoCaoDto` |
| `src/bao-cao-dong-gop/trang-loi-tai.ts` (+ spec) | Tạo | Trang HTML lỗi hai thứ tiếng + exception filter |
| `src/bao-cao-dong-gop/bao-cao-dong-gop.controller.ts` | Tạo | `BaoCaoDongGopController`, `TaiBaoCaoController` |
| `src/bao-cao-dong-gop/bao-cao-dong-gop.http.spec.ts` | Tạo | Hợp đồng HTTP qua ValidationPipe như `main.ts`, JwtStrategy thật |
| `src/bao-cao-dong-gop/bao-cao-dong-gop.module.ts`, `src/app.module.ts` | Tạo/Sửa | Đăng ký module |
| `src/common/request-rate-limit.guard.ts` (+ `.spec.ts`) | Sửa | 10/phút/người cho xuất + xin link; 30/phút/IP cho tải bằng token |

### Web — `D:\WEDO_PC\wt\fe-bao-cao` (nhánh `feat/bao-cao-dong-gop` từ `origin/main`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `src/lib/bao-cao-dong-gop.ts` (+ `.test.ts`) | Tạo | Tên tệp (khớp máy chủ), đọc tên tệp từ header, khoảng ngày mặc định, kiểm khoảng ngày, loại báo cáo, đường dẫn API, lưu blob |
| `src/lib/api.ts` | Sửa | `api.taiBaoCaoDongGop` |
| `src/i18n/tu-dien/bao-cao-dong-gop.ts` | Tạo | Chữ của nút, hộp thoại, khối trong Cài đặt |
| `src/i18n/loi.ts` (+ `loi.test.ts`) | Sửa | Dịch `REPORT_*` và câu dự phòng sang tiếng Anh |
| `src/components/du-an/XuatBaoCaoDialog.tsx` | Tạo | Hộp thoại chọn PDF/Excel, Từ ngày/Đến ngày, loại báo cáo, Tải xuống |
| `src/components/du-an/KhoiXuatBaoCao.tsx` | Tạo | Khối "Xuất báo cáo" có ô chọn dự án (tab Bảng đóng góp) |
| `src/views/ProjectBoardView.tsx` | Sửa | Nút "Xuất báo cáo đóng góp" ở đầu trang (icon dòng 3; state ~263-265; header ~918-938) |
| `src/views/ContributionsView.tsx` | Sửa | Giữ workspace, gắn `KhoiXuatBaoCao` (effect dòng 95-119; JSX ~138-160) |

### Mobile — `D:\WEDO_PC\wt\mb-bao-cao` (nhánh `feat/bao-cao-dong-gop` từ `main` = `a3259dc`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `src/lib/api/bao-cao.ts` (+ `src/lib/api/__tests__/bao-cao.test.ts`) | Tạo | `xinLinkBaoCao` |
| `src/lib/bao-cao.ts` (+ `src/lib/__tests__/bao-cao.test.ts`) | Tạo | `cauLoiBaoCao` — câu tiếng Việt theo mã lỗi |
| `src/components/dong-gop/XuatBaoCao.tsx` (+ `__tests__/xuat-bao-cao.test.tsx`) | Tạo | Chọn dự án, PDF/Excel, Xuất báo cáo → mở trình duyệt |
| `src/app/(tabs)/account/contributions.tsx` | Sửa | Gắn `XuatBaoCao` đầu `ScrollView` |
| `src/lib/__tests__/bang-dong-gop-web.test.tsx` | Sửa | Giả `listProjects` vì màn giờ có khối xuất báo cáo |

---

# PHẦN 1 — BACKEND (`D:\WEDO_PC\wt\be-bao-cao`)

Mọi lệnh trong phần này chạy trong `D:\WEDO_PC\wt\be-bao-cao` bằng Git Bash (công cụ Bash), trừ khi ghi khác. Kiểm thử một tệp: `npx jest <đường dẫn>`; lint một thư mục: `npx eslint <thư mục> --max-warnings 0`.

### Task R0: Tạo worktree backend và kiểm mốc xuất phát

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: `origin/backend` (đỉnh `cd6943b`, cùng mã với `D:\WEDO_PC\wt\be-ios-mien-phi`).
- Produces: worktree `D:\WEDO_PC\wt\be-bao-cao` trên nhánh `feat/bao-cao-dong-gop`, `node_modules` riêng, Prisma Client đã sinh.

- [ ] **Step 1: Tạo worktree và cài thư viện**

```bash
git -C D:/WEDO_PC/BE_WEDO fetch origin
git -C D:/WEDO_PC/BE_WEDO worktree add D:/WEDO_PC/wt/be-bao-cao -b feat/bao-cao-dong-gop origin/backend
cd D:/WEDO_PC/wt/be-bao-cao && npm ci && npx prisma generate
git log --oneline -1
ls .env 2>&1
```

Expected: `npm ci` xong, `prisma generate` in "Generated Prisma Client"; `git log` in `cd6943b style(main): binh luan co dau` (hoặc mới hơn nếu `origin/backend` đã tiến — ghi lại đỉnh thật); `ls .env` → "No such file". KHÔNG chép `.env` vào đây.

- [ ] **Step 2: Kiểm mốc xanh trước khi sửa**

```bash
npx tsc --noEmit -p tsconfig.json && npx jest && npm run lint -- --max-warnings 0 && npm run test:ops
```

Expected: cả bốn sạch (các bài `*.integration.spec.ts` tự bỏ qua). Không sạch thì dừng và báo người giao việc — không sửa lỗi có sẵn trong task này. Không commit.

---

### Task R1: Thư viện `exceljs`/`pdfkit` và phông Be Vietnam Pro đi theo bản build

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `assets/fonts/BeVietnamPro-Regular.ttf`, `assets/fonts/BeVietnamPro-SemiBold.ttf`, `assets/fonts/OFL.txt`
- Modify: `nest-cli.json` (khối `compilerOptions`, dòng 5-7)
- Create: `scripts/ops/phong-chu-bao-cao.test.mjs`
- Create: `src/bao-cao-dong-gop/phong-chu.ts`
- Test: `src/bao-cao-dong-gop/phong-chu.spec.ts`

**Interfaces:**
- Consumes: không.
- Produces:
  - `export const TEP_PHONG: { readonly thuong: 'BeVietnamPro-Regular.ttf'; readonly dam: 'BeVietnamPro-SemiBold.ttf' }`
  - `export function thuMucPhongChu(ungVien?: string[]): string`
  - Sau `npm run build`: `dist/assets/fonts/{BeVietnamPro-Regular.ttf,BeVietnamPro-SemiBold.ttf,OFL.txt}`.

Vì sao chép vào `dist`: workflow deploy (`.github/workflows/backend_api-wedo-backend-dai.yml` dòng 189 và `deploy-backend-staging.yml` dòng 95) chỉ đóng gói `dist prisma package.json package-lock.json prisma.config.ts`. Sửa workflow thì lần push cần token có quyền `workflow`; để Nest CLI chép phông vào `dist` thì không phải đụng workflow. Đã đọc `node_modules/@nestjs/cli/lib/compiler/assets-manager.js` (Nest CLI 11.0.23): mục `{ "include": "../assets/fonts/*", "outDir": "dist/assets" }` cắt đường dẫn theo độ sâu của `src` nên ra `dist/assets/fonts/<tệp>` trên cả Windows lẫn Linux.

- [ ] **Step 1: Cài thư viện**

```bash
npm install exceljs@4.4.0 pdfkit@0.17.2
npm install -D @types/pdfkit@0.17.6
ls node_modules/exceljs/index.d.ts node_modules/@types/pdfkit/index.d.ts
git diff --stat package.json
```

Expected: hai tệp kiểu đều có (exceljs tự mang `index.d.ts`, khai `"types": "./index.d.ts"`); `package.json` thêm `"exceljs": "^4.4.0"`, `"pdfkit": "^0.17.2"` vào `dependencies` và `"@types/pdfkit": "^0.17.6"` vào `devDependencies`. Ghim `pdfkit` 0.17.x vì `@types/pdfkit` mới nhất là 0.17.6 — bản 0.18-0.20 chưa có kiểu tương ứng.

- [ ] **Step 2: Tải phông một lần (lệnh mạng duy nhất của kế hoạch)**

```bash
mkdir -p assets/fonts
for f in BeVietnamPro-Regular.ttf BeVietnamPro-SemiBold.ttf OFL.txt; do
  curl -fsSL -o "assets/fonts/$f" "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/$f"
done
ls -l assets/fonts
sha256sum assets/fonts/*.ttf
head -3 assets/fonts/OFL.txt
```

Expected:
```
cd1ef6e9d7db28ad5cdb88a65ccbe693870e60d340b791f349d248342b4fe4c3 *assets/fonts/BeVietnamPro-Regular.ttf
bd8e27eb02720b9d91e59e4f10a90878643219f25ce6a8d9a4f06a8a88d3bb71 *assets/fonts/BeVietnamPro-SemiBold.ttf
```
(132.948 và 136.736 byte; `OFL.txt` bắt đầu bằng "Copyright 2021 The Be Vietnam Pro Project Authors" và có câu "SIL Open Font License, Version 1.1"). Băm khác: DỪNG, báo người giao việc — kho phông đã đổi bản, phải xem lại trước khi nhúng.

- [ ] **Step 3: Viết bài kiểm đóng gói (thất bại)**

`scripts/ops/phong-chu-bao-cao.test.mjs`:

```js
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Báo cáo đóng góp dạng PDF nhúng phông Be Vietnam Pro (SIL OFL 1.1).
 * Ghim ba điều mà kiểm thử jest không thấy:
 * - đúng bản phông đã kiểm lúc tải (SHA-256), không ai lặng lẽ thay;
 * - giấy phép OFL đi kèm, như giấy phép đòi;
 * - `nest build` chép phông vào `dist` — workflow deploy chỉ đóng gói `dist`,
 *   thiếu bước này thì máy chủ thật không vẽ được PDF.
 */
const goc = fileURLToPath(new URL('../..', import.meta.url));

const BAM_PHONG = {
  'BeVietnamPro-Regular.ttf': 'cd1ef6e9d7db28ad5cdb88a65ccbe693870e60d340b791f349d248342b4fe4c3',
  'BeVietnamPro-SemiBold.ttf': 'bd8e27eb02720b9d91e59e4f10a90878643219f25ce6a8d9a4f06a8a88d3bb71',
};

for (const [ten, bam] of Object.entries(BAM_PHONG)) {
  test(`assets/fonts/${ten} đúng bản đã kiểm`, () => {
    const that = createHash('sha256').update(readFileSync(`${goc}assets/fonts/${ten}`)).digest('hex');
    assert.equal(that, bam);
  });
}

test('giấy phép SIL OFL đi kèm phông', () => {
  // Không băm tệp chữ: git trên Windows có thể đổi xuống dòng thành CRLF.
  assert.match(readFileSync(`${goc}assets/fonts/OFL.txt`, 'utf8'), /SIL Open Font License, Version 1\.1/);
});

test('nest build chép assets/fonts vào dist/assets/fonts', () => {
  const cauHinh = JSON.parse(readFileSync(`${goc}nest-cli.json`, 'utf8'));
  assert.deepEqual(cauHinh.compilerOptions.assets, [{ include: '../assets/fonts/*', outDir: 'dist/assets' }]);
});
```

Run: `node --test scripts/ops/phong-chu-bao-cao.test.mjs`
Expected: FAIL đúng một bài — "nest build chép assets/fonts…" (`cauHinh.compilerOptions.assets` là `undefined`); ba bài phông PASS.

- [ ] **Step 4: Sửa `nest-cli.json`**

Thay toàn bộ tệp bằng:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": [{ "include": "../assets/fonts/*", "outDir": "dist/assets" }]
  }
}
```

Run: `node --test scripts/ops/phong-chu-bao-cao.test.mjs`
Expected: PASS (4 bài).

- [ ] **Step 5: Viết bài kiểm tìm thư mục phông (thất bại)**

`src/bao-cao-dong-gop/phong-chu.spec.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { TEP_PHONG, thuMucPhongChu } from './phong-chu';

describe('thuMucPhongChu', () => {
  it('chạy kiểm thử thì thấy phông ở assets/fonts của repo', () => {
    expect(thuMucPhongChu()).toMatch(/assets[\\/]fonts$/);
  });

  it('bỏ qua thư mục thiếu một trong hai tệp phông', () => {
    const thieu = mkdtempSync(join(tmpdir(), 'phong-thieu-'));
    writeFileSync(join(thieu, TEP_PHONG.thuong), '');
    const du = mkdtempSync(join(tmpdir(), 'phong-du-'));
    writeFileSync(join(du, TEP_PHONG.thuong), '');
    writeFileSync(join(du, TEP_PHONG.dam), '');

    expect(thuMucPhongChu([thieu, du])).toBe(du);
  });

  it('không có ở đâu thì báo rõ đã tìm những chỗ nào', () => {
    expect(() => thuMucPhongChu(['/khong-co/phong'])).toThrow(
      /Thiếu phông Be Vietnam Pro.*\/khong-co\/phong/,
    );
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/phong-chu.spec.ts`
Expected: FAIL — "Cannot find module './phong-chu'".

- [ ] **Step 6: Viết mã**

`src/bao-cao-dong-gop/phong-chu.ts`:

```ts
import { existsSync } from 'fs';
import { join } from 'path';

export const TEP_PHONG = {
  thuong: 'BeVietnamPro-Regular.ttf',
  dam: 'BeVietnamPro-SemiBold.ttf',
} as const;

/**
 * Thư mục chứa phông Be Vietnam Pro của báo cáo PDF.
 *
 * Mã nguồn để phông ở `assets/fonts/`; `nest build` chép sang
 * `dist/assets/fonts/` (nest-cli.json) vì workflow deploy chỉ đóng gói `dist`.
 * Từ tệp này đi lên hai cấp là đúng chỗ ở cả hai nơi: `src/bao-cao-dong-gop`
 * → gốc repo (jest), `dist/src/bao-cao-dong-gop` → `dist` (máy chủ thật).
 * Hai đường theo `process.cwd()` chỉ là dự phòng.
 */
export function thuMucPhongChu(
  ungVien: string[] = [
    join(__dirname, '..', '..', 'assets', 'fonts'),
    join(process.cwd(), 'assets', 'fonts'),
    join(process.cwd(), 'dist', 'assets', 'fonts'),
  ],
): string {
  const thay = ungVien.find(
    (thuMuc) =>
      existsSync(join(thuMuc, TEP_PHONG.thuong)) &&
      existsSync(join(thuMuc, TEP_PHONG.dam)),
  );
  if (!thay) {
    throw new Error(
      `Thiếu phông Be Vietnam Pro cho báo cáo PDF. Đã tìm ở: ${ungVien.join(', ')}`,
    );
  }
  return thay;
}
```

- [ ] **Step 7: Chạy lại và kiểm bản build**

```bash
npx jest src/bao-cao-dong-gop/phong-chu.spec.ts
npx eslint src/bao-cao-dong-gop --max-warnings 0
npm run build
ls dist/assets/fonts
node -e "console.log(require('./dist/src/bao-cao-dong-gop/phong-chu.js').thuMucPhongChu())"
```

Expected: 3 bài PASS; eslint sạch; build xong; `ls` in đúng ba tệp `BeVietnamPro-Regular.ttf BeVietnamPro-SemiBold.ttf OFL.txt`; lệnh `node` in đường dẫn kết thúc bằng `dist\assets\fonts` (Windows) — tức máy chủ thật đọc phông từ gói deploy. Nếu `ls` báo không có thư mục: dừng, báo lại kết quả `ls -R dist | grep -i ttf` — không sửa workflow deploy.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json assets/fonts nest-cli.json scripts/ops/phong-chu-bao-cao.test.mjs src/bao-cao-dong-gop/phong-chu.ts src/bao-cao-dong-gop/phong-chu.spec.ts
git commit -m "chore(bao-cao): them exceljs, pdfkit va phong Be Vietnam Pro chep vao dist" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R2: Ngày theo giờ Việt Nam, lúc nộp và khoảng thời gian của báo cáo

**Files:**
- Modify: `src/common/ngay-vn.ts` (thêm sau dòng 63, cuối tệp)
- Test: `src/common/ngay-vn.spec.ts` (thêm cuối tệp, sửa dòng import 2)
- Modify: `src/tasks/contributions.ts` (`mocHoanThanh` dòng 89-97)
- Test: `src/tasks/contributions.spec.ts` (sửa import dòng 2, thêm `describe` cuối tệp)
- Create: `src/bao-cao-dong-gop/bao-cao.errors.ts`
- Create: `src/bao-cao-dong-gop/khoang-ngay.ts`
- Test: `src/bao-cao-dong-gop/khoang-ngay.spec.ts`

**Interfaces:**
- Consumes: `LECH_VN_MS`, `NGAY_MS`, `ngayVN` (có sẵn trong `ngay-vn.ts`); `TaskDeTinh`, `MOC_CO_LUC_NOP` (có sẵn trong `contributions.ts`).
- Produces:
  - `export function laNgayCoThat(ngay: string): boolean`
  - `export function dauNgayVNTuChuoi(ngay: string, soNgay?: number): Date`
  - `export function soNgayLichVN(tu: Date, den: Date): number`
  - `export function lucNopDeTinh(t: TaskDeTinh): Date | null`
  - `export const MA_LOI_BAO_CAO: { readonly khoangNgay: 'REPORT_BAD_RANGE'; readonly quaLon: 'REPORT_TOO_LARGE'; readonly linkHong: 'REPORT_LINK_INVALID' }`
  - `export const TOI_DA_VIEC_BAO_CAO = 3000`
  - `export function loiKhoangNgay(): BadRequestException`, `loiQuaLon(): PayloadTooLargeException`, `loiLinkHong(): UnauthorizedException`
  - `export interface KhoangNgay { tu: string; den: string }`
  - `export function khoangNgayBaoCao(from: string | undefined, to: string | undefined, duAnTaoLuc: Date, bayGio: Date): KhoangNgay`
  - `export function mocTruyVan(khoang: KhoangNgay): { gte: Date; lt: Date }`
  - `export function trongKhoang(luc: Date, khoang: KhoangNgay): boolean`

- [ ] **Step 1: Viết bài kiểm thất bại cho ngày VN**

Trong `src/common/ngay-vn.spec.ts`, đổi dòng import thành:

```ts
import {
  cacNgayVN,
  dauNgayVN,
  dauNgayVNTuChuoi,
  gioVN,
  hanCuoiNgayVN,
  laNgayCoThat,
  ngayVN,
  soNgayLichVN,
} from './ngay-vn';
```

và thêm cuối tệp:

```ts
describe('laNgayCoThat', () => {
  it('chỉ nhận YYYY-MM-DD có thật', () => {
    expect(laNgayCoThat('2026-02-28')).toBe(true);
    expect(laNgayCoThat('2028-02-29')).toBe(true);
    expect(laNgayCoThat('2026-02-29')).toBe(false);
    expect(laNgayCoThat('2026-13-01')).toBe(false);
    expect(laNgayCoThat('2026-9-1')).toBe(false);
    expect(laNgayCoThat('01/09/2026')).toBe(false);
    expect(laNgayCoThat('')).toBe(false);
  });
});

describe('dauNgayVNTuChuoi', () => {
  it('0h giờ Việt Nam là 17:00 UTC hôm trước; cộng ngày lăn qua tháng', () => {
    expect(dauNgayVNTuChuoi('2026-10-01').toISOString()).toBe(
      '2026-09-30T17:00:00.000Z',
    );
    expect(dauNgayVNTuChuoi('2026-10-31', 1).toISOString()).toBe(
      '2026-10-31T17:00:00.000Z',
    );
  });
});

describe('soNgayLichVN', () => {
  it('đếm theo lịch Việt Nam, không theo lịch UTC', () => {
    // 01:00 30/09 VN (UTC còn 29/09) tới 23:30 01/10 VN: lịch VN 1 ngày, lịch UTC 2 ngày.
    expect(
      soNgayLichVN(
        new Date('2026-09-29T18:00:00Z'),
        new Date('2026-10-01T16:30:00Z'),
      ),
    ).toBe(1);
  });

  it('cùng ngày là 0, ngược chiều là số âm', () => {
    expect(
      soNgayLichVN(
        new Date('2026-09-30T01:00:00Z'),
        new Date('2026-09-30T16:00:00Z'),
      ),
    ).toBe(0);
    expect(
      soNgayLichVN(
        new Date('2026-10-02T05:00:00Z'),
        new Date('2026-09-30T05:00:00Z'),
      ),
    ).toBe(-2);
  });
});
```

Run: `npx jest src/common/ngay-vn.spec.ts`
Expected: FAIL — `laNgayCoThat is not a function` (và hai hàm kia).

- [ ] **Step 2: Viết mã ngày VN**

Thêm cuối `src/common/ngay-vn.ts`:

```ts
/** `YYYY-MM-DD` có thật trên lịch (không nhận 2026-02-29 hay 2026-13-01). */
export function laNgayCoThat(ngay: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return false;
  const [y, m, d] = ngay.split('-').map(Number);
  const luc = new Date(Date.UTC(y, m - 1, d));
  return (
    luc.getUTCFullYear() === y &&
    luc.getUTCMonth() === m - 1 &&
    luc.getUTCDate() === d
  );
}

/**
 * Nửa đêm giờ Việt Nam đầu ngày `ngay` (YYYY-MM-DD) cộng `soNgay` ngày, biểu
 * diễn bằng thời điểm UTC. Cận dưới/cận trên của một khoảng ngày khi truy vấn.
 */
export function dauNgayVNTuChuoi(ngay: string, soNgay = 0): Date {
  const [y, m, d] = ngay.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + soNgay) - LECH_VN_MS);
}

/**
 * Số ngày theo LỊCH Việt Nam từ ngày chứa `tu` tới ngày chứa `den`.
 *
 * "Trễ 1 ngày" phải là sang ngày hôm sau theo giờ Việt Nam: nộp 23:30 cho hạn
 * 01:00 sáng hôm trước là trễ một ngày lịch, dù máy chủ Azure chạy giờ UTC và
 * lịch UTC nói hai ngày.
 */
export function soNgayLichVN(tu: Date, den: Date): number {
  return Math.round(
    (Date.parse(ngayVN(den)) - Date.parse(ngayVN(tu))) / NGAY_MS,
  );
}
```

Run: `npx jest src/common/ngay-vn.spec.ts`
Expected: PASS.

- [ ] **Step 3: Viết bài kiểm thất bại cho lúc nộp**

Trong `src/tasks/contributions.spec.ts`, đổi dòng 2 thành:

```ts
import {
  dungHan,
  lucNopDeTinh,
  MOC_CO_LUC_NOP,
  tinhDongGop,
  type TaskDeTinh,
} from './contributions';
```

và thêm cuối tệp:

```ts
describe('lucNopDeTinh', () => {
  it('có submittedAt thì lấy submittedAt', () => {
    const nop = new Date('2026-10-01T03:00:00Z');
    expect(
      lucNopDeTinh(
        task({ submittedAt: nop, completedAt: new Date('2026-10-02T03:00:00Z') }),
      ),
    ).toBe(nop);
  });

  it('việc xong trước MOC_CO_LUC_NOP mà không có submittedAt: lấy lần nộp tệp gần nhất', () => {
    const tep = new Date('2026-08-18T09:00:00Z');
    expect(lucNopDeTinh(task({ nopGanNhatLuc: tep }))).toBe(tep);
  });

  it('việc xong sau mốc mà không có submittedAt: không có lúc nộp', () => {
    expect(
      lucNopDeTinh(
        task({
          completedAt: new Date(MOC_CO_LUC_NOP.getTime() + 1000),
          nopGanNhatLuc: new Date('2026-09-30T09:00:00Z'),
        }),
      ),
    ).toBeNull();
  });
});
```

Run: `npx jest src/tasks/contributions.spec.ts`
Expected: FAIL — `lucNopDeTinh is not a function`.

- [ ] **Step 4: Tách `lucNopDeTinh` khỏi `mocHoanThanh`**

Trong `src/tasks/contributions.ts`, thay hàm `mocHoanThanh` (dòng 89-97) bằng:

```ts
/**
 * Lúc người làm nộp, theo đúng quy tắc đo đúng hạn: `submittedAt`, hoặc lần
 * nộp tệp gần nhất với việc xong trước `MOC_CO_LUC_NOP`. Báo cáo đóng góp in
 * đúng mốc này ở cột "Ngày nộp", để cột đó khớp với kết luận đúng/trễ hạn.
 */
export function lucNopDeTinh(t: TaskDeTinh): Date | null {
  const duLieuCu =
    !t.submittedAt && t.completedAt !== null && t.completedAt < MOC_CO_LUC_NOP;
  return t.submittedAt ?? (duLieuCu ? (t.nopGanNhatLuc ?? null) : null);
}

export function mocHoanThanh(t: TaskDeTinh): Date | null {
  const nop = lucNopDeTinh(t);
  if (nop && t.completedAt) {
    return nop.getTime() <= t.completedAt.getTime() ? nop : t.completedAt;
  }
  return nop ?? t.completedAt;
}
```

(Giữ nguyên khối bình luận dài phía trên `mocHoanThanh`.)

Run: `npx jest src/tasks/contributions.spec.ts`
Expected: PASS — mọi bài cũ của `tinhDongGop`/`mocHoanThanh` vẫn xanh, 3 bài mới xanh.

- [ ] **Step 5: Viết bài kiểm thất bại cho khoảng ngày**

`src/bao-cao-dong-gop/khoang-ngay.spec.ts`:

```ts
import { HttpException } from '@nestjs/common';
import { khoangNgayBaoCao, mocTruyVan, trongKhoang } from './khoang-ngay';

const TAO_DU_AN = new Date('2026-08-31T18:00:00Z'); // 01:00 01/09 giờ VN
const BAY_GIO = new Date('2026-10-01T20:00:00Z'); // 03:00 02/10 giờ VN

function loiCua(viec: () => unknown) {
  try {
    viec();
  } catch (e) {
    if (e instanceof HttpException) {
      return { status: e.getStatus(), body: e.getResponse() };
    }
    throw e;
  }
  return null;
}

describe('khoangNgayBaoCao', () => {
  it('mặc định từ ngày tạo dự án tới hôm nay, tính theo ngày Việt Nam', () => {
    expect(khoangNgayBaoCao(undefined, undefined, TAO_DU_AN, BAY_GIO)).toEqual({
      tu: '2026-09-01',
      den: '2026-10-02',
    });
  });

  it('giữ nguyên ngày người dùng chọn; from = to vẫn hợp lệ', () => {
    expect(
      khoangNgayBaoCao('2026-09-15', '2026-09-15', TAO_DU_AN, BAY_GIO),
    ).toEqual({ tu: '2026-09-15', den: '2026-09-15' });
  });

  it.each([
    ['2026-09-30', '2026-09-01'],
    ['2026-02-30', '2026-03-01'],
    ['30/09/2026', undefined],
    ['', undefined],
    [undefined, '2026-9-1'],
  ])('from=%s to=%s → 400 REPORT_BAD_RANGE', (from, to) => {
    expect(
      loiCua(() => khoangNgayBaoCao(from, to, TAO_DU_AN, BAY_GIO)),
    ).toMatchObject({ status: 400, body: { code: 'REPORT_BAD_RANGE' } });
  });
});

describe('mocTruyVan và trongKhoang', () => {
  const khoang = { tu: '2026-09-01', den: '2026-09-30' };

  it('cận dưới là 0h ngày đầu, cận trên là 0h ngày sau ngày cuối, theo giờ VN', () => {
    expect(mocTruyVan(khoang)).toEqual({
      gte: new Date('2026-08-31T17:00:00.000Z'),
      lt: new Date('2026-09-30T17:00:00.000Z'),
    });
  });

  it('23:59 ngày 30/09 giờ VN thì trong; 00:00 ngày 01/10 giờ VN thì ngoài', () => {
    expect(trongKhoang(new Date('2026-09-30T16:59:00Z'), khoang)).toBe(true);
    expect(trongKhoang(new Date('2026-09-30T17:00:00Z'), khoang)).toBe(false);
    expect(trongKhoang(new Date('2026-08-31T17:00:00Z'), khoang)).toBe(true);
    expect(trongKhoang(new Date('2026-08-31T16:59:00Z'), khoang)).toBe(false);
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/khoang-ngay.spec.ts`
Expected: FAIL — "Cannot find module './khoang-ngay'".

- [ ] **Step 6: Viết mã lỗi và khoảng ngày**

`src/bao-cao-dong-gop/bao-cao.errors.ts`:

```ts
import {
  BadRequestException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Mã lỗi của báo cáo đóng góp. Web dịch theo mã (src/i18n/loi.ts), app dịch
 * theo mã (src/lib/bao-cao.ts) — câu tiếng Việt dưới đây chỉ là câu mặc định.
 */
export const MA_LOI_BAO_CAO = {
  khoangNgay: 'REPORT_BAD_RANGE',
  quaLon: 'REPORT_TOO_LARGE',
  linkHong: 'REPORT_LINK_INVALID',
} as const;

/**
 * Trần số việc của một báo cáo. Vẽ PDF chạy đồng bộ trong tiến trình Node:
 * vài chục nghìn dòng sẽ giữ máy chủ hàng giây cho mọi người khác.
 */
export const TOI_DA_VIEC_BAO_CAO = 3000;

export function loiKhoangNgay() {
  return new BadRequestException({
    statusCode: 400,
    code: MA_LOI_BAO_CAO.khoangNgay,
    message:
      'Khoảng thời gian không hợp lệ. Chọn ngày dạng YYYY-MM-DD, "Từ ngày" không được sau "Đến ngày".',
  });
}

export function loiQuaLon() {
  return new PayloadTooLargeException({
    statusCode: 413,
    code: MA_LOI_BAO_CAO.quaLon,
    message:
      'Báo cáo có hơn 3.000 việc. Hãy thu hẹp khoảng thời gian rồi xuất lại.',
    limit: TOI_DA_VIEC_BAO_CAO,
  });
}

/** Token tải sai chữ ký, hết hạn, sai mục đích, hay của tài khoản đã bị khoá. */
export function loiLinkHong() {
  return new UnauthorizedException({
    statusCode: 401,
    code: MA_LOI_BAO_CAO.linkHong,
    message: 'Link tải báo cáo đã hết hạn hoặc không hợp lệ. Hãy xuất lại.',
  });
}
```

`src/bao-cao-dong-gop/khoang-ngay.ts`:

```ts
import { dauNgayVNTuChuoi, laNgayCoThat, ngayVN } from '../common/ngay-vn';
import { loiKhoangNgay } from './bao-cao.errors';

/** Khoảng ngày `YYYY-MM-DD` theo giờ Việt Nam, tính cả hai đầu. */
export interface KhoangNgay {
  tu: string;
  den: string;
}

/**
 * Khoảng thời gian của báo cáo, tính theo NGÀY TẠO việc.
 *
 * Thiếu `from` thì lấy ngày tạo dự án, thiếu `to` thì lấy hôm nay — cả hai
 * theo giờ Việt Nam. Sai dạng, ngày không có thật hay `from` sau `to` đều là
 * 400 `REPORT_BAD_RANGE`, để web và app dịch được theo mã.
 */
export function khoangNgayBaoCao(
  from: string | undefined,
  to: string | undefined,
  duAnTaoLuc: Date,
  bayGio: Date,
): KhoangNgay {
  const tu = from ?? ngayVN(duAnTaoLuc);
  const den = to ?? ngayVN(bayGio);
  if (!laNgayCoThat(tu) || !laNgayCoThat(den) || tu > den) {
    throw loiKhoangNgay();
  }
  return { tu, den };
}

/** Điều kiện `createdAt` cho Prisma: từ 0h ngày đầu tới TRƯỚC 0h ngày sau ngày cuối. */
export function mocTruyVan(khoang: KhoangNgay): { gte: Date; lt: Date } {
  return {
    gte: dauNgayVNTuChuoi(khoang.tu),
    lt: dauNgayVNTuChuoi(khoang.den, 1),
  };
}

export function trongKhoang(luc: Date, khoang: KhoangNgay): boolean {
  const ngay = ngayVN(luc);
  return ngay >= khoang.tu && ngay <= khoang.den;
}
```

- [ ] **Step 7: Chạy lại**

Run: `npx jest src/common/ngay-vn.spec.ts src/tasks/contributions.spec.ts src/bao-cao-dong-gop && npx eslint src/common src/tasks src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS; eslint sạch.

- [ ] **Step 8: Commit**

```bash
git add src/common/ngay-vn.ts src/common/ngay-vn.spec.ts src/tasks/contributions.ts src/tasks/contributions.spec.ts src/bao-cao-dong-gop/bao-cao.errors.ts src/bao-cao-dong-gop/khoang-ngay.ts src/bao-cao-dong-gop/khoang-ngay.spec.ts
git commit -m "feat(bao-cao): ngay lich VN, luc nop de tinh va khoang thoi gian bao cao" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R3: Kiểu dữ liệu, chữ vi/en và cách viết ngày giờ của báo cáo

**Files:**
- Create: `src/bao-cao-dong-gop/kieu-bao-cao.ts`
- Create: `src/bao-cao-dong-gop/chu-bao-cao.ts`
- Test: `src/bao-cao-dong-gop/chu-bao-cao.spec.ts`

**Interfaces:**
- Consumes: `LECH_VN_MS` (`src/common/ngay-vn.ts`).
- Produces (`kieu-bao-cao.ts`):
  - `export type LoaiBaoCao = 'NHOM' | 'CA_NHAN'`
  - `export type DinhDangBaoCao = 'pdf' | 'xlsx'`, `export const DINH_DANG_BAO_CAO: readonly ['pdf', 'xlsx']`
  - `export type NgonNguBaoCao = 'vi' | 'en'`, `export const NGON_NGU_BAO_CAO: readonly ['vi', 'en']`
  - `export interface YeuCauBaoCao { format: DinhDangBaoCao; from?: string; to?: string; lang?: NgonNguBaoCao }`
  - `export type KetQuaViec = { loai: 'DUNG_HAN' } | { loai: 'TRE_HAN'; soNgay: number } | { loai: 'XONG_KHONG_HAN' } | { loai: 'XONG_KHONG_RO_LUC' } | { loai: 'CHO_DUYET' } | { loai: 'QUA_HAN'; soNgay: number } | { loai: 'CHUA_XONG' }`
  - `export interface ViecTrongBaoCao { id: string; tieuDe: string; hanChot: Date | null; ngayNop: Date | null; ngayHoanThanh: Date | null; ketQua: KetQuaViec; soTepDaNop: number }`
  - `export interface DongTongHop { userId: string; ten: string; vaiTro: 'LEADER' | 'MEMBER' | null; duocGiao: number; hoanThanh: number; dungHan: number; treHan: number; chuaXong: number; quaHanChuaXong: number; daNop: number; tyLeDungHanPhanTram: number | null }`
  - `export interface MucThanhVien { tongHop: DongTongHop; viec: ViecTrongBaoCao[] }`
  - `export interface NguoiKy { ten: string; vaiTro: 'LEADER' | 'MEMBER' }`
  - `export interface BaoCaoDongGop { loai: LoaiBaoCao; tenDuAn: string; tenWorkspace: string; tenLeader: string[]; soThanhVien: number | null; khoang: { tu: string; den: string }; xuatLuc: Date; nguoiXuat: string; thanhVien: MucThanhVien[]; nguoiKy: NguoiKy[]; tongSoViec: number }`
- Produces (`chu-bao-cao.ts`):
  - `export const CHU_BAO_CAO: Record<NgonNguBaoCao, ChuBaoCao>`
  - `export function dinhDangLuc(luc: Date | null, lang: NgonNguBaoCao): string`
  - `export function dinhDangNgay(ngay: string, lang: NgonNguBaoCao): string`
  - `export function dinhDangTyLe(tyLe: number | null, lang: NgonNguBaoCao): string`
  - `export function nhanKetQua(kq: KetQuaViec, lang: NgonNguBaoCao): string`
  - `export function nhanKetQuaNgan(kq: KetQuaViec, lang: NgonNguBaoCao): string`
  - `export function soNgayTre(kq: KetQuaViec): number | null`
  - `export function tenCoGhiChu(d: DongTongHop, lang: NgonNguBaoCao): string`
  - `export function dongThongTin(bc: BaoCaoDongGop, lang: NgonNguBaoCao): Array<[string, string]>`
  - `export function chuPdf(chu: string): string`

- [ ] **Step 1: Viết kiểu dữ liệu**

`src/bao-cao-dong-gop/kieu-bao-cao.ts`:

```ts
/**
 * Kiểu dữ liệu của báo cáo đóng góp. Hàm dựng (`dung-bao-cao.ts`) cho ra một
 * `BaoCaoDongGop`; hai hàm vẽ (Excel, PDF) chỉ đọc nó — không ai đọc lại cơ sở
 * dữ liệu, nên PDF và Excel của cùng một lần xuất luôn cùng số.
 */
export type LoaiBaoCao = 'NHOM' | 'CA_NHAN';

export const DINH_DANG_BAO_CAO = ['pdf', 'xlsx'] as const;
export type DinhDangBaoCao = (typeof DINH_DANG_BAO_CAO)[number];

export const NGON_NGU_BAO_CAO = ['vi', 'en'] as const;
export type NgonNguBaoCao = (typeof NGON_NGU_BAO_CAO)[number];

export interface YeuCauBaoCao {
  format: DinhDangBaoCao;
  /** `YYYY-MM-DD` theo giờ Việt Nam; thiếu thì lấy ngày tạo dự án. */
  from?: string;
  /** `YYYY-MM-DD` theo giờ Việt Nam; thiếu thì lấy hôm nay. */
  to?: string;
  lang?: NgonNguBaoCao;
}

export type KetQuaViec =
  | { loai: 'DUNG_HAN' }
  | { loai: 'TRE_HAN'; soNgay: number }
  | { loai: 'XONG_KHONG_HAN' }
  /** Xong, có hạn, nhưng không có lúc xong lẫn lúc nộp (dữ liệu rất cũ): không kết luận đúng/trễ. */
  | { loai: 'XONG_KHONG_RO_LUC' }
  | { loai: 'CHO_DUYET' }
  | { loai: 'QUA_HAN'; soNgay: number }
  | { loai: 'CHUA_XONG' };

export interface ViecTrongBaoCao {
  id: string;
  tieuDe: string;
  hanChot: Date | null;
  ngayNop: Date | null;
  ngayHoanThanh: Date | null;
  ketQua: KetQuaViec;
  soTepDaNop: number;
}

/** Một dòng của bảng tổng hợp. Số lấy từ `tinhDongGop` nên khớp bảng đóng góp trên màn hình. */
export interface DongTongHop {
  userId: string;
  ten: string;
  /** `null`: không còn trong dự án nhưng có việc trong kỳ. */
  vaiTro: 'LEADER' | 'MEMBER' | null;
  duocGiao: number;
  hoanThanh: number;
  dungHan: number;
  treHan: number;
  chuaXong: number;
  quaHanChuaXong: number;
  daNop: number;
  tyLeDungHanPhanTram: number | null;
}

export interface MucThanhVien {
  tongHop: DongTongHop;
  viec: ViecTrongBaoCao[];
}

export interface NguoiKy {
  ten: string;
  vaiTro: 'LEADER' | 'MEMBER';
}

export interface BaoCaoDongGop {
  loai: LoaiBaoCao;
  tenDuAn: string;
  tenWorkspace: string;
  tenLeader: string[];
  /** `null` ở báo cáo cá nhân: không lộ gì về người khác, kể cả số người. */
  soThanhVien: number | null;
  khoang: { tu: string; den: string };
  xuatLuc: Date;
  nguoiXuat: string;
  thanhVien: MucThanhVien[];
  /** Khung xác nhận cuối báo cáo nhóm; rỗng ở báo cáo cá nhân. */
  nguoiKy: NguoiKy[];
  /** Số việc được tính (đã giao, không bị từ chối, trong khoảng thời gian). */
  tongSoViec: number;
}
```

- [ ] **Step 2: Viết bài kiểm thất bại cho chữ báo cáo**

`src/bao-cao-dong-gop/chu-bao-cao.spec.ts`:

```ts
import {
  CHU_BAO_CAO,
  chuPdf,
  dinhDangLuc,
  dinhDangNgay,
  dinhDangTyLe,
  dongThongTin,
  nhanKetQua,
  nhanKetQuaNgan,
  soNgayTre,
  tenCoGhiChu,
} from './chu-bao-cao';
import type { BaoCaoDongGop, DongTongHop } from './kieu-bao-cao';

const dong = (ghiDe: Partial<DongTongHop> = {}): DongTongHop => ({
  userId: 'u-1',
  ten: 'Lê Hữu Đại',
  vaiTro: 'LEADER',
  duocGiao: 4,
  hoanThanh: 3,
  dungHan: 2,
  treHan: 1,
  chuaXong: 1,
  quaHanChuaXong: 1,
  daNop: 5,
  tyLeDungHanPhanTram: 66.7,
  ...ghiDe,
});

const baoCao = (ghiDe: Partial<BaoCaoDongGop> = {}): BaoCaoDongGop => ({
  loai: 'NHOM',
  tenDuAn: 'EXE201',
  tenWorkspace: 'FPT HCM',
  tenLeader: ['Lê Hữu Đại', 'Trần Thu Hà'],
  soThanhVien: 5,
  khoang: { tu: '2026-09-01', den: '2026-10-02' },
  xuatLuc: new Date('2026-10-02T03:05:00Z'),
  nguoiXuat: 'Lê Hữu Đại',
  thanhVien: [],
  nguoiKy: [],
  tongSoViec: 0,
  ...ghiDe,
});

/** Mọi khoá lồng nhau, để so hai bản ngôn ngữ cùng hình dạng. */
function khoa(giaTri: unknown, tien = ''): string[] {
  if (!giaTri || typeof giaTri !== 'object') return [tien];
  return Object.entries(giaTri).flatMap(([k, v]) => khoa(v, `${tien}.${k}`));
}

describe('CHU_BAO_CAO', () => {
  it('bản tiếng Anh có đủ mọi khoá của bản tiếng Việt', () => {
    expect(khoa(CHU_BAO_CAO.en).sort()).toEqual(khoa(CHU_BAO_CAO.vi).sort());
  });
});

describe('ngày giờ luôn theo giờ Việt Nam', () => {
  it('dd/MM/yyyy HH:mm (vi) và MMM d, yyyy HH:mm (en)', () => {
    const luc = new Date('2026-09-30T16:59:00Z');
    expect(dinhDangLuc(luc, 'vi')).toBe('30/09/2026 23:59');
    expect(dinhDangLuc(luc, 'en')).toBe('Sep 30, 2026 23:59');
    expect(dinhDangLuc(null, 'vi')).toBe('');
  });

  it('sau 17:00 UTC đã là ngày hôm sau ở Việt Nam', () => {
    expect(dinhDangLuc(new Date('2026-09-30T17:30:00Z'), 'vi')).toBe(
      '01/10/2026 00:30',
    );
  });

  it('ngày của khoảng thời gian', () => {
    expect(dinhDangNgay('2026-09-01', 'vi')).toBe('01/09/2026');
    expect(dinhDangNgay('2026-09-01', 'en')).toBe('Sep 1, 2026');
  });
});

describe('dinhDangTyLe', () => {
  it('dấu phẩy thập phân ở tiếng Việt, gạch ngang khi chưa có gì để đo', () => {
    expect(dinhDangTyLe(66.7, 'vi')).toBe('66,7%');
    expect(dinhDangTyLe(66.7, 'en')).toBe('66.7%');
    expect(dinhDangTyLe(100, 'vi')).toBe('100%');
    expect(dinhDangTyLe(null, 'vi')).toBe('—');
  });
});

describe('nhãn kết quả', () => {
  it('đủ sáu loại của spec, cộng "không rõ lúc xong"', () => {
    expect(nhanKetQua({ loai: 'DUNG_HAN' }, 'vi')).toBe('Đúng hạn');
    expect(nhanKetQua({ loai: 'TRE_HAN', soNgay: 3 }, 'vi')).toBe('Trễ 3 ngày');
    expect(nhanKetQua({ loai: 'XONG_KHONG_HAN' }, 'vi')).toBe(
      'Đã xong, không có hạn',
    );
    expect(nhanKetQua({ loai: 'XONG_KHONG_RO_LUC' }, 'vi')).toBe(
      'Đã xong, không rõ lúc xong',
    );
    expect(nhanKetQua({ loai: 'CHUA_XONG' }, 'vi')).toBe('Chưa xong');
    expect(nhanKetQua({ loai: 'QUA_HAN', soNgay: 2 }, 'vi')).toBe(
      'Quá hạn 2 ngày',
    );
    expect(nhanKetQua({ loai: 'CHO_DUYET' }, 'vi')).toBe('Đang chờ duyệt');
  });

  it('tiếng Anh chia số ít, số nhiều', () => {
    expect(nhanKetQua({ loai: 'TRE_HAN', soNgay: 1 }, 'en')).toBe('1 day late');
    expect(nhanKetQua({ loai: 'TRE_HAN', soNgay: 4 }, 'en')).toBe('4 days late');
    expect(nhanKetQua({ loai: 'QUA_HAN', soNgay: 1 }, 'en')).toBe(
      'Overdue by 1 day',
    );
  });

  it('Excel tách "Trễ N ngày" thành chữ và số', () => {
    expect(nhanKetQuaNgan({ loai: 'TRE_HAN', soNgay: 3 }, 'vi')).toBe('Trễ hạn');
    expect(nhanKetQuaNgan({ loai: 'QUA_HAN', soNgay: 2 }, 'vi')).toBe('Quá hạn');
    expect(nhanKetQuaNgan({ loai: 'DUNG_HAN' }, 'vi')).toBe('Đúng hạn');
    expect(soNgayTre({ loai: 'TRE_HAN', soNgay: 3 })).toBe(3);
    expect(soNgayTre({ loai: 'QUA_HAN', soNgay: 2 })).toBe(2);
    expect(soNgayTre({ loai: 'DUNG_HAN' })).toBeNull();
  });
});

describe('tenCoGhiChu', () => {
  it('người đã rời dự án được ghi rõ', () => {
    expect(tenCoGhiChu(dong(), 'vi')).toBe('Lê Hữu Đại');
    expect(tenCoGhiChu(dong({ vaiTro: null }), 'vi')).toBe(
      'Lê Hữu Đại (đã rời dự án)',
    );
  });
});

describe('dongThongTin', () => {
  it('báo cáo nhóm: nối nhiều Leader bằng dấu phẩy, có số thành viên', () => {
    expect(dongThongTin(baoCao(), 'vi')).toEqual([
      ['Dự án', 'EXE201'],
      ['Workspace', 'FPT HCM'],
      ['Leader', 'Lê Hữu Đại, Trần Thu Hà'],
      ['Số thành viên', '5'],
      ['Khoảng thời gian', '01/09/2026 – 02/10/2026'],
      ['Thời điểm xuất', '02/10/2026 10:05'],
      ['Người xuất', 'Lê Hữu Đại'],
    ]);
  });

  it('báo cáo cá nhân không có số thành viên; không có Leader thì gạch ngang', () => {
    const dongCaNhan = dongThongTin(
      baoCao({ loai: 'CA_NHAN', soThanhVien: null, tenLeader: [] }),
      'vi',
    );
    expect(dongCaNhan.map(([nhan]) => nhan)).not.toContain('Số thành viên');
    expect(dongCaNhan).toContainEqual(['Leader', '—']);
  });
});

describe('chuPdf', () => {
  it('giữ nguyên tiếng Việt, kể cả khi lưu dạng tách dấu (NFD)', () => {
    expect(chuPdf('Lê Hữu Đại · Ơn Ưu – “trích”')).toBe(
      'Lê Hữu Đại · Ơn Ưu – “trích”',
    );
    expect(chuPdf('Lê Hữu Đại'.normalize('NFD'))).toBe('Lê Hữu Đại');
  });

  it('ký tự không có trong phông thành "?" thay vì làm hỏng tệp', () => {
    expect(chuPdf('Báo cáo 🚀 cuối kỳ')).toBe('Báo cáo ? cuối kỳ');
    expect(chuPdf('❤️ nhóm')).toBe('? nhóm');
    expect(chuPdf('中文')).toBe('??');
  });

  it('xuống dòng và tab trong tên việc thành dấu cách', () => {
    expect(chuPdf('Dòng 1\nDòng 2\tcuối')).toBe('Dòng 1 Dòng 2 cuối');
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/chu-bao-cao.spec.ts`
Expected: FAIL — "Cannot find module './chu-bao-cao'".

- [ ] **Step 3: Viết mã**

`src/bao-cao-dong-gop/chu-bao-cao.ts`:

```ts
import { LECH_VN_MS } from '../common/ngay-vn';
import type {
  BaoCaoDongGop,
  DongTongHop,
  KetQuaViec,
  NgonNguBaoCao,
} from './kieu-bao-cao';

/** Mọi chữ in ra báo cáo. Hai bản cùng một kiểu, thiếu khoá là lỗi biên dịch. */
interface ChuBaoCao {
  tieuDeNhom: string;
  tieuDeCaNhan: string;
  duAn: string;
  workspace: string;
  leader: string;
  soThanhVien: string;
  khoangThoiGian: string;
  xuatLuc: string;
  nguoiXuat: string;
  ghiChu: string;
  bangTongHop: string;
  cot: {
    thanhVien: string;
    duocGiao: string;
    hoanThanh: string;
    dungHan: string;
    treHan: string;
    chuaXong: string;
    quaHan: string;
    daNop: string;
    tyLe: string;
    tenViec: string;
    hanChot: string;
    ngayNop: string;
    ngayHoanThanh: string;
    ketQua: string;
    soNgayTre: string;
    soTep: string;
    hoTen: string;
    vaiTro: string;
    chuKy: string;
    ngay: string;
  };
  sheetTongHop: string;
  sheetViec: string;
  khongCoViec: string;
  caNhanKhongCoViec: string;
  thanhVienKhongCoViec: string;
  daRoi: string;
  xacNhan: string;
  xacNhanMoTa: string;
  vaiTroLeader: string;
  vaiTroThanhVien: string;
  ketQua: {
    dungHan: string;
    treHan: string;
    xongKhongHan: string;
    xongKhongRoLuc: string;
    choDuyet: string;
    quaHan: string;
    chuaXong: string;
  };
  treNgay: (soNgay: number) => string;
  quaHanNgay: (soNgay: number) => string;
  tomTat: (d: DongTongHop, tyLe: string) => string;
  trang: (so: number, tong: number) => string;
  chanTrang: string;
}

const ngayTiengAnh = (so: number) => (so === 1 ? 'day' : 'days');

export const CHU_BAO_CAO: Record<NgonNguBaoCao, ChuBaoCao> = {
  vi: {
    tieuDeNhom: 'Báo cáo đóng góp',
    tieuDeCaNhan: 'Báo cáo đóng góp cá nhân',
    duAn: 'Dự án',
    workspace: 'Workspace',
    leader: 'Leader',
    soThanhVien: 'Số thành viên',
    khoangThoiGian: 'Khoảng thời gian',
    xuatLuc: 'Thời điểm xuất',
    nguoiXuat: 'Người xuất',
    ghiChu:
      'Số liệu do WeDo tự tính từ dữ liệu công việc. Đúng hạn: nộp hoặc hoàn thành trước hạn chót.',
    bangTongHop: 'Bảng tổng hợp',
    cot: {
      thanhVien: 'Thành viên',
      duocGiao: 'Được giao',
      hoanThanh: 'Hoàn thành',
      dungHan: 'Đúng hạn',
      treHan: 'Trễ hạn',
      chuaXong: 'Chưa xong',
      quaHan: 'Quá hạn',
      daNop: 'Tệp đã nộp',
      tyLe: 'Tỷ lệ đúng hạn',
      tenViec: 'Tên việc',
      hanChot: 'Hạn chót',
      ngayNop: 'Ngày nộp',
      ngayHoanThanh: 'Ngày hoàn thành',
      ketQua: 'Kết quả',
      soNgayTre: 'Số ngày trễ',
      soTep: 'Số tệp đã nộp',
      hoTen: 'Họ tên',
      vaiTro: 'Vai trò',
      chuKy: 'Chữ ký',
      ngay: 'Ngày',
    },
    sheetTongHop: 'Tổng hợp',
    sheetViec: 'Chi tiết việc',
    khongCoViec: 'Chưa có công việc trong khoảng thời gian này.',
    caNhanKhongCoViec: 'Bạn chưa được giao việc nào trong dự án này.',
    thanhVienKhongCoViec: 'Chưa được giao việc nào trong khoảng thời gian này.',
    daRoi: '(đã rời dự án)',
    xacNhan: 'Xác nhận của nhóm',
    xacNhanMoTa: 'Mỗi thành viên ký xác nhận số liệu của mình.',
    vaiTroLeader: 'Leader',
    vaiTroThanhVien: 'Thành viên',
    ketQua: {
      dungHan: 'Đúng hạn',
      treHan: 'Trễ hạn',
      xongKhongHan: 'Đã xong, không có hạn',
      xongKhongRoLuc: 'Đã xong, không rõ lúc xong',
      choDuyet: 'Đang chờ duyệt',
      quaHan: 'Quá hạn',
      chuaXong: 'Chưa xong',
    },
    treNgay: (so) => `Trễ ${so} ngày`,
    quaHanNgay: (so) => `Quá hạn ${so} ngày`,
    tomTat: (d, tyLe) =>
      `Được giao ${d.duocGiao} · Hoàn thành ${d.hoanThanh} · Đúng hạn ${d.dungHan} · Trễ hạn ${d.treHan} · Chưa xong ${d.chuaXong} (quá hạn ${d.quaHanChuaXong}) · Tệp đã nộp ${d.daNop} · Tỷ lệ đúng hạn ${tyLe}`,
    trang: (so, tong) => `Trang ${so}/${tong}`,
    chanTrang: 'Xuất từ WeDo — wedofpt.com.vn',
  },
  en: {
    tieuDeNhom: 'Contribution report',
    tieuDeCaNhan: 'Personal contribution report',
    duAn: 'Project',
    workspace: 'Workspace',
    leader: 'Leader',
    soThanhVien: 'Members',
    khoangThoiGian: 'Period',
    xuatLuc: 'Exported at',
    nguoiXuat: 'Exported by',
    ghiChu:
      'Figures are calculated by WeDo from task data. On time: submitted or completed before the due date.',
    bangTongHop: 'Summary',
    cot: {
      thanhVien: 'Member',
      duocGiao: 'Assigned',
      hoanThanh: 'Completed',
      dungHan: 'On time',
      treHan: 'Late',
      chuaXong: 'Not done',
      quaHan: 'Overdue',
      daNop: 'Files submitted',
      tyLe: 'On-time rate',
      tenViec: 'Task',
      hanChot: 'Due date',
      ngayNop: 'Submitted',
      ngayHoanThanh: 'Completed at',
      ketQua: 'Result',
      soNgayTre: 'Days late',
      soTep: 'Files submitted',
      hoTen: 'Full name',
      vaiTro: 'Role',
      chuKy: 'Signature',
      ngay: 'Date',
    },
    sheetTongHop: 'Summary',
    sheetViec: 'Tasks',
    khongCoViec: 'No tasks in this period.',
    caNhanKhongCoViec: 'You have not been assigned any tasks in this project.',
    thanhVienKhongCoViec: 'No tasks assigned in this period.',
    daRoi: '(left the project)',
    xacNhan: 'Team confirmation',
    xacNhanMoTa: 'Each member signs to confirm their own figures.',
    vaiTroLeader: 'Leader',
    vaiTroThanhVien: 'Member',
    ketQua: {
      dungHan: 'On time',
      treHan: 'Late',
      xongKhongHan: 'Done, no due date',
      xongKhongRoLuc: 'Done, completion time unknown',
      choDuyet: 'Awaiting review',
      quaHan: 'Overdue',
      chuaXong: 'Not done',
    },
    treNgay: (so) => `${so} ${ngayTiengAnh(so)} late`,
    quaHanNgay: (so) => `Overdue by ${so} ${ngayTiengAnh(so)}`,
    tomTat: (d, tyLe) =>
      `Assigned ${d.duocGiao} · Completed ${d.hoanThanh} · On time ${d.dungHan} · Late ${d.treHan} · Not done ${d.chuaXong} (overdue ${d.quaHanChuaXong}) · Files submitted ${d.daNop} · On-time rate ${tyLe}`,
    trang: (so, tong) => `Page ${so} of ${tong}`,
    chanTrang: 'Exported from WeDo — wedofpt.com.vn',
  },
};

const THANG_TIENG_ANH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const haiSo = (so: number) => String(so).padStart(2, '0');

/**
 * Thời điểm theo giờ Việt Nam (UTC+7 quanh năm), bất kể máy chủ đặt múi giờ
 * nào: cộng độ lệch rồi đọc phần UTC. Không dùng `toLocaleString` vì kết quả
 * phụ thuộc bản ICU của Node trên Azure.
 */
export function dinhDangLuc(luc: Date | null, lang: NgonNguBaoCao): string {
  if (!luc) return '';
  const vn = new Date(luc.getTime() + LECH_VN_MS);
  const gio = `${haiSo(vn.getUTCHours())}:${haiSo(vn.getUTCMinutes())}`;
  return lang === 'vi'
    ? `${haiSo(vn.getUTCDate())}/${haiSo(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${gio}`
    : `${THANG_TIENG_ANH[vn.getUTCMonth()]} ${vn.getUTCDate()}, ${vn.getUTCFullYear()} ${gio}`;
}

/** Ngày `YYYY-MM-DD` (đã là ngày Việt Nam) → 01/09/2026 hay Sep 1, 2026. */
export function dinhDangNgay(ngay: string, lang: NgonNguBaoCao): string {
  const [y, m, d] = ngay.split('-').map(Number);
  return lang === 'vi'
    ? `${haiSo(d)}/${haiSo(m)}/${y}`
    : `${THANG_TIENG_ANH[m - 1]} ${d}, ${y}`;
}

/** `null` là "chưa có việc nào có hạn để đo" — khác hẳn 0%, nên in "—". */
export function dinhDangTyLe(
  tyLe: number | null,
  lang: NgonNguBaoCao,
): string {
  if (tyLe === null) return '—';
  const so = String(tyLe);
  return `${lang === 'vi' ? so.replace('.', ',') : so}%`;
}

export function nhanKetQua(kq: KetQuaViec, lang: NgonNguBaoCao): string {
  const chu = CHU_BAO_CAO[lang];
  switch (kq.loai) {
    case 'DUNG_HAN':
      return chu.ketQua.dungHan;
    case 'TRE_HAN':
      return chu.treNgay(kq.soNgay);
    case 'XONG_KHONG_HAN':
      return chu.ketQua.xongKhongHan;
    case 'XONG_KHONG_RO_LUC':
      return chu.ketQua.xongKhongRoLuc;
    case 'CHO_DUYET':
      return chu.ketQua.choDuyet;
    case 'QUA_HAN':
      return chu.quaHanNgay(kq.soNgay);
    case 'CHUA_XONG':
      return chu.ketQua.chuaXong;
  }
}

/** Nhãn cột "Kết quả" của Excel: số ngày nằm riêng ở cột "Số ngày trễ" để lọc, cộng được. */
export function nhanKetQuaNgan(kq: KetQuaViec, lang: NgonNguBaoCao): string {
  if (kq.loai === 'TRE_HAN') return CHU_BAO_CAO[lang].ketQua.treHan;
  if (kq.loai === 'QUA_HAN') return CHU_BAO_CAO[lang].ketQua.quaHan;
  return nhanKetQua(kq, lang);
}

export function soNgayTre(kq: KetQuaViec): number | null {
  return kq.loai === 'TRE_HAN' || kq.loai === 'QUA_HAN' ? kq.soNgay : null;
}

export function tenCoGhiChu(d: DongTongHop, lang: NgonNguBaoCao): string {
  return d.vaiTro === null ? `${d.ten} ${CHU_BAO_CAO[lang].daRoi}` : d.ten;
}

/** Các dòng "nhãn: giá trị" của phần đầu báo cáo, dùng chung cho PDF và Excel. */
export function dongThongTin(
  bc: BaoCaoDongGop,
  lang: NgonNguBaoCao,
): Array<[string, string]> {
  const chu = CHU_BAO_CAO[lang];
  const dong: Array<[string, string]> = [
    [chu.duAn, bc.tenDuAn],
    [chu.workspace, bc.tenWorkspace],
    [chu.leader, bc.tenLeader.join(', ') || '—'],
  ];
  if (bc.soThanhVien !== null) {
    dong.push([chu.soThanhVien, String(bc.soThanhVien)]);
  }
  dong.push(
    [
      chu.khoangThoiGian,
      `${dinhDangNgay(bc.khoang.tu, lang)} – ${dinhDangNgay(bc.khoang.den, lang)}`,
    ],
    [chu.xuatLuc, dinhDangLuc(bc.xuatLuc, lang)],
    [chu.nguoiXuat, bc.nguoiXuat],
  );
  return dong;
}

/**
 * Ký tự Be Vietnam Pro có glyph: Latin cơ bản, Latin-1, Latin mở rộng A, Ơ ơ
 * Ư ư, dấu kết hợp tiếng Việt, khối Latin mở rộng bổ sung (toàn bộ chữ có dấu
 * dựng sẵn), và vài dấu câu. Ngoài danh sách là "?": phông thiếu glyph thì
 * pdfkit in ô trống hoặc ký tự rác, người đọc tưởng tệp hỏng.
 */
const KY_TU_CO_TRONG_PHONG =
  /^[\u0020-\u007E\u00A0-\u017F\u01A0\u01A1\u01AF\u01B0\u0300-\u0303\u0309\u0323\u1EA0-\u1EF9\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AB]$/u;

/** Chuỗi an toàn cho PDF: NFC, bỏ ký tự điều khiển hiển thị emoji, thay ký tự không có glyph bằng "?". */
export function chuPdf(chu: string): string {
  return Array.from(
    chu
      .normalize('NFC')
      .replace(/[\r\n\t]+/g, ' ')
      // Bộ chọn biến thể và ký tự nối emoji không tự hiện ra; bỏ đi để một emoji ghép chỉ thành một "?".
      .replace(/[\uFE0E\uFE0F\u200D]/g, ''),
  )
    .map((kyTu) => (KY_TU_CO_TRONG_PHONG.test(kyTu) ? kyTu : '?'))
    .join('');
}
```

Ghi chú cho người thực hiện: Prettier sẽ dàn mảng `THANG_TIENG_ANH` mỗi phần tử một dòng — cứ để `npx eslint --fix src/bao-cao-dong-gop` dàn lại, không đổi nội dung.

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/bao-cao-dong-gop/chu-bao-cao.spec.ts && npx eslint src/bao-cao-dong-gop --fix --max-warnings 0`
Expected: PASS (14 bài); eslint sạch sau `--fix`.

- [ ] **Step 5: Commit**

```bash
git add src/bao-cao-dong-gop/kieu-bao-cao.ts src/bao-cao-dong-gop/chu-bao-cao.ts src/bao-cao-dong-gop/chu-bao-cao.spec.ts
git commit -m "feat(bao-cao): kieu du lieu, chu vi/en va dinh dang gio Viet Nam cua bao cao" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R4: Hàm thuần dựng dữ liệu báo cáo

**Files:**
- Create: `src/bao-cao-dong-gop/dung-bao-cao.ts`
- Test: `src/bao-cao-dong-gop/dung-bao-cao.spec.ts`

**Interfaces:**
- Consumes: `tinhDongGop`, `mocHoanThanh`, `lucNopDeTinh`, `TaskDeTinh` (`src/tasks/contributions.ts`, R2); `soNgayLichVN` (R2); `trongKhoang`, `KhoangNgay` (R2); kiểu ở `kieu-bao-cao.ts` (R3).
- Produces:
  - `export interface ViecNguon { id: string; tieuDe: string; assigneeId: string | null; assignmentStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null; status: TaskStatus; dueDate: Date | null; completedAt: Date | null; submittedAt: Date | null; nopGanNhatLuc: Date | null; soTepDaNop: number; createdAt: Date }`
  - `export interface ThanhVienNguon { userId: string; ten: string; vaiTro: 'LEADER' | 'MEMBER' }`
  - `export interface DauVaoBaoCao { loai: LoaiBaoCao; nguoiXem: { id: string; ten: string }; tenDuAn: string; tenWorkspace: string; thanhVien: ThanhVienNguon[]; tenNguoiKhac: Record<string, string>; viec: ViecNguon[]; khoang: KhoangNgay; bayGio: Date }`
  - `export function ketQuaViec(v: ViecNguon, bayGio: Date): KetQuaViec`
  - `export function dungBaoCao(v: DauVaoBaoCao): BaoCaoDongGop`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/bao-cao-dong-gop/dung-bao-cao.spec.ts`:

```ts
/*
  Mã dưới đây không đọc múi giờ máy. Đặt TZ=UTC chỉ để chắc rằng bài kiểm
  chạy y như trên Azure (giờ UTC), không nhờ máy dev đang ở giờ Việt Nam.
*/
process.env.TZ = 'UTC';

import { TaskStatus } from '@prisma/client';
import { tinhDongGop } from '../tasks/contributions';
import {
  dungBaoCao,
  ketQuaViec,
  type DauVaoBaoCao,
  type ViecNguon,
} from './dung-bao-cao';

const BAY_GIO = new Date('2026-10-02T03:00:00Z'); // 10:00 02/10 giờ VN

let dem = 0;
function viec(ghiDe: Partial<ViecNguon> = {}): ViecNguon {
  dem += 1;
  return {
    id: `t-${dem}`,
    tieuDe: `Việc ${dem}`,
    assigneeId: 'u-dai',
    assignmentStatus: 'ACCEPTED',
    status: TaskStatus.DONE,
    dueDate: new Date('2026-09-20T16:59:00Z'),
    completedAt: new Date('2026-09-19T03:00:00Z'),
    submittedAt: null,
    nopGanNhatLuc: null,
    soTepDaNop: 1,
    createdAt: new Date('2026-09-10T03:00:00Z'),
    ...ghiDe,
  };
}

function dauVao(ghiDe: Partial<DauVaoBaoCao> = {}): DauVaoBaoCao {
  return {
    loai: 'NHOM',
    nguoiXem: { id: 'u-dai', ten: 'Lê Hữu Đại' },
    tenDuAn: 'EXE201 — Nhóm 5',
    tenWorkspace: 'FPT HCM',
    thanhVien: [
      { userId: 'u-dai', ten: 'Lê Hữu Đại', vaiTro: 'LEADER' },
      { userId: 'u-ha', ten: 'Trần Thu Hà', vaiTro: 'MEMBER' },
      { userId: 'u-an', ten: 'Nguyễn An', vaiTro: 'MEMBER' },
    ],
    tenNguoiKhac: {},
    viec: [],
    khoang: { tu: '2026-09-01', den: '2026-10-02' },
    bayGio: BAY_GIO,
    ...ghiDe,
  };
}

describe('dungBaoCao — khớp bảng đóng góp', () => {
  it('số tổng hợp khớp đúng tinhDongGop trên cùng bộ việc', () => {
    const ds = [
      viec(),
      viec({ completedAt: new Date('2026-09-22T03:00:00Z') }),
      viec({
        assigneeId: 'u-ha',
        status: TaskStatus.IN_PROGRESS,
        completedAt: null,
        dueDate: new Date('2026-09-25T16:59:00Z'),
      }),
      viec({
        assigneeId: 'u-ha',
        status: TaskStatus.REVIEW,
        completedAt: null,
        submittedAt: new Date('2026-09-24T03:00:00Z'),
        dueDate: new Date('2026-09-25T16:59:00Z'),
      }),
      viec({ assigneeId: 'u-ha', dueDate: null }),
      viec({ assigneeId: 'u-ha', soTepDaNop: 3 }),
    ];
    const bc = dungBaoCao(dauVao({ viec: ds }));
    const mong = tinhDongGop(
      ds.map((v) => ({
        assigneeId: v.assigneeId,
        assignmentStatus: v.assignmentStatus,
        status: v.status,
        dueDate: v.dueDate,
        completedAt: v.completedAt,
        submittedAt: v.submittedAt,
        nopGanNhatLuc: v.nopGanNhatLuc,
        soLanBiTraLai: 0,
        soBaiDaNop: v.soTepDaNop,
      })),
      BAY_GIO,
    );

    const truong = [
      'duocGiao',
      'hoanThanh',
      'dungHan',
      'treHan',
      'chuaXong',
      'quaHanChuaXong',
      'daNop',
      'tyLeDungHanPhanTram',
    ] as const;
    for (const m of mong) {
      const dong = bc.thanhVien.find((t) => t.tongHop.userId === m.userId)!;
      for (const k of truong) expect(dong.tongHop[k]).toBe(m[k]);
    }
    const dai = bc.thanhVien.find((t) => t.tongHop.userId === 'u-dai')!;
    expect(dai.viec.map((v) => v.ketQua.loai).sort()).toEqual([
      'DUNG_HAN',
      'TRE_HAN',
    ]);
  });

  it('không tính việc chưa giao và việc đã bị từ chối nhận', () => {
    const bc = dungBaoCao(
      dauVao({
        viec: [
          viec({ assigneeId: null }),
          viec({ assignmentStatus: 'REJECTED' }),
          viec(),
        ],
      }),
    );
    expect(bc.tongSoViec).toBe(1);
    expect(
      bc.thanhVien.find((t) => t.tongHop.userId === 'u-dai')!.tongHop.duocGiao,
    ).toBe(1);
  });
});

describe('dungBaoCao — khoảng thời gian', () => {
  it('lọc theo ngày tạo việc tính theo giờ Việt Nam, cả hai đầu', () => {
    const bc = dungBaoCao(
      dauVao({
        khoang: { tu: '2026-09-01', den: '2026-09-30' },
        viec: [
          viec({ tieuDe: 'Đầu kỳ', createdAt: new Date('2026-08-31T17:00:00Z') }),
          viec({ tieuDe: 'Cuối kỳ', createdAt: new Date('2026-09-30T16:59:00Z') }),
          // 00:00 01/10 giờ VN — lịch UTC vẫn là 30/09, nhưng phải nằm ngoài.
          viec({ tieuDe: 'Sang tháng', createdAt: new Date('2026-09-30T17:00:00Z') }),
          viec({ tieuDe: 'Trước kỳ', createdAt: new Date('2026-08-31T16:59:00Z') }),
        ],
      }),
    );
    expect(
      bc.thanhVien.flatMap((t) => t.viec.map((v) => v.tieuDe)).sort(),
    ).toEqual(['Cuối kỳ', 'Đầu kỳ']);
    expect(bc.tongSoViec).toBe(2);
  });
});

describe('ketQuaViec', () => {
  it('Trễ N ngày đếm theo lịch Việt Nam khi máy chủ chạy giờ UTC', () => {
    // Hạn 01:00 30/09 VN; nộp 23:30 01/10 VN → trễ 1 ngày (lịch UTC sẽ nói 2).
    const v = viec({
      dueDate: new Date('2026-09-29T18:00:00Z'),
      submittedAt: new Date('2026-10-01T16:30:00Z'),
      completedAt: new Date('2026-10-02T02:00:00Z'),
    });
    expect(ketQuaViec(v, BAY_GIO)).toEqual({ loai: 'TRE_HAN', soNgay: 1 });
  });

  it('trễ vài phút trong cùng ngày vẫn ghi ít nhất 1 ngày', () => {
    const v = viec({
      dueDate: new Date('2026-09-20T10:00:00Z'),
      completedAt: new Date('2026-09-20T10:05:00Z'),
    });
    expect(ketQuaViec(v, BAY_GIO)).toEqual({ loai: 'TRE_HAN', soNgay: 1 });
  });

  it('nộp trước hạn, Leader duyệt sau hạn: vẫn Đúng hạn', () => {
    const v = viec({
      dueDate: new Date('2026-09-20T10:00:00Z'),
      submittedAt: new Date('2026-09-20T09:00:00Z'),
      completedAt: new Date('2026-09-21T03:00:00Z'),
    });
    expect(ketQuaViec(v, BAY_GIO)).toEqual({ loai: 'DUNG_HAN' });
  });

  it('chưa xong, đã qua hạn: Quá hạn N ngày tính tới hôm nay', () => {
    const v = viec({
      status: TaskStatus.TODO,
      completedAt: null,
      dueDate: new Date('2026-09-28T16:59:00Z'), // 23:59 28/09 VN; hôm nay 02/10 VN
    });
    expect(ketQuaViec(v, BAY_GIO)).toEqual({ loai: 'QUA_HAN', soNgay: 4 });
  });

  it('đang chờ duyệt thì không bị tính quá hạn', () => {
    const v = viec({
      status: TaskStatus.REVIEW,
      completedAt: null,
      dueDate: new Date('2026-09-28T16:59:00Z'),
    });
    expect(ketQuaViec(v, BAY_GIO)).toEqual({ loai: 'CHO_DUYET' });
  });

  it('các loại còn lại', () => {
    expect(ketQuaViec(viec({ dueDate: null }), BAY_GIO)).toEqual({
      loai: 'XONG_KHONG_HAN',
    });
    expect(ketQuaViec(viec({ completedAt: null }), BAY_GIO)).toEqual({
      loai: 'XONG_KHONG_RO_LUC',
    });
    expect(
      ketQuaViec(
        viec({ status: TaskStatus.IN_PROGRESS, completedAt: null, dueDate: null }),
        BAY_GIO,
      ),
    ).toEqual({ loai: 'CHUA_XONG' });
    expect(
      ketQuaViec(
        viec({
          status: TaskStatus.TODO,
          completedAt: null,
          dueDate: new Date('2026-10-05T16:59:00Z'),
        }),
        BAY_GIO,
      ),
    ).toEqual({ loai: 'CHUA_XONG' });
  });
});

describe('dungBaoCao — từng việc', () => {
  it('Ngày nộp theo đúng quy tắc của bảng đóng góp (dữ liệu cũ: lần nộp tệp gần nhất)', () => {
    const tep = new Date('2026-08-18T09:00:00Z');
    const bc = dungBaoCao(dauVao({ viec: [viec({ nopGanNhatLuc: tep })] }));
    const v = bc.thanhVien.find((t) => t.tongHop.userId === 'u-dai')!.viec[0];
    expect(v.ngayNop).toBe(tep);
    expect(v.ngayHoanThanh).toEqual(new Date('2026-09-19T03:00:00Z'));
  });

  it('việc chưa xong không có ngày hoàn thành; xếp theo hạn, việc không hạn xuống cuối', () => {
    const bc = dungBaoCao(
      dauVao({
        viec: [
          viec({ tieuDe: 'Không hạn', dueDate: null }),
          viec({ tieuDe: 'Hạn sau', dueDate: new Date('2026-09-25T16:59:00Z') }),
          viec({
            tieuDe: 'Hạn trước',
            status: TaskStatus.IN_PROGRESS,
            completedAt: new Date('2026-09-15T00:00:00Z'),
            dueDate: new Date('2026-09-15T16:59:00Z'),
          }),
        ],
      }),
    );
    const ds = bc.thanhVien.find((t) => t.tongHop.userId === 'u-dai')!.viec;
    expect(ds.map((v) => v.tieuDe)).toEqual(['Hạn trước', 'Hạn sau', 'Không hạn']);
    expect(ds[0].ngayHoanThanh).toBeNull();
  });
});

describe('dungBaoCao — thành viên', () => {
  it('báo cáo nhóm có mọi thành viên; người chưa có việc toàn số 0; xếp theo hoàn thành rồi theo tên', () => {
    const bc = dungBaoCao(
      dauVao({
        viec: [viec({ assigneeId: 'u-ha' }), viec({ assigneeId: 'u-ha' }), viec()],
      }),
    );
    expect(bc.thanhVien.map((t) => t.tongHop.ten)).toEqual([
      'Trần Thu Hà',
      'Lê Hữu Đại',
      'Nguyễn An',
    ]);
    expect(bc.thanhVien[2].tongHop).toMatchObject({
      duocGiao: 0,
      hoanThanh: 0,
      daNop: 0,
      tyLeDungHanPhanTram: null,
    });
    expect(bc.thanhVien[2].viec).toEqual([]);
    expect(bc.soThanhVien).toBe(3);
    expect(bc.tenLeader).toEqual(['Lê Hữu Đại']);
    expect(bc.nguoiKy).toEqual([
      { ten: 'Lê Hữu Đại', vaiTro: 'LEADER' },
      { ten: 'Nguyễn An', vaiTro: 'MEMBER' },
      { ten: 'Trần Thu Hà', vaiTro: 'MEMBER' },
    ]);
  });

  it('người đã rời dự án mà còn việc trong kỳ vẫn có dòng (để khớp bảng đóng góp), không có trong khung ký', () => {
    const bc = dungBaoCao(
      dauVao({
        tenNguoiKhac: { 'u-cu': 'Phạm Văn Cũ' },
        viec: [viec({ assigneeId: 'u-cu' })],
      }),
    );
    const cu = bc.thanhVien.find((t) => t.tongHop.userId === 'u-cu')!;
    expect(cu.tongHop).toMatchObject({
      ten: 'Phạm Văn Cũ',
      vaiTro: null,
      hoanThanh: 1,
    });
    expect(bc.nguoiKy.map((n) => n.ten)).not.toContain('Phạm Văn Cũ');
  });

  it('báo cáo cá nhân chỉ có người xem: không tên, không số, không việc của ai khác', () => {
    const bc = dungBaoCao(
      dauVao({
        loai: 'CA_NHAN',
        nguoiXem: { id: 'u-ha', ten: 'Trần Thu Hà' },
        viec: [
          viec({ tieuDe: 'Việc của Đại' }),
          viec({ assigneeId: 'u-ha', tieuDe: 'Việc của Hà' }),
        ],
      }),
    );
    expect(bc.thanhVien).toHaveLength(1);
    expect(bc.thanhVien[0].tongHop).toMatchObject({ userId: 'u-ha', duocGiao: 1 });
    expect(bc.soThanhVien).toBeNull();
    expect(bc.nguoiKy).toEqual([]);
    expect(bc.tongSoViec).toBe(1);
    const json = JSON.stringify(bc);
    expect(json).not.toContain('Việc của Đại');
    expect(json).not.toContain('Nguyễn An');
    expect(json).not.toContain('u-dai');
  });

  it('báo cáo cá nhân của người chưa có việc nào vẫn có đúng một dòng toàn số 0', () => {
    const bc = dungBaoCao(
      dauVao({ loai: 'CA_NHAN', nguoiXem: { id: 'u-an', ten: 'Nguyễn An' } }),
    );
    expect(bc.thanhVien).toHaveLength(1);
    expect(bc.thanhVien[0].tongHop).toMatchObject({
      ten: 'Nguyễn An',
      duocGiao: 0,
    });
    expect(bc.tongSoViec).toBe(0);
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/dung-bao-cao.spec.ts`
Expected: FAIL — "Cannot find module './dung-bao-cao'".

- [ ] **Step 2: Viết mã**

`src/bao-cao-dong-gop/dung-bao-cao.ts`:

```ts
import { TaskStatus } from '@prisma/client';
import { soNgayLichVN } from '../common/ngay-vn';
import {
  lucNopDeTinh,
  mocHoanThanh,
  tinhDongGop,
  type TaskDeTinh,
} from '../tasks/contributions';
import { trongKhoang, type KhoangNgay } from './khoang-ngay';
import type {
  BaoCaoDongGop,
  DongTongHop,
  KetQuaViec,
  LoaiBaoCao,
  MucThanhVien,
  NguoiKy,
  ViecTrongBaoCao,
} from './kieu-bao-cao';

/** Một việc như service đọc từ cơ sở dữ liệu. */
export interface ViecNguon {
  id: string;
  tieuDe: string;
  assigneeId: string | null;
  assignmentStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  submittedAt: Date | null;
  /** Lần nộp tệp gần nhất — chỉ dùng cho việc xong trước `MOC_CO_LUC_NOP`. */
  nopGanNhatLuc: Date | null;
  soTepDaNop: number;
  createdAt: Date;
}

export interface ThanhVienNguon {
  userId: string;
  ten: string;
  vaiTro: 'LEADER' | 'MEMBER';
}

export interface DauVaoBaoCao {
  loai: LoaiBaoCao;
  nguoiXem: { id: string; ten: string };
  tenDuAn: string;
  tenWorkspace: string;
  /** Thành viên HIỆN TẠI của dự án. */
  thanhVien: ThanhVienNguon[];
  /** Tên người từng được giao việc trong kỳ nhưng nay không còn trong dự án. */
  tenNguoiKhac: Record<string, string>;
  viec: ViecNguon[];
  khoang: KhoangNgay;
  bayGio: Date;
}

function deTinh(v: ViecNguon): TaskDeTinh {
  return {
    assigneeId: v.assigneeId,
    assignmentStatus: v.assignmentStatus,
    status: v.status,
    dueDate: v.dueDate,
    completedAt: v.completedAt,
    submittedAt: v.submittedAt,
    nopGanNhatLuc: v.nopGanNhatLuc,
    // Báo cáo bỏ cột "Bị trả lại" (spec mục 2.2): số đó chỉ đếm việc ĐANG bị trả lại.
    soLanBiTraLai: 0,
    soBaiDaNop: v.soTepDaNop,
  };
}

/**
 * Kết quả của một việc, cùng quy tắc với `tinhDongGop`: đếm nhãn trong danh
 * sách việc của một người ra đúng các số Đúng hạn / Trễ hạn / Quá hạn ở bảng
 * tổng hợp của chính người đó.
 */
export function ketQuaViec(v: ViecNguon, bayGio: Date): KetQuaViec {
  if (v.status === TaskStatus.DONE) {
    if (!v.dueDate) return { loai: 'XONG_KHONG_HAN' };
    const moc = mocHoanThanh(deTinh(v));
    if (!moc) return { loai: 'XONG_KHONG_RO_LUC' };
    if (moc.getTime() <= v.dueDate.getTime()) return { loai: 'DUNG_HAN' };
    return {
      loai: 'TRE_HAN',
      soNgay: Math.max(1, soNgayLichVN(v.dueDate, moc)),
    };
  }
  // Đã nộp, chờ Leader duyệt: phần của người làm đã xong, không tính quá hạn.
  if (v.status === TaskStatus.REVIEW) return { loai: 'CHO_DUYET' };
  if (v.dueDate && v.dueDate.getTime() < bayGio.getTime()) {
    return {
      loai: 'QUA_HAN',
      soNgay: Math.max(1, soNgayLichVN(v.dueDate, bayGio)),
    };
  }
  return { loai: 'CHUA_XONG' };
}

const theoTen = (a: string, b: string) => a.localeCompare(b, 'vi');

/** Hạn sớm trước, việc không hạn xuống cuối, cùng hạn thì theo tên. */
function soSanhViec(a: ViecTrongBaoCao, b: ViecTrongBaoCao): number {
  const hanA = a.hanChot?.getTime() ?? Number.POSITIVE_INFINITY;
  const hanB = b.hanChot?.getTime() ?? Number.POSITIVE_INFINITY;
  // Hai việc cùng không hạn: Infinity − Infinity là NaN, rơi xuống so tên.
  return hanA - hanB || theoTen(a.tieuDe, b.tieuDe);
}

function dongKhong(
  userId: string,
  ten: string,
  vaiTro: DongTongHop['vaiTro'],
): DongTongHop {
  return {
    userId,
    ten,
    vaiTro,
    duocGiao: 0,
    hoanThanh: 0,
    dungHan: 0,
    treHan: 0,
    chuaXong: 0,
    quaHanChuaXong: 0,
    daNop: 0,
    tyLeDungHanPhanTram: null,
  };
}

/**
 * Dữ liệu của một báo cáo đóng góp.
 *
 * Số tổng hợp đi qua đúng `tinhDongGop` của bảng đóng góp, để số trong tệp nộp
 * giảng viên khớp với số trên màn hình. Báo cáo nhóm có MỌI thành viên hiện tại
 * (người chưa được giao gì hiện toàn số 0 — đó cũng là thông tin), cộng người
 * đã rời dự án mà còn việc trong kỳ (bảng đóng góp cũng đếm họ). Báo cáo cá
 * nhân lọc việc ngay từ đầu, nên không số nào của người khác lọt vào kết quả.
 */
export function dungBaoCao(v: DauVaoBaoCao): BaoCaoDongGop {
  const tinh = v.viec.filter(
    (x) =>
      trongKhoang(x.createdAt, v.khoang) &&
      x.assigneeId !== null &&
      x.assignmentStatus !== 'REJECTED' &&
      (v.loai === 'NHOM' || x.assigneeId === v.nguoiXem.id),
  );
  const tong = new Map(
    tinhDongGop(tinh.map(deTinh), v.bayGio).map((d) => [d.userId, d]),
  );
  const thanhVien = new Map(v.thanhVien.map((t) => [t.userId, t]));
  const ids =
    v.loai === 'NHOM'
      ? [...new Set([...thanhVien.keys(), ...tong.keys()])]
      : [v.nguoiXem.id];

  const muc: MucThanhVien[] = ids
    .map((userId) => {
      const tv = thanhVien.get(userId);
      const ten =
        tv?.ten ??
        v.tenNguoiKhac[userId] ??
        (userId === v.nguoiXem.id ? v.nguoiXem.ten : '?');
      const vaiTro = tv?.vaiTro ?? null;
      const d = tong.get(userId);
      const tongHop: DongTongHop = d
        ? {
            userId,
            ten,
            vaiTro,
            duocGiao: d.duocGiao,
            hoanThanh: d.hoanThanh,
            dungHan: d.dungHan,
            treHan: d.treHan,
            chuaXong: d.chuaXong,
            quaHanChuaXong: d.quaHanChuaXong,
            daNop: d.daNop,
            tyLeDungHanPhanTram: d.tyLeDungHanPhanTram,
          }
        : dongKhong(userId, ten, vaiTro);
      const viec = tinh
        .filter((x) => x.assigneeId === userId)
        .map(
          (x): ViecTrongBaoCao => ({
            id: x.id,
            tieuDe: x.tieuDe,
            hanChot: x.dueDate,
            ngayNop: lucNopDeTinh(deTinh(x)),
            ngayHoanThanh: x.status === TaskStatus.DONE ? x.completedAt : null,
            ketQua: ketQuaViec(x, v.bayGio),
            soTepDaNop: x.soTepDaNop,
          }),
        )
        .sort(soSanhViec);
      return { tongHop, viec };
    })
    .sort(
      (a, b) =>
        b.tongHop.hoanThanh - a.tongHop.hoanThanh ||
        theoTen(a.tongHop.ten, b.tongHop.ten),
    );

  const nguoiKy: NguoiKy[] =
    v.loai === 'NHOM'
      ? [...v.thanhVien]
          .sort((a, b) =>
            a.vaiTro === b.vaiTro
              ? theoTen(a.ten, b.ten)
              : a.vaiTro === 'LEADER'
                ? -1
                : 1,
          )
          .map((t) => ({ ten: t.ten, vaiTro: t.vaiTro }))
      : [];

  return {
    loai: v.loai,
    tenDuAn: v.tenDuAn,
    tenWorkspace: v.tenWorkspace,
    tenLeader: v.thanhVien
      .filter((t) => t.vaiTro === 'LEADER')
      .map((t) => t.ten)
      .sort(theoTen),
    soThanhVien: v.loai === 'NHOM' ? v.thanhVien.length : null,
    khoang: v.khoang,
    xuatLuc: v.bayGio,
    nguoiXuat: v.nguoiXem.ten,
    thanhVien: muc,
    nguoiKy,
    tongSoViec: tinh.length,
  };
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/bao-cao-dong-gop/dung-bao-cao.spec.ts && npx eslint src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (15 bài); eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/bao-cao-dong-gop/dung-bao-cao.ts src/bao-cao-dong-gop/dung-bao-cao.spec.ts
git commit -m "feat(bao-cao): ham thuan dung du lieu bao cao khop bang dong gop" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R5: Tên tệp và header `Content-Disposition` dùng chung

**Files:**
- Create: `src/common/content-disposition.ts`
- Test: `src/common/content-disposition.spec.ts`
- Modify: `src/chat/chat-attachments.controller.ts` (dòng 37-49: bỏ phương thức riêng `contentDisposition`)
- Create: `src/bao-cao-dong-gop/ten-tep.ts`
- Test: `src/bao-cao-dong-gop/ten-tep.spec.ts`

**Interfaces:**
- Consumes: `DinhDangBaoCao`, `LoaiBaoCao` (R3).
- Produces:
  - `export function contentDisposition(tenTep: string, kieu?: 'inline' | 'attachment'): string`
  - `export const MIME_BAO_CAO: Record<DinhDangBaoCao, string>`
  - `export function tenKhongDau(ten: string, toiDa?: number): string`
  - `export function tenTepBaoCao(p: { tenDuAn: string; dinhDang: DinhDangBaoCao; loai: LoaiBaoCao; ngay: string }): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/common/content-disposition.spec.ts`:

```ts
import { contentDisposition } from './content-disposition';

describe('contentDisposition', () => {
  it('giữ đúng dạng cũ của tải tệp chat: tên ASCII dự phòng + filename* UTF-8', () => {
    expect(contentDisposition('Báo cáo.pdf')).toBe(
      "inline; filename=\"B_o_c_o.pdf\"; filename*=UTF-8''B%C3%A1o%20c%C3%A1o.pdf",
    );
  });

  it('tải về (attachment) cho Excel', () => {
    expect(contentDisposition('Bao-cao.xlsx', 'attachment')).toBe(
      "attachment; filename=\"Bao-cao.xlsx\"; filename*=UTF-8''Bao-cao.xlsx",
    );
  });
});
```

`src/bao-cao-dong-gop/ten-tep.spec.ts`:

```ts
import { MIME_BAO_CAO, tenKhongDau, tenTepBaoCao } from './ten-tep';

/* Cùng bộ mẫu với web (FE src/lib/bao-cao-dong-gop.test.ts) — sửa một bên thì sửa cả hai. */
describe('tenTepBaoCao', () => {
  it('bỏ dấu, thay khoảng trắng và ký tự lạ bằng gạch', () => {
    expect(
      tenTepBaoCao({
        tenDuAn: 'Đồ án EXE201 — Nhóm 5',
        dinhDang: 'pdf',
        loai: 'NHOM',
        ngay: '2026-10-02',
      }),
    ).toBe('Bao-cao-dong-gop_Do-an-EXE201-Nhom-5_2026-10-02.pdf');
  });

  it('báo cáo cá nhân thêm _ca-nhan trước đuôi tệp', () => {
    expect(
      tenTepBaoCao({
        tenDuAn: 'Đồ án EXE201 — Nhóm 5',
        dinhDang: 'xlsx',
        loai: 'CA_NHAN',
        ngay: '2026-10-02',
      }),
    ).toBe('Bao-cao-dong-gop_Do-an-EXE201-Nhom-5_2026-10-02_ca-nhan.xlsx');
  });

  it('cắt còn 60 ký tự, không để gạch thừa ở cuối', () => {
    expect(tenKhongDau(`${'a'.repeat(59)} bc`)).toBe('a'.repeat(59));
    expect(tenKhongDau('x'.repeat(80))).toHaveLength(60);
  });

  it('tên không còn chữ nào thì dùng du-an', () => {
    expect(tenKhongDau('🚀🚀')).toBe('du-an');
  });

  it('MIME đúng cho trình duyệt và Excel', () => {
    expect(MIME_BAO_CAO.pdf).toBe('application/pdf');
    expect(MIME_BAO_CAO.xlsx).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});
```

Run: `npx jest src/common/content-disposition.spec.ts src/bao-cao-dong-gop/ten-tep.spec.ts`
Expected: FAIL — hai lỗi "Cannot find module".

- [ ] **Step 2: Viết mã**

`src/common/content-disposition.ts`:

```ts
/**
 * Header `Content-Disposition` cho tệp tải về.
 *
 * `filename` là bản ASCII cho trình duyệt cũ; `filename*` (RFC 5987) mang tên
 * UTF-8 thật, trình duyệt mới ưu tiên nó. Tách từ ChatAttachmentsController để
 * báo cáo đóng góp dùng cùng một cách, không mỗi nơi tự ghép một kiểu.
 */
export function contentDisposition(
  tenTep: string,
  kieu: 'inline' | 'attachment' = 'inline',
): string {
  const duPhong = tenTep.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${kieu}; filename="${duPhong}"; filename*=UTF-8''${encodeURIComponent(tenTep)}`;
}
```

Trong `src/chat/chat-attachments.controller.ts`: thêm `import { contentDisposition } from '../common/content-disposition';` sau dòng import `ChatService`, đổi `'Content-Disposition': this.contentDisposition(attachment.originalName),` thành `'Content-Disposition': contentDisposition(attachment.originalName),` và xoá cả phương thức riêng:

```ts
  private contentDisposition(fileName: string) {
    const fallback = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  }
```

`src/bao-cao-dong-gop/ten-tep.ts`:

```ts
import type { DinhDangBaoCao, LoaiBaoCao } from './kieu-bao-cao';

export const MIME_BAO_CAO: Record<DinhDangBaoCao, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Tên dự án không dấu cho tên tệp: bỏ dấu (Đ/đ không tách dấu được nên đổi
 * tay), mọi thứ không phải chữ số Latin thành một dấu gạch, cắt còn `toiDa` ký
 * tự. Không còn gì thì `du-an` — tên tệp rỗng làm hệ điều hành đặt tên lạ.
 */
export function tenKhongDau(ten: string, toiDa = 60): string {
  const gon = ten
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return gon.slice(0, toiDa).replace(/-+$/, '') || 'du-an';
}

/** `Bao-cao-dong-gop_<ten-du-an>_<YYYY-MM-DD>[_ca-nhan].pdf|xlsx` — `ngay` là ngày xuất theo giờ VN. */
export function tenTepBaoCao(p: {
  tenDuAn: string;
  dinhDang: DinhDangBaoCao;
  loai: LoaiBaoCao;
  ngay: string;
}): string {
  const caNhan = p.loai === 'CA_NHAN' ? '_ca-nhan' : '';
  return `Bao-cao-dong-gop_${tenKhongDau(p.tenDuAn)}_${p.ngay}${caNhan}.${p.dinhDang}`;
}
```

- [ ] **Step 3: Chạy lại, kể cả bài cũ của tải tệp chat**

Run: `npx jest src/common/content-disposition.spec.ts src/bao-cao-dong-gop/ten-tep.spec.ts src/chat && npx eslint src/common src/chat src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (mọi bộ của `src/chat` vẫn xanh, trong đó có `tai-tep-cac-duong.spec.ts`); eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/common/content-disposition.ts src/common/content-disposition.spec.ts src/chat/chat-attachments.controller.ts src/bao-cao-dong-gop/ten-tep.ts src/bao-cao-dong-gop/ten-tep.spec.ts
git commit -m "feat(bao-cao): ten tep khong dau va header Content-Disposition dung chung" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R6: Vẽ Excel — sheet "Tổng hợp" và "Chi tiết việc"

**Files:**
- Create: `src/bao-cao-dong-gop/ve-excel.ts`
- Test: `src/bao-cao-dong-gop/ve-excel.spec.ts`

**Interfaces:**
- Consumes: `BaoCaoDongGop`, `NgonNguBaoCao` (R3); `CHU_BAO_CAO`, `dongThongTin`, `nhanKetQuaNgan`, `soNgayTre`, `tenCoGhiChu` (R3); `LECH_VN_MS`.
- Produces:
  - `export function lucExcel(luc: Date | null): Date | null`
  - `export async function veBaoCaoExcel(bc: BaoCaoDongGop, lang: NgonNguBaoCao): Promise<Buffer>`

- [ ] **Step 1: Viết bài kiểm thất bại (tạo tệp rồi đọc lại bằng exceljs)**

`src/bao-cao-dong-gop/ve-excel.spec.ts`:

```ts
import { Workbook, type Row, type Worksheet } from 'exceljs';
import type { BaoCaoDongGop } from './kieu-bao-cao';
import { veBaoCaoExcel } from './ve-excel';

function baoCaoMau(ghiDe: Partial<BaoCaoDongGop> = {}): BaoCaoDongGop {
  return {
    loai: 'NHOM',
    tenDuAn: 'EXE201',
    tenWorkspace: 'FPT HCM',
    tenLeader: ['Lê Hữu Đại'],
    soThanhVien: 2,
    khoang: { tu: '2026-09-01', den: '2026-10-02' },
    xuatLuc: new Date('2026-10-02T03:05:00Z'),
    nguoiXuat: 'Lê Hữu Đại',
    thanhVien: [
      {
        tongHop: {
          userId: 'u-dai',
          ten: 'Lê Hữu Đại',
          vaiTro: 'LEADER',
          duocGiao: 3,
          hoanThanh: 2,
          dungHan: 1,
          treHan: 1,
          chuaXong: 1,
          quaHanChuaXong: 1,
          daNop: 4,
          tyLeDungHanPhanTram: 50,
        },
        viec: [
          {
            id: 't-1',
            // Chuỗi bắt đầu bằng "=" phải ở dạng chữ, không thành công thức.
            tieuDe: '=HYPERLINK("http://x")',
            hanChot: new Date('2026-09-30T16:59:00Z'),
            ngayNop: new Date('2026-10-01T03:00:00Z'),
            ngayHoanThanh: new Date('2026-10-01T05:00:00Z'),
            ketQua: { loai: 'TRE_HAN', soNgay: 1 },
            soTepDaNop: 2,
          },
          {
            id: 't-2',
            tieuDe: 'Viết báo cáo',
            hanChot: null,
            ngayNop: null,
            ngayHoanThanh: null,
            ketQua: { loai: 'CHUA_XONG' },
            soTepDaNop: 0,
          },
        ],
      },
      {
        tongHop: {
          userId: 'u-an',
          ten: 'Nguyễn An',
          vaiTro: 'MEMBER',
          duocGiao: 0,
          hoanThanh: 0,
          dungHan: 0,
          treHan: 0,
          chuaXong: 0,
          quaHanChuaXong: 0,
          daNop: 0,
          tyLeDungHanPhanTram: null,
        },
        viec: [],
      },
    ],
    nguoiKy: [
      { ten: 'Lê Hữu Đại', vaiTro: 'LEADER' },
      { ten: 'Nguyễn An', vaiTro: 'MEMBER' },
    ],
    tongSoViec: 2,
    ...ghiDe,
  };
}

async function docLai(tep: Buffer): Promise<Workbook> {
  const wb = new Workbook();
  // Kiểu của exceljs khai `load` nhận ArrayBuffer; Buffer của Node chạy được (tài liệu exceljs dùng đúng cách này).
  await wb.xlsx.load(tep as unknown as Parameters<Workbook['xlsx']['load']>[0]);
  return wb;
}

/** Số hàng có ô A đúng bằng `oDau`; 0 nếu không có. */
function hangCo(ws: Worksheet, oDau: string): number {
  let so = 0;
  ws.eachRow((row, i) => {
    if (so === 0 && row.getCell(1).value === oDau) so = i;
  });
  return so;
}

const giaTri = (row: Row, den: number) =>
  Array.from({ length: den }, (_, i) => row.getCell(i + 1).value);

describe('veBaoCaoExcel', () => {
  it('hai sheet, tên theo ngôn ngữ', async () => {
    const vi = await docLai(await veBaoCaoExcel(baoCaoMau(), 'vi'));
    expect(vi.worksheets.map((ws) => ws.name)).toEqual(['Tổng hợp', 'Chi tiết việc']);
    const en = await docLai(await veBaoCaoExcel(baoCaoMau(), 'en'));
    expect(en.worksheets.map((ws) => ws.name)).toEqual(['Summary', 'Tasks']);
  });

  it('Tổng hợp: phần đầu, số là số, tỷ lệ dạng 0.0"%", ô trống khi chưa đo được, có bộ lọc và cố định dòng tiêu đề', async () => {
    const wb = await docLai(await veBaoCaoExcel(baoCaoMau(), 'vi'));
    const ws = wb.getWorksheet('Tổng hợp')!;

    expect(ws.getRow(1).getCell(1).value).toBe('Báo cáo đóng góp');
    expect(ws.getRow(hangCo(ws, 'Số thành viên')).getCell(2).value).toBe('2');
    expect(hangCo(ws, 'Số liệu do WeDo tự tính từ dữ liệu công việc. Đúng hạn: nộp hoặc hoàn thành trước hạn chót.')).toBeGreaterThan(0);

    const r = hangCo(ws, 'Thành viên');
    expect(r).toBeGreaterThan(1);
    expect(ws.getRow(r).getCell(1).font?.bold).toBe(true);
    expect(giaTri(ws.getRow(r + 1), 9)).toEqual(['Lê Hữu Đại', 3, 2, 1, 1, 1, 1, 4, 50]);
    expect(ws.getRow(r + 1).getCell(9).numFmt).toBe('0.0"%"');
    expect(ws.getRow(r + 2).getCell(1).value).toBe('Nguyễn An');
    expect(ws.getRow(r + 2).getCell(9).value).toBeNull();
    expect(ws.autoFilter).toBeTruthy();
    expect(ws.views[0]).toMatchObject({ state: 'frozen', ySplit: r });
  });

  it('Chi tiết việc: mỗi việc một dòng có cột Thành viên, ngày là ngày giờ Excel theo giờ VN, "Trễ N ngày" tách hai cột', async () => {
    const wb = await docLai(await veBaoCaoExcel(baoCaoMau(), 'vi'));
    const ws = wb.getWorksheet('Chi tiết việc')!;

    expect(giaTri(ws.getRow(1), 8)).toEqual([
      'Thành viên',
      'Tên việc',
      'Hạn chót',
      'Ngày nộp',
      'Ngày hoàn thành',
      'Kết quả',
      'Số ngày trễ',
      'Số tệp đã nộp',
    ]);
    expect(ws.getRow(1).getCell(1).font?.bold).toBe(true);

    const dong = ws.getRow(2);
    expect(dong.getCell(1).value).toBe('Lê Hữu Đại');
    expect(dong.getCell(2).value).toBe('=HYPERLINK("http://x")');
    const han = dong.getCell(3).value;
    expect(han).toBeInstanceOf(Date);
    // Hạn 16:59 UTC = 23:59 giờ VN: ô Excel hiện đúng 23:59 (Excel không có múi giờ).
    expect((han as Date).toISOString()).toBe('2026-09-30T23:59:00.000Z');
    expect(dong.getCell(3).numFmt).toBe('dd/mm/yyyy hh:mm');
    expect((dong.getCell(4).value as Date).toISOString()).toBe('2026-10-01T10:00:00.000Z');
    expect(dong.getCell(6).value).toBe('Trễ hạn');
    expect(dong.getCell(7).value).toBe(1);
    expect(dong.getCell(8).value).toBe(2);

    const dong3 = ws.getRow(3);
    expect(dong3.getCell(3).value).toBeNull();
    expect(dong3.getCell(6).value).toBe('Chưa xong');
    expect(dong3.getCell(7).value).toBeNull();
    expect(ws.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
  });

  it('báo cáo cá nhân: một dòng, không có "Số thành viên", có câu "chưa được giao việc"', async () => {
    const mau = baoCaoMau();
    const bc = baoCaoMau({
      loai: 'CA_NHAN',
      soThanhVien: null,
      thanhVien: [mau.thanhVien[1]],
      nguoiKy: [],
      tongSoViec: 0,
    });
    const ws = (await docLai(await veBaoCaoExcel(bc, 'vi'))).getWorksheet('Tổng hợp')!;

    expect(ws.getRow(1).getCell(1).value).toBe('Báo cáo đóng góp cá nhân');
    expect(hangCo(ws, 'Số thành viên')).toBe(0);
    expect(hangCo(ws, 'Bạn chưa được giao việc nào trong dự án này.')).toBeGreaterThan(0);
    const r = hangCo(ws, 'Thành viên');
    expect(ws.getRow(r + 1).getCell(1).value).toBe('Nguyễn An');
    expect(ws.getRow(r + 2).getCell(1).value).toBeNull();
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/ve-excel.spec.ts`
Expected: FAIL — "Cannot find module './ve-excel'".

- [ ] **Step 2: Viết mã**

`src/bao-cao-dong-gop/ve-excel.ts`:

```ts
import { Workbook, type Worksheet } from 'exceljs';
import { LECH_VN_MS } from '../common/ngay-vn';
import {
  CHU_BAO_CAO,
  dongThongTin,
  nhanKetQuaNgan,
  soNgayTre,
  tenCoGhiChu,
} from './chu-bao-cao';
import type { BaoCaoDongGop, NgonNguBaoCao } from './kieu-bao-cao';

const DINH_DANG_LUC = 'dd/mm/yyyy hh:mm';
/** Lưu SỐ (66.7) để giảng viên cộng trừ được; dấu % chỉ là cách hiện. */
const DINH_DANG_TY_LE = '0.0"%"';

/**
 * Ô ngày giờ của Excel không có múi giờ: nó hiện đúng con số được ghi. exceljs
 * ghi phần UTC của `Date`, nên cộng sẵn 7 tiếng để ô hiện đúng giờ Việt Nam,
 * và giảng viên lọc/sắp xếp theo đúng ngày người Việt Nam thấy.
 */
export function lucExcel(luc: Date | null): Date | null {
  return luc ? new Date(luc.getTime() + LECH_VN_MS) : null;
}

function veSheetTongHop(
  ws: Worksheet,
  bc: BaoCaoDongGop,
  lang: NgonNguBaoCao,
): void {
  const chu = CHU_BAO_CAO[lang];
  ws.addRow([bc.loai === 'NHOM' ? chu.tieuDeNhom : chu.tieuDeCaNhan]).font = {
    bold: true,
    size: 14,
  };
  for (const [nhan, giaTri] of dongThongTin(bc, lang)) ws.addRow([nhan, giaTri]);
  ws.addRow([chu.ghiChu]);
  if (bc.tongSoViec === 0) {
    ws.addRow([bc.loai === 'NHOM' ? chu.khongCoViec : chu.caNhanKhongCoViec]);
  }
  ws.addRow([]);

  const c = chu.cot;
  const tieuDe = ws.addRow([
    c.thanhVien,
    c.duocGiao,
    c.hoanThanh,
    c.dungHan,
    c.treHan,
    c.chuaXong,
    c.quaHan,
    c.daNop,
    c.tyLe,
  ]);
  tieuDe.font = { bold: true };
  for (const { tongHop: d } of bc.thanhVien) {
    const hang = ws.addRow([
      tenCoGhiChu(d, lang),
      d.duocGiao,
      d.hoanThanh,
      d.dungHan,
      d.treHan,
      d.chuaXong,
      d.quaHanChuaXong,
      d.daNop,
      d.tyLeDungHanPhanTram,
    ]);
    hang.getCell(9).numFmt = DINH_DANG_TY_LE;
  }

  ws.autoFilter = {
    from: { row: tieuDe.number, column: 1 },
    to: { row: tieuDe.number + bc.thanhVien.length, column: 9 },
  };
  ws.views = [{ state: 'frozen', ySplit: tieuDe.number }];
  ws.getColumn(1).width = 32;
  for (let cot = 2; cot <= 9; cot += 1) ws.getColumn(cot).width = 15;
}

function veSheetViec(
  ws: Worksheet,
  bc: BaoCaoDongGop,
  lang: NgonNguBaoCao,
): void {
  const c = CHU_BAO_CAO[lang].cot;
  ws.columns = [
    { header: c.thanhVien, width: 28 },
    // Tên việc để nguyên, không cắt (spec mục 7): Excel tự cuộn trong ô khi cần.
    { header: c.tenViec, width: 48 },
    { header: c.hanChot, width: 18 },
    { header: c.ngayNop, width: 18 },
    { header: c.ngayHoanThanh, width: 18 },
    { header: c.ketQua, width: 24 },
    { header: c.soNgayTre, width: 12 },
    { header: c.soTep, width: 14 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const muc of bc.thanhVien) {
    for (const v of muc.viec) {
      const hang = ws.addRow([
        tenCoGhiChu(muc.tongHop, lang),
        v.tieuDe,
        lucExcel(v.hanChot),
        lucExcel(v.ngayNop),
        lucExcel(v.ngayHoanThanh),
        nhanKetQuaNgan(v.ketQua, lang),
        soNgayTre(v.ketQua),
        v.soTepDaNop,
      ]);
      for (const cot of [3, 4, 5]) hang.getCell(cot).numFmt = DINH_DANG_LUC;
    }
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, ws.rowCount), column: 8 },
  };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Tệp Excel của báo cáo. Hai sheet đọc cùng một `BaoCaoDongGop` với PDF, nên
 * hai định dạng của cùng một lần xuất luôn cùng số. Chuỗi được ghi dạng chữ
 * (exceljs không tự biến "=..." thành công thức), nên tên việc kiểu
 * `=HYPERLINK(...)` không chạy được khi giảng viên mở tệp.
 */
export async function veBaoCaoExcel(
  bc: BaoCaoDongGop,
  lang: NgonNguBaoCao,
): Promise<Buffer> {
  const chu = CHU_BAO_CAO[lang];
  const wb = new Workbook();
  wb.creator = 'WeDo';
  wb.created = bc.xuatLuc;
  veSheetTongHop(wb.addWorksheet(chu.sheetTongHop), bc, lang);
  veSheetViec(wb.addWorksheet(chu.sheetViec), bc, lang);
  return Buffer.from(await wb.xlsx.writeBuffer());
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/bao-cao-dong-gop/ve-excel.spec.ts && npx eslint src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (4 bài); eslint sạch. Nếu bài "cố định dòng tiêu đề" hỏng vì exceljs đọc lại `views` khác dạng (ví dụ thiếu `state`): in `console.log(ws.views)` một lần, chỉ sửa phần kỳ vọng sang đúng khoá exceljs trả về (`ySplit` phải đúng số hàng tiêu đề), không bỏ bài kiểm.

- [ ] **Step 4: Commit**

```bash
git add src/bao-cao-dong-gop/ve-excel.ts src/bao-cao-dong-gop/ve-excel.spec.ts
git commit -m "feat(bao-cao): ve Excel hai sheet Tong hop va Chi tiet viec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R7: Vẽ PDF — A4, bảng lặp tiêu đề cột, khung xác nhận, số trang

**Files:**
- Create: `src/bao-cao-dong-gop/ve-pdf.ts`
- Test: `src/bao-cao-dong-gop/ve-pdf.spec.ts`

**Interfaces:**
- Consumes: `thuMucPhongChu`, `TEP_PHONG` (R1); `CHU_BAO_CAO`, `chuPdf`, `dinhDangLuc`, `dinhDangTyLe`, `dongThongTin`, `nhanKetQua`, `tenCoGhiChu` (R3); `BaoCaoDongGop`, `DongTongHop`, `NgonNguBaoCao` (R3).
- Produces: `export function veBaoCaoPdf(bc: BaoCaoDongGop, lang: NgonNguBaoCao): Promise<Buffer>`

Cách kiểm (đã chốt): phông nhúng dạng tập con lưu glyph theo mã số, nên kể cả với `compress: false` cũng không tìm được "Lê Hữu Đại" trong byte của tệp. Bài kiểm nghe mọi lượt `PDFDocument.prototype.text(...)` (pdfkit gắn `text` lên prototype bằng `Object.assign`, đo chữ dùng `_text` nên không đếm trùng) để kiểm chữ, và đếm đối tượng `/Type /Page` (không bao giờ bị nén) để kiểm số trang.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/bao-cao-dong-gop/ve-pdf.spec.ts`:

```ts
import PDFDocument from 'pdfkit';
import type {
  BaoCaoDongGop,
  MucThanhVien,
  ViecTrongBaoCao,
} from './kieu-bao-cao';
import { veBaoCaoPdf } from './ve-pdf';

const nguyenMau = (PDFDocument as unknown as { prototype: PDFKit.PDFDocument })
  .prototype;
const viet = jest.spyOn(nguyenMau, 'text');

afterEach(() => viet.mockClear());
afterAll(() => viet.mockRestore());

/** Mọi chuỗi đã được vẽ lên các trang, theo thứ tự vẽ. */
const chuDaViet = () => viet.mock.calls.map((goi) => String(goi[0]));
const soTrang = (tep: Buffer) =>
  (tep.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;

function viecMau(so: number): ViecTrongBaoCao {
  return {
    id: `t-${so}`,
    tieuDe: `Việc số ${so}: chuẩn bị tài liệu thuyết trình cuối kỳ`,
    hanChot: new Date('2026-09-20T16:59:00Z'),
    ngayNop: new Date('2026-09-20T10:00:00Z'),
    ngayHoanThanh: new Date('2026-09-21T03:00:00Z'),
    ketQua: { loai: 'DUNG_HAN' },
    soTepDaNop: 1,
  };
}

function mucMau(ten: string, userId: string, viec: ViecTrongBaoCao[]): MucThanhVien {
  return {
    tongHop: {
      userId,
      ten,
      vaiTro: 'MEMBER',
      duocGiao: viec.length,
      hoanThanh: viec.length,
      dungHan: viec.length,
      treHan: 0,
      chuaXong: 0,
      quaHanChuaXong: 0,
      daNop: viec.length,
      tyLeDungHanPhanTram: viec.length ? 100 : null,
    },
    viec,
  };
}

function baoCaoMau(ghiDe: Partial<BaoCaoDongGop> = {}): BaoCaoDongGop {
  return {
    loai: 'NHOM',
    tenDuAn: 'EXE201 — Nhóm 5',
    tenWorkspace: 'FPT HCM',
    tenLeader: ['Lê Hữu Đại'],
    soThanhVien: 2,
    khoang: { tu: '2026-09-01', den: '2026-10-02' },
    xuatLuc: new Date('2026-10-02T03:05:00Z'),
    nguoiXuat: 'Lê Hữu Đại',
    thanhVien: [
      mucMau('Lê Hữu Đại', 'u-dai', [viecMau(1)]),
      mucMau('Trần Thu Hà', 'u-ha', [viecMau(2), viecMau(3)]),
    ],
    nguoiKy: [
      { ten: 'Lê Hữu Đại', vaiTro: 'LEADER' },
      { ten: 'Trần Thu Hà', vaiTro: 'MEMBER' },
    ],
    tongSoViec: 3,
    ...ghiDe,
  };
}

describe('veBaoCaoPdf', () => {
  it('là tệp PDF có tiêu đề, tên từng thành viên, khung xác nhận và số trang', async () => {
    const tep = await veBaoCaoPdf(baoCaoMau(), 'vi');

    expect(tep.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(soTrang(tep)).toBe(2);
    expect(chuDaViet()).toEqual(
      expect.arrayContaining([
        'Báo cáo đóng góp',
        'Lê Hữu Đại',
        'Trần Thu Hà',
        'Xác nhận của nhóm',
        'Chữ ký',
        'Trang 1/2',
        'Trang 2/2',
        'Xuất từ WeDo — wedofpt.com.vn',
      ]),
    );
  });

  it('bảng dài sang trang và lặp lại dòng tiêu đề cột ở mỗi trang', async () => {
    const viec = Array.from({ length: 150 }, (_, i) => viecMau(i + 1));
    const tep = await veBaoCaoPdf(
      baoCaoMau({
        loai: 'CA_NHAN',
        soThanhVien: null,
        nguoiKy: [],
        thanhVien: [mucMau('Trần Thu Hà', 'u-ha', viec)],
        tongSoViec: 150,
      }),
      'vi',
    );

    const n = soTrang(tep);
    expect(n).toBeGreaterThanOrEqual(4);
    // Trang 1 là bảng tổng hợp; mỗi trang sau đều mở đầu bằng dòng tiêu đề của bảng việc.
    expect(chuDaViet().filter((chu) => chu === 'Tên việc')).toHaveLength(n - 1);
    expect(chuDaViet()).toContain(`Trang ${n}/${n}`);
    expect(chuDaViet()).toContain('Báo cáo đóng góp cá nhân');
    expect(chuDaViet()).not.toContain('Xác nhận của nhóm');
  });

  it('tên việc có emoji không làm hỏng tệp, ký tự lạ thành "?"', async () => {
    const v = { ...viecMau(1), tieuDe: 'Thiết kế poster 🚀' };
    const tep = await veBaoCaoPdf(
      baoCaoMau({ thanhVien: [mucMau('Lê Hữu Đại', 'u-dai', [v])] }),
      'vi',
    );
    expect(tep.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(chuDaViet()).toContain('Thiết kế poster ?');
  });

  it('không có việc nào trong kỳ vẫn xuất được, có câu báo', async () => {
    const tep = await veBaoCaoPdf(
      baoCaoMau({ thanhVien: [mucMau('Lê Hữu Đại', 'u-dai', [])], tongSoViec: 0 }),
      'vi',
    );
    expect(tep.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(chuDaViet()).toEqual(
      expect.arrayContaining([
        'Chưa có công việc trong khoảng thời gian này.',
        'Chưa được giao việc nào trong khoảng thời gian này.',
      ]),
    );
  });

  it('tiếng Anh: tiêu đề, khung xác nhận và chân trang', async () => {
    await veBaoCaoPdf(baoCaoMau(), 'en');
    expect(chuDaViet()).toEqual(
      expect.arrayContaining(['Contribution report', 'Team confirmation', 'Page 1 of 2']),
    );
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/ve-pdf.spec.ts`
Expected: FAIL — "Cannot find module './ve-pdf'".

- [ ] **Step 2: Viết mã**

`src/bao-cao-dong-gop/ve-pdf.ts`:

```ts
import PDFDocument from 'pdfkit';
import { join } from 'path';
import {
  CHU_BAO_CAO,
  chuPdf,
  dinhDangLuc,
  dinhDangTyLe,
  dongThongTin,
  nhanKetQua,
  tenCoGhiChu,
} from './chu-bao-cao';
import type {
  BaoCaoDongGop,
  DongTongHop,
  NgonNguBaoCao,
} from './kieu-bao-cao';
import { TEP_PHONG, thuMucPhongChu } from './phong-chu';

type Pdf = PDFKit.PDFDocument;

/** Lề 40pt bốn phía; nội dung rộng 595,28 − 2 × 40 = 515,28pt. */
const LE = 40;
const DEM = 4;
const CO_BANG = 8.5;
const MAU_CHU = '#111827';
const MAU_PHU = '#4b5563';
const MAU_VIEN = '#d0d5dd';
const MAU_NEN_TIEU_DE = '#eef2f7';
const PHONG_THUONG = 'BeVietnamPro';
const PHONG_DAM = 'BeVietnamPro-SemiBold';
/** Tên việc dài quá thì cắt ở PDF (Excel giữ nguyên): một ô không được cao hơn một trang. */
const TOI_DA_TEN_VIEC = 500;
/** Ô ký đủ cao để ký tay. */
const CAO_O_KY = 30;

interface Cot {
  tieu: string;
  rong: number;
  canh?: 'left' | 'right' | 'center';
}

const rongNoiDung = (doc: Pdf) => doc.page.width - LE * 2;
const dayNoiDung = (doc: Pdf) => doc.page.height - doc.page.margins.bottom;
const tongRong = (cot: Cot[]) => cot.reduce((tong, c) => tong + c.rong, 0);

function catTenViec(ten: string): string {
  return ten.length > TOI_DA_TEN_VIEC ? `${ten.slice(0, TOI_DA_TEN_VIEC)}…` : ten;
}

function vietDong(
  doc: Pdf,
  chu: string,
  kieu: { dam?: boolean; co?: number; mau?: string } = {},
): void {
  doc
    .font(kieu.dam ? PHONG_DAM : PHONG_THUONG)
    .fontSize(kieu.co ?? 10)
    .fillColor(kieu.mau ?? MAU_CHU);
  doc.text(chuPdf(chu), LE, doc.y, { width: rongNoiDung(doc) });
}

function caoHang(
  doc: Pdf,
  cot: Cot[],
  o: string[],
  dam: boolean,
  toiThieu: number,
): number {
  doc.font(dam ? PHONG_DAM : PHONG_THUONG).fontSize(CO_BANG);
  const caoChu = Math.max(
    ...cot.map((c, i) =>
      doc.heightOfString(o[i] || ' ', { width: c.rong - DEM * 2 }),
    ),
  );
  return Math.max(caoChu + DEM * 2, toiThieu);
}

function veHang(
  doc: Pdf,
  cot: Cot[],
  o: string[],
  kieu: { dam?: boolean; nen?: string; toiThieu?: number } = {},
): void {
  const dam = Boolean(kieu.dam);
  const cao = caoHang(doc, cot, o, dam, kieu.toiThieu ?? 0);
  const y = doc.y;
  if (kieu.nen) doc.rect(LE, y, tongRong(cot), cao).fill(kieu.nen);
  doc.font(dam ? PHONG_DAM : PHONG_THUONG).fontSize(CO_BANG).fillColor(MAU_CHU);
  let x = LE;
  cot.forEach((c, i) => {
    const chu = o[i] ?? '';
    if (chu) {
      doc.text(chu, x + DEM, y + DEM, {
        width: c.rong - DEM * 2,
        align: c.canh ?? 'left',
      });
    }
    x += c.rong;
  });
  doc
    .moveTo(LE, y + cao)
    .lineTo(LE + tongRong(cot), y + cao)
    .lineWidth(0.5)
    .strokeColor(MAU_VIEN)
    .stroke();
  doc.x = LE;
  doc.y = y + cao;
}

/**
 * Bảng có dòng tiêu đề cột. Hàng kế tiếp không vừa trang thì sang trang mới
 * và vẽ lại dòng tiêu đề, để trang nào in ra cũng đọc được cột nào là gì.
 * Ô trong `hang` phải đã qua `chuPdf`.
 */
function veBang(doc: Pdf, cot: Cot[], hang: string[][], toiThieu = 0): void {
  const tieuDe = cot.map((c) => c.tieu);
  const veTieuDe = () =>
    veHang(doc, cot, tieuDe, { dam: true, nen: MAU_NEN_TIEU_DE });
  const hangDau = hang[0] ?? tieuDe;
  if (
    doc.y +
      caoHang(doc, cot, tieuDe, true, 0) +
      caoHang(doc, cot, hangDau, false, toiThieu) >
    dayNoiDung(doc)
  ) {
    doc.addPage();
  }
  veTieuDe();
  for (const o of hang) {
    if (doc.y + caoHang(doc, cot, o, false, toiThieu) > dayNoiDung(doc)) {
      doc.addPage();
      veTieuDe();
    }
    veHang(doc, cot, o, { toiThieu });
  }
}

function veDau(doc: Pdf, bc: BaoCaoDongGop, lang: NgonNguBaoCao): void {
  const chu = CHU_BAO_CAO[lang];
  vietDong(doc, bc.loai === 'NHOM' ? chu.tieuDeNhom : chu.tieuDeCaNhan, {
    dam: true,
    co: 18,
  });
  doc.moveDown(0.4);
  for (const [nhan, giaTri] of dongThongTin(bc, lang)) {
    vietDong(doc, `${nhan}: ${giaTri}`);
  }
  doc.moveDown(0.3);
  vietDong(doc, chu.ghiChu, { co: 8.5, mau: MAU_PHU });
  doc.moveDown(1);
}

/** 131,28 + 46 × 6 + 50 + 58 = 515,28. */
function cotTongHop(lang: NgonNguBaoCao): Cot[] {
  const c = CHU_BAO_CAO[lang].cot;
  return [
    { tieu: c.thanhVien, rong: 131.28 },
    { tieu: c.duocGiao, rong: 46, canh: 'right' },
    { tieu: c.hoanThanh, rong: 50, canh: 'right' },
    { tieu: c.dungHan, rong: 46, canh: 'right' },
    { tieu: c.treHan, rong: 46, canh: 'right' },
    { tieu: c.chuaXong, rong: 46, canh: 'right' },
    { tieu: c.quaHan, rong: 46, canh: 'right' },
    { tieu: c.daNop, rong: 46, canh: 'right' },
    { tieu: c.tyLe, rong: 58, canh: 'right' },
  ];
}

/** 165,28 + 70 × 3 + 90 + 50 = 515,28. */
function cotViec(lang: NgonNguBaoCao): Cot[] {
  const c = CHU_BAO_CAO[lang].cot;
  return [
    { tieu: c.tenViec, rong: 165.28 },
    { tieu: c.hanChot, rong: 70 },
    { tieu: c.ngayNop, rong: 70 },
    { tieu: c.ngayHoanThanh, rong: 70 },
    { tieu: c.ketQua, rong: 90 },
    { tieu: c.soTep, rong: 50, canh: 'right' },
  ];
}

function soLieu(d: DongTongHop, lang: NgonNguBaoCao): string[] {
  return [
    String(d.duocGiao),
    String(d.hoanThanh),
    String(d.dungHan),
    String(d.treHan),
    String(d.chuaXong),
    String(d.quaHanChuaXong),
    String(d.daNop),
    dinhDangTyLe(d.tyLeDungHanPhanTram, lang),
  ];
}

function veTongHop(doc: Pdf, bc: BaoCaoDongGop, lang: NgonNguBaoCao): void {
  const chu = CHU_BAO_CAO[lang];
  vietDong(doc, chu.bangTongHop, { dam: true, co: 12 });
  doc.moveDown(0.3);
  veBang(
    doc,
    cotTongHop(lang),
    bc.thanhVien.map(({ tongHop }) => [
      chuPdf(tenCoGhiChu(tongHop, lang)),
      ...soLieu(tongHop, lang),
    ]),
  );
  if (bc.tongSoViec === 0) {
    doc.moveDown(0.5);
    vietDong(
      doc,
      bc.loai === 'NHOM' ? chu.khongCoViec : chu.caNhanKhongCoViec,
      { co: 9, mau: MAU_PHU },
    );
  }
}

function veTungNguoi(doc: Pdf, bc: BaoCaoDongGop, lang: NgonNguBaoCao): void {
  const chu = CHU_BAO_CAO[lang];
  doc.addPage();
  bc.thanhVien.forEach((muc, i) => {
    if (i > 0) doc.moveDown(1.2);
    // Tên người không đứng trơ trọi cuối trang, tách khỏi bảng của chính họ.
    if (doc.y > dayNoiDung(doc) - 90) doc.addPage();
    const d = muc.tongHop;
    vietDong(doc, tenCoGhiChu(d, lang), { dam: true, co: 12 });
    vietDong(doc, chu.tomTat(d, dinhDangTyLe(d.tyLeDungHanPhanTram, lang)), {
      co: 8.5,
      mau: MAU_PHU,
    });
    doc.moveDown(0.4);
    if (muc.viec.length === 0) {
      vietDong(
        doc,
        bc.loai === 'CA_NHAN' ? chu.caNhanKhongCoViec : chu.thanhVienKhongCoViec,
        { co: 9, mau: MAU_PHU },
      );
      return;
    }
    veBang(
      doc,
      cotViec(lang),
      muc.viec.map((v) => [
        chuPdf(catTenViec(v.tieuDe)),
        dinhDangLuc(v.hanChot, lang) || '—',
        dinhDangLuc(v.ngayNop, lang) || '—',
        dinhDangLuc(v.ngayHoanThanh, lang) || '—',
        nhanKetQua(v.ketQua, lang),
        String(v.soTepDaNop),
      ]),
    );
  });
}

/** Cuối báo cáo nhóm: Leader rồi từng thành viên, mỗi người một dòng họ tên, chữ ký, ngày. */
function veXacNhan(doc: Pdf, bc: BaoCaoDongGop, lang: NgonNguBaoCao): void {
  const chu = CHU_BAO_CAO[lang];
  doc.moveDown(1.5);
  if (doc.y > dayNoiDung(doc) - 150) doc.addPage();
  vietDong(doc, chu.xacNhan, { dam: true, co: 12 });
  vietDong(doc, chu.xacNhanMoTa, { co: 8.5, mau: MAU_PHU });
  doc.moveDown(0.4);
  const c = chu.cot;
  veBang(
    doc,
    [
      { tieu: c.hoTen, rong: 175.28 },
      { tieu: c.vaiTro, rong: 80 },
      { tieu: c.chuKy, rong: 160 },
      { tieu: c.ngay, rong: 100 },
    ],
    bc.nguoiKy.map((n) => [
      chuPdf(n.ten),
      n.vaiTro === 'LEADER' ? chu.vaiTroLeader : chu.vaiTroThanhVien,
      '',
      '',
    ]),
    CAO_O_KY,
  );
}

/**
 * Chân trang mọi trang: "Xuất từ WeDo — wedofpt.com.vn" và "Trang i/n".
 * Vẽ SAU cùng (bufferPages) vì phải biết tổng số trang. Chữ nằm trong lề
 * dưới, nên tạm đặt lề dưới về 0 — nếu không pdfkit tưởng tràn trang và tự
 * thêm trang trắng.
 */
function veChanTrang(doc: Pdf, lang: NgonNguBaoCao): void {
  const chu = CHU_BAO_CAO[lang];
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i += 1) {
    doc.switchToPage(i);
    const leDuoi = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - LE + 12;
    const nua = rongNoiDung(doc) / 2;
    doc.font(PHONG_THUONG).fontSize(7.5).fillColor(MAU_PHU);
    doc.text(chu.chanTrang, LE, y, { width: nua, lineBreak: false });
    doc.text(chu.trang(i - start + 1, count), LE + nua, y, {
      width: nua,
      align: 'right',
      lineBreak: false,
    });
    doc.page.margins.bottom = leDuoi;
  }
}

/**
 * Tệp PDF của báo cáo: A4 dọc, lề 40pt, Be Vietnam Pro nhúng trong tệp.
 * Trang 1: phần đầu + bảng tổng hợp. Từ trang 2: mỗi người một mục. Báo cáo
 * nhóm kết thúc bằng khung xác nhận để nộp có chữ ký.
 */
export function veBaoCaoPdf(
  bc: BaoCaoDongGop,
  lang: NgonNguBaoCao,
): Promise<Buffer> {
  const chu = CHU_BAO_CAO[lang];
  const thuMuc = thuMucPhongChu();
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: LE, bottom: LE, left: LE, right: LE },
    bufferPages: true,
    info: {
      Title: chuPdf(
        `${bc.loai === 'NHOM' ? chu.tieuDeNhom : chu.tieuDeCaNhan} — ${bc.tenDuAn}`,
      ),
      Author: 'WeDo',
      Creator: 'WeDo',
    },
  });
  doc.registerFont(PHONG_THUONG, join(thuMuc, TEP_PHONG.thuong));
  doc.registerFont(PHONG_DAM, join(thuMuc, TEP_PHONG.dam));

  const phan: Buffer[] = [];
  const xong = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (manh: Buffer) => phan.push(manh));
    doc.on('end', () => resolve(Buffer.concat(phan)));
    doc.on('error', reject);
  });

  veDau(doc, bc, lang);
  veTongHop(doc, bc, lang);
  veTungNguoi(doc, bc, lang);
  if (bc.loai === 'NHOM') veXacNhan(doc, bc, lang);
  veChanTrang(doc, lang);
  doc.end();
  return xong;
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/bao-cao-dong-gop/ve-pdf.spec.ts && npx eslint src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (5 bài, mỗi bài dưới 2 giây); eslint sạch. Nếu bài "là tệp PDF…" ra 3 trang thay vì 2: in `chuDaViet()` một lần để xem trang thừa từ đâu — thường là chân trang bị đẩy sang trang mới vì quên đặt `margins.bottom = 0`; sửa mã, không sửa kỳ vọng.

- [ ] **Step 4: Commit**

```bash
git add src/bao-cao-dong-gop/ve-pdf.ts src/bao-cao-dong-gop/ve-pdf.spec.ts
git commit -m "feat(bao-cao): ve PDF A4 co bang lap tieu de cot, khung xac nhan va so trang" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R8: Ai xuất được loại nào, và token tải có chữ ký

**Files:**
- Create: `src/projects/dieu-kien-xem-du-an.ts`
- Modify: `src/projects/projects.service.ts` (import đầu tệp; `projectAccessWhere` dòng 753-763)
- Create: `src/bao-cao-dong-gop/quyen-bao-cao.ts`
- Test: `src/bao-cao-dong-gop/quyen-bao-cao.spec.ts`
- Create: `src/bao-cao-dong-gop/token-tai.ts`
- Test: `src/bao-cao-dong-gop/token-tai.spec.ts`

**Interfaces:**
- Consumes: `JwtService` (`@nestjs/jwt`); `laNgayCoThat` (R2); `DinhDangBaoCao`, `NgonNguBaoCao`, `LoaiBaoCao` (R3).
- Produces:
  - `export function dieuKienXemDuAn(userId: string): { OR: [...] }` (đúng ba điều kiện của `projectAccessWhere` cũ)
  - `export interface VaiTroNguoiXem { laChuWorkspace: boolean; laAdminWorkspace: boolean; vaiTroTrongDuAn: 'LEADER' | 'MEMBER' | null }`
  - `export function loaiBaoCaoTheoVaiTro(v: VaiTroNguoiXem): LoaiBaoCao | null`
  - `export const MUC_DICH_TOKEN_BAO_CAO = 'contribution-report'`
  - `export const HAN_TOKEN_BAO_CAO_GIAY = 300`
  - `export interface NoiDungTokenBaoCao { userId: string; projectId: string; format: DinhDangBaoCao; from: string; to: string; lang: NgonNguBaoCao }`
  - `export function khoaKyBaoCao(jwtSecret: string): string`
  - `export function kyTokenBaoCao(jwt: JwtService, khoa: string, nd: NoiDungTokenBaoCao, hetHanLuc: Date): string`
  - `export function docTokenBaoCao(jwt: JwtService, khoa: string, token: string): (NoiDungTokenBaoCao & { exp: number }) | null`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/bao-cao-dong-gop/quyen-bao-cao.spec.ts`:

```ts
import { dieuKienXemDuAn } from '../projects/dieu-kien-xem-du-an';
import { loaiBaoCaoTheoVaiTro, type VaiTroNguoiXem } from './quyen-bao-cao';

const khong: VaiTroNguoiXem = {
  laChuWorkspace: false,
  laAdminWorkspace: false,
  vaiTroTrongDuAn: null,
};

describe('loaiBaoCaoTheoVaiTro', () => {
  it.each<[string, VaiTroNguoiXem, 'NHOM' | 'CA_NHAN' | null]>([
    ['Leader dự án', { ...khong, vaiTroTrongDuAn: 'LEADER' }, 'NHOM'],
    ['chủ workspace không ở trong dự án', { ...khong, laChuWorkspace: true }, 'NHOM'],
    // Bảng đóng góp vốn đã cho ADMIN workspace xem mọi việc trong workspace.
    ['admin workspace không phải Leader', { ...khong, laAdminWorkspace: true }, 'NHOM'],
    [
      'admin workspace kiêm thành viên thường',
      { ...khong, laAdminWorkspace: true, vaiTroTrongDuAn: 'MEMBER' },
      'NHOM',
    ],
    ['thành viên thường', { ...khong, vaiTroTrongDuAn: 'MEMBER' }, 'CA_NHAN'],
    ['người ngoài', khong, null],
  ])('%s', (_ten, vaiTro, mong) => {
    expect(loaiBaoCaoTheoVaiTro(vaiTro)).toBe(mong);
  });
});

describe('dieuKienXemDuAn', () => {
  it('thành viên dự án, chủ workspace hoặc ADMIN workspace — đúng quy tắc mọi API dự án đang dùng', () => {
    expect(dieuKienXemDuAn('u-1')).toEqual({
      OR: [
        { members: { some: { userId: 'u-1' } } },
        { workspace: { ownerId: 'u-1' } },
        { workspace: { members: { some: { userId: 'u-1', role: 'ADMIN' } } } },
      ],
    });
  });
});
```

`src/bao-cao-dong-gop/token-tai.spec.ts`:

```ts
import { JwtService } from '@nestjs/jwt';
import {
  docTokenBaoCao,
  HAN_TOKEN_BAO_CAO_GIAY,
  khoaKyBaoCao,
  kyTokenBaoCao,
  MUC_DICH_TOKEN_BAO_CAO,
  type NoiDungTokenBaoCao,
} from './token-tai';

const BI_MAT = 'bi-mat-dang-nhap-kiem-thu';
const khoa = khoaKyBaoCao(BI_MAT);
const jwt = new JwtService({});
const ND: NoiDungTokenBaoCao = {
  userId: 'u-1',
  projectId: 'p-1',
  format: 'pdf',
  from: '2026-09-01',
  to: '2026-10-02',
  lang: 'vi',
};
const sauNamPhut = () => new Date(Date.now() + HAN_TOKEN_BAO_CAO_GIAY * 1000);

describe('khoaKyBaoCao', () => {
  it('ổn định, khác JWT_SECRET, đổi theo JWT_SECRET', () => {
    expect(khoaKyBaoCao(BI_MAT)).toBe(khoa);
    expect(khoa).not.toBe(BI_MAT);
    expect(khoaKyBaoCao('bi-mat-khac')).not.toBe(khoa);
  });
});

describe('kyTokenBaoCao / docTokenBaoCao', () => {
  it('token đúng đọc lại đủ nội dung và hạn', () => {
    const het = sauNamPhut();
    expect(docTokenBaoCao(jwt, khoa, kyTokenBaoCao(jwt, khoa, ND, het))).toEqual({
      ...ND,
      exp: Math.floor(het.getTime() / 1000),
    });
  });

  it('hết hạn thì không dùng được', () => {
    const token = kyTokenBaoCao(jwt, khoa, ND, new Date(Date.now() - 1000));
    expect(docTokenBaoCao(jwt, khoa, token)).toBeNull();
  });

  it('sửa nội dung (đổi dự án) mà giữ chữ ký cũ thì không dùng được', () => {
    const [dau, than, ky] = kyTokenBaoCao(jwt, khoa, ND, sauNamPhut()).split('.');
    const nd = JSON.parse(Buffer.from(than, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    const thanSua = Buffer.from(JSON.stringify({ ...nd, projectId: 'p-khac' })).toString(
      'base64url',
    );
    expect(docTokenBaoCao(jwt, khoa, `${dau}.${thanSua}.${ky}`)).toBeNull();
  });

  it('ký đúng khoá nhưng sai mục đích thì không dùng được', () => {
    const token = jwt.sign({ ...ND, purpose: 'login' }, { secret: khoa, expiresIn: 300 });
    expect(docTokenBaoCao(jwt, khoa, token)).toBeNull();
  });

  it('access token đăng nhập (ký bằng JWT_SECRET) không thành link tải được', () => {
    const token = new JwtService({ secret: BI_MAT }).sign({
      sub: 'u-1',
      email: 'u-1@wedo.vn',
      ...ND,
      purpose: MUC_DICH_TOKEN_BAO_CAO,
    });
    expect(docTokenBaoCao(jwt, khoa, token)).toBeNull();
  });

  it('sai kiểu trường, chuỗi rỗng hay không phải JWT thì không dùng được', () => {
    const token = jwt.sign(
      { ...ND, format: 'docx', purpose: MUC_DICH_TOKEN_BAO_CAO },
      { secret: khoa, expiresIn: 300 },
    );
    expect(docTokenBaoCao(jwt, khoa, token)).toBeNull();
    expect(docTokenBaoCao(jwt, khoa, '')).toBeNull();
    expect(docTokenBaoCao(jwt, khoa, 'khong-phai-jwt')).toBeNull();
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/quyen-bao-cao.spec.ts src/bao-cao-dong-gop/token-tai.spec.ts`
Expected: FAIL — các lỗi "Cannot find module".

- [ ] **Step 2: Tách điều kiện "thấy được dự án"**

`src/projects/dieu-kien-xem-du-an.ts`:

```ts
/**
 * Ai thấy được một dự án: thành viên dự án, chủ workspace, hoặc ADMIN của
 * workspace. Mọi API dự án dùng đúng điều kiện này (người không thấy thì 404);
 * báo cáo đóng góp dùng lại để không chép quy tắc ra chỗ thứ hai.
 */
export function dieuKienXemDuAn(userId: string) {
  return {
    OR: [
      { members: { some: { userId } } },
      { workspace: { ownerId: userId } },
      {
        workspace: { members: { some: { userId, role: 'ADMIN' as const } } },
      },
    ],
  };
}
```

Trong `src/projects/projects.service.ts`: thêm `import { dieuKienXemDuAn } from './dieu-kien-xem-du-an';` ngay sau dòng `import { lenhGhiThanhVien } from './ghi-thanh-vien';`, rồi thay thân `projectAccessWhere` (dòng 753-763) bằng:

```ts
  private projectAccessWhere(userId: string) {
    return dieuKienXemDuAn(userId);
  }
```

- [ ] **Step 3: Viết quyền và token**

`src/bao-cao-dong-gop/quyen-bao-cao.ts`:

```ts
import type { LoaiBaoCao } from './kieu-bao-cao';

export interface VaiTroNguoiXem {
  laChuWorkspace: boolean;
  laAdminWorkspace: boolean;
  vaiTroTrongDuAn: 'LEADER' | 'MEMBER' | null;
}

/**
 * Hàm DUY NHẤT quyết định loại báo cáo, dùng cho cả xuất trực tiếp, xin link
 * và tải bằng token (kiểm lại lúc tải với dữ liệu hiện tại).
 *
 * Chủ workspace, ADMIN workspace và Leader → báo cáo nhóm: bảng đóng góp vốn
 * đã cho họ xem mọi việc. Thành viên thường → báo cáo của riêng mình. Còn lại
 * `null`: service trả 404 như mọi API dự án, không để lộ dự án có tồn tại.
 */
export function loaiBaoCaoTheoVaiTro(v: VaiTroNguoiXem): LoaiBaoCao | null {
  if (v.laChuWorkspace || v.laAdminWorkspace || v.vaiTroTrongDuAn === 'LEADER') {
    return 'NHOM';
  }
  if (v.vaiTroTrongDuAn === 'MEMBER') return 'CA_NHAN';
  return null;
}
```

`src/bao-cao-dong-gop/token-tai.ts`:

```ts
import type { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { laNgayCoThat } from '../common/ngay-vn';
import {
  DINH_DANG_BAO_CAO,
  NGON_NGU_BAO_CAO,
  type DinhDangBaoCao,
  type NgonNguBaoCao,
} from './kieu-bao-cao';

export const MUC_DICH_TOKEN_BAO_CAO = 'contribution-report';
/** Link tải sống 5 phút: đủ để app mở trình duyệt, ngắn để link lỡ bị chia sẻ cũng hết dùng sớm. */
export const HAN_TOKEN_BAO_CAO_GIAY = 5 * 60;

export interface NoiDungTokenBaoCao {
  userId: string;
  projectId: string;
  format: DinhDangBaoCao;
  from: string;
  to: string;
  lang: NgonNguBaoCao;
}

/**
 * Khoá ký riêng cho link tải, dẫn xuất từ `JWT_SECRET` bằng HMAC với một nhãn
 * cố định. Không cần biến môi trường mới, mà access token đăng nhập (ký bằng
 * `JWT_SECRET`) và token tải (ký bằng khoá này) không bao giờ dùng lẫn được.
 */
export function khoaKyBaoCao(jwtSecret: string): string {
  return createHmac('sha256', jwtSecret)
    .update('wedo:contribution-report-download:v1')
    .digest('base64url');
}

/** Không lưu vào cơ sở dữ liệu: dùng lại trong 5 phút được, chấp nhận vì chỉ người xin mới có link. */
export function kyTokenBaoCao(
  jwt: JwtService,
  khoa: string,
  nd: NoiDungTokenBaoCao,
  hetHanLuc: Date,
): string {
  return jwt.sign(
    {
      ...nd,
      purpose: MUC_DICH_TOKEN_BAO_CAO,
      exp: Math.floor(hetHanLuc.getTime() / 1000),
    },
    { secret: khoa, algorithm: 'HS256' },
  );
}

const laDinhDang = (x: unknown): x is DinhDangBaoCao =>
  (DINH_DANG_BAO_CAO as readonly unknown[]).includes(x);
const laNgonNgu = (x: unknown): x is NgonNguBaoCao =>
  (NGON_NGU_BAO_CAO as readonly unknown[]).includes(x);

/** `null` khi sai chữ ký, hết hạn, sai mục đích, hay thiếu/sai kiểu trường. */
export function docTokenBaoCao(
  jwt: JwtService,
  khoa: string,
  token: string,
): (NoiDungTokenBaoCao & { exp: number }) | null {
  if (!token) return null;
  let p: Record<string, unknown>;
  try {
    p = jwt.verify<Record<string, unknown>>(token, {
      secret: khoa,
      algorithms: ['HS256'],
    });
  } catch {
    return null;
  }
  const { userId, projectId, format, from, to, lang, purpose, exp } = p;
  if (
    purpose !== MUC_DICH_TOKEN_BAO_CAO ||
    typeof userId !== 'string' ||
    typeof projectId !== 'string' ||
    typeof exp !== 'number' ||
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    !laNgayCoThat(from) ||
    !laNgayCoThat(to) ||
    !laDinhDang(format) ||
    !laNgonNgu(lang)
  ) {
    return null;
  }
  return { userId, projectId, format, from, to, lang, exp };
}
```

- [ ] **Step 4: Chạy lại, kể cả bài cũ của dự án**

Run: `npx jest src/bao-cao-dong-gop src/projects && npx tsc --noEmit -p tsconfig.json && npx eslint src/projects src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (mọi bộ của `src/projects` vẫn xanh); tsc và eslint sạch.

- [ ] **Step 5: Commit**

```bash
git add src/projects/dieu-kien-xem-du-an.ts src/projects/projects.service.ts src/bao-cao-dong-gop/quyen-bao-cao.ts src/bao-cao-dong-gop/quyen-bao-cao.spec.ts src/bao-cao-dong-gop/token-tai.ts src/bao-cao-dong-gop/token-tai.spec.ts
git commit -m "feat(bao-cao): quyen xuat theo vai tro va token tai ky bang khoa dan xuat" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R9: Service — quyền, đọc dữ liệu, giới hạn 3.000 việc, link tải

**Files:**
- Create: `src/bao-cao-dong-gop/bao-cao-dong-gop.service.ts`
- Test: `src/bao-cao-dong-gop/bao-cao-dong-gop.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`; `JwtService`; `ConfigService`; `layJwtSecret` (`src/common/cau-hinh-khoi-dong.ts`); `ngayVN`; `dieuKienXemDuAn` (R8); `loaiBaoCaoTheoVaiTro` (R8); `khoaKyBaoCao`, `kyTokenBaoCao`, `docTokenBaoCao`, `HAN_TOKEN_BAO_CAO_GIAY` (R8); `khoangNgayBaoCao`, `mocTruyVan` (R2); `loiQuaLon`, `loiLinkHong`, `TOI_DA_VIEC_BAO_CAO` (R2); `dungBaoCao`, `ViecNguon` (R4); `veBaoCaoExcel` (R6); `veBaoCaoPdf` (R7); `tenTepBaoCao`, `MIME_BAO_CAO` (R5).
- Produces:
  - `export interface TepBaoCao { noiDung: Buffer; tenTep: string; mime: string; kieu: 'inline' | 'attachment'; loai: LoaiBaoCao }`
  - `export interface LinkTaiBaoCao { url: string; expiresAt: string }`
  - `export interface QuyenBaoCao { loai: LoaiBaoCao; duAn: DuAnChoBaoCao }`
  - `class BaoCaoDongGopService` với:
    - `xacDinhQuyen(userId: string, projectId: string): Promise<QuyenBaoCao>`
    - `taoTep(userId: string, projectId: string, yc: YeuCauBaoCao, bayGio?: Date): Promise<TepBaoCao>`
    - `taoLink(userId: string, projectId: string, yc: YeuCauBaoCao, goc: string, bayGio?: Date): Promise<LinkTaiBaoCao>`
    - `taiBangToken(token: string, bayGio?: Date): Promise<TepBaoCao>`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/bao-cao-dong-gop/bao-cao-dong-gop.service.spec.ts`:

```ts
import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TaskStatus } from '@prisma/client';
import { ngayVN } from '../common/ngay-vn';
import { dieuKienXemDuAn } from '../projects/dieu-kien-xem-du-an';
import { BaoCaoDongGopService } from './bao-cao-dong-gop.service';
import { docTokenBaoCao, khoaKyBaoCao, kyTokenBaoCao } from './token-tai';

const BI_MAT = 'bi-mat-kiem-thu-dai-hon-ba-muoi-hai-ky-tu-cho-chac';
const LEADER = 'u-leader';
const THANH_VIEN = 'u-tv';
const CHU = 'u-chu';
const ADMIN = 'u-admin';
const GOC = 'https://api.wedo.test';
const BAY_GIO = new Date('2026-10-02T03:00:00Z');

function duAn(ghiDe: { adminCua?: boolean } = {}) {
  return {
    id: 'p-1',
    name: 'Đồ án EXE201',
    createdAt: new Date('2026-09-01T02:00:00Z'),
    workspace: {
      name: 'FPT HCM',
      ownerId: CHU,
      // Prisma đã lọc `members` theo người gọi.
      members: ghiDe.adminCua ? [{ role: 'ADMIN' }] : [],
    },
    members: [
      { userId: LEADER, role: 'LEADER', user: { fullName: 'Lê Hữu Đại' } },
      { userId: THANH_VIEN, role: 'MEMBER', user: { fullName: 'Trần Thu Hà' } },
    ],
  };
}

function viecDb(ghiDe: Record<string, unknown> = {}) {
  return {
    id: 't-1',
    title: 'Thiết kế poster',
    assigneeId: THANH_VIEN,
    assignmentStatus: 'ACCEPTED',
    status: TaskStatus.DONE,
    dueDate: new Date('2026-09-20T16:59:00Z'),
    completedAt: new Date('2026-09-19T03:00:00Z'),
    submittedAt: null,
    createdAt: new Date('2026-09-10T03:00:00Z'),
    submissions: [],
    _count: { submissions: 2 },
    ...ghiDe,
  };
}

function taoService(duAnTraVe: unknown = duAn(), viec: unknown[] = [viecDb()], soViec?: number) {
  const prisma = {
    project: { findFirst: jest.fn().mockResolvedValue(duAnTraVe) },
    task: {
      count: jest.fn().mockResolvedValue(soViec ?? viec.length),
      findMany: jest.fn().mockResolvedValue(viec),
    },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ fullName: 'Người xuất', suspendedAt: null }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const jwt = new JwtService({});
  const config = { get: jest.fn().mockReturnValue(BI_MAT) };
  const service = new BaoCaoDongGopService(prisma as never, jwt, config as never);
  return { service, prisma, jwt, khoa: khoaKyBaoCao(BI_MAT) };
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

const tokenTrongLink = (url: string) => new URL(url).searchParams.get('token') ?? '';

describe('BaoCaoDongGopService — quyền', () => {
  it('Leader → báo cáo nhóm; chỉ tìm dự án trong phạm vi người gọi thấy được', async () => {
    const { service, prisma } = taoService();
    await expect(service.xacDinhQuyen(LEADER, 'p-1')).resolves.toMatchObject({
      loai: 'NHOM',
    });
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p-1', ...dieuKienXemDuAn(LEADER) } }),
    );
  });

  it('chủ workspace không ở trong dự án → báo cáo nhóm', async () => {
    const { service } = taoService();
    await expect(service.xacDinhQuyen(CHU, 'p-1')).resolves.toMatchObject({
      loai: 'NHOM',
    });
  });

  it('admin workspace không phải Leader → báo cáo nhóm', async () => {
    const { service } = taoService(duAn({ adminCua: true }));
    await expect(service.xacDinhQuyen(ADMIN, 'p-1')).resolves.toMatchObject({
      loai: 'NHOM',
    });
  });

  it('thành viên thường → báo cáo cá nhân, chỉ đọc việc của chính mình', async () => {
    const { service, prisma } = taoService();
    const tep = await service.taoTep(THANH_VIEN, 'p-1', { format: 'xlsx' }, BAY_GIO);
    expect(tep.loai).toBe('CA_NHAN');
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'p-1', assigneeId: THANH_VIEN }),
      }),
    );
  });

  it('người ngoài → 404, không đọc việc nào', async () => {
    const { service, prisma } = taoService(null);
    expect(await loiCua(service.taoTep('u-la', 'p-1', { format: 'pdf' }))).toMatchObject({
      status: 404,
    });
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });
});

describe('BaoCaoDongGopService — tạo tệp', () => {
  it('PDF báo cáo nhóm: đúng tên tệp, MIME, mở xem được trong trình duyệt', async () => {
    const { service, prisma } = taoService();
    const tep = await service.taoTep(LEADER, 'p-1', { format: 'pdf' }, BAY_GIO);

    expect(tep.noiDung.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(tep).toMatchObject({
      tenTep: 'Bao-cao-dong-gop_Do-an-EXE201_2026-10-02.pdf',
      mime: 'application/pdf',
      kieu: 'inline',
      loai: 'NHOM',
    });
    // Mặc định: từ ngày tạo dự án (01/09 giờ VN) tới hôm nay (02/10 giờ VN).
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          projectId: 'p-1',
          createdAt: {
            gte: new Date('2026-08-31T17:00:00.000Z'),
            lt: new Date('2026-10-02T17:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('Excel báo cáo cá nhân: tệp zip, tên có _ca-nhan, tải về', async () => {
    const { service } = taoService();
    const tep = await service.taoTep(THANH_VIEN, 'p-1', { format: 'xlsx' }, BAY_GIO);
    expect(tep.noiDung.subarray(0, 2).toString('latin1')).toBe('PK');
    expect(tep.tenTep).toBe('Bao-cao-dong-gop_Do-an-EXE201_2026-10-02_ca-nhan.xlsx');
    expect(tep.kieu).toBe('attachment');
  });

  it('hơn 3.000 việc → 413 REPORT_TOO_LARGE, không đọc việc nào; đúng 3.000 vẫn được', async () => {
    const quaLon = taoService(duAn(), [], 3001);
    expect(
      await loiCua(quaLon.service.taoTep(LEADER, 'p-1', { format: 'pdf' }, BAY_GIO)),
    ).toMatchObject({ status: 413, body: { code: 'REPORT_TOO_LARGE' } });
    expect(quaLon.prisma.task.findMany).not.toHaveBeenCalled();

    const vuaDu = taoService(duAn(), [viecDb()], 3000);
    await expect(
      vuaDu.service.taoTep(LEADER, 'p-1', { format: 'xlsx' }, BAY_GIO),
    ).resolves.toMatchObject({ loai: 'NHOM' });
  });

  it('from sau to → 400 REPORT_BAD_RANGE', async () => {
    const { service } = taoService();
    expect(
      await loiCua(
        service.taoTep(LEADER, 'p-1', { format: 'pdf', from: '2026-09-30', to: '2026-09-01' }),
      ),
    ).toMatchObject({ status: 400, body: { code: 'REPORT_BAD_RANGE' } });
  });

  it('người từng được giao việc nhưng đã rời dự án: đọc tên để báo cáo nhóm khớp bảng đóng góp', async () => {
    const { service, prisma } = taoService(duAn(), [viecDb({ assigneeId: 'u-cu' })]);
    prisma.user.findMany.mockResolvedValue([{ id: 'u-cu', fullName: 'Phạm Văn Cũ' }]);
    await service.taoTep(LEADER, 'p-1', { format: 'xlsx' }, BAY_GIO);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['u-cu'] } },
      select: { id: true, fullName: true },
    });
  });
});

describe('BaoCaoDongGopService — link tải', () => {
  it('trả link tuyệt đối có token sống 5 phút, mang khoảng ngày đã chốt', async () => {
    const { service, jwt, khoa } = taoService();
    const truoc = Date.now();
    const { url, expiresAt } = await service.taoLink(LEADER, 'p-1', { format: 'pdf' }, GOC);

    expect(url.startsWith(`${GOC}/contribution-report/download?token=`)).toBe(true);
    const het = new Date(expiresAt).getTime();
    expect(het).toBeGreaterThanOrEqual(truoc + 299_000);
    expect(het).toBeLessThanOrEqual(Date.now() + 301_000);
    expect(docTokenBaoCao(jwt, khoa, tokenTrongLink(url))).toMatchObject({
      userId: LEADER,
      projectId: 'p-1',
      format: 'pdf',
      from: '2026-09-01',
      to: ngayVN(new Date()),
      lang: 'vi',
    });
  });

  it('người ngoài không xin được link (404); dự án quá lớn báo ngay lúc xin link (413)', async () => {
    expect(
      await loiCua(taoService(null).service.taoLink('u-la', 'p-1', { format: 'pdf' }, GOC)),
    ).toMatchObject({ status: 404 });
    expect(
      await loiCua(
        taoService(duAn(), [], 3001).service.taoLink(LEADER, 'p-1', { format: 'pdf' }, GOC),
      ),
    ).toMatchObject({ status: 413 });
  });
});

describe('BaoCaoDongGopService — tải bằng token', () => {
  it('token đúng → tệp; quyền được kiểm lại với dữ liệu hiện tại', async () => {
    const { service, prisma } = taoService();
    const { url } = await service.taoLink(LEADER, 'p-1', { format: 'pdf' }, GOC);
    prisma.project.findFirst.mockClear();

    const tep = await service.taiBangToken(tokenTrongLink(url));
    expect(tep.noiDung.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(prisma.project.findFirst).toHaveBeenCalledTimes(1);
  });

  it('người bị mời ra sau khi xin link → 404', async () => {
    const { service, prisma } = taoService();
    const { url } = await service.taoLink(THANH_VIEN, 'p-1', { format: 'pdf' }, GOC);
    prisma.project.findFirst.mockResolvedValue(null);
    expect(await loiCua(service.taiBangToken(tokenTrongLink(url)))).toMatchObject({
      status: 404,
    });
  });

  it('Leader bị hạ xuống thành viên sau khi xin link → nhận báo cáo cá nhân', async () => {
    const { service, prisma } = taoService();
    const { url } = await service.taoLink(LEADER, 'p-1', { format: 'xlsx' }, GOC);
    const daHa = duAn();
    daHa.members[0].role = 'MEMBER';
    prisma.project.findFirst.mockResolvedValue(daHa);
    await expect(service.taiBangToken(tokenTrongLink(url))).resolves.toMatchObject({
      loai: 'CA_NHAN',
    });
  });

  it('token hết hạn, bị sửa, sai mục đích hay là access token → 401 REPORT_LINK_INVALID', async () => {
    const { service, jwt, khoa } = taoService();
    const nd = {
      userId: LEADER,
      projectId: 'p-1',
      format: 'pdf' as const,
      from: '2026-09-01',
      to: '2026-10-02',
      lang: 'vi' as const,
    };
    const hetHan = kyTokenBaoCao(jwt, khoa, nd, new Date(Date.now() - 1000));
    const [dau, than, ky] = kyTokenBaoCao(jwt, khoa, nd, new Date(Date.now() + 60_000)).split('.');
    const biSua = `${dau}.${Buffer.from(
      JSON.stringify({
        ...(JSON.parse(Buffer.from(than, 'base64url').toString('utf8')) as object),
        projectId: 'p-khac',
      }),
    ).toString('base64url')}.${ky}`;
    const saiMucDich = jwt.sign({ ...nd, purpose: 'login' }, { secret: khoa, expiresIn: 300 });
    const accessToken = new JwtService({ secret: BI_MAT }).sign({ sub: LEADER });

    for (const token of [hetHan, biSua, saiMucDich, accessToken, '']) {
      expect(await loiCua(service.taiBangToken(token))).toMatchObject({
        status: 401,
        body: { code: 'REPORT_LINK_INVALID' },
      });
    }
  });

  it('tài khoản bị khoá sau khi xin link → 401', async () => {
    const { service, prisma } = taoService();
    const { url } = await service.taoLink(LEADER, 'p-1', { format: 'pdf' }, GOC);
    prisma.user.findUnique.mockResolvedValue({ fullName: 'X', suspendedAt: new Date() });
    expect(await loiCua(service.taiBangToken(tokenTrongLink(url)))).toMatchObject({
      status: 401,
    });
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/bao-cao-dong-gop.service.spec.ts`
Expected: FAIL — "Cannot find module './bao-cao-dong-gop.service'".

- [ ] **Step 2: Viết mã**

`src/bao-cao-dong-gop/bao-cao-dong-gop.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { ProjectRole, Role } from '@prisma/client';
import { layJwtSecret } from '../common/cau-hinh-khoi-dong';
import { ngayVN } from '../common/ngay-vn';
import { PrismaService } from '../prisma/prisma.service';
import { dieuKienXemDuAn } from '../projects/dieu-kien-xem-du-an';
import { loiLinkHong, loiQuaLon, TOI_DA_VIEC_BAO_CAO } from './bao-cao.errors';
import { dungBaoCao, type ViecNguon } from './dung-bao-cao';
import { khoangNgayBaoCao, mocTruyVan, type KhoangNgay } from './khoang-ngay';
import type { LoaiBaoCao, YeuCauBaoCao } from './kieu-bao-cao';
import { loaiBaoCaoTheoVaiTro } from './quyen-bao-cao';
import { MIME_BAO_CAO, tenTepBaoCao } from './ten-tep';
import {
  docTokenBaoCao,
  HAN_TOKEN_BAO_CAO_GIAY,
  khoaKyBaoCao,
  kyTokenBaoCao,
} from './token-tai';
import { veBaoCaoExcel } from './ve-excel';
import { veBaoCaoPdf } from './ve-pdf';

export interface TepBaoCao {
  noiDung: Buffer;
  tenTep: string;
  mime: string;
  /** PDF mở xem ngay trong trình duyệt; Excel tải về. */
  kieu: 'inline' | 'attachment';
  loai: LoaiBaoCao;
}

export interface LinkTaiBaoCao {
  url: string;
  expiresAt: string;
}

interface DuAnChoBaoCao {
  id: string;
  name: string;
  createdAt: Date;
  workspace: { name: string; ownerId: string; members: { role: Role }[] };
  members: { userId: string; role: ProjectRole; user: { fullName: string } }[];
}

export interface QuyenBaoCao {
  loai: LoaiBaoCao;
  duAn: DuAnChoBaoCao;
}

/** Điều kiện chọn việc: cùng một điều kiện cho phép đếm (413) và phép đọc. */
interface DieuKienViec {
  projectId: string;
  createdAt: { gte: Date; lt: Date };
  assigneeId?: string;
}

@Injectable()
export class BaoCaoDongGopService {
  private readonly khoa: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    // Cùng hàm với nơi ký access token, nên khoá dẫn xuất luôn đi theo đúng JWT_SECRET đang chạy.
    this.khoa = khoaKyBaoCao(layJwtSecret(config.get<string>('JWT_SECRET')));
  }

  /** Người không thấy được dự án thì 404, giống mọi API dự án khác. */
  async xacDinhQuyen(userId: string, projectId: string): Promise<QuyenBaoCao> {
    const duAn = await this.prisma.project.findFirst({
      where: { id: projectId, ...dieuKienXemDuAn(userId) },
      select: {
        id: true,
        name: true,
        createdAt: true,
        workspace: {
          select: {
            name: true,
            ownerId: true,
            members: { where: { userId }, select: { role: true } },
          },
        },
        members: {
          select: { userId: true, role: true, user: { select: { fullName: true } } },
        },
      },
    });
    if (!duAn) throw new NotFoundException('Không tìm thấy dự án');

    const loai = loaiBaoCaoTheoVaiTro({
      laChuWorkspace: duAn.workspace.ownerId === userId,
      laAdminWorkspace: duAn.workspace.members.some((m) => m.role === 'ADMIN'),
      vaiTroTrongDuAn: duAn.members.find((m) => m.userId === userId)?.role ?? null,
    });
    if (!loai) throw new NotFoundException('Không tìm thấy dự án');
    return { loai, duAn };
  }

  async taoTep(
    userId: string,
    projectId: string,
    yc: YeuCauBaoCao,
    bayGio: Date = new Date(),
  ): Promise<TepBaoCao> {
    const { loai, duAn } = await this.xacDinhQuyen(userId, projectId);
    const khoang = khoangNgayBaoCao(yc.from, yc.to, duAn.createdAt, bayGio);
    const lang = yc.lang ?? 'vi';
    const where = this.dieuKienViec(projectId, loai, userId, khoang);
    await this.kiemKichThuoc(where);

    const [viec, nguoiXem] = await Promise.all([
      this.prisma.task.findMany({
        where,
        select: {
          id: true,
          title: true,
          assigneeId: true,
          assignmentStatus: true,
          status: true,
          dueDate: true,
          completedAt: true,
          submittedAt: true,
          createdAt: true,
          // Chỉ để đo đúng hạn cho việc gửi duyệt trước khi có `submittedAt`.
          submissions: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      }),
    ]);

    const thanhVien = duAn.members.map((m) => ({
      userId: m.userId,
      ten: m.user.fullName,
      vaiTro: m.role,
    }));
    const viecNguon: ViecNguon[] = viec.map((t) => ({
      id: t.id,
      tieuDe: t.title,
      assigneeId: t.assigneeId,
      assignmentStatus: t.assignmentStatus,
      status: t.status,
      dueDate: t.dueDate,
      completedAt: t.completedAt,
      submittedAt: t.submittedAt,
      nopGanNhatLuc: t.submissions[0]?.createdAt ?? null,
      soTepDaNop: t._count.submissions,
      createdAt: t.createdAt,
    }));

    const bc = dungBaoCao({
      loai,
      nguoiXem: { id: userId, ten: nguoiXem?.fullName ?? '' },
      tenDuAn: duAn.name,
      tenWorkspace: duAn.workspace.name,
      thanhVien,
      tenNguoiKhac:
        loai === 'NHOM' ? await this.tenNguoiDaRoi(viecNguon, thanhVien) : {},
      viec: viecNguon,
      khoang,
      bayGio,
    });

    const noiDung =
      yc.format === 'pdf'
        ? await veBaoCaoPdf(bc, lang)
        : await veBaoCaoExcel(bc, lang);
    return {
      noiDung,
      tenTep: tenTepBaoCao({
        tenDuAn: duAn.name,
        dinhDang: yc.format,
        loai,
        ngay: ngayVN(bayGio),
      }),
      mime: MIME_BAO_CAO[yc.format],
      kieu: yc.format === 'pdf' ? 'inline' : 'attachment',
      loai,
    };
  }

  /**
   * Link tải cho app: app mở bằng trình duyệt, nơi không có access token. Kiểm
   * quyền, khoảng ngày và kích thước NGAY lúc xin link, để app báo lỗi bằng
   * câu tiếng Việt thay vì mở trình duyệt ra một trang lỗi.
   */
  async taoLink(
    userId: string,
    projectId: string,
    yc: YeuCauBaoCao,
    goc: string,
    bayGio: Date = new Date(),
  ): Promise<LinkTaiBaoCao> {
    const { loai, duAn } = await this.xacDinhQuyen(userId, projectId);
    const khoang = khoangNgayBaoCao(yc.from, yc.to, duAn.createdAt, bayGio);
    await this.kiemKichThuoc(this.dieuKienViec(projectId, loai, userId, khoang));

    const hetHan = new Date(bayGio.getTime() + HAN_TOKEN_BAO_CAO_GIAY * 1000);
    const token = kyTokenBaoCao(
      this.jwt,
      this.khoa,
      {
        userId,
        projectId,
        format: yc.format,
        from: khoang.tu,
        to: khoang.den,
        lang: yc.lang ?? 'vi',
      },
      hetHan,
    );
    return {
      url: `${goc}/contribution-report/download?token=${encodeURIComponent(token)}`,
      expiresAt: hetHan.toISOString(),
    };
  }

  /**
   * Tải bằng token, không cần đăng nhập. Quyền được kiểm LẠI với dữ liệu hiện
   * tại (`taoTep` → `xacDinhQuyen`): người bị mời ra trong 5 phút đó nhận 404,
   * Leader vừa bị hạ xuống thành viên chỉ nhận báo cáo cá nhân.
   */
  async taiBangToken(
    token: string,
    bayGio: Date = new Date(),
  ): Promise<TepBaoCao> {
    const nd = docTokenBaoCao(this.jwt, this.khoa, token);
    if (!nd) throw loiLinkHong();
    const nguoi = await this.prisma.user.findUnique({
      where: { id: nd.userId },
      select: { suspendedAt: true },
    });
    // Không đi qua JwtStrategy, nên tự chặn tài khoản đã xoá hay bị đình chỉ.
    if (!nguoi || nguoi.suspendedAt) throw loiLinkHong();
    return this.taoTep(
      nd.userId,
      nd.projectId,
      { format: nd.format, from: nd.from, to: nd.to, lang: nd.lang },
      bayGio,
    );
  }

  private dieuKienViec(
    projectId: string,
    loai: LoaiBaoCao,
    userId: string,
    khoang: KhoangNgay,
  ): DieuKienViec {
    return {
      projectId,
      createdAt: mocTruyVan(khoang),
      ...(loai === 'CA_NHAN' ? { assigneeId: userId } : {}),
    };
  }

  private async kiemKichThuoc(where: DieuKienViec): Promise<void> {
    const so = await this.prisma.task.count({ where });
    if (so > TOI_DA_VIEC_BAO_CAO) throw loiQuaLon();
  }

  /** Tên người còn việc trong kỳ nhưng đã rời dự án — bảng đóng góp vẫn đếm họ. */
  private async tenNguoiDaRoi(
    viec: ViecNguon[],
    thanhVien: { userId: string }[],
  ): Promise<Record<string, string>> {
    const conTrong = new Set(thanhVien.map((t) => t.userId));
    const ids = [
      ...new Set(
        viec
          .map((v) => v.assigneeId)
          .filter((id): id is string => id !== null && !conTrong.has(id)),
      ),
    ];
    if (ids.length === 0) return {};
    const nguoi = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true },
    });
    return Object.fromEntries(nguoi.map((u) => [u.id, u.fullName]));
  }
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/bao-cao-dong-gop/bao-cao-dong-gop.service.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src/bao-cao-dong-gop --max-warnings 0`
Expected: PASS (17 bài); tsc, eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/bao-cao-dong-gop/bao-cao-dong-gop.service.ts src/bao-cao-dong-gop/bao-cao-dong-gop.service.spec.ts
git commit -m "feat(bao-cao): service quyen, doc du lieu, gioi han 3000 viec va link tai 5 phut" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R10: Hai controller, DTO, trang lỗi HTML và đăng ký module

**Files:**
- Create: `src/bao-cao-dong-gop/dto/yeu-cau-bao-cao.dto.ts`
- Create: `src/bao-cao-dong-gop/trang-loi-tai.ts`
- Test: `src/bao-cao-dong-gop/trang-loi-tai.spec.ts`
- Create: `src/bao-cao-dong-gop/bao-cao-dong-gop.controller.ts`
- Test: `src/bao-cao-dong-gop/bao-cao-dong-gop.http.spec.ts`
- Create: `src/bao-cao-dong-gop/bao-cao-dong-gop.module.ts`
- Modify: `src/app.module.ts` (import sau dòng 24; mảng `imports` sau `ModerationModule` dòng 51)

**Interfaces:**
- Consumes: `BaoCaoDongGopService`, `TepBaoCao` (R9); `contentDisposition` (R5); `JwtAuthGuard`, `YeuCauDaXacThuc`; `DINH_DANG_BAO_CAO`, `NGON_NGU_BAO_CAO` (R3).
- Produces:
  - `GET /projects/:id/contribution-report?format=pdf|xlsx&from&to&lang=vi|en` → tệp (`Cache-Control: private, no-store`, `Access-Control-Expose-Headers: Content-Disposition`).
  - `POST /projects/:id/contribution-report/link` thân `{ format, from?, to?, lang? }` → 200 `{ url: string, expiresAt: string }`.
  - `GET /contribution-report/download?token=…` → tệp; lỗi → trang HTML hai thứ tiếng (401/404/413/429/khác).
  - `export class TruyVanBaoCaoDto`, `export class TaoLinkBaoCaoDto`
  - `export type LoaiTrangLoi = 'het-han' | 'khong-quyen' | 'qua-lon' | 'qua-nhanh' | 'loi-chung'`
  - `export function trangLoiTaiBaoCao(loai: LoaiTrangLoi): string`
  - `export class TrangLoiTaiBaoCaoFilter implements ExceptionFilter`
  - `export function thanhTep(tep: TepBaoCao): StreamableFile`
  - `export function gocMayChu(req: Pick<Request, 'protocol' | 'get'>): string`
  - `export class BaoCaoDongGopController`, `export class TaiBaoCaoController`, `export class BaoCaoDongGopModule`

- [ ] **Step 1: Viết bài kiểm thất bại cho trang lỗi**

`src/bao-cao-dong-gop/trang-loi-tai.spec.ts`:

```ts
import {
  HttpException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { loiLinkHong } from './bao-cao.errors';
import { TrangLoiTaiBaoCaoFilter, trangLoiTaiBaoCao } from './trang-loi-tai';

describe('trangLoiTaiBaoCao', () => {
  it('link hỏng: đúng câu của spec, đủ hai thứ tiếng, không tải gì từ ngoài', () => {
    const html = trangLoiTaiBaoCao('het-han');
    expect(html).toContain('<html lang="vi">');
    expect(html).toContain('Link đã hết hạn, hãy xuất lại trong app.');
    expect(html).toContain(
      'This link has expired. Please export the report again in the app.',
    );
    expect(html).not.toMatch(/<script|<link|src=|https?:\/\//);
  });
});

describe('TrangLoiTaiBaoCaoFilter', () => {
  function chay(loi: HttpException) {
    const res = { status: jest.fn(), set: jest.fn(), send: jest.fn() };
    res.status.mockReturnValue(res);
    res.set.mockReturnValue(res);
    new TrangLoiTaiBaoCaoFilter().catch(loi, {
      switchToHttp: () => ({ getResponse: () => res }),
    } as never);
    return res;
  }

  it.each<[HttpException, number, string]>([
    [loiLinkHong(), 401, 'Link đã hết hạn'],
    [new UnauthorizedException(), 401, 'Link đã hết hạn'],
    [new NotFoundException(), 404, 'không còn quyền'],
    [new PayloadTooLargeException(), 413, 'hơn 3.000 việc'],
    [new HttpException('x', 429), 429, 'quá nhanh'],
    [new HttpException('x', 500), 500, 'Không tạo được báo cáo'],
  ])('trường hợp %#', (loi, ma, cau) => {
    const res = chay(loi);
    expect(res.status).toHaveBeenCalledWith(ma);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      }),
    );
    expect(String(res.send.mock.calls[0][0])).toContain(cau);
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/trang-loi-tai.spec.ts`
Expected: FAIL — "Cannot find module './trang-loi-tai'".

- [ ] **Step 2: Viết trang lỗi và filter**

`src/bao-cao-dong-gop/trang-loi-tai.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

export type LoaiTrangLoi =
  | 'het-han'
  | 'khong-quyen'
  | 'qua-lon'
  | 'qua-nhanh'
  | 'loi-chung';

const NOI_DUNG: Record<
  LoaiTrangLoi,
  { vi: [string, string]; en: [string, string] }
> = {
  'het-han': {
    vi: ['Link đã hết hạn', 'Link đã hết hạn, hãy xuất lại trong app.'],
    en: [
      'This link has expired',
      'This link has expired. Please export the report again in the app.',
    ],
  },
  'khong-quyen': {
    vi: [
      'Không mở được báo cáo',
      'Bạn không còn quyền xem báo cáo của dự án này, hoặc dự án không còn.',
    ],
    en: [
      'Can’t open this report',
      'You no longer have access to this project’s report, or the project no longer exists.',
    ],
  },
  'qua-lon': {
    vi: [
      'Báo cáo quá lớn',
      'Báo cáo có hơn 3.000 việc. Hãy thu hẹp khoảng thời gian rồi xuất lại.',
    ],
    en: [
      'Report too large',
      'This report has more than 3,000 tasks. Narrow the date range and export again.',
    ],
  },
  'qua-nhanh': {
    vi: ['Thao tác quá nhanh', 'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.'],
    en: ['Too many requests', 'Too many requests. Wait a minute and try again.'],
  },
  'loi-chung': {
    vi: ['Không tạo được báo cáo', 'Không tạo được báo cáo. Hãy thử lại sau ít phút.'],
    en: [
      'Couldn’t create the report',
      'Couldn’t create the report. Please try again in a few minutes.',
    ],
  },
};

/**
 * Trang HTML ngắn hai thứ tiếng cho người mở link tải bằng trình duyệt của
 * app: một khối JSON `{"statusCode":401}` không nói gì với người dùng. Không
 * chèn dữ liệu nào từ yêu cầu vào trang, không tải gì từ bên ngoài.
 */
export function trangLoiTaiBaoCao(loai: LoaiTrangLoi): string {
  const { vi, en } = NOI_DUNG[loai];
  return [
    '<!doctype html><html lang="vi"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>WeDo · ${vi[0]}</title>`,
    '<style>body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.25rem;color:#111827;line-height:1.6}',
    'h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0 0 1rem;color:#374151}hr{border:0;border-top:1px solid #e5e7eb;margin:1.5rem 0}</style>',
    `</head><body><h1>${vi[0]}</h1><p>${vi[1]}</p><hr>`,
    `<h1 lang="en">${en[0]}</h1><p lang="en">${en[1]}</p></body></html>`,
  ].join('');
}

function loaiTheoMa(ma: number): LoaiTrangLoi {
  if (ma === 401) return 'het-han';
  if (ma === 403 || ma === 404) return 'khong-quyen';
  if (ma === 413) return 'qua-lon';
  if (ma === 429) return 'qua-nhanh';
  return 'loi-chung';
}

/** Chỉ gắn vào đường tải bằng token; các API JSON khác vẫn trả lỗi như cũ. */
@Catch(HttpException)
export class TrangLoiTaiBaoCaoFilter implements ExceptionFilter {
  catch(loi: HttpException, host: ArgumentsHost): void {
    const ma = loi.getStatus();
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(ma)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      })
      .send(trangLoiTaiBaoCao(loaiTheoMa(ma)));
  }
}
```

Run: `npx jest src/bao-cao-dong-gop/trang-loi-tai.spec.ts`
Expected: PASS (7 bài).

- [ ] **Step 3: Viết bài kiểm HTTP thất bại**

`src/bao-cao-dong-gop/bao-cao-dong-gop.http.spec.ts`:

```ts
import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { loiLinkHong } from './bao-cao.errors';
import {
  BaoCaoDongGopController,
  TaiBaoCaoController,
} from './bao-cao-dong-gop.controller';
import { BaoCaoDongGopService } from './bao-cao-dong-gop.service';

/**
 * Hợp đồng HTTP của báo cáo đóng góp: đường dẫn, mã HTTP, header tệp, và việc
 * truy vấn/thân ĐÚNG NHƯ web và app gửi qua được ValidationPipe cấu hình y như
 * `main.ts`. JwtStrategy thật, service giả.
 */
const BI_MAT = 'bi-mat-kiem-thu';
const token = new JwtService({ secret: BI_MAT }).sign({
  sub: 'u1',
  email: 'u1@wedo.vn',
});
const PDF = Buffer.from('%PDF-1.3 thu');
const TEP = {
  noiDung: PDF,
  tenTep: 'Bao-cao-dong-gop_EXE_2026-10-02.pdf',
  mime: 'application/pdf',
  kieu: 'inline',
  loai: 'NHOM',
};

describe('HTTP báo cáo đóng góp', () => {
  let app: INestApplication<App>;
  const service = {
    taoTep: jest.fn(),
    taoLink: jest.fn(),
    taiBangToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service.taoTep.mockResolvedValue(TEP);
    service.taoLink.mockResolvedValue({
      url: 'http://x/contribution-report/download?token=t',
      expiresAt: '2026-10-02T03:05:00.000Z',
    });
    service.taiBangToken.mockResolvedValue(TEP);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u1@wedo.vn',
          fullName: 'Người u1',
          platformRole: 'USER',
          suspendedAt: null,
          passwordChangedAt: null,
        }),
      },
    };
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [BaoCaoDongGopController, TaiBaoCaoController],
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => BI_MAT } },
        { provide: BaoCaoDongGopService, useValue: service },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Y hệt `main.ts`.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('chưa đăng nhập thì 401, không dựng báo cáo', async () => {
    await request(app.getHttpServer())
      .get('/projects/p1/contribution-report?format=pdf')
      .expect(401);
    expect(service.taoTep).not.toHaveBeenCalled();
  });

  it('trả tệp kèm tên UTF-8, không cho lưu đệm, mở Content-Disposition cho web đọc', async () => {
    const res = await request(app.getHttpServer())
      .get('/projects/p1/contribution-report?format=pdf&from=2026-09-01&to=2026-10-02&lang=en')
      .set('Authorization', `Bearer ${token}`)
      .responseType('blob')
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(
      "inline; filename=\"Bao-cao-dong-gop_EXE_2026-10-02.pdf\"; filename*=UTF-8''Bao-cao-dong-gop_EXE_2026-10-02.pdf",
    );
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['access-control-expose-headers']).toBe('Content-Disposition');
    expect((res.body as Buffer).subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(service.taoTep).toHaveBeenCalledWith(
      'u1',
      'p1',
      expect.objectContaining({
        format: 'pdf',
        from: '2026-09-01',
        to: '2026-10-02',
        lang: 'en',
      }),
    );
  });

  it.each(['format=doc', 'format=pdf&lang=fr', 'format=pdf&email=a@b.c', ''])(
    'truy vấn sai (%s) → 400',
    async (q) => {
      await request(app.getHttpServer())
        .get(`/projects/p1/contribution-report?${q}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(service.taoTep).not.toHaveBeenCalled();
    },
  );

  it('xin link: 200 (không phải 201), chuyển gốc máy chủ cho service', async () => {
    const res = await request(app.getHttpServer())
      .post('/projects/p1/contribution-report/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ format: 'xlsx' })
      .expect(200);

    expect(res.body).toEqual({
      url: 'http://x/contribution-report/download?token=t',
      expiresAt: '2026-10-02T03:05:00.000Z',
    });
    expect(service.taoLink).toHaveBeenCalledWith(
      'u1',
      'p1',
      expect.objectContaining({ format: 'xlsx' }),
      expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+$/),
    );
  });

  it('xin link có khoá lạ trong thân → 400', async () => {
    await request(app.getHttpServer())
      .post('/projects/p1/contribution-report/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ format: 'pdf', userId: 'u2' })
      .expect(400);
    expect(service.taoLink).not.toHaveBeenCalled();
  });

  it('tải bằng token không cần đăng nhập', async () => {
    const res = await request(app.getHttpServer())
      .get('/contribution-report/download?token=abc')
      .responseType('blob')
      .expect(200);
    expect(service.taiBangToken).toHaveBeenCalledWith('abc');
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('token hỏng hay hết hạn → 401 với trang HTML hai thứ tiếng', async () => {
    service.taiBangToken.mockRejectedValue(loiLinkHong());
    const res = await request(app.getHttpServer())
      .get('/contribution-report/download?token=abc')
      .expect(401);
    expect(res.headers['content-type']).toMatch(/^text\/html/);
    expect(res.text).toContain('Link đã hết hạn, hãy xuất lại trong app.');
    expect(res.text).toContain('This link has expired');
  });

  it('không còn trong dự án → 404 với trang HTML', async () => {
    service.taiBangToken.mockRejectedValue(new NotFoundException());
    const res = await request(app.getHttpServer())
      .get('/contribution-report/download?token=abc')
      .expect(404);
    expect(res.text).toContain('không còn quyền');
  });
});
```

Run: `npx jest src/bao-cao-dong-gop/bao-cao-dong-gop.http.spec.ts`
Expected: FAIL — "Cannot find module './bao-cao-dong-gop.controller'".

- [ ] **Step 4: Viết DTO, controller, module**

`src/bao-cao-dong-gop/dto/yeu-cau-bao-cao.dto.ts`:

```ts
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  DINH_DANG_BAO_CAO,
  NGON_NGU_BAO_CAO,
  type DinhDangBaoCao,
  type NgonNguBaoCao,
} from '../kieu-bao-cao';

/**
 * Truy vấn của `GET /projects/:id/contribution-report`. `from`/`to` chỉ kiểm
 * là chuỗi ở đây; dạng ngày và thứ tự do service kiểm, để lỗi mang mã
 * `REPORT_BAD_RANGE` mà web và app dịch được.
 */
export class TruyVanBaoCaoDto {
  @IsIn([...DINH_DANG_BAO_CAO], { message: 'Định dạng chỉ nhận pdf hoặc xlsx.' })
  format: DinhDangBaoCao;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn([...NGON_NGU_BAO_CAO], { message: 'Ngôn ngữ chỉ nhận vi hoặc en.' })
  lang?: NgonNguBaoCao;
}

/** Thân của `POST /projects/:id/contribution-report/link` — cùng các trường. */
export class TaoLinkBaoCaoDto extends TruyVanBaoCaoDto {}
```

`src/bao-cao-dong-gop/bao-cao-dong-gop.controller.ts`:

```ts
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { YeuCauDaXacThuc } from '../auth/yeu-cau-da-xac-thuc';
import { contentDisposition } from '../common/content-disposition';
import {
  BaoCaoDongGopService,
  type LinkTaiBaoCao,
  type TepBaoCao,
} from './bao-cao-dong-gop.service';
import { TaoLinkBaoCaoDto, TruyVanBaoCaoDto } from './dto/yeu-cau-bao-cao.dto';
import { TrangLoiTaiBaoCaoFilter } from './trang-loi-tai';

export function thanhTep(tep: TepBaoCao): StreamableFile {
  return new StreamableFile(tep.noiDung, {
    type: tep.mime,
    disposition: contentDisposition(tep.tenTep, tep.kieu),
    length: tep.noiDung.length,
  });
}

/**
 * Gốc tuyệt đối của chính máy chủ này, để link tải mở được từ trình duyệt của
 * app. `trust proxy 1` (main.ts) làm `protocol` là `https` sau proxy Azure.
 * Không cần biến môi trường mới.
 */
export function gocMayChu(req: Pick<Request, 'protocol' | 'get'>): string {
  return `${req.protocol}://${req.get('host') ?? 'localhost'}`;
}

/** Đường cần đăng nhập. Hai đoạn sau `:id` nên không đụng `GET /projects/:id`. */
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class BaoCaoDongGopController {
  constructor(private readonly baoCao: BaoCaoDongGopService) {}

  /** Web tải bằng `fetch` khác nguồn: phải mở Content-Disposition thì mới đọc được tên tệp. */
  @Get(':id/contribution-report')
  @Header('Cache-Control', 'private, no-store')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  async tai(
    @Req() req: YeuCauDaXacThuc,
    @Param('id') id: string,
    @Query() q: TruyVanBaoCaoDto,
  ): Promise<StreamableFile> {
    return thanhTep(await this.baoCao.taoTep(req.user.id, id, q));
  }

  /** 200 chứ không 201: không tạo bản ghi nào, token không lưu vào cơ sở dữ liệu. */
  @Post(':id/contribution-report/link')
  @HttpCode(200)
  taoLink(
    @Req() req: YeuCauDaXacThuc & Pick<Request, 'protocol' | 'get'>,
    @Param('id') id: string,
    @Body() dto: TaoLinkBaoCaoDto,
  ): Promise<LinkTaiBaoCao> {
    return this.baoCao.taoLink(req.user.id, id, dto, gocMayChu(req));
  }
}

/** Đường công khai: token có chữ ký thay cho đăng nhập (trình duyệt của app không có access token). */
@Controller('contribution-report')
export class TaiBaoCaoController {
  constructor(private readonly baoCao: BaoCaoDongGopService) {}

  @Get('download')
  @UseFilters(TrangLoiTaiBaoCaoFilter)
  @Header('Cache-Control', 'private, no-store')
  async tai(@Query('token') token: string | undefined): Promise<StreamableFile> {
    return thanhTep(await this.baoCao.taiBangToken(token ?? ''));
  }
}
```

`src/bao-cao-dong-gop/bao-cao-dong-gop.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import {
  BaoCaoDongGopController,
  TaiBaoCaoController,
} from './bao-cao-dong-gop.controller';
import { BaoCaoDongGopService } from './bao-cao-dong-gop.service';

/**
 * `JwtModule.register({})` không có khoá mặc định: service luôn truyền khoá
 * dẫn xuất khi ký và kiểm, nên không thể vô tình ký token tải bằng JWT_SECRET.
 */
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [BaoCaoDongGopController, TaiBaoCaoController],
  providers: [BaoCaoDongGopService],
})
export class BaoCaoDongGopModule {}
```

Trong `src/app.module.ts`: thêm `import { BaoCaoDongGopModule } from './bao-cao-dong-gop/bao-cao-dong-gop.module';` sau dòng 24 (`import { ModerationModule } …`), và thêm `BaoCaoDongGopModule,` ngay sau `ModerationModule,` trong mảng `imports`.

- [ ] **Step 5: Chạy lại, kể cả bài nối dây AppModule**

Run: `npx jest src/bao-cao-dong-gop src/common/request-rate-limit.wiring.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src --max-warnings 0`
Expected: PASS (bài HTTP 11 bài; `request-rate-limit.wiring.spec.ts` vẫn thấy đúng một guard có JwtService — module mới không export JwtModule nên không gây hai JwtService cho guard); tsc, eslint sạch.

- [ ] **Step 6: Commit**

```bash
git add src/bao-cao-dong-gop/dto src/bao-cao-dong-gop/trang-loi-tai.ts src/bao-cao-dong-gop/trang-loi-tai.spec.ts src/bao-cao-dong-gop/bao-cao-dong-gop.controller.ts src/bao-cao-dong-gop/bao-cao-dong-gop.http.spec.ts src/bao-cao-dong-gop/bao-cao-dong-gop.module.ts src/app.module.ts
git commit -m "feat(bao-cao): API xuat bao cao, xin link va tai bang token co trang loi hai thu tieng" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R11: Giới hạn tần suất của báo cáo

**Files:**
- Modify: `src/common/request-rate-limit.guard.ts` (`resolveRule`, chèn trước khối bình luận "Thêm thành viên tra được…" ở dòng ~222)
- Test: `src/common/request-rate-limit.guard.spec.ts` (thêm `describe` trước dấu `});` đóng `describe('RequestRateLimitGuard')`, ~dòng 409)

**Interfaces:**
- Consumes: không.
- Produces: luật `contribution-report` (10/phút/người, chung cho `GET /projects/:id/contribution-report` và `POST /projects/:id/contribution-report/link`) và `contribution-report-download` (30/phút/IP cho `GET /contribution-report/download`).

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào `src/common/request-rate-limit.guard.spec.ts`, bên trong `describe('RequestRateLimitGuard', …)`, sau `describe('mời vào nhóm bằng mã', …)`:

```ts
  describe('báo cáo đóng góp', () => {
    const tokenCua = (sub: string) =>
      jwt.sign({ sub, email: `${sub}@wedo.vn` });

    it('xuất trực tiếp và xin link chung hạn mức 10 lượt mỗi phút mỗi người', () => {
      const token = tokenCua('u-1');
      expect(
        goi(
          guard,
          { method: 'GET', url: '/projects/p1/contribution-report?format=pdf', token },
          5,
        ),
      ).toBe(0);
      expect(
        goi(
          guard,
          { method: 'POST', url: '/projects/p1/contribution-report/link', token },
          5,
        ),
      ).toBe(0);
      expect(
        goi(
          guard,
          { method: 'GET', url: '/projects/p2/contribution-report?format=xlsx', token },
          1,
        ),
      ).toBe(1);
    });

    it('hai người chung một Wi-Fi không ăn chung hạn mức xuất báo cáo', () => {
      goi(
        guard,
        { method: 'GET', url: '/projects/p1/contribution-report', token: tokenCua('u-1') },
        10,
      );
      expect(
        goi(
          guard,
          { method: 'GET', url: '/projects/p1/contribution-report', token: tokenCua('u-2') },
          1,
        ),
      ).toBe(0);
    });

    it('tải bằng token: 30 lượt mỗi phút theo IP', () => {
      expect(
        goi(guard, { method: 'GET', url: '/contribution-report/download?token=abc' }, 31),
      ).toBe(1);
      expect(
        goi(
          guard,
          { method: 'GET', url: '/contribution-report/download?token=abc', ip: '5.5.5.5' },
          1,
        ),
      ).toBe(0);
    });

    it('bảng đóng góp cũ (GET /tasks/contributions) không bị hạn mức mới', () => {
      expect(
        goi(
          guard,
          { method: 'GET', url: '/tasks/contributions?workspaceId=w1', token: tokenCua('u-1') },
          50,
        ),
      ).toBe(0);
    });
  });
```

Run: `npx jest src/common/request-rate-limit.guard.spec.ts`
Expected: FAIL đúng hai bài: "chung hạn mức 10 lượt" (nhận 0, mong 1) và "tải bằng token" (nhận 0, mong 1).

- [ ] **Step 2: Thêm luật**

Trong `resolveRule` của `src/common/request-rate-limit.guard.ts`, chèn ngay TRƯỚC khối bình luận `/* Thêm thành viên tra được người theo số điện thoại hay ID. …`:

```ts
    /*
      Báo cáo đóng góp dựng cả tệp PDF/Excel trong bộ nhớ, nặng hơn hẳn một
      lượt đọc. Xuất trực tiếp (web) và xin link (app) chung một hạn mức theo
      người: 10 lượt mỗi phút là quá đủ cho người thật.
    */
    if (
      (method === 'GET' &&
        /^\/projects\/[^/]+\/contribution-report\/?$/.test(path)) ||
      (method === 'POST' &&
        /^\/projects\/[^/]+\/contribution-report\/link\/?$/.test(path))
    ) {
      return {
        key: 'contribution-report',
        max: 10,
        windowMs: 60_000,
        perUser: true,
      };
    }
    // Tải bằng token: không có access token, chỉ IP nói được ai đang thử.
    if (method === 'GET' && /^\/contribution-report\/download\/?$/.test(path)) {
      return {
        key: 'contribution-report-download',
        max: 30,
        windowMs: 60_000,
        perUser: false,
      };
    }
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/common && npx eslint src/common --max-warnings 0`
Expected: PASS (mọi bài cũ của guard vẫn xanh); eslint sạch.

- [ ] **Step 4: Commit**

```bash
git add src/common/request-rate-limit.guard.ts src/common/request-rate-limit.guard.spec.ts
git commit -m "feat(bao-cao): han muc 10 lan/phut moi nguoi cho xuat bao cao, 30/phut moi IP cho tai bang token" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task R12: Cổng cuối của backend

**Files:** không sửa tệp nào (trừ khi một cổng đỏ — khi đó sửa đúng chỗ và commit riêng).

**Interfaces:**
- Consumes: R1–R11.
- Produces: bằng chứng nhánh đi qua được workflow deploy (lint đầy đủ, `test:ops`, build, jest), không migration.

- [ ] **Step 1: Bốn cổng của workflow, đúng thứ tự workflow chạy**

```bash
npx tsc --noEmit -p tsconfig.json
npm run lint -- --max-warnings 0
npm run test:ops
npm run build
npx jest
```

Expected: tất cả sạch; `ls dist/assets/fonts` vẫn có ba tệp sau build.

- [ ] **Step 2: Không đụng cơ sở dữ liệu, không đụng workflow**

```bash
git diff --stat origin/backend -- prisma prisma.config.ts .github
git diff --name-only origin/backend
```

Expected: lệnh đầu không in gì. Lệnh hai chỉ có: `package.json`, `package-lock.json`, `nest-cli.json`, `assets/fonts/*`, `scripts/ops/phong-chu-bao-cao.test.mjs`, `src/app.module.ts`, `src/bao-cao-dong-gop/**`, `src/chat/chat-attachments.controller.ts`, `src/common/{content-disposition*,ngay-vn*,request-rate-limit.guard*}`, `src/projects/{dieu-kien-xem-du-an.ts,projects.service.ts}`, `src/tasks/contributions*`.

- [ ] **Step 3: Kiểm bằng mắt hai tệp mẫu (không gọi mạng, không cơ sở dữ liệu)**

```bash
cat > "$TEMP/mau-bao-cao.cjs" <<'EOF'
const { writeFileSync } = require('fs');
const { join } = require('path');
const { dungBaoCao } = require('./dist/src/bao-cao-dong-gop/dung-bao-cao.js');
const { veBaoCaoPdf } = require('./dist/src/bao-cao-dong-gop/ve-pdf.js');
const { veBaoCaoExcel } = require('./dist/src/bao-cao-dong-gop/ve-excel.js');
const bayGio = new Date();
const ten = ['Lê Hữu Đại', 'Trần Thu Hà', 'Nguyễn Minh Anh', 'Phạm Quốc Bảo'];
const viec = Array.from({ length: 80 }, (_, i) => ({
  id: `t${i}`, tieuDe: `Việc ${i + 1}: soạn nội dung chương ${i % 7 + 1} cho bài thuyết trình cuối kỳ 🚀`,
  assigneeId: `u${i % 3}`, assignmentStatus: 'ACCEPTED', status: ['DONE', 'DONE', 'IN_PROGRESS', 'REVIEW'][i % 4],
  dueDate: new Date(bayGio.getTime() - (i % 9 - 4) * 86400000), completedAt: i % 4 < 2 ? new Date(bayGio.getTime() - (i % 5) * 86400000) : null,
  submittedAt: null, nopGanNhatLuc: null, soTepDaNop: i % 3, createdAt: new Date(bayGio.getTime() - 10 * 86400000),
}));
const vao = (loai) => ({ loai, nguoiXem: { id: 'u0', ten: ten[0] }, tenDuAn: 'Đồ án EXE201 — Nhóm 5', tenWorkspace: 'FPT HCM',
  thanhVien: ten.map((t, i) => ({ userId: `u${i}`, ten: t, vaiTro: i === 0 ? 'LEADER' : 'MEMBER' })), tenNguoiKhac: {}, viec,
  khoang: { tu: '2026-09-01', den: '2026-12-31' }, bayGio });
(async () => {
  for (const lang of ['vi', 'en']) {
    writeFileSync(join(process.env.TEMP, `bao-cao-nhom-${lang}.pdf`), await veBaoCaoPdf(dungBaoCao(vao('NHOM')), lang));
    writeFileSync(join(process.env.TEMP, `bao-cao-nhom-${lang}.xlsx`), await veBaoCaoExcel(dungBaoCao(vao('NHOM')), lang));
  }
  writeFileSync(join(process.env.TEMP, 'bao-cao-ca-nhan-vi.pdf'), await veBaoCaoPdf(dungBaoCao(vao('CA_NHAN')), 'vi'));
  console.log('Đã ghi vào', process.env.TEMP);
})();
EOF
node "$TEMP/mau-bao-cao.cjs"
```

Expected: in "Đã ghi vào …". Mở `bao-cao-nhom-vi.pdf`, `bao-cao-nhom-en.pdf`, `bao-cao-ca-nhan-vi.pdf` và hai tệp `.xlsx`; ghi vào báo cáo cho người giao việc: dấu tiếng Việt hiện đúng, emoji thành "?", bảng sang trang có lặp tiêu đề cột, chân trang "Trang i/n", khung xác nhận chỉ ở báo cáo nhóm, cột ngày trong Excel lọc được theo ngày. Xoá `"$TEMP"/mau-bao-cao.cjs` và các tệp mẫu sau khi xem. Không commit gì ở task này.

---

# PHẦN 2 — WEB (`D:\WEDO_PC\wt\fe-bao-cao`)

Mọi lệnh chạy trong `D:\WEDO_PC\wt\fe-bao-cao` bằng Git Bash. Kiểm thử một tệp: `npx tsx --test <tệp>`; cả bộ: `npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')`. Web KHÔNG thêm thư viện.

### Task W0: Tạo worktree web với `node_modules` riêng

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: `origin/main` của FE (đỉnh `3c87e3e` = web production, đã có mời vào nhóm và mẫu dự án).
- Produces: worktree `D:\WEDO_PC\wt\fe-bao-cao` (nhánh `feat/bao-cao-dong-gop`) có `node_modules` thật của riêng nó.

- [ ] **Step 1: Tạo worktree và cài**

```bash
git -C D:/WEDO_PC/FE_WEDO fetch origin
git -C D:/WEDO_PC/FE_WEDO worktree add D:/WEDO_PC/wt/fe-bao-cao -b feat/bao-cao-dong-gop origin/main
cd D:/WEDO_PC/wt/fe-bao-cao && npm ci
cmd //c "dir /AL D:\\WEDO_PC\\wt\\fe-bao-cao" | grep -i junction; echo "ma thoat: $?"
git log --oneline -1
```

Expected: `npm ci` xong; không có dòng `<JUNCTION>` (`ma thoat: 1`); `git log` in `3c87e3e …` (hoặc mới hơn — ghi lại đỉnh thật).

- [ ] **Step 2: Kiểm mốc xanh**

```bash
npm run lint && npm run kiem-dich && npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')
```

Expected: tsc sạch, kiem-dich báo 0 chuỗi, mọi bài PASS. Không sạch thì dừng và báo người giao việc. Không commit.

---

### Task W1: Hàm thuần của báo cáo phía web

**Files:**
- Create: `src/lib/bao-cao-dong-gop.ts`
- Test: `src/lib/bao-cao-dong-gop.test.ts`

**Interfaces:**
- Consumes: `homNayVietNam`, `ngayGioVietNam` (`src/lib/gio-viet-nam.ts`); `laNgayHopLe` (`src/lib/mau-du-an.ts`); `NgonNgu` (`src/i18n/ngon-ngu.ts`).
- Produces:
  - `export type DinhDangBaoCao = 'pdf' | 'xlsx'`, `export type LoaiBaoCao = 'NHOM' | 'CA_NHAN'`
  - `export interface ThamSoBaoCao { format: DinhDangBaoCao; from: string; to: string; lang: NgonNgu }`
  - `export function tenKhongDau(ten: string, toiDa?: number): string`
  - `export function tenTepBaoCao(p: { tenDuAn: string; dinhDang: DinhDangBaoCao; loai: LoaiBaoCao; ngay: string }): string`
  - `export function tenTepTuHeader(giaTri: string | null): string | null`
  - `export function khoangNgayMacDinh(duAnTaoLuc: string, bayGio?: Date): { tu: string; den: string }`
  - `export type LoiKhoangNgay = 'thieuNgay' | 'ngayKhongHopLe' | 'tuSauDen'`
  - `export function kiemKhoangNgay(tu: string, den: string): LoiKhoangNgay | null`
  - `export function loaiBaoCaoCuaToi(p: { userId?: string | null; ownerId?: string | null; thanhVienWorkspace?: ThanhVienCoVaiTro[]; thanhVienDuAn?: ThanhVienCoVaiTro[] }): LoaiBaoCao`
  - `export function duongDanBaoCao(projectId: string, t: ThamSoBaoCao): string`
  - `export interface MoiTruongTai { taoUrl(blob: Blob): string; bamTai(url: string, tenTep: string): void; xoaUrl(url: string): void; hen(viec: () => void, ms: number): void }`
  - `export function luuBlob(blob: Blob, tenTep: string, mt?: MoiTruongTai): void`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/bao-cao-dong-gop.test.ts`:

```ts
/*
  Báo cáo đóng góp phía web: tên tệp (khớp máy chủ), đọc tên tệp từ header,
  khoảng ngày mặc định và kiểm khoảng ngày, loại báo cáo theo vai trò, đường
  dẫn API, lưu blob rồi giải phóng URL.

    npx tsx --test src/lib/bao-cao-dong-gop.test.ts
*/
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  duongDanBaoCao,
  khoangNgayMacDinh,
  kiemKhoangNgay,
  loaiBaoCaoCuaToi,
  luuBlob,
  tenKhongDau,
  tenTepBaoCao,
  tenTepTuHeader,
} from './bao-cao-dong-gop';

describe('tenTepBaoCao — cùng bộ mẫu với máy chủ (BE src/bao-cao-dong-gop/ten-tep.spec.ts)', () => {
  it('bỏ dấu, thay khoảng trắng và ký tự lạ bằng gạch', () => {
    assert.equal(
      tenTepBaoCao({ tenDuAn: 'Đồ án EXE201 — Nhóm 5', dinhDang: 'pdf', loai: 'NHOM', ngay: '2026-10-02' }),
      'Bao-cao-dong-gop_Do-an-EXE201-Nhom-5_2026-10-02.pdf',
    );
  });

  it('báo cáo cá nhân thêm _ca-nhan trước đuôi tệp', () => {
    assert.equal(
      tenTepBaoCao({ tenDuAn: 'Đồ án EXE201 — Nhóm 5', dinhDang: 'xlsx', loai: 'CA_NHAN', ngay: '2026-10-02' }),
      'Bao-cao-dong-gop_Do-an-EXE201-Nhom-5_2026-10-02_ca-nhan.xlsx',
    );
  });

  it('cắt còn 60 ký tự, không để gạch thừa; tên không còn chữ nào thì du-an', () => {
    assert.equal(tenKhongDau(`${'a'.repeat(59)} bc`), 'a'.repeat(59));
    assert.equal(tenKhongDau('x'.repeat(80)).length, 60);
    assert.equal(tenKhongDau('🚀🚀'), 'du-an');
  });
});

describe('tenTepTuHeader', () => {
  it('ưu tiên filename* UTF-8, rồi tới filename thường', () => {
    assert.equal(
      tenTepTuHeader("inline; filename=\"B_o_c_o.pdf\"; filename*=UTF-8''B%C3%A1o%20c%C3%A1o.pdf"),
      'Báo cáo.pdf',
    );
    assert.equal(tenTepTuHeader('attachment; filename="Bao-cao.xlsx"'), 'Bao-cao.xlsx');
  });

  it('không có header, hay mã hoá hỏng mà không có tên dự phòng, thì null', () => {
    assert.equal(tenTepTuHeader(null), null);
    assert.equal(tenTepTuHeader("inline; filename*=UTF-8''%E0%A4%A"), null);
  });

  it('không để tên tệp chứa đường dẫn', () => {
    assert.equal(tenTepTuHeader('attachment; filename="../x/y.pdf"'), '.._x_y.pdf');
  });
});

describe('khoangNgayMacDinh', () => {
  it('từ ngày tạo dự án tới hôm nay, theo giờ Việt Nam', () => {
    // Tạo lúc 01:00 01/09 giờ VN (UTC còn 31/08); bây giờ là 03:00 02/10 giờ VN.
    assert.deepEqual(khoangNgayMacDinh('2026-08-31T18:00:00.000Z', new Date('2026-10-01T20:00:00Z')), {
      tu: '2026-09-01',
      den: '2026-10-02',
    });
  });

  it('ngày tạo hỏng thì lấy hôm nay cho cả hai đầu', () => {
    assert.deepEqual(khoangNgayMacDinh('', new Date('2026-10-01T20:00:00Z')), { tu: '2026-10-02', den: '2026-10-02' });
  });
});

describe('kiemKhoangNgay', () => {
  it('hợp lệ thì null; from = to vẫn hợp lệ', () => {
    assert.equal(kiemKhoangNgay('2026-09-01', '2026-10-02'), null);
    assert.equal(kiemKhoangNgay('2026-09-15', '2026-09-15'), null);
  });

  it('báo đúng lý do', () => {
    assert.equal(kiemKhoangNgay('', '2026-10-02'), 'thieuNgay');
    assert.equal(kiemKhoangNgay('2026-02-30', '2026-10-02'), 'ngayKhongHopLe');
    assert.equal(kiemKhoangNgay('2026-10-02', '2026-09-01'), 'tuSauDen');
  });
});

describe('loaiBaoCaoCuaToi — chỉ để hiện dòng loại báo cáo, máy chủ mới quyết định', () => {
  const ws = [
    { role: 'ADMIN', user: { id: 'u-admin' } },
    { role: 'MEMBER', user: { id: 'u-tv' } },
  ];
  const duAn = [
    { role: 'LEADER', user: { id: 'u-leader' } },
    { role: 'MEMBER', user: { id: 'u-tv' } },
  ];

  it('chủ workspace, admin workspace, Leader → cả nhóm', () => {
    for (const userId of ['u-chu', 'u-admin', 'u-leader']) {
      assert.equal(
        loaiBaoCaoCuaToi({ userId, ownerId: 'u-chu', thanhVienWorkspace: ws, thanhVienDuAn: duAn }),
        'NHOM',
      );
    }
  });

  it('thành viên thường, hay chưa biết là ai → của bạn', () => {
    assert.equal(loaiBaoCaoCuaToi({ userId: 'u-tv', ownerId: 'u-chu', thanhVienWorkspace: ws, thanhVienDuAn: duAn }), 'CA_NHAN');
    assert.equal(loaiBaoCaoCuaToi({ userId: null, ownerId: 'u-chu' }), 'CA_NHAN');
  });
});

describe('duongDanBaoCao', () => {
  it('mã hoá id dự án, đủ bốn tham số', () => {
    assert.equal(
      duongDanBaoCao('p 1', { format: 'pdf', from: '2026-09-01', to: '2026-10-02', lang: 'en' }),
      '/projects/p%201/contribution-report?format=pdf&from=2026-09-01&to=2026-10-02&lang=en',
    );
  });
});

describe('luuBlob', () => {
  it('bấm tải trước, giải phóng URL sau (hẹn giờ), không giải phóng ngay', () => {
    const nhatKy: string[] = [];
    const hen: Array<() => void> = [];
    luuBlob(new Blob(['x']), 'a.pdf', {
      taoUrl: () => {
        nhatKy.push('tao');
        return 'blob:1';
      },
      bamTai: (url, ten) => nhatKy.push(`bam ${url} ${ten}`),
      xoaUrl: (url) => nhatKy.push(`xoa ${url}`),
      hen: (viec) => hen.push(viec),
    });
    assert.deepEqual(nhatKy, ['tao', 'bam blob:1 a.pdf']);
    hen.forEach((viec) => viec());
    assert.deepEqual(nhatKy, ['tao', 'bam blob:1 a.pdf', 'xoa blob:1']);
  });

  it('bấm tải lỗi vẫn hẹn giải phóng URL', () => {
    const hen: Array<() => void> = [];
    const xoa: string[] = [];
    assert.throws(() =>
      luuBlob(new Blob(['x']), 'a.pdf', {
        taoUrl: () => 'blob:2',
        bamTai: () => {
          throw new Error('chặn');
        },
        xoaUrl: (url) => xoa.push(url),
        hen: (viec) => hen.push(viec),
      }),
    );
    hen.forEach((viec) => viec());
    assert.deepEqual(xoa, ['blob:2']);
  });
});
```

Run: `npx tsx --test src/lib/bao-cao-dong-gop.test.ts`
Expected: FAIL — "Cannot find module … bao-cao-dong-gop".

- [ ] **Step 2: Viết mã**

`src/lib/bao-cao-dong-gop.ts`:

```ts
import type { NgonNgu } from '../i18n/ngon-ngu';
import { homNayVietNam, ngayGioVietNam } from './gio-viet-nam';
import { laNgayHopLe } from './mau-du-an';

/*
  Không nhập './api': tệp đó đọc `import.meta.env` ngay khi nạp, chạy dưới
  node:test sẽ vỡ. Mọi thứ ở đây thuần, kiểm thử được.
*/

export type DinhDangBaoCao = 'pdf' | 'xlsx';
export type LoaiBaoCao = 'NHOM' | 'CA_NHAN';

export interface ThamSoBaoCao {
  format: DinhDangBaoCao;
  from: string;
  to: string;
  lang: NgonNgu;
}

/**
 * Cùng quy tắc với máy chủ (BE src/bao-cao-dong-gop/ten-tep.ts). Chỉ dùng khi
 * không đọc được tên tệp từ Content-Disposition (proxy lạ cắt mất header).
 */
export function tenKhongDau(ten: string, toiDa = 60): string {
  const gon = ten
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return gon.slice(0, toiDa).replace(/-+$/, '') || 'du-an';
}

export function tenTepBaoCao(p: { tenDuAn: string; dinhDang: DinhDangBaoCao; loai: LoaiBaoCao; ngay: string }): string {
  const caNhan = p.loai === 'CA_NHAN' ? '_ca-nhan' : '';
  return `Bao-cao-dong-gop_${tenKhongDau(p.tenDuAn)}_${p.ngay}${caNhan}.${p.dinhDang}`;
}

const lamSachTenTep = (ten: string) => ten.replace(/[\\/]/g, '_');

/** Tên tệp máy chủ đặt (`filename*` UTF-8 trước, `filename` sau); không đọc được thì `null`. */
export function tenTepTuHeader(giaTri: string | null): string | null {
  if (!giaTri) return null;
  const utf8 = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(giaTri);
  if (utf8) {
    try {
      return lamSachTenTep(decodeURIComponent(utf8[1].trim()));
    } catch {
      // Mã hoá hỏng: thử tên dự phòng bên dưới.
    }
  }
  const thuong = /filename\s*=\s*"([^"]+)"/i.exec(giaTri);
  return thuong ? lamSachTenTep(thuong[1]) : null;
}

/** Mặc định của hộp thoại: từ ngày tạo dự án tới hôm nay, theo giờ Việt Nam như máy chủ. */
export function khoangNgayMacDinh(duAnTaoLuc: string, bayGio: Date = new Date()): { tu: string; den: string } {
  const den = homNayVietNam(bayGio);
  const tu = ngayGioVietNam(duAnTaoLuc).ngay || den;
  return { tu: tu > den ? den : tu, den };
}

export type LoiKhoangNgay = 'thieuNgay' | 'ngayKhongHopLe' | 'tuSauDen';

/** Kiểm trước khi gửi, cùng điều kiện với máy chủ (REPORT_BAD_RANGE). */
export function kiemKhoangNgay(tu: string, den: string): LoiKhoangNgay | null {
  if (!tu || !den) return 'thieuNgay';
  if (!laNgayHopLe(tu) || !laNgayHopLe(den)) return 'ngayKhongHopLe';
  if (tu > den) return 'tuSauDen';
  return null;
}

interface ThanhVienCoVaiTro {
  role: string;
  user: { id: string };
}

/**
 * Loại báo cáo theo vai trò, cùng quy tắc với máy chủ (BE quyen-bao-cao.ts).
 * Chỉ để hiện đúng dòng "Báo cáo cả nhóm/của bạn" và đặt tên tệp dự phòng:
 * máy chủ tự quyết khi dựng tệp, web đoán sai cũng không lộ gì.
 */
export function loaiBaoCaoCuaToi(p: {
  userId?: string | null;
  ownerId?: string | null;
  thanhVienWorkspace?: ThanhVienCoVaiTro[];
  thanhVienDuAn?: ThanhVienCoVaiTro[];
}): LoaiBaoCao {
  const id = p.userId;
  if (!id) return 'CA_NHAN';
  if (p.ownerId === id) return 'NHOM';
  if (p.thanhVienWorkspace?.some((m) => m.user.id === id && m.role === 'ADMIN')) return 'NHOM';
  if (p.thanhVienDuAn?.some((m) => m.user.id === id && m.role === 'LEADER')) return 'NHOM';
  return 'CA_NHAN';
}

export function duongDanBaoCao(projectId: string, t: ThamSoBaoCao): string {
  const thamSo = new URLSearchParams({ format: t.format, from: t.from, to: t.to, lang: t.lang });
  return `/projects/${encodeURIComponent(projectId)}/contribution-report?${thamSo.toString()}`;
}

export interface MoiTruongTai {
  taoUrl(blob: Blob): string;
  bamTai(url: string, tenTep: string): void;
  xoaUrl(url: string): void;
  hen(viec: () => void, ms: number): void;
}

function moiTruongTrinhDuyet(): MoiTruongTai {
  return {
    taoUrl: (blob) => URL.createObjectURL(blob),
    bamTai: (url, tenTep) => {
      const lienKet = document.createElement('a');
      lienKet.href = url;
      lienKet.download = tenTep;
      document.body.appendChild(lienKet);
      lienKet.click();
      lienKet.remove();
    },
    xoaUrl: (url) => URL.revokeObjectURL(url),
    hen: (viec, ms) => {
      window.setTimeout(viec, ms);
    },
  };
}

/**
 * Tải blob về máy bằng `<a download>`, rồi giải phóng URL. Giải phóng SAU một
 * nhịp: Firefox và Safari huỷ lượt tải nếu URL bị thu hồi ngay trong cùng tác vụ
 * với cú bấm.
 */
export function luuBlob(blob: Blob, tenTep: string, mt: MoiTruongTai = moiTruongTrinhDuyet()): void {
  const url = mt.taoUrl(blob);
  try {
    mt.bamTai(url, tenTep);
  } finally {
    mt.hen(() => mt.xoaUrl(url), 1000);
  }
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx tsx --test src/lib/bao-cao-dong-gop.test.ts && npm run lint`
Expected: PASS (15 bài); tsc sạch.

- [ ] **Step 4: Commit**

```bash
git add src/lib/bao-cao-dong-gop.ts src/lib/bao-cao-dong-gop.test.ts
git commit -m "feat(web): ham thuan cho bao cao dong gop - ten tep, khoang ngay, loai bao cao, luu blob" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W2: Gọi API tải tệp, từ điển và dịch mã lỗi `REPORT_*`

**Files:**
- Modify: `src/lib/api.ts` (import đầu tệp; thêm `taiBaoCaoDongGop` ngay sau `getContributions`, ~dòng 1574)
- Create: `src/i18n/tu-dien/bao-cao-dong-gop.ts`
- Modify: `src/i18n/loi.ts` (`TIENG_ANH_THEO_MA` sau các mã `INVITE_*`; `TIENG_ANH_THEO_CAU` cuối bảng)
- Test: `src/i18n/loi.test.ts` (thêm `describe` cuối tệp)

**Interfaces:**
- Consumes: `duongDanBaoCao`, `tenTepTuHeader`, `ThamSoBaoCao` (W1); `guiKemPhien`, `guiYeuCau`, `authHeaders`, `loiTuPhanHoi`, `chuyenLoiMang` (có sẵn trong `api.ts`/`loi-api.ts`).
- Produces:
  - `api.taiBaoCaoDongGop(projectId: string, thamSo: ThamSoBaoCao): Promise<{ blob: Blob; tenTep: string | null }>`
  - `export const tuDienBaoCaoDongGop` với khoá: `nut`, `nutNgan`, `hopThoai.{tieuDe, moTa(duAn), dong, dinhDang, pdf, pdfMoTa, excel, excelMoTa, tuNgay, denNgay, loaiNhom, loaiCaNhan, taiXuong, dangTao, daTai, loiTao, loiNgay.{thieuNgay, ngayKhongHopLe, tuSauDen}}`, `khoi.{tieuDe, moTa, chonDuAn, dangTaiDuAn, chuaCoDuAn, loiTaiDuAn}`
  - Bản dịch tiếng Anh cho `REPORT_BAD_RANGE`, `REPORT_TOO_LARGE`, `REPORT_LINK_INVALID` và câu dự phòng "Không tạo được báo cáo."

- [ ] **Step 1: Viết bài kiểm thất bại cho dịch lỗi**

Thêm cuối `src/i18n/loi.test.ts`:

```ts
describe('báo cáo đóng góp', () => {
  it('tiếng Anh: dịch ba mã lỗi của báo cáo', () => {
    const ca: Array<[string, number, RegExp]> = [
      ['REPORT_BAD_RANGE', 400, /date range is invalid/],
      ['REPORT_TOO_LARGE', 413, /more than 3,000 tasks/],
      ['REPORT_LINK_INVALID', 401, /expired or is invalid/],
    ];
    for (const [code, status, mau] of ca) {
      const loi = loiTuPhanHoi(status, JSON.stringify({ code, message: 'Câu tiếng Việt của máy chủ.' }));
      assert.match(dichThongBaoLoi(loi, 'Fallback', 'en'), mau);
    }
  });

  it('tiếng Việt: giữ nguyên câu của máy chủ', () => {
    const cau = 'Báo cáo có hơn 3.000 việc. Hãy thu hẹp khoảng thời gian rồi xuất lại.';
    const loi = loiTuPhanHoi(413, JSON.stringify({ code: 'REPORT_TOO_LARGE', message: cau }));
    assert.equal(dichThongBaoLoi(loi, 'Dự phòng', 'vi'), cau);
  });

  it('câu dự phòng của web khi tải báo cáo hỏng', () => {
    assert.equal(dichCauHeThong('Không tạo được báo cáo.', 'en'), 'Couldn’t create the report.');
  });
});
```

Run: `npx tsx --test src/i18n/loi.test.ts`
Expected: FAIL ở bài "dịch ba mã lỗi" (trả "Câu tiếng Việt của máy chủ.") và bài "câu dự phòng".

- [ ] **Step 2: Thêm bản dịch**

Trong `src/i18n/loi.ts`, thêm vào `TIENG_ANH_THEO_MA` ngay sau dòng `INVITE_PROJECT_CLOSED: …`:

```ts
  // Báo cáo đóng góp (BE src/bao-cao-dong-gop/bao-cao.errors.ts).
  REPORT_BAD_RANGE: () => 'The date range is invalid. Use YYYY-MM-DD dates, with “From” no later than “To”.',
  REPORT_TOO_LARGE: () => 'This report has more than 3,000 tasks. Narrow the date range and export again.',
  REPORT_LINK_INVALID: () => 'This download link has expired or is invalid. Export the report again.',
```

và thêm vào cuối `TIENG_ANH_THEO_CAU` (trước `};`):

```ts
  // Web: tải báo cáo đóng góp (lib/api.ts taiBaoCaoDongGop).
  'Không tạo được báo cáo.': 'Couldn’t create the report.',
```

Run: `npx tsx --test src/i18n/loi.test.ts`
Expected: PASS.

- [ ] **Step 3: Từ điển**

`src/i18n/tu-dien/bao-cao-dong-gop.ts`:

```ts
import { khaiBaoTuDien } from '../dich';

/** Xuất báo cáo đóng góp: nút ở Bảng công việc, hộp thoại, khối trong tab Bảng đóng góp của Cài đặt. */
export const tuDienBaoCaoDongGop = khaiBaoTuDien(
  {
    nut: 'Xuất báo cáo đóng góp',
    nutNgan: 'Xuất báo cáo',
    hopThoai: {
      tieuDe: 'Xuất báo cáo đóng góp',
      moTa: (duAn: string) => `Dự án ${duAn}. Số liệu lấy từ công việc trên WeDo, lọc theo ngày tạo việc.`,
      dong: 'Đóng',
      dinhDang: 'Định dạng',
      pdf: 'PDF',
      pdfMoTa: 'Để nộp, có chỗ ký xác nhận',
      excel: 'Excel',
      excelMoTa: 'Để lọc và tính điểm',
      tuNgay: 'Từ ngày',
      denNgay: 'Đến ngày',
      loaiNhom: 'Báo cáo cả nhóm',
      loaiCaNhan: 'Báo cáo của bạn',
      taiXuong: 'Tải xuống',
      dangTao: 'Đang tạo báo cáo…',
      daTai: 'Đã tải báo cáo xuống',
      loiTao: 'Không tạo được báo cáo',
      loiNgay: {
        thieuNgay: 'Chọn đủ Từ ngày và Đến ngày.',
        ngayKhongHopLe: 'Ngày không hợp lệ.',
        tuSauDen: '“Từ ngày” không được sau “Đến ngày”.',
      },
    },
    khoi: {
      tieuDe: 'Xuất báo cáo',
      moTa: 'Tải PDF để nộp (có chỗ ký) hoặc Excel để giảng viên lọc và tính điểm.',
      chonDuAn: 'Dự án',
      dangTaiDuAn: 'Đang tải danh sách dự án…',
      chuaCoDuAn: 'Workspace chưa có dự án nào.',
      loiTaiDuAn: 'Không tải được danh sách dự án',
    },
  },
  {
    nut: 'Export contribution report',
    nutNgan: 'Export report',
    hopThoai: {
      tieuDe: 'Export contribution report',
      moTa: (duAn: string) => `Project ${duAn}. Figures come from tasks on WeDo, filtered by task creation date.`,
      dong: 'Close',
      dinhDang: 'Format',
      pdf: 'PDF',
      pdfMoTa: 'To hand in, with space to sign',
      excel: 'Excel',
      excelMoTa: 'To filter and grade',
      tuNgay: 'From',
      denNgay: 'To',
      loaiNhom: 'Whole-team report',
      loaiCaNhan: 'Your own report',
      taiXuong: 'Download',
      dangTao: 'Creating report…',
      daTai: 'Report downloaded',
      loiTao: 'Couldn’t create the report',
      loiNgay: {
        thieuNgay: 'Choose both From and To.',
        ngayKhongHopLe: 'That date isn’t valid.',
        tuSauDen: '“From” can’t be later than “To”.',
      },
    },
    khoi: {
      tieuDe: 'Export report',
      moTa: 'Download a PDF to hand in (with space to sign) or an Excel file for your lecturer to filter and grade.',
      chonDuAn: 'Project',
      dangTaiDuAn: 'Loading projects…',
      chuaCoDuAn: 'This workspace has no projects yet.',
      loiTaiDuAn: 'Couldn’t load projects',
    },
  },
);
```

- [ ] **Step 4: Hàm tải tệp trong `api.ts`**

Thêm vào khối import đầu `src/lib/api.ts` (sau dòng `import { duongDanGoiYCongViecAi } from './ai-web';`):

```ts
import { duongDanBaoCao, tenTepTuHeader, type ThamSoBaoCao } from './bao-cao-dong-gop';
```

và thêm vào đối tượng `api`, ngay sau khối `getContributions: (…) => { … },`:

```ts
  /**
   * Tải tệp báo cáo đóng góp (PDF/Excel) kèm phiên đăng nhập. Máy chủ mở header
   * Content-Disposition cho CORS, nên đọc được đúng tên tệp nó đặt; không đọc
   * được thì hộp thoại tự đặt tên theo cùng quy tắc.
   */
  taiBaoCaoDongGop: async (projectId: string, thamSo: ThamSoBaoCao): Promise<{ blob: Blob; tenTep: string | null }> => {
    const path = duongDanBaoCao(projectId, thamSo);
    const response = await guiKemPhien(path, () => guiYeuCau(`${API_URL}${path}`, { headers: authHeaders() }));
    try {
      if (!response.ok) {
        throw loiTuPhanHoi(response.status, await response.text(), 'Không tạo được báo cáo.');
      }
      return { blob: await response.blob(), tenTep: tenTepTuHeader(response.headers.get('Content-Disposition')) };
    } catch (loi) {
      throw chuyenLoiMang(loi);
    }
  },
```

- [ ] **Step 5: Chạy lại**

Run: `npx tsx --test src/i18n/loi.test.ts src/i18n/tu-dien.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS; tsc sạch; kiem-dich 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/i18n/tu-dien/bao-cao-dong-gop.ts src/i18n/loi.ts src/i18n/loi.test.ts
git commit -m "feat(web): goi API tai bao cao dong gop, tu dien va dich ma loi REPORT" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W3: Hộp thoại "Xuất báo cáo đóng góp"

**Files:**
- Create: `src/components/du-an/XuatBaoCaoDialog.tsx`

**Interfaces:**
- Consumes: `api.taiBaoCaoDongGop`, `displayProjectName` (W2, `api.ts`); `khoangNgayMacDinh`, `kiemKhoangNgay`, `luuBlob`, `tenTepBaoCao`, `DinhDangBaoCao`, `LoaiBaoCao` (W1); `homNayVietNam`; `tuDienBaoCaoDongGop` (W2); `LopPhu`; `VietnameseDateInput`; `useToast`.
- Produces: `export function XuatBaoCaoDialog(props: { projectId: string; projectName: string; projectCreatedAt: string; loai: LoaiBaoCao; onClose: () => void })`

Task giao diện thuần: logic đã nằm ở hàm thuần có kiểm thử (W1, W2); cổng của task này là `tsc` + `kiem-dich`.

- [ ] **Step 1: Viết hộp thoại**

`src/components/du-an/XuatBaoCaoDialog.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Download, FileSpreadsheet, FileText, Loader2, X } from 'lucide-react';
import { LopPhu } from '../LopPhu';
import VietnameseDateInput from '../VietnameseDateInput';
import { useToast } from '../../contexts/ToastContext';
import { api, displayProjectName } from '../../lib/api';
import {
  khoangNgayMacDinh,
  kiemKhoangNgay,
  luuBlob,
  tenTepBaoCao,
  type DinhDangBaoCao,
  type LoaiBaoCao,
} from '../../lib/bao-cao-dong-gop';
import { homNayVietNam } from '../../lib/gio-viet-nam';
import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienBaoCaoDongGop } from '../../i18n/tu-dien/bao-cao-dong-gop';

interface XuatBaoCaoDialogProps {
  projectId: string;
  projectName: string;
  /** `createdAt` (ISO) của dự án — mặc định của "Từ ngày". */
  projectCreatedAt: string;
  /** Chỉ để hiện dòng loại báo cáo và đặt tên tệp dự phòng; máy chủ mới là nơi quyết định. */
  loai: LoaiBaoCao;
  onClose: () => void;
}

const LOP_O_NGAY =
  'w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60';

/**
 * Chọn PDF hay Excel và khoảng ngày (mặc định từ ngày tạo dự án tới hôm nay),
 * rồi tải bằng `fetch` có đăng nhập → blob → `<a download>`. Báo cáo dùng ngôn
 * ngữ đang chọn trên web.
 */
export function XuatBaoCaoDialog({ projectId, projectName, projectCreatedAt, loai, onClose }: XuatBaoCaoDialogProps) {
  const t = useTuDien(tuDienBaoCaoDongGop).hopThoai;
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  const { showToast } = useToast();
  const macDinh = useMemo(() => khoangNgayMacDinh(projectCreatedAt), [projectCreatedAt]);
  const [dinhDang, setDinhDang] = useState<DinhDangBaoCao>('pdf');
  const [tu, setTu] = useState(macDinh.tu);
  const [den, setDen] = useState(macDinh.den);
  const [dangTao, setDangTao] = useState(false);
  // Giữ lỗi gốc, dịch lúc vẽ: đổi ngôn ngữ thì câu báo lỗi đổi theo.
  const [loi, setLoi] = useState<unknown>(null);
  const loiNgay = kiemKhoangNgay(tu, den);

  const taiXuong = async () => {
    if (loiNgay || dangTao) return;
    setDangTao(true);
    setLoi(null);
    try {
      const { blob, tenTep } = await api.taiBaoCaoDongGop(projectId, { format: dinhDang, from: tu, to: den, lang: ngonNgu });
      luuBlob(blob, tenTep ?? tenTepBaoCao({ tenDuAn: projectName, dinhDang, loai, ngay: homNayVietNam() }));
      showToast(t.daTai, undefined, 'success');
      onClose();
    } catch (e) {
      setLoi(e ?? new Error());
    } finally {
      setDangTao(false);
    }
  };

  const theDinhDang = (giaTri: DinhDangBaoCao, Icon: LucideIcon, nhan: string, moTa: string) => (
    <button
      key={giaTri}
      type="button"
      role="radio"
      aria-checked={dinhDang === giaTri}
      onClick={() => setDinhDang(giaTri)}
      disabled={dangTao}
      className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors disabled:opacity-60 ${
        dinhDang === giaTri ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <span className="min-w-0">
        <span className="block font-bold text-on-surface">{nhan}</span>
        <span className="mt-0.5 block text-xs text-on-surface-variant">{moTa}</span>
      </span>
    </button>
  );

  return (
    <LopPhu className="flex items-center justify-center bg-scrim/50 p-4 backdrop-blur-sm">
      <button type="button" aria-label={t.dong} className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="xuat-bao-cao-tieu-de"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/20 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="xuat-bao-cao-tieu-de" className="text-2xl font-bold text-on-surface">
              {t.tieuDe}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t.moTa(displayProjectName(projectName, ngonNgu))}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label={t.dong}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.dinhDang}</span>
            <div role="radiogroup" aria-label={t.dinhDang} className="grid gap-2 sm:grid-cols-2">
              {theDinhDang('pdf', FileText, t.pdf, t.pdfMoTa)}
              {theDinhDang('xlsx', FileSpreadsheet, t.excel, t.excelMoTa)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.tuNgay}</span>
              <VietnameseDateInput value={tu} max={den || undefined} onChange={(e) => setTu(e.target.value)} disabled={dangTao} className={LOP_O_NGAY} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.denNgay}</span>
              <VietnameseDateInput value={den} min={tu || undefined} onChange={(e) => setDen(e.target.value)} disabled={dangTao} className={LOP_O_NGAY} />
            </label>
          </div>

          <p className="rounded-xl bg-surface px-3 py-2 text-sm font-medium text-on-surface">
            {loai === 'NHOM' ? t.loaiNhom : t.loaiCaNhan}
          </p>

          {loiNgay && (
            <p role="alert" className="text-sm text-error">
              {t.loiNgay[loiNgay]}
            </p>
          )}
          {loi !== null && (
            <p role="alert" className="rounded-xl bg-error/10 p-3 text-sm text-error">
              {dichLoi(loi, t.loiTao)}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-bold text-on-surface hover:bg-surface-container"
          >
            {t.dong}
          </button>
          <button
            type="button"
            onClick={() => void taiXuong()}
            disabled={dangTao || loiNgay !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
          >
            {dangTao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {dangTao ? t.dangTao : t.taiXuong}
          </button>
        </div>
      </div>
    </LopPhu>
  );
}
```

- [ ] **Step 2: Kiểm**

Run: `npm run lint && npm run kiem-dich`
Expected: tsc sạch (nếu `VietnameseDateInput` không nhận `min`/`max` thì bỏ hai thuộc tính đó — `kiemKhoangNgay` đã chặn ngày ngược); kiem-dich 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/du-an/XuatBaoCaoDialog.tsx
git commit -m "feat(web): hop thoai xuat bao cao dong gop chon PDF/Excel va khoang ngay" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W4: Nút ở Bảng công việc, khối trong tab Bảng đóng góp, và cổng cuối của web

**Files:**
- Create: `src/components/du-an/KhoiXuatBaoCao.tsx`
- Modify: `src/views/ProjectBoardView.tsx` (import icon dòng 3; import mới sau dòng 35; state sau `const tMoi = useTuDien(tuDienMoiVaoNhom);` ~dòng 265; header ~918-938)
- Modify: `src/views/ContributionsView.tsx` (import dòng 4-12; state + effect dòng 90-121; JSX trước khối `thanhVien.length === 0` ~dòng 160)

**Interfaces:**
- Consumes: `XuatBaoCaoDialog` (W3); `loaiBaoCaoCuaToi` (W1); `tuDienBaoCaoDongGop` (W2); `docNguoiDungDaLuu` (`src/lib/nguoi-dung-hien-tai.ts`); `api.getProjects`.
- Produces: `export function KhoiXuatBaoCao(props: { workspace: Workspace })`.

- [ ] **Step 1: Khối trong tab Bảng đóng góp**

`src/components/du-an/KhoiXuatBaoCao.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { api, displayProjectName, type Project, type Workspace } from '../../lib/api';
import { loaiBaoCaoCuaToi } from '../../lib/bao-cao-dong-gop';
import { docNguoiDungDaLuu } from '../../lib/nguoi-dung-hien-tai';
import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienBaoCaoDongGop } from '../../i18n/tu-dien/bao-cao-dong-gop';
import { XuatBaoCaoDialog } from './XuatBaoCaoDialog';

/** Trình duyệt chặn bộ nhớ (chế độ riêng tư nghiêm) thì ngay việc đọc `localStorage` cũng ném lỗi. */
function khoTrinhDuyet(): Pick<Storage, 'getItem'> | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Tab Bảng đóng góp trong Cài đặt: chọn dự án rồi mở hộp thoại xuất báo cáo. */
export function KhoiXuatBaoCao({ workspace }: { workspace: Workspace }) {
  const t = useTuDien(tuDienBaoCaoDongGop);
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  const [duAn, setDuAn] = useState<Project[] | null>(null);
  const [loi, setLoi] = useState<unknown>(null);
  const [chon, setChon] = useState('');
  const [mo, setMo] = useState(false);
  const nguoiDung = useMemo(() => docNguoiDungDaLuu(khoTrinhDuyet()), []);

  useEffect(() => {
    let huy = false;
    setDuAn(null);
    setLoi(null);
    api.getProjects(workspace.id).then(
      (ds) => {
        if (huy) return;
        setDuAn(ds);
        setChon((cu) => (ds.some((p) => p.id === cu) ? cu : (ds[0]?.id ?? '')));
      },
      (e: unknown) => {
        if (!huy) setLoi(e ?? new Error());
      },
    );
    return () => {
      huy = true;
    };
  }, [workspace.id]);

  const duAnChon = duAn?.find((p) => p.id === chon) ?? null;
  const loai = loaiBaoCaoCuaToi({
    userId: nguoiDung?.id,
    ownerId: workspace.ownerId,
    thanhVienWorkspace: workspace.members,
    thanhVienDuAn: duAnChon?.members,
  });

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
      <h3 className="font-bold text-on-surface">{t.khoi.tieuDe}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{t.khoi.moTa}</p>

      {loi !== null ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {dichLoi(loi, t.khoi.loiTaiDuAn)}
        </p>
      ) : duAn === null ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t.khoi.dangTaiDuAn}
        </p>
      ) : duAn.length === 0 ? (
        <p className="mt-3 text-sm text-on-surface-variant">{t.khoi.chuaCoDuAn}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.khoi.chonDuAn}</span>
            <select
              value={chon}
              onChange={(e) => setChon(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
            >
              {duAn.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayProjectName(p.name, ngonNgu)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setMo(true)}
            disabled={!duAnChon}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {t.nutNgan}
          </button>
        </div>
      )}

      {mo && duAnChon && (
        <XuatBaoCaoDialog
          projectId={duAnChon.id}
          projectName={duAnChon.name}
          projectCreatedAt={duAnChon.createdAt}
          loai={loai}
          onClose={() => setMo(false)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Gắn vào `ContributionsView`**

Trong `src/views/ContributionsView.tsx`:

1. Khối import `../lib/api` thêm `type Workspace`; thêm dòng `import { KhoiXuatBaoCao } from '../components/du-an/KhoiXuatBaoCao';` sau `import { tuDienDongGop } from '../i18n/tu-dien/dong-gop';`.
2. Sau `const [bang, setBang] = useState<BangDongGop | null>(null);` thêm:

```tsx
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
```

3. Trong `useEffect`, thay ba dòng

```tsx
        const workspace = await ensureDefaultWorkspace();
        const data = await api.getContributions(workspace.id);
        if (!cancelled) setBang(data);
```

bằng

```tsx
        const khongGian = await ensureDefaultWorkspace();
        if (!cancelled) setWorkspace(khongGian);
        const data = await api.getContributions(khongGian.id);
        if (!cancelled) setBang(data);
```

4. Ngay TRƯỚC dòng `{thanhVien.length === 0 ? (` thêm:

```tsx
      {workspace && <KhoiXuatBaoCao workspace={workspace} />}
```

- [ ] **Step 3: Nút ở đầu Bảng công việc**

Trong `src/views/ProjectBoardView.tsx`:

1. Dòng 3 (import từ `lucide-react`): thêm `FileDown` vào danh sách (giữ thứ tự chữ cái: sau `FileText`… hoặc ở bất kỳ chỗ nào trong ngoặc).
2. Sau dòng `import { tuDienMoiVaoNhom } from '../i18n/tu-dien/moi-vao-nhom';` thêm:

```tsx
import { XuatBaoCaoDialog } from '../components/du-an/XuatBaoCaoDialog';
import { loaiBaoCaoCuaToi } from '../lib/bao-cao-dong-gop';
import { tuDienBaoCaoDongGop } from '../i18n/tu-dien/bao-cao-dong-gop';
```

3. Sau dòng `const tMoi = useTuDien(tuDienMoiVaoNhom);` thêm:

```tsx
  const [baoCaoOpen, setBaoCaoOpen] = useState(false);
  const tBaoCao = useTuDien(tuDienBaoCaoDongGop);
  /** Chỉ để hiện đúng dòng "Báo cáo cả nhóm/của bạn"; máy chủ tự quyết khi dựng tệp. */
  const loaiBaoCao = useMemo(
    () =>
      loaiBaoCaoCuaToi({
        userId: currentUser?.id,
        ownerId: workspace?.ownerId,
        thanhVienWorkspace: workspace?.members,
        thanhVienDuAn: project?.members,
      }),
    [currentUser?.id, workspace, project],
  );
```

4. Trong `<div className="flex items-center gap-2 md:gap-4">` của phần đầu trang, chèn TRƯỚC khối `{coTheMoi && project && (`:

```tsx
          {project && (
            <button
              type="button"
              onClick={() => setBaoCaoOpen(true)}
              aria-label={tBaoCao.nut}
              className="flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 font-bold text-on-surface transition-colors hover:bg-surface-container"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden lg:inline">{tBaoCao.nut}</span>
            </button>
          )}
```

và chèn ngay SAU khối `{moiOpen && project && ( <MoiVaoNhomDialog … /> )}`:

```tsx
          {baoCaoOpen && project && (
            <XuatBaoCaoDialog
              projectId={project.id}
              projectName={project.name}
              projectCreatedAt={project.createdAt}
              loai={loaiBaoCao}
              onClose={() => setBaoCaoOpen(false)}
            />
          )}
```

- [ ] **Step 4: Cổng cuối của web**

```bash
npm run lint
npm run kiem-dich
npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')
npm run build
git diff --stat origin/main -- package.json package-lock.json
```

Expected: tsc sạch; kiem-dich "0"; mọi bài PASS; build xong; lệnh cuối không in gì (web không thêm thư viện).

Kiểm bằng mắt (không bắt buộc, chỉ khi có backend cục bộ): chạy backend `be-bao-cao` với Postgres thử và `.env` cục bộ tự soạn (KHÔNG chép `.env` production), rồi `VITE_API_URL=http://localhost:3000 npm run dev`; mở Bảng công việc → "Xuất báo cáo đóng góp" → PDF và Excel; Cài đặt → Bảng đóng góp → khối "Xuất báo cáo". Không chạy dev server khi `VITE_API_URL` trỏ ra API thật.

- [ ] **Step 5: Commit**

```bash
git add src/components/du-an/KhoiXuatBaoCao.tsx src/views/ContributionsView.tsx src/views/ProjectBoardView.tsx
git commit -m "feat(web): nut xuat bao cao dong gop o Bang cong viec va tab Bang dong gop" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

# PHẦN 3 — MOBILE (`D:\WEDO_PC\wt\mb-bao-cao`)

Chỉ phần phát được qua OTA. Không sửa `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `eas.json`; không thêm thư viện (`expo-web-browser` đã có sẵn); không thêm màn hình mới vào `src/app/` (nên không phải sinh lại `.expo/types/router.d.ts`). Kiểm thử: `npx jest <tệp>`; kiểu: `npx tsc --noEmit`. KHÔNG chạy `npx expo lint`.

### Task M0: Tạo worktree mobile và đo mốc

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: nhánh `main` của `D:\WeDo_ChPlay` (đỉnh `a3259dc`).
- Produces: worktree `D:\WEDO_PC\wt\mb-bao-cao` (nhánh `feat/bao-cao-dong-gop`), `node_modules` là junction sang `D:\WeDo_ChPlay\node_modules`, có `.env` và `.expo\types\router.d.ts`.

- [ ] **Step 1: Tạo worktree (PowerShell)**

```powershell
git -C D:\WeDo_ChPlay worktree add D:\WEDO_PC\wt\mb-bao-cao -b feat/bao-cao-dong-gop main
New-Item -ItemType Junction -Path D:\WEDO_PC\wt\mb-bao-cao\node_modules -Target D:\WeDo_ChPlay\node_modules
Copy-Item D:\WeDo_ChPlay\.env D:\WEDO_PC\wt\mb-bao-cao\.env
New-Item -ItemType Directory -Force D:\WEDO_PC\wt\mb-bao-cao\.expo\types
Copy-Item D:\WeDo_ChPlay\.expo\types\router.d.ts D:\WEDO_PC\wt\mb-bao-cao\.expo\types\router.d.ts
(Get-Item D:\WEDO_PC\wt\mb-bao-cao\node_modules).LinkType
```

Expected: worktree tạo xong; dòng cuối in `Junction`. Không in nội dung `.env` ra màn hình hay vào báo cáo.

**CẢNH BÁO:** khi dọn worktree này về sau, KHÔNG `Remove-Item -Recurse` và KHÔNG `git worktree remove` khi junction còn đó — cả hai sẽ xoá luôn `D:\WeDo_ChPlay\node_modules`. Luôn chạy `cmd /c rmdir D:\WEDO_PC\wt\mb-bao-cao\node_modules` TRƯỚC.

- [ ] **Step 2: Kiểm mốc (Git Bash, trong `D:/WEDO_PC/wt/mb-bao-cao`)**

```bash
npx tsc --noEmit && npx jest
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: tsc sạch, jest PASS. Ghi lại giá trị vân tay làm MỐC của worktree (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`; worktree cho số khác vì đường dẫn/junction thì vẫn dùng số đó làm mốc so sánh ở M4 — số chính thức đo lại ở checkout thật của `main` lúc deploy). Không commit.

---

### Task M1: API xin link và câu lỗi theo mã

**Files:**
- Create: `src/lib/api/bao-cao.ts`
- Test: `src/lib/api/__tests__/bao-cao.test.ts`
- Create: `src/lib/bao-cao.ts`
- Test: `src/lib/__tests__/bao-cao.test.ts`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError` (`src/lib/api/client.ts`); hợp đồng `POST /projects/:id/contribution-report/link` → `{ url, expiresAt }` (R10).
- Produces:
  - `export type DinhDangBaoCao = 'pdf' | 'xlsx'`
  - `export interface LinkBaoCao { url: string; expiresAt: string }`
  - `export function xinLinkBaoCao(projectId: string, format: DinhDangBaoCao): Promise<LinkBaoCao>`
  - `export function cauLoiBaoCao(loi: unknown): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/api/__tests__/bao-cao.test.ts`:

```ts
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
```

`src/lib/__tests__/bao-cao.test.ts`:

```ts
import { ApiError } from '../api/client';
import { cauLoiBaoCao } from '../bao-cao';

describe('cauLoiBaoCao', () => {
  it('dịch theo mã lỗi chứ không theo câu chữ', () => {
    expect(cauLoiBaoCao(new ApiError('x', 413, 'REPORT_TOO_LARGE'))).toMatch(/hơn 3\.000 việc/);
    expect(cauLoiBaoCao(new ApiError('x', 400, 'REPORT_BAD_RANGE'))).toMatch(/Khoảng thời gian/);
    expect(cauLoiBaoCao(new ApiError('x', 401, 'REPORT_LINK_INVALID'))).toMatch(/Xuất báo cáo lần nữa/);
  });

  it('404 và 429 có câu riêng', () => {
    expect(cauLoiBaoCao(new ApiError('Project not found', 404))).toBe(
      'Không tìm thấy dự án, hoặc bạn không còn trong dự án này.',
    );
    expect(cauLoiBaoCao(new ApiError('x', 429))).toBe('Bạn xuất báo cáo quá nhanh. Đợi một phút rồi thử lại.');
  });

  it('mất mạng: giữ câu tiếng Việt của apiRequest', () => {
    expect(cauLoiBaoCao(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))).toBe(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    );
  });

  it('lỗi không phải ApiError (ví dụ không mở được trình duyệt)', () => {
    expect(cauLoiBaoCao(new Error('No browser'))).toBe('Không mở được báo cáo. Thử lại sau ít phút.');
  });
});
```

Run: `npx jest src/lib/api/__tests__/bao-cao.test.ts src/lib/__tests__/bao-cao.test.ts`
Expected: FAIL — hai lỗi "Cannot find module".

- [ ] **Step 2: Viết mã**

`src/lib/api/bao-cao.ts`:

```ts
import { apiRequest } from './client';

export type DinhDangBaoCao = 'pdf' | 'xlsx';

/** Link tải có chữ ký, sống 5 phút (máy chủ: src/bao-cao-dong-gop). */
export interface LinkBaoCao {
  url: string;
  expiresAt: string;
}

/**
 * Xin link tải báo cáo đóng góp. App luôn dùng khoảng thời gian mặc định của
 * máy chủ (từ ngày tạo dự án tới hôm nay) và tiếng Việt — app chỉ có tiếng Việt.
 */
export function xinLinkBaoCao(projectId: string, format: DinhDangBaoCao): Promise<LinkBaoCao> {
  return apiRequest<LinkBaoCao>(`/projects/${encodeURIComponent(projectId)}/contribution-report/link`, {
    method: 'POST',
    body: { format, lang: 'vi' },
  });
}
```

`src/lib/bao-cao.ts`:

```ts
import { ApiError } from './api/client';

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  REPORT_TOO_LARGE:
    'Báo cáo có hơn 3.000 việc, quá lớn để xuất trên điện thoại. Hãy xuất trên máy tính và chọn khoảng thời gian ngắn hơn.',
  REPORT_BAD_RANGE: 'Khoảng thời gian của báo cáo không hợp lệ. Thử lại sau ít phút.',
  REPORT_LINK_INVALID: 'Link tải đã hết hạn. Bấm Xuất báo cáo lần nữa.',
};

export function cauLoiBaoCao(loi: unknown): string {
  if (loi instanceof ApiError) {
    if (loi.code && CAU_THEO_MA[loi.code]) return CAU_THEO_MA[loi.code];
    if (loi.status === 404) return 'Không tìm thấy dự án, hoặc bạn không còn trong dự án này.';
    if (loi.status === 429) return 'Bạn xuất báo cáo quá nhanh. Đợi một phút rồi thử lại.';
    // Mất mạng (status 0), máy chủ bận…: câu của apiRequest đã là tiếng Việt.
    return loi.message;
  }
  return 'Không mở được báo cáo. Thử lại sau ít phút.';
}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/lib/api/__tests__/bao-cao.test.ts src/lib/__tests__/bao-cao.test.ts && npx tsc --noEmit`
Expected: PASS (5 bài); tsc sạch.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/bao-cao.ts src/lib/api/__tests__/bao-cao.test.ts src/lib/bao-cao.ts src/lib/__tests__/bao-cao.test.ts
git commit -m "feat(mobile): API xin link bao cao dong gop va cau loi theo ma" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M2: Khối "Xuất báo cáo đóng góp"

**Files:**
- Create: `src/components/dong-gop/XuatBaoCao.tsx`
- Test: `src/components/dong-gop/__tests__/xuat-bao-cao.test.tsx`

**Interfaces:**
- Consumes: `xinLinkBaoCao`, `DinhDangBaoCao` (M1); `cauLoiBaoCao` (M1); `listProjects` (`src/lib/api/projects.ts`, khoá truy vấn `['projects', workspaceId]` dùng chung với màn Trò chuyện); `WebBrowser.openBrowserAsync`; `ErrorBanner`; token giao diện `colors`, `fontSize`, `radius`, `spacing`.
- Produces: `export function XuatBaoCao(props: { workspaceId: string }): React.JSX.Element`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/components/dong-gop/__tests__/xuat-bao-cao.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { XuatBaoCao } from '../XuatBaoCao';
import { listProjects } from '../../../lib/api/projects';
import { xinLinkBaoCao } from '../../../lib/api/bao-cao';
import { ApiError } from '../../../lib/api/client';
import { renderScreen } from '../../../test-utils/render';
import type { Project } from '../../../lib/types';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('../../../lib/api/projects', () => ({ listProjects: jest.fn() }));
jest.mock('../../../lib/api/bao-cao', () => ({ xinLinkBaoCao: jest.fn() }));

const mockedDuAn = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedLink = xinLinkBaoCao as jest.MockedFunction<typeof xinLinkBaoCao>;
const mockedMo = WebBrowser.openBrowserAsync as jest.MockedFunction<typeof WebBrowser.openBrowserAsync>;

const duAn = (id: string, name: string) =>
  ({
    id,
    name,
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }) as Project;
const URL_TAI = 'https://api.wedo.test/contribution-report/download?token=abc';

let queryClient: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedDuAn.mockResolvedValue([duAn('p1', 'EXE201'), duAn('p2', 'Đồ án môn học')]);
  mockedLink.mockResolvedValue({ url: URL_TAI, expiresAt: '2026-10-02T03:05:00.000Z' });
  mockedMo.mockResolvedValue({ type: 'opened' } as never);
});

afterEach(() => {
  queryClient.clear();
});

const ve = () =>
  renderScreen(
    <QueryClientProvider client={queryClient}>
      <XuatBaoCao workspaceId="w1" />
    </QueryClientProvider>,
  );

describe('XuatBaoCao', () => {
  it('mặc định dự án đầu và PDF; bấm Xuất báo cáo thì xin link rồi mở trình duyệt', async () => {
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    await waitFor(() => expect(mockedMo).toHaveBeenCalledWith(URL_TAI));
    expect(mockedLink).toHaveBeenCalledWith('p1', 'pdf');
    expect(mockedDuAn).toHaveBeenCalledWith('w1');
  });

  it('chọn dự án khác và Excel', async () => {
    const man = await ve();
    await waitFor(() => expect(man.getByText('Đồ án môn học')).toBeTruthy());

    await fireEvent.press(man.getByText('Đồ án môn học'));
    await fireEvent.press(man.getByText('Excel'));
    await fireEvent.press(man.getByText('Xuất báo cáo'));

    await waitFor(() => expect(mockedLink).toHaveBeenCalledWith('p2', 'xlsx'));
  });

  it('lỗi máy chủ hiện câu tiếng Việt theo mã, không mở trình duyệt', async () => {
    mockedLink.mockRejectedValue(new ApiError('Báo cáo có hơn 3.000 việc.', 413, 'REPORT_TOO_LARGE'));
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    expect(await man.findByText(/quá lớn để xuất trên điện thoại/)).toBeTruthy();
    expect(mockedMo).not.toHaveBeenCalled();
  });

  it('mất mạng: hiện câu kết nối của app', async () => {
    mockedLink.mockRejectedValue(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0));
    const man = await ve();
    await waitFor(() => expect(man.getByText('EXE201')).toBeTruthy());

    await fireEvent.press(man.getByText('Xuất báo cáo'));

    expect(await man.findByText('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.')).toBeTruthy();
  });

  it('không gian chưa có dự án: báo rõ, không có nút xuất', async () => {
    mockedDuAn.mockResolvedValue([]);
    const man = await ve();

    expect(await man.findByText('Không gian này chưa có dự án nào.')).toBeTruthy();
    expect(man.queryByText('Xuất báo cáo')).toBeNull();
  });
});
```

Run: `npx jest src/components/dong-gop`
Expected: FAIL — "Cannot find module '../XuatBaoCao'".

- [ ] **Step 2: Viết mã**

`src/components/dong-gop/XuatBaoCao.tsx`:

```tsx
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';

import { ErrorBanner } from '../ui/ErrorBanner';
import { xinLinkBaoCao, type DinhDangBaoCao } from '../../lib/api/bao-cao';
import { listProjects } from '../../lib/api/projects';
import { cauLoiBaoCao } from '../../lib/bao-cao';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const DINH_DANG: Array<{ giaTri: DinhDangBaoCao; nhan: string }> = [
  { giaTri: 'pdf', nhan: 'PDF' },
  { giaTri: 'xlsx', nhan: 'Excel' },
];

/**
 * Khối "Xuất báo cáo đóng góp" ở Tài khoản → Bảng đóng góp.
 *
 * App không tự lưu tệp: thêm thư viện lưu/chia sẻ tệp là đổi dấu vân tay, không
 * phát qua OTA được. Nên app xin máy chủ một link tải có chữ ký (sống 5 phút)
 * rồi mở bằng trình duyệt — trình duyệt hiện PDF hoặc tải Excel, người dùng
 * chia sẻ hay lưu bằng menu của trình duyệt. Khoảng thời gian dùng mặc định.
 */
export function XuatBaoCao({ workspaceId }: { workspaceId: string }) {
  const duAn = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
  });
  const [chon, setChon] = useState<string | null>(null);
  const [dinhDang, setDinhDang] = useState<DinhDangBaoCao>('pdf');
  const [dangXuat, setDangXuat] = useState(false);
  const [loi, setLoi] = useState('');

  const ds = duAn.data ?? [];
  // Chưa chọn, hay dự án đã chọn không còn trong danh sách: lấy dự án đầu.
  const projectId = chon && ds.some((p) => p.id === chon) ? chon : (ds[0]?.id ?? null);

  const xuat = async () => {
    if (!projectId || dangXuat) return;
    setDangXuat(true);
    setLoi('');
    try {
      const { url } = await xinLinkBaoCao(projectId, dinhDang);
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      setLoi(cauLoiBaoCao(e));
    } finally {
      setDangXuat(false);
    }
  };

  return (
    <View style={styles.khoi}>
      <Text style={styles.tieuDe}>Xuất báo cáo đóng góp</Text>
      <Text style={styles.moTa}>
        Leader nhận báo cáo cả nhóm, thành viên nhận báo cáo của riêng mình. Số liệu tính từ ngày tạo dự án tới hôm nay.
      </Text>

      {duAn.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : duAn.isError && !duAn.data ? (
        <ErrorBanner message="Không tải được danh sách dự án." />
      ) : ds.length === 0 ? (
        <Text style={styles.moTa}>Không gian này chưa có dự án nào.</Text>
      ) : (
        <>
          <Text style={styles.nhan}>Dự án</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hang}>
            {ds.map((p) => {
              const dangChon = p.id === projectId;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dangChon }}
                  onPress={() => setChon(p.id)}
                  style={[styles.chip, dangChon && styles.chipChon]}
                >
                  <Text style={[styles.chipChu, dangChon && styles.chipChuChon]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.nhan}>Định dạng</Text>
          <View style={styles.hang}>
            {DINH_DANG.map(({ giaTri, nhan }) => {
              const dangChon = giaTri === dinhDang;
              return (
                <Pressable
                  key={giaTri}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: dangChon }}
                  onPress={() => setDinhDang(giaTri)}
                  style={[styles.chip, dangChon && styles.chipChon]}
                >
                  <Text style={[styles.chipChu, dangChon && styles.chipChuChon]}>{nhan}</Text>
                </Pressable>
              );
            })}
          </View>

          {loi ? <ErrorBanner message={loi} /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: dangXuat, busy: dangXuat }}
            disabled={dangXuat}
            onPress={() => void xuat()}
            style={[styles.nut, dangXuat && styles.nutTat]}
          >
            {dangXuat ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.nutChu}>Xuất báo cáo</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  khoi: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tieuDe: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  moTa: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
  nhan: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  hang: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    maxWidth: 220,
  },
  chipChon: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipChu: { fontSize: fontSize.sm, color: colors.text },
  chipChuChon: { color: colors.primary, fontWeight: '600' },
  nut: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  nutTat: { opacity: 0.6 },
  nutChu: { color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: '600' },
});
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/components/dong-gop && npx tsc --noEmit`
Expected: PASS (5 bài); tsc sạch.

- [ ] **Step 4: Commit**

```bash
git add src/components/dong-gop
git commit -m "feat(mobile): khoi Xuat bao cao dong gop xin link roi mo trinh duyet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M3: Gắn khối vào màn Tài khoản → Bảng đóng góp

**Files:**
- Modify: `src/app/(tabs)/account/contributions.tsx` (import ~dòng 13-18; đầu `ScrollView` dòng 95)
- Modify: `src/lib/__tests__/bang-dong-gop-web.test.tsx` (giả `listProjects`; thêm một bài)

**Interfaces:**
- Consumes: `XuatBaoCao` (M2); `useWorkspace().active` (có sẵn trong màn).
- Produces: màn Bảng đóng góp có khối "Xuất báo cáo đóng góp" ở đầu khi đã có không gian làm việc.

- [ ] **Step 1: Viết bài kiểm thất bại**

Trong `src/lib/__tests__/bang-dong-gop-web.test.tsx`:

1. Sau dòng `jest.mock('../api/tasks', () => ({ getContributions: jest.fn() }));` thêm:

```tsx
// Màn có khối Xuất báo cáo, khối đó đọc danh sách dự án của không gian.
jest.mock('../api/projects', () => ({ listProjects: jest.fn().mockResolvedValue([]) }));
```

2. Thêm vào cuối `describe('Bảng đóng góp — nút mở web', …)` (trước `});` đóng):

```tsx
  it('có khối "Xuất báo cáo đóng góp" ở đầu màn', async () => {
    const man = await renderScreen(
      <QueryClientProvider client={queryClient}>
        <ManDongGop />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(man.getByText('Lê Hữu Đại')).toBeTruthy());
    expect(man.getByText('Xuất báo cáo đóng góp')).toBeTruthy();
  });
```

Run: `npx jest src/lib/__tests__/bang-dong-gop-web.test.tsx`
Expected: FAIL đúng bài mới — "Unable to find an element with text: Xuất báo cáo đóng góp".

- [ ] **Step 2: Gắn khối**

Trong `src/app/(tabs)/account/contributions.tsx`:

1. Sau dòng `import { GradientHeader } from '../../../components/ui/GradientHeader';` thêm:

```tsx
import { XuatBaoCao } from '../../../components/dong-gop/XuatBaoCao';
```

2. Ngay sau dòng `<ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>` (dòng 95), trước khối bình luận "Chỉ báo lỗi to khi KHÔNG có gì để xem", thêm:

```tsx
        {/*
          Đặt trên cùng: bảng bên dưới là của cả không gian làm việc, còn báo
          cáo xuất theo từng dự án — người dùng chọn dự án ngay trong khối.
        */}
        {active?.id ? <XuatBaoCao workspaceId={active.id} /> : null}
```

- [ ] **Step 3: Chạy lại**

Run: `npx jest src/lib/__tests__/bang-dong-gop-web.test.tsx src/components/dong-gop && npx tsc --noEmit`
Expected: PASS (bài cũ "không có nút Xem đầy đủ trên web" vẫn xanh); tsc sạch.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tabs)/account/contributions.tsx" src/lib/__tests__/bang-dong-gop-web.test.tsx
git commit -m "feat(mobile): gan khoi xuat bao cao vao man Bang dong gop" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M4: Cổng cuối của mobile — kiểu, toàn bộ kiểm thử, dấu vân tay

**Files:** không sửa tệp nào.

**Interfaces:**
- Consumes: M1–M3.
- Produces: bằng chứng nhánh phát được qua OTA.

- [ ] **Step 1: Kiểu và kiểm thử**

```bash
npx tsc --noEmit
npx jest
```

Expected: sạch, mọi bộ PASS.

- [ ] **Step 2: Không đụng cấu hình native**

```bash
git diff --name-only main...HEAD -- package.json package-lock.json app.json app.config.js eas.json plugins
git diff --name-only main...HEAD | grep -v '^src/'; echo "ma thoat grep: $?"
```

Expected: lệnh đầu không in gì; lệnh hai không in gì (`ma thoat grep: 1`) — chỉ `src/` thay đổi.

- [ ] **Step 3: Dấu vân tay Android**

```bash
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: đúng bằng MỐC ghi ở M0 Step 2 (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`). Khác mốc → có thứ ngoài `src/` bị đổi: tìm và hoàn lại, không đưa lên OTA.

- [ ] **Step 4: Báo cáo, không commit**

Ghi vào báo cáo cho người giao việc: số commit, kết quả `tsc`/`jest`, giá trị vân tay. Gộp vào `main` và `eas update` là việc của chủ dự án.

---

## Self-Review

### Spec coverage (mục spec → task)

| Mục spec | Nội dung | Task |
|---|---|---|
| 1 | Leader/chủ workspace → báo cáo nhóm; thành viên → báo cáo cá nhân | R8 (`loaiBaoCaoTheoVaiTro`), R9, W1 (`loaiBaoCaoCuaToi` chỉ để hiển thị) |
| 1 | PDF (có chỗ ký) và Excel | R6, R7 |
| 1 | Miễn phí mọi nền tảng, không áp gói | R9/R10 không gọi `EntitlementsService`; M2 không phân nhánh theo nền tảng |
| 1 | Ngoài phạm vi (lịch sử, số lần trả lại, chế độ giảng viên, logo, nhiều dự án, email) | không task nào làm; R4 bỏ `biTraLai` |
| 2.1 | Theo một dự án; khoảng ngày theo `createdAt` giờ VN, `from`/`to` tính cả hai đầu, mặc định ngày tạo dự án → hôm nay | R2 (`khoangNgayBaoCao`, `mocTruyVan`, `trongKhoang`), R4 (lọc lại trong hàm thuần), R9 (truy vấn), W1 (`khoangNgayMacDinh`) |
| 2.1 | Chỉ việc đã giao, không bị từ chối | R4 (bài "không tính việc chưa giao và việc đã bị từ chối nhận") |
| 2.2 | Dùng đúng `tinhDongGop`; 8 cột; "—" khi không có tỷ lệ; bỏ "Bị trả lại" | R4 (bài "khớp đúng tinhDongGop"), R3 (`dinhDangTyLe`), R6, R7 |
| 2.2 | Mọi thành viên kể cả 0 việc; sắp theo hoàn thành giảm dần rồi theo tên | R4 |
| 2.3 | Tên việc, Hạn chót, Ngày nộp (quy tắc `MOC_CO_LUC_NOP`), Ngày hoàn thành, Kết quả (6 loại), Số tệp | R2 (`lucNopDeTinh`), R3 (`nhanKetQua`), R4 (`ketQuaViec`) |
| 2.3 | "Trễ N ngày"/"Quá hạn N ngày" theo lịch VN, tối thiểu 1 | R2 (`soNgayLichVN`), R4 (bài TZ=UTC) |
| 2.3 | Ngày giờ VN, `dd/MM/yyyy HH:mm` / `MMM d, yyyy HH:mm` | R3 (`dinhDangLuc`) |
| 2.4 | Tiêu đề nhóm/cá nhân, dự án, workspace, Leader nối dấu phẩy, số thành viên, khoảng thời gian, lúc xuất + người xuất, ghi chú | R3 (`dongThongTin`, `CHU_BAO_CAO.ghiChu`), R6, R7 |
| 2.5 | Chỉ tên; báo cáo cá nhân không lộ số liệu người khác (cả số thành viên) | R4 (bài JSON không chứa người khác, `soThanhVien: null`), R9 (lọc `assigneeId` ngay trong truy vấn), select chỉ `fullName` |
| 3.1 | A4 dọc, lề 40pt, Be Vietnam Pro Regular/SemiBold nhúng, `OFL.txt` ở `assets/fonts/` | R1, R7 |
| 3.1 | Trang 1 tổng hợp; trang sau mỗi người một mục, sang trang lặp tiêu đề cột; khung xác nhận cuối báo cáo nhóm; chân trang "Trang i/n" + "Xuất từ WeDo — wedofpt.com.vn" | R7 (bài 150 việc đếm tiêu đề cột = số trang − 1) |
| 3.2 | Sheet "Tổng hợp"/"Summary": phần đầu, tiêu đề in đậm, bộ lọc, cố định dòng, tỷ lệ số `0.0"%"`, ô trống khi không có | R6 |
| 3.2 | Sheet "Chi tiết việc"/"Tasks": cột Thành viên, ngày là ngày giờ Excel theo giờ VN, Kết quả + Số ngày trễ tách cột; cá nhân cùng cấu trúc | R6 |
| 3.3 | Tên tệp không dấu, cắt 60, `_ca-nhan`; `filename*` RFC 5987 dùng chung | R5, R10 (header), W1 (bản web cùng bộ mẫu) |
| 4 | Ba API, mã HTTP | R10 (bài HTTP) |
| 4 | Một hàm quyết định quyền; 404 cho người ngoài; admin workspace → nhóm | R8, R9 |
| 4 | Token: khoá dẫn xuất từ `JWT_SECRET` + nhãn riêng, 5 phút, đủ trường, kiểm lại quyền khi tải, không lưu DB | R8 (`khoaKyBaoCao`, `kyTokenBaoCao`, `docTokenBaoCao`), R9 (`taiBangToken`) |
| 4 | Kiểm đầu vào: `format`, ngày + `from ≤ to` → 400 `REPORT_BAD_RANGE`, `lang` mặc định `vi`, DTO chỉ ở đường mới | R2, R10 (DTO + bài HTTP 400) |
| 4 | Hạn mức 10/phút/người; tải bằng token 30/phút/IP | R11 |
| 4 | Tối đa 3.000 việc → 413 `REPORT_TOO_LARGE` | R2, R9 (cả lúc xin link) |
| 4 | Cấu trúc `src/bao-cao-dong-gop/`: hàm dựng, hai hàm vẽ, service, hai controller | R4, R6, R7, R9, R10 |
| 4 | Thư viện `exceljs`, `pdfkit`, `@types/pdfkit`; không migration, không biến môi trường | R1, R12 Step 2 |
| 4 | Lint đủ kiểu, không `any`, `--max-warnings 0` | mọi task backend, R12 |
| 5 | Nút ở ProjectBoardView và tab Bảng đóng góp (kèm chọn dự án) | W4 |
| 5 | Hộp thoại PDF/Excel, Từ/Đến ngày mặc định, dòng loại báo cáo, "Đang tạo báo cáo…", lỗi dịch theo mã | W3, W2 |
| 5 | `fetch` có đăng nhập → blob → `<a download>` → giải phóng URL | W1 (`luuBlob`), W2 (`taiBaoCaoDongGop`) |
| 5 | Song ngữ, `kiem-dich` = 0, `lang` theo ngôn ngữ đang chọn | W2, W3, W4 Step 4 |
| 6 | Khối Xuất báo cáo (chọn dự án, PDF/Excel, khoảng mặc định) → POST link → `openBrowserAsync` | M1, M2, M3 |
| 6 | Lỗi mạng/máy chủ → câu tiếng Việt theo mã | M1 (`cauLoiBaoCao`), M2 |
| 6 | Không thư viện, không sửa `app.json`/`package.json`; vân tay `82cd9900…` | M4 |
| 7 | Không có việc trong kỳ vẫn xuất; thành viên 0 việc; cá nhân "Bạn chưa được giao việc nào…"; tên dài PDF xuống dòng (cắt ở 500 ký tự), Excel để nguyên; emoji → "?"; link hết hạn/bị sửa → 401 HTML hai thứ tiếng | R4, R6, R7, R3 (`chuPdf`), R10 (`trangLoiTaiBaoCao`) |
| 8 | Kiểm thử backend/web/app như liệt kê | mỗi task; R12; W4 Step 4; M4 |
| 9 | Thứ tự đưa lên | mục "Execution order and deploy" |

### Quét chỗ trống
Không có "TBD"/"TODO"/"tương tự task N". Ba task giao diện thuần (W3, W4, phần JSX của M3) không có bài kiểm riêng cho từng pixel; logic của chúng nằm ở hàm thuần đã kiểm (W1, W2, M1) và M2/M3 có bài kiểm RNTL. Cổng của W3/W4 là `tsc` + `kiem-dich` + `build`.

### Nhất quán tên và kiểu
- Backend: `laNgayCoThat`, `dauNgayVNTuChuoi`, `soNgayLichVN`, `lucNopDeTinh` (R2 → R4, R8); `KhoangNgay`, `khoangNgayBaoCao`, `mocTruyVan`, `trongKhoang` (R2 → R4, R9); `MA_LOI_BAO_CAO`, `TOI_DA_VIEC_BAO_CAO`, `loiKhoangNgay`, `loiQuaLon`, `loiLinkHong` (R2 → R9, R10); kiểu `LoaiBaoCao`, `DinhDangBaoCao`, `NgonNguBaoCao`, `YeuCauBaoCao`, `KetQuaViec`, `ViecTrongBaoCao`, `DongTongHop`, `MucThanhVien`, `NguoiKy`, `BaoCaoDongGop` (R3 → R4–R10); `CHU_BAO_CAO`, `dinhDangLuc`, `dinhDangNgay`, `dinhDangTyLe`, `nhanKetQua`, `nhanKetQuaNgan`, `soNgayTre`, `tenCoGhiChu`, `dongThongTin`, `chuPdf` (R3 → R6, R7); `ViecNguon`, `ThanhVienNguon`, `DauVaoBaoCao`, `ketQuaViec`, `dungBaoCao` (R4 → R9); `contentDisposition`, `MIME_BAO_CAO`, `tenKhongDau`, `tenTepBaoCao` (R5 → R9, R10); `TEP_PHONG`, `thuMucPhongChu` (R1 → R7); `veBaoCaoExcel` (R6), `veBaoCaoPdf` (R7) → R9; `dieuKienXemDuAn`, `loaiBaoCaoTheoVaiTro`, `MUC_DICH_TOKEN_BAO_CAO`, `HAN_TOKEN_BAO_CAO_GIAY`, `NoiDungTokenBaoCao`, `khoaKyBaoCao`, `kyTokenBaoCao`, `docTokenBaoCao` (R8 → R9); `BaoCaoDongGopService.{xacDinhQuyen, taoTep, taoLink, taiBangToken}`, `TepBaoCao`, `LinkTaiBaoCao` (R9 → R10); `TruyVanBaoCaoDto`, `TaoLinkBaoCaoDto`, `trangLoiTaiBaoCao`, `TrangLoiTaiBaoCaoFilter`, `thanhTep`, `gocMayChu`, `BaoCaoDongGopController`, `TaiBaoCaoController`, `BaoCaoDongGopModule` (R10).
- Web: `DinhDangBaoCao`, `LoaiBaoCao`, `ThamSoBaoCao`, `tenKhongDau`, `tenTepBaoCao`, `tenTepTuHeader`, `khoangNgayMacDinh`, `kiemKhoangNgay`, `LoiKhoangNgay` (= khoá `hopThoai.loiNgay`), `loaiBaoCaoCuaToi`, `duongDanBaoCao`, `luuBlob` (W1 → W2–W4); `api.taiBaoCaoDongGop`, `tuDienBaoCaoDongGop` (W2 → W3, W4); `XuatBaoCaoDialog` (W3 → W4); `KhoiXuatBaoCao` (W4).
- Mobile: `xinLinkBaoCao`, `DinhDangBaoCao`, `LinkBaoCao`, `cauLoiBaoCao` (M1 → M2); `XuatBaoCao` (M2 → M3).
- Hợp đồng HTTP giống nhau ở ba nơi: `GET /projects/:id/contribution-report?format&from&to&lang`, `POST /projects/:id/contribution-report/link` → `{ url, expiresAt }`, `GET /contribution-report/download?token=`; mã lỗi `REPORT_BAD_RANGE`, `REPORT_TOO_LARGE`, `REPORT_LINK_INVALID`.
- Bộ mẫu tên tệp giống hệt ở `ten-tep.spec.ts` (BE) và `bao-cao-dong-gop.test.ts` (FE).

### Chỗ spec chưa nói rõ và cách kế hoạch chốt
1. **Phông đi theo bản deploy:** workflow deploy chỉ đóng gói `dist prisma package.json package-lock.json prisma.config.ts`. Kế hoạch KHÔNG sửa workflow (push sửa workflow cần token có quyền `workflow`) mà để `nest build` chép `assets/fonts/*` vào `dist/assets/fonts` qua `nest-cli.json`; `thuMucPhongChu` đi lên hai cấp từ tệp biên dịch nên đúng ở cả jest (`src/…`) lẫn máy chủ (`dist/src/…`). Có bài `test:ops` ghim SHA-256 phông và mục `assets`, R1 Step 7 kiểm `dist/assets/fonts` sau build.
2. **Nguồn phông:** `@fontsource/be-vietnam-pro` chỉ có woff/woff2 chia theo vùng mã, không có TTF; lấy `BeVietnamPro-Regular.ttf`, `BeVietnamPro-SemiBold.ttf`, `OFL.txt` từ `raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/` một lần, kiểm SHA-256 đã đo ngày 02/10/2026.
3. **Phiên bản thư viện:** `exceljs@4.4.0` tự mang kiểu; `pdfkit` ghim `0.17.2` vì `@types/pdfkit` mới nhất là `0.17.6` (pdfkit 0.18–0.20 chưa có kiểu tương ứng).
4. **Kiểm chữ trong PDF:** phông nhúng tập con lưu mã glyph, `compress:false` cũng không tìm được chữ trong byte; bài kiểm nghe `PDFDocument.prototype.text` và đếm `/Type /Page`.
5. **Ký tự không có trong phông:** danh sách trắng các khối Unicode Be Vietnam Pro có (Latin, Latin-1, Latin mở rộng A, Ơ/Ư, khối tiếng Việt dựng sẵn, vài dấu câu); ngoài danh sách → "?". Không phụ thuộc `fontkit` (thư viện con của pdfkit, không khai trong `package.json`).
6. **Người đã rời dự án mà còn việc trong kỳ:** vẫn có dòng trong báo cáo nhóm, ghi "(đã rời dự án)", để tổng khớp bảng đóng góp (bảng đó cũng đếm họ); không có trong khung xác nhận.
7. **Báo cáo cá nhân:** không có số thành viên (kể cả ở phần đầu) và không có khung xác nhận, nhưng VẪN ghi tên Leader — thành viên vốn thấy Leader của dự án, và giảng viên cần biết nhóm của ai.
8. **Việc xong, có hạn nhưng không có lúc xong lẫn lúc nộp** (dữ liệu rất cũ): thêm nhãn "Đã xong, không rõ lúc xong" — `tinhDongGop` cũng không tính nó vào đúng hạn hay trễ hạn, nên nhãn khớp số.
9. **Excel tách "Trễ N ngày":** cột Kết quả ghi "Trễ hạn"/"Quá hạn" (không số), cột "Số ngày trễ" mang N cho cả trễ hạn lẫn quá hạn; các loại khác để trống.
10. **Vị trí `_ca-nhan`:** sau ngày, trước đuôi tệp (`…_2026-10-02_ca-nhan.pdf`); ngày trong tên tệp là ngày XUẤT theo giờ VN.
11. **Hạn mức:** xuất trực tiếp và xin link CHUNG một hạn mức 10/phút/người; đường tải bằng token chỉ tính theo IP (30/phút) vì guard chạy trước và không có access token — "10/phút/người" của spec áp cho hai đường có đăng nhập.
12. **Lỗi khi tải bằng token:** mọi lỗi HTTP của đường này thành trang HTML hai thứ tiếng (401 hết hạn/bị sửa/tài khoản bị khoá, 404 không còn quyền, 413, 429, còn lại "không tạo được"); người bị mời ra trong 5 phút nhận 404; Leader bị hạ xuống thành viên nhận báo cáo cá nhân (quyền tính lại lúc tải).
13. **Link tuyệt đối không cần biến môi trường mới:** `url` dựng từ `req.protocol` + `Host` (main.ts đã `trust proxy 1` nên là `https` sau Azure).
14. **Trần 3.000 việc** đếm việc tạo trong khoảng thời gian của dự án (báo cáo cá nhân: chỉ việc giao cho người đó), kiểm cả lúc xin link để app báo lỗi bằng câu tiếng Việt thay vì mở trình duyệt ra trang lỗi.
15. **Web đọc tên tệp:** CORS hiện không mở header nào; đường `GET …/contribution-report` tự gửi `Access-Control-Expose-Headers: Content-Disposition` để web lấy đúng tên máy chủ đặt, dự phòng bằng `tenTepBaoCao` cùng quy tắc. Dòng "Báo cáo cả nhóm/của bạn" trên web tính ở phía khách từ vai trò (chỉ để hiển thị; máy chủ quyết định).
16. **Tab Bảng đóng góp của web:** ô chọn dự án lấy dự án của workspace mặc định — đúng workspace mà bảng trong tab đang hiện.
17. **App:** luôn `lang: 'vi'` (app chỉ có tiếng Việt) và khoảng thời gian mặc định; khối đặt trên cùng màn Bảng đóng góp vì bảng là của cả không gian, còn báo cáo theo dự án.
18. **Thứ tự việc trong mục của từng người:** hạn sớm trước, việc không hạn xuống cuối, cùng hạn theo tên. **Khung xác nhận:** Leader trước, rồi thành viên, theo tên.
19. **Tên việc trong PDF** cắt ở 500 ký tự (thêm "…") để một ô không cao hơn một trang; Excel giữ nguyên. Chuỗi bắt đầu bằng "=" vào Excel ở dạng chữ, không thành công thức.

---

## Execution order and deploy

### Thứ tự làm
1. **Backend** R0 → R12 (tuần tự; R4 cần R2, R3; R7 cần R1, R3; R9 cần R2–R8; R10 cần R9).
2. **Web** W0 → W4 (W1 trước W2; W3 sau W2; W4 sau W3).
3. **Mobile** M0 → M4.

Ba repo không phụ thuộc nhau lúc làm (web và app chỉ cần hợp đồng HTTP ở khối **Interfaces** của R10), nhưng làm theo thứ tự trên để lỗi hợp đồng lộ ra sớm ở phía máy chủ.

### Đưa lên (chủ dự án làm — người thực hiện kế hoạch KHÔNG push, KHÔNG deploy, KHÔNG `eas update`)
1. **Backend.** Gộp `feat/bao-cao-dong-gop` vào `backend` rồi push. Không có migration và không đổi `prisma/`, nên lần chạy tự động đi qua cổng "Block destructive database changes" và bước migration bỏ qua; workflow tự chạy lint đầy đủ, `test:ops` (ghim phông), build (chép phông vào `dist`), jest. Sau deploy:
   - `curl -i "https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/projects/x/contribution-report?format=pdf"` → **401** (chưa đăng nhập);
   - `curl -i "https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/contribution-report/download?token=sai"` → **401**, `Content-Type: text/html`, có câu "Link đã hết hạn, hãy xuất lại trong app.";
   - `GET …/health/ready` → 200.
2. **Web.** Gộp `feat/bao-cao-dong-gop` của FE vào `main`; Vercel tự build (sau khi backend đã lên, nếu không nút xuất trả 404). Kiểm trên `https://wedofpt.com.vn` với một dự án thật của nhóm: tài khoản Leader xuất PDF và Excel ở Bảng công việc (PDF có khung xác nhận, tên tệp `Bao-cao-dong-gop_…`), tài khoản thành viên xuất ở Cài đặt → Bảng đóng góp (tên tệp có `_ca-nhan`, không thấy ai khác), chuyển sang tiếng Anh xuất lại một lần. Lần xuất PDF đầu tiên trên máy chủ thật đồng thời xác nhận phông đã có trong gói deploy.
3. **App.**
   - Dọn worktree: `cmd /c rmdir D:\WEDO_PC\wt\mb-bao-cao\node_modules` TRƯỚC, rồi mới `git -C D:\WeDo_ChPlay worktree remove D:\WEDO_PC\wt\mb-bao-cao`.
   - Gộp `feat/bao-cao-dong-gop` vào `main` ở `D:\WeDo_ChPlay`.
   - Đo vân tay ở checkout thật của `main`: `npx expo-updates fingerprint:generate --platform android` phải ra `82cd990037afe065754c48a9a004f293c0d84be9`.
   - Chủ dự án chạy `npx eas-cli@latest update --branch production --platform android --environment production`. Thử trên máy thật: Tài khoản → Bảng đóng góp → Xuất báo cáo → trình duyệt mở PDF / tải Excel.
   - **iPhone:** có ở bản build iOS kế tiếp — cherry-pick ba commit mobile của kế hoạch này sang nhánh `ios` (worktree `D:\WeDo_ChPlay-ios`). Tính năng không đụng thanh toán hay gói.
4. **Dọn worktree backend và web** (không có junction), sau khi đã gộp: `git -C D:\WEDO_PC\BE_WEDO worktree remove D:\WEDO_PC\wt\be-bao-cao`, `git -C D:\WEDO_PC\FE_WEDO worktree remove D:\WEDO_PC\wt\fe-bao-cao`.
