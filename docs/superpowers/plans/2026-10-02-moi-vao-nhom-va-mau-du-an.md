# Mời vào nhóm và mẫu dự án — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leader mời cả nhóm vào dự án bằng một link/QR/mã 8 ký tự (vào thẳng, hết hạn sau 7 ngày) và tạo dự án mới từ 6 mẫu dựng sẵn có đủ việc và hạn chót.

**Architecture:** Máy chủ thêm bảng `ProjectInvite`, một service mời (`ProjectInvitesService`) dùng lại quyền `ensureProjectManager` và đúng logic ghi thành viên của `addMember` (tách ra `lenhGhiThanhVien`), hai controller (`/projects/:id/invite` cho Leader, `/invites/:code` công khai + `join`), danh mục mẫu nằm trong code (`mau-du-an.ts`) và `POST /projects` tạo dự án + việc trong một giao dịch. Web thêm đường dẫn có tham số `#/moi/:code`, hộp thoại "Mời vào nhóm" có QR và thẻ "Bắt đầu từ mẫu" trong hộp thoại tạo dự án. App chỉ thêm phần phát được qua OTA: chia sẻ link bằng `Share.share`, ô "Nhập mã mời", và chạm push mở đúng chat dự án.

**Tech Stack:** NestJS 11 + Prisma 7.8 (PostgreSQL, `@prisma/adapter-pg`) + jest/ts-jest; Vite + React 19 + Tailwind 4 + node:test qua `tsx`; thư viện mới duy nhất `qrcode` (web); Expo SDK 57 + React Native + expo-router (typed routes) + TanStack Query v5 + jest-expo + @testing-library/react-native v14.

Thiết kế gốc (đã duyệt): `docs/superpowers/specs/2026-10-02-moi-vao-nhom-va-mau-du-an-design.md`

## Global Constraints

- **Tương thích ngược:** không đổi hay bỏ API, trường, loại thông báo nào mà Android 1.0.13/1.0.14, iOS 1.0.14 và web cũ đang đọc; `POST /projects` vẫn nhận đúng thân cũ, chỉ thêm `templateId`, `startDate`, `lang` không bắt buộc, `forbidNonWhitelisted` vẫn chặn trường lạ.
- **Migration chỉ THÊM:** `git diff -w <nhánh gốc> -- prisma/schema.prisma prisma/migrations prisma.config.ts | grep '^-[^-]'` phải rỗng, để lần deploy tự động đi qua cổng "Block destructive database changes".
- **Dấu vân tay OTA Android không đổi:** `npx expo-updates fingerprint:generate --platform android` phải ra `82cd990037afe065754c48a9a004f293c0d84be9` (đo ở một checkout thật của `main` sau khi gộp); app không sửa `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `eas.json`, không thêm thư viện native.
- **Backend lint đầy đủ = 0:** `npm run lint -- --max-warnings 0` (không `any`, request đã đăng nhập dùng kiểu `YeuCauDaXacThuc`), cộng `npx tsc --noEmit -p tsconfig.json` và `npx jest` xanh.
- **Web song ngữ:** mọi chữ giao diện nằm trong từ điển vi + en (`src/i18n/tu-dien`), `npm run kiem-dich` = 0, `npm run lint` (tsc) và `npm run build` sạch; mã lỗi mới dịch ở `src/i18n/loi.ts`.
- **Commit:** tiền tố conventional + tiếng Việt KHÔNG dấu + dòng trống + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (dùng hai `-m`). Không `--no-verify`.
- **Chữ giao diện và bình luận:** tiếng Việt CÓ dấu, chuẩn NFC (bình luận giải thích *vì sao*). Mã lỗi máy đọc bằng tiếng Anh viết hoa (`INVITE_EXPIRED`…).
- **Không gọi production hay dịch vụ ngoài:** cơ sở dữ liệu thử là Postgres trong Docker ở `127.0.0.1`; KHÔNG chép `.env` của backend vào worktree, và mọi lệnh `prisma migrate`/`db` phải đặt `DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo` ngay trên dòng lệnh. Không chạy dev server web trỏ vào API thật.
- **Không push, không deploy, không `eas update`.** Chủ dự án làm các bước đó (mục "Execution order and deploy").
- **Repo mobile:** không chạy `npx expo lint` (tự sửa `package.json`); `act`/`render`/`fireEvent` của RNTL v14 luôn `await`; khôi phục spy bằng `spy.mockRestore()`.
- **Worktree có junction `node_modules`:** KHÔNG BAO GIỜ `Remove-Item -Recurse` hay `git worktree remove` một worktree còn junction — sẽ xoá luôn `node_modules` thật của repo gốc. Luôn `cmd /c rmdir <worktree>\node_modules` trước.

---

## File Structure

### Backend — `D:\WEDO_PC\wt\be-moi` (nhánh `feat/moi-vao-nhom` từ `sua-toan-dien-3`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `prisma/schema.prisma` | Sửa | model `ProjectInvite`, quan hệ ở `Project`/`User`, `NotificationType.PROJECT_MEMBER_JOINED` |
| `prisma/migrations/202610020001_project_invites/migration.sql` | Tạo | Tạo bảng, chỉ mục, khoá ngoại `ProjectInvite` |
| `prisma/migrations/202610020002_project_member_joined_notification/migration.sql` | Tạo | `ALTER TYPE … ADD VALUE 'PROJECT_MEMBER_JOINED'` |
| `src/projects/loi-moi/ma-moi.ts` (+ `.spec.ts`) | Tạo | Sinh mã 8 ký tự, chuẩn hoá mã nhập, hiển thị `XXXX-XXXX`, dựng URL từ `FRONTEND_URL` |
| `src/projects/loi-moi/loi-moi.errors.ts` | Tạo | Mã lỗi `INVITE_*` và các hàm tạo HttpException kèm `code` |
| `src/projects/ghi-thanh-vien.ts` (+ `.spec.ts`) | Tạo | `lenhGhiThanhVien`: 3 lệnh upsert WorkspaceMember/ProjectMember + chạm `Workspace.updatedAt`, dùng chung cho `addMember` và `join` |
| `src/projects/projects.service.ts` | Sửa | `addMember` dùng `lenhGhiThanhVien`; `ensureProjectManager` thành public; `create` hỗ trợ mẫu |
| `src/projects/loi-moi/project-invites.service.ts` (+ `.spec.ts`) | Tạo | Lấy/tạo/tắt link (Leader), xem trước, tham gia, báo Leader |
| `src/projects/loi-moi/project-invites.controller.ts` (+ `.spec.ts`) | Tạo | `ProjectInvitesController` (`/projects/:id/invite`) và `InvitesController` (`/invites/:code`) |
| `src/projects/mau-du-an.ts` (+ `.spec.ts`) | Tạo | Danh mục 6 mẫu song ngữ, `timMauDuAn`, `mauTheoNgonNgu` |
| `src/projects/project-templates.controller.ts` | Tạo | `GET /project-templates?lang=` |
| `src/projects/dto/create-project.dto.ts` | Sửa | Thêm `templateId`, `startDate`, `lang` không bắt buộc |
| `src/projects/tao-du-an-tu-mau.spec.ts` | Tạo | Kiểm `POST /projects` có/không mẫu và DTO |
| `src/projects/projects.module.ts` | Sửa | Đăng ký controller/service mới |
| `src/common/ngay-vn.ts` (+ `.spec.ts`) | Sửa | `hanCuoiNgayVN(ngay, soNgay)` = 23:59 giờ Việt Nam |
| `src/notifications/notifications.service.ts` | Sửa | `SystemNotificationInput.actorId` (tuỳ chọn) |
| `src/notifications/thong-bao-nguoi-lam.spec.ts` | Tạo | Kiểm `actorId` và loại mới |
| `src/common/request-rate-limit.guard.ts` (+ `.spec.ts`) | Sửa | Nhiều hạn mức cho một yêu cầu; luật `/invites/*` |
| `src/projects/loi-moi/loi-moi.integration.spec.ts` | Tạo | Chạy trên Postgres thật trong Docker |

### Web — `D:\WEDO_PC\wt\fe-moi` (nhánh `feat/moi-vao-nhom` từ `sua-toan-dien-3`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `package.json`, `package-lock.json` | Sửa | `qrcode` + `@types/qrcode` |
| `src/lib/api.ts` | Sửa | Kiểu và hàm gọi API mời/mẫu; `createProject` nhận trường mẫu; `NotificationType` thêm loại mới |
| `src/i18n/loi.ts` (+ `loi.test.ts`) | Sửa | Dịch `INVITE_*` sang tiếng Anh |
| `src/i18n/tu-dien/moi-vao-nhom.ts` | Tạo | Chữ của hộp thoại mời và trang `#/moi/:code` |
| `src/i18n/tu-dien/mau-du-an.ts` | Tạo | Chữ của thẻ mẫu, xem trước việc, thẻ "Bắt đầu nhanh" |
| `src/i18n/tu-dien/thong-bao.ts`, `src/i18n/tu-dien/khung.ts` | Sửa | Nhãn "Thành viên mới", nút "Xem dự án", tiêu đề tiếng Anh |
| `src/views/NotificationsView.tsx`, `src/components/layout/Topbar.tsx` | Sửa | Tông màu/nhãn cho `PROJECT_MEMBER_JOINED` |
| `src/lib/loi-moi.ts` (+ `.test.ts`) | Tạo | Chuẩn hoá mã, đọc `#/moi/:code`, lời mời chờ qua đăng nhập (`wedo:loi-moi-cho`), tên tệp QR |
| `src/lib/dieu-huong-phien.ts` + `src/lib/dieu-huong-sau-dang-nhap.test.ts` | Sửa/Tạo | `chonDichSauDangNhap`: đơn thanh toán → lời mời → app |
| `src/views/LoiMoiView.tsx` | Tạo | Trang xem trước + nút Tham gia / Đăng nhập / Đăng ký |
| `src/App.tsx` | Sửa | Màn `moi`, đọc tham số, `vaoSauDangNhap`, quên lời mời khi đăng xuất, chế độ mở hộp thoại tạo dự án |
| `src/components/du-an/MoiVaoNhomDialog.tsx` | Tạo | Link + Sao chép, QR + tải PNG, mã in to, hạn, số người, Tạo link mới, Tắt link |
| `src/views/ProjectBoardView.tsx`, `src/views/WorkspaceView.tsx` | Sửa | Nút "Mời vào nhóm" cho Leader/chủ workspace; thẻ mẫu trong hộp thoại tạo dự án |
| `src/lib/mau-du-an.ts` (+ `.test.ts`) | Tạo | Cộng ngày, hạn 23:59 giờ VN, xem trước danh sách việc |
| `src/components/du-an/ChonMauDuAn.tsx` | Tạo | Lưới chọn mẫu + ngày bắt đầu + danh sách việc kèm hạn |
| `src/components/du-an/TheBatDauVoiMau.tsx`, `src/views/DashboardView.tsx` | Tạo/Sửa | Thẻ "Bắt đầu nhanh với mẫu" khi workspace chưa có dự án |

### Mobile — `D:\WEDO_PC\wt\mb-moi` (nhánh `feat/moi-vao-nhom` từ `sua-mobile-dot-2`)

| Tệp | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `src/lib/api/loi-moi.ts` (+ `__tests__/loi-moi.test.ts`) | Tạo | Gọi 5 API mời |
| `src/lib/loi-moi.ts` (+ `src/lib/__tests__/loi-moi.test.ts`) | Tạo | Định dạng ô mã, mã gửi đi, câu lỗi theo mã, nội dung chia sẻ, giờ hết hạn |
| `src/components/chat/NhapMaMoiSheet.tsx` (+ test) | Tạo | Bảng "Nhập mã mời": gõ → xem trước → tham gia |
| `src/app/(tabs)/chat/index.tsx` (+ `__tests__/nhap-ma-moi.test.tsx`) | Sửa/Tạo | Nút "Nhập mã mời"; tham gia xong chọn đúng không gian và mở chat |
| `src/components/chat/MoiVaoNhomSheet.tsx`, `src/components/chat/NutMoiVaoNhom.tsx` (+ test) | Tạo | Nút đầu màn chat (chỉ Leader/chủ không gian), chia sẻ/tạo lại/tắt link |
| `src/app/(tabs)/chat/[projectId].tsx` | Sửa | Gắn `NutMoiVaoNhom` vào `GradientHeader.right` |
| `src/lib/notifications/handler.ts` (+ test) | Sửa | Push `PROJECT_MEMBER_ADDED`/`PROJECT_MEMBER_JOINED` → `/chat/:projectId` |
| `src/lib/types.ts`, `src/components/notifications/NotificationRow.tsx`, `src/app/(tabs)/notifications/index.tsx` (+ test) | Sửa | Loại thông báo mới: biểu tượng, chạm trong danh sách mở chat dự án |

### Kiểm tra tương thích loại thông báo lạ (mục 2 của spec) — ĐÃ KIỂM, kết luận: GHI dòng `Notification`

Cả ba bản app cũ hiển thị được một loại thông báo lạ, nên máy chủ ghi dòng `Notification` loại `PROJECT_MEMBER_JOINED` (kèm push và socket `notification:new`), không cần nhánh "chỉ push + socket":

- **Android 1.0.13 (`main`, `D:\WeDo_ChPlay` @ 82a6d47):** `src/components/notifications/NotificationRow.tsx:51` — `const look = LOOK[item.type] ?? FALLBACK;` (có từ commit 1ede0fb ngày 05/08/2026, tức trong mọi bản đã phát). `src/lib/api/notifications.ts` chỉ `apiRequest<NotificationItem[]>('/notifications')`, không kiểm kiểu. Chạm vào dòng (`src/app/(tabs)/notifications/index.tsx` `handlePress`) chỉ xử lý `taskId` và `actionUrl` bắt đầu bằng `#/meeting` → loại mới không có hai thứ đó nên chỉ đánh dấu đã đọc. Chạm push: `duongDanTuThongBao` rơi vào `default: return null` và `taskIdFromResponse` trả `null` → không làm gì, không văng.
- **iOS 1.0.14 (nhánh `ios`, `D:\WeDo_ChPlay-ios` @ b1588ef):** cùng dòng `NotificationRow.tsx:26` (`FALLBACK`) và `:51`.
- **`sua-mobile-dot-2` (@ 330196a):** cùng hai dòng; socket `notification:new` chỉ làm mới truy vấn (`src/lib/realtime/use-realtime-sync.ts:54`).
- **Web cũ:** loại lạ rơi vào nhánh cuối của `notificationTone` (nhãn đỏ "Đã từ chối") — chỉ trong vài phút giữa deploy backend và web; Task W2 sửa. Thông báo này chỉ gửi cho Leader/chủ workspace.

---

# PHẦN 1 — BACKEND (`D:\WEDO_PC\wt\be-moi`)

Mọi lệnh trong phần này chạy trong `D:\WEDO_PC\wt\be-moi` bằng Git Bash (công cụ Bash), trừ khi ghi khác.

### Task B0: Tạo worktree backend và kiểm mốc xuất phát

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: nhánh `sua-toan-dien-3` (đang ở `D:\WEDO_PC\wt\be-dot3`, đỉnh `736bbba`).
- Produces: worktree `D:\WEDO_PC\wt\be-moi` trên nhánh `feat/moi-vao-nhom`, `node_modules` riêng, Prisma Client đã sinh.

- [ ] **Step 1: Tạo worktree và cài thư viện**

```bash
git -C D:/WEDO_PC/BE_WEDO worktree add D:/WEDO_PC/wt/be-moi -b feat/moi-vao-nhom sua-toan-dien-3
cd D:/WEDO_PC/wt/be-moi && npm ci
```

Expected: `npm ci` chạy xong, `postinstall` in "Generated Prisma Client". Kiểm `ls .env` → "No such file": KHÔNG chép `.env` vào đây (nó trỏ vào cơ sở dữ liệu production).

- [ ] **Step 2: Kiểm mốc xanh trước khi sửa**

```bash
npx tsc --noEmit -p tsconfig.json && npx jest && npm run lint -- --max-warnings 0
```

Expected: cả ba sạch (các bài `*.integration.spec.ts` tự bỏ qua vì không có `WEDO_TEST_DATABASE_URL`). Nếu không sạch: dừng lại, báo người giao việc — không sửa lỗi có sẵn trong task này.

- [ ] **Step 3: Dựng Postgres thử dùng cho cả phần backend**

```bash
docker run -d --name wedo-thu-loi-moi -e POSTGRES_PASSWORD=thu -e POSTGRES_DB=wedo -p 127.0.0.1:55902:5432 postgres:17
docker exec wedo-thu-loi-moi pg_isready -U postgres
```

Expected: lệnh thứ hai in `accepting connections` (chạy lại vài giây sau nếu chưa). Không commit gì ở task này.

---

### Task B1: Bảng `ProjectInvite` và loại thông báo `PROJECT_MEMBER_JOINED`

**Files:**
- Modify: `prisma/schema.prisma` (enum `NotificationType` ~dòng 65-76; model `User` ~144-226; model `Project` ~323-340; sau model `ProjectMember` ~342-353)
- Create: `prisma/migrations/202610020001_project_invites/migration.sql`
- Create: `prisma/migrations/202610020002_project_member_joined_notification/migration.sql`

**Interfaces:**
- Consumes: Postgres thử ở `127.0.0.1:55902` (Task B0).
- Produces: model Prisma `ProjectInvite { id, code @unique, projectId, createdById?, createdAt, expiresAt, revokedAt?, useCount }`, quan hệ `Project.invites`, `User.projectInvites`, giá trị enum `NotificationType.PROJECT_MEMBER_JOINED`; kiểu TS `ProjectInvite` từ `@prisma/client`.

- [ ] **Step 1: Đưa cơ sở dữ liệu thử lên đúng các migration đang có**

```bash
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate deploy
```

Expected: "All migrations have been successfully applied." (mọi migration hiện có, mới nhất `202609301200_keep_payment_orders_on_user_delete`).

- [ ] **Step 2: Sửa schema**

Trong `enum NotificationType`, thay:

```prisma
  SUBSCRIPTION_RENEWAL_DUE
  PAYMENT_CONFIRMED
}
```

bằng:

```prisma
  SUBSCRIPTION_RENEWAL_DUE
  PAYMENT_CONFIRMED
  PROJECT_MEMBER_JOINED
}
```

Trong `model User`, ngay sau dòng `  refreshTokens              RefreshToken[]` thêm:

```prisma
  projectInvites             ProjectInvite[]
```

Trong `model Project`, thay `  chatReads          ProjectChatRead[]` + `}` bằng:

```prisma
  chatReads          ProjectChatRead[]
  invites            ProjectInvite[]
}
```

Sau model `ProjectMember` (tức thay `  @@unique([projectId, userId])\n}\n\nmodel Task {`), chèn model mới để đoạn đó thành:

```prisma
  @@unique([projectId, userId])
}

/**
 * Link mời vào dự án (mời bằng link, QR hoặc mã 8 ký tự).
 *
 * Mỗi dự án có tối đa MỘT link còn hiệu lực (`revokedAt IS NULL` và
 * `expiresAt > now`): tạo link mới thì link cũ bị đặt `revokedAt` trong cùng
 * một giao dịch. Người tạo xoá tài khoản thì `createdById` về NULL và link coi
 * như đã tắt.
 */
model ProjectInvite {
  id          String    @id @default(uuid())
  code        String    @unique
  projectId   String
  createdById String?
  createdAt   DateTime  @default(now())
  expiresAt   DateTime
  revokedAt   DateTime?
  useCount    Int       @default(0)

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy User?   @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([projectId, revokedAt])
}

model Task {
```

- [ ] **Step 3: Chạy phép so lệch — phải THẤY lệch (bài kiểm thất bại)**

```bash
npx prisma format
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code; echo "ma thoat: $?"
```

Expected: liệt kê "Added tables: ProjectInvite" và "Changed the `NotificationType` enum", rồi `ma thoat: 2` (có lệch).

- [ ] **Step 4: Viết hai migration**

`prisma/migrations/202610020001_project_invites/migration.sql`:

```sql
-- Link moi vao du an (moi bang link, QR hoac ma 8 ky tu). Spec 02/10/2026.
--
-- Chi THEM MOI: mot bang moi, hai chi muc, hai khoa ngoai. Khong doi hay xoa
-- cot nao, nen ban Android 1.0.13/1.0.14, iOS 1.0.14 va web dang chay khong bi
-- anh huong. Bang moi rong nen tao chi muc va khoa ngoai la tuc thi.

-- CreateTable
CREATE TABLE "ProjectInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvite_code_key" ON "ProjectInvite"("code");

-- CreateIndex
CREATE INDEX "ProjectInvite_projectId_revokedAt_idx" ON "ProjectInvite"("projectId", "revokedAt");

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

`prisma/migrations/202610020002_project_member_joined_notification/migration.sql`:

```sql
-- Thong bao cho Leader va chu workspace khi co nguoi vao du an qua link moi.
--
-- Chi THEM mot gia tri enum. App Android 1.0.13/1.0.14, iOS 1.0.14 hien loai
-- thong bao la bang bieu tuong mac dinh (NotificationRow: LOOK[type] ?? FALLBACK),
-- nen ghi dong Notification loai moi an toan. Tach migration rieng: gia tri
-- enum vua them khong duoc dung trong cung giao dich voi cau ALTER TYPE.
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_MEMBER_JOINED';
```

- [ ] **Step 5: Áp migration và so lệch lại — phải hết lệch**

```bash
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate deploy
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code; echo "ma thoat: $?"
npx prisma generate
```

Expected: deploy áp đúng 2 migration mới; diff in "No difference detected." và `ma thoat: 0`; generate xong. Nếu diff còn lệch về chi tiết (tên chỉ mục, kiểu cột), sửa SQL ở Step 4 cho khớp đúng câu mà `--script` in ra, rồi `docker rm -f wedo-thu-loi-moi`, chạy lại Task B0 Step 3 và Task này từ Step 1.

- [ ] **Step 6: Kiểm cổng "chỉ thêm" và kiểu**

```bash
git diff -w sua-toan-dien-3 -- prisma/schema.prisma prisma/migrations prisma.config.ts | grep '^-[^-]'; echo "ma thoat grep: $?"
npx tsc --noEmit -p tsconfig.json
```

Expected: grep không in dòng nào và `ma thoat grep: 1`; tsc sạch.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/202610020001_project_invites prisma/migrations/202610020002_project_member_joined_notification
git commit -m "feat(loi-moi): bang ProjectInvite va loai thong bao PROJECT_MEMBER_JOINED" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B2: Sinh mã, chuẩn hoá mã và đường dẫn mời

**Files:**
- Create: `src/projects/loi-moi/ma-moi.ts`
- Test: `src/projects/loi-moi/ma-moi.spec.ts`

**Interfaces:**
- Consumes: `normalizeOrigin` từ `src/common/cors-policy.ts`.
- Produces:
  - `export const BANG_KY_TU_MA_MOI = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'`
  - `export const DO_DAI_MA_MOI = 8`
  - `export function sinhMaMoi(ngauNhien?: (max: number) => number): string`
  - `export function chuanHoaMaMoi(nhap: string): string | null`
  - `export function hienThiMaMoi(ma: string): string`
  - `export function duongDanMoi(ma: string, env?: NodeJS.ProcessEnv): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

```ts
import {
  BANG_KY_TU_MA_MOI,
  chuanHoaMaMoi,
  duongDanMoi,
  hienThiMaMoi,
  sinhMaMoi,
} from './ma-moi';

describe('sinhMaMoi', () => {
  it('đúng 8 ký tự, chỉ lấy từ bảng không có 0, O, 1, I', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(sinhMaMoi()).toMatch(/^[23456789A-HJ-NP-Z]{8}$/);
    }
  });

  it('mỗi ký tự lấy theo chỉ số ngẫu nhiên trên đúng 32 ký tự', () => {
    const goi: number[] = [];
    const ma = sinhMaMoi((max) => {
      goi.push(max);
      return goi.length - 1;
    });
    expect(goi).toEqual([32, 32, 32, 32, 32, 32, 32, 32]);
    expect(ma).toBe(BANG_KY_TU_MA_MOI.slice(0, 8));
  });
});

describe('chuanHoaMaMoi', () => {
  it('viết hoa, bỏ khoảng trắng và dấu gạch trước khi so', () => {
    expect(chuanHoaMaMoi(' 7k3m-9qxa ')).toBe('7K3M9QXA');
    expect(chuanHoaMaMoi('7K3M 9QXA')).toBe('7K3M9QXA');
    expect(chuanHoaMaMoi('7K3M–9QXA')).toBe('7K3M9QXA');
  });

  it('gõ nhầm 0, O, 1, I hoặc sai độ dài thì là mã sai, không đoán', () => {
    for (const sai of ['7K3M9QX0', '7K3M9QXO', '7K3M9QX1', '7K3M9QXI', '7K3M9QX', '7K3M9QXAB', '']) {
      expect(chuanHoaMaMoi(sai)).toBeNull();
    }
  });
});

describe('hienThiMaMoi', () => {
  it('chia đôi bằng dấu gạch cho dễ đọc', () => {
    expect(hienThiMaMoi('7K3M9QXA')).toBe('7K3M-9QXA');
  });
});

describe('duongDanMoi', () => {
  it('lấy gốc từ FRONTEND_URL, bỏ dấu / cuối', () => {
    expect(duongDanMoi('7K3M9QXA', { FRONTEND_URL: 'https://wedofpt.com.vn/' })).toBe(
      'https://wedofpt.com.vn/#/moi/7K3M9QXA',
    );
  });

  it('thiếu FRONTEND_URL vẫn ra link dùng được trên tên miền chính', () => {
    expect(duongDanMoi('7K3M9QXA', {})).toBe('https://wedofpt.com.vn/#/moi/7K3M9QXA');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/projects/loi-moi/ma-moi.spec.ts`
Expected: FAIL — "Cannot find module './ma-moi'".

- [ ] **Step 3: Viết mã**

`src/projects/loi-moi/ma-moi.ts`:

```ts
import { randomInt } from 'crypto';
import { normalizeOrigin } from '../../common/cors-policy';

/**
 * Bảng ký tự của mã mời: bỏ 0, O, 1, I.
 *
 * Người đọc mã trên máy chiếu hay gõ lại từ ảnh chụp hay nhầm các cặp đó. Bảng
 * không có chúng thì gõ nhầm chỉ ra "mã không đúng", không bao giờ ra đúng mã
 * của một dự án khác. 32 ký tự × 8 vị trí = 40 bit ngẫu nhiên.
 */
export const BANG_KY_TU_MA_MOI = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const DO_DAI_MA_MOI = 8;

/** Tên miền chính của web, dùng khi máy chủ thiếu FRONTEND_URL. */
const GOC_WEB_MAC_DINH = 'https://wedofpt.com.vn';

/** Sinh mã bằng `crypto.randomInt`. Tham số chỉ để kiểm thử thay nguồn ngẫu nhiên. */
export function sinhMaMoi(
  ngauNhien: (max: number) => number = (max) => randomInt(max),
): string {
  let ma = '';
  for (let i = 0; i < DO_DAI_MA_MOI; i += 1) {
    ma += BANG_KY_TU_MA_MOI[ngauNhien(BANG_KY_TU_MA_MOI.length)];
  }
  return ma;
}

/**
 * Mã người dùng gõ hay dán vào: viết hoa, bỏ khoảng trắng và dấu gạch (kể cả
 * gạch ngang dài do bàn phím điện thoại tự đổi). Không đúng 8 ký tự của bảng
 * thì trả `null` — máy chủ báo "không tìm thấy", không đoán.
 */
export function chuanHoaMaMoi(nhap: string): string | null {
  const gon = nhap.toUpperCase().replace(/[\s\-–—]/g, '');
  if (gon.length !== DO_DAI_MA_MOI) return null;
  for (const kyTu of gon) {
    if (!BANG_KY_TU_MA_MOI.includes(kyTu)) return null;
  }
  return gon;
}

/** `7K3M9QXA` → `7K3M-9QXA`. */
export function hienThiMaMoi(ma: string): string {
  return `${ma.slice(0, 4)}-${ma.slice(4)}`;
}

/**
 * Link mời mở thẳng trang `#/moi/:code` của web. Gốc lấy từ FRONTEND_URL —
 * từ 29/09/2026 biến này là https://wedofpt.com.vn, nơi người dùng đăng nhập.
 */
export function duongDanMoi(
  ma: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const goc = normalizeOrigin(env.FRONTEND_URL || '') || GOC_WEB_MAC_DINH;
  return `${goc}/#/moi/${ma}`;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/projects/loi-moi/ma-moi.spec.ts && npx eslint src/projects/loi-moi --max-warnings 0`
Expected: PASS (7 bài), eslint sạch.

- [ ] **Step 5: Commit**

```bash
git add src/projects/loi-moi/ma-moi.ts src/projects/loi-moi/ma-moi.spec.ts
git commit -m "feat(loi-moi): sinh ma 8 ky tu, chuan hoa ma nhap va dung link moi" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B3: Tách logic ghi thành viên để `addMember` và `join` dùng chung

**Files:**
- Create: `src/projects/ghi-thanh-vien.ts`
- Test: `src/projects/ghi-thanh-vien.spec.ts`
- Modify: `src/projects/projects.service.ts:220-248` (khối `$transaction([...])` trong `addMember`), `:758` (`private async ensureProjectManager` → public)
- Test (giữ nguyên, phải còn xanh): `src/projects/thanh-vien-du-an.spec.ts`

**Interfaces:**
- Consumes: Prisma Client (`Prisma.PrismaPromise`, `ProjectRole`).
- Produces:
  - `export interface GhiThanhVien { projectId: string; workspaceId: string; userId: string; vaiTro: ProjectRole; doiVaiTroNeuDaCo: boolean }`
  - `export function lenhGhiThanhVien(prisma: CoBangThanhVien, v: GhiThanhVien): Prisma.PrismaPromise<unknown>[]` — trả đúng 3 lệnh theo thứ tự: upsert WorkspaceMember (MEMBER), upsert ProjectMember, update `Workspace.updatedAt`.
  - `ProjectsService.ensureProjectManager(userId: string, projectId: string)` thành **public** (cùng chữ ký, cùng kiểu trả về: dự án kèm `workspace.ownerId` và `members` của người gọi).

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/projects/ghi-thanh-vien.spec.ts`:

```ts
import { lenhGhiThanhVien } from './ghi-thanh-vien';
import { ProjectsService } from './projects.service';

function taoPrisma() {
  return {
    workspaceMember: { upsert: jest.fn().mockReturnValue('upsert-ws') },
    projectMember: { upsert: jest.fn().mockReturnValue('upsert-du-an') },
    workspace: { update: jest.fn().mockReturnValue('cham-ws') },
  };
}

describe('lenhGhiThanhVien', () => {
  it('ba lệnh theo đúng thứ tự cũ của addMember', () => {
    const prisma = taoPrisma();
    const lenh = lenhGhiThanhVien(prisma as never, {
      projectId: 'p-1',
      workspaceId: 'w-1',
      userId: 'u-moi',
      vaiTro: 'MEMBER',
      doiVaiTroNeuDaCo: true,
    });

    expect(lenh).toEqual(['upsert-ws', 'upsert-du-an', 'cham-ws']);
    expect(prisma.workspaceMember.upsert).toHaveBeenCalledWith({
      where: { workspaceId_userId: { workspaceId: 'w-1', userId: 'u-moi' } },
      update: {},
      create: { workspaceId: 'w-1', userId: 'u-moi', role: 'MEMBER' },
    });
    expect(prisma.workspace.update).toHaveBeenCalledWith({
      where: { id: 'w-1' },
      data: { updatedAt: expect.any(Date) },
    });
  });

  it('được phép đổi vai trò thì cập nhật vai trò người đã có', () => {
    const prisma = taoPrisma();
    lenhGhiThanhVien(prisma as never, {
      projectId: 'p-1',
      workspaceId: 'w-1',
      userId: 'u-1',
      vaiTro: 'LEADER',
      doiVaiTroNeuDaCo: true,
    });
    expect(prisma.projectMember.upsert).toHaveBeenCalledWith({
      where: { projectId_userId: { projectId: 'p-1', userId: 'u-1' } },
      update: { role: 'LEADER' },
      create: { projectId: 'p-1', userId: 'u-1', role: 'LEADER' },
    });
  });

  it('vào bằng link mời: KHÔNG bao giờ đổi vai trò của người đã có trong dự án', () => {
    const prisma = taoPrisma();
    lenhGhiThanhVien(prisma as never, {
      projectId: 'p-1',
      workspaceId: 'w-1',
      userId: 'u-1',
      vaiTro: 'MEMBER',
      doiVaiTroNeuDaCo: false,
    });
    expect(prisma.projectMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });
});

describe('ProjectsService.ensureProjectManager', () => {
  it('là API dùng chung cho service mời: chủ workspace qua được', async () => {
    const duAn = {
      id: 'p-1',
      workspaceId: 'w-1',
      workspace: { ownerId: 'u-chu' },
      members: [],
    };
    const prisma = { project: { findFirst: jest.fn().mockResolvedValue(duAn) } };
    const service = new ProjectsService(prisma as never, {} as never, {} as never, {} as never);

    await expect(service.ensureProjectManager('u-chu', 'p-1')).resolves.toBe(duAn);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/projects/ghi-thanh-vien.spec.ts`
Expected: FAIL — "Cannot find module './ghi-thanh-vien'" (và lỗi TS "Property 'ensureProjectManager' is private").

- [ ] **Step 3: Viết mã**

`src/projects/ghi-thanh-vien.ts`:

```ts
import type { Prisma, PrismaClient, ProjectRole } from '@prisma/client';

export interface GhiThanhVien {
  projectId: string;
  workspaceId: string;
  userId: string;
  vaiTro: ProjectRole;
  /**
   * `true`: người đã có trong dự án được đặt lại đúng `vaiTro` (Leader thêm
   * người bằng ô mời và chọn rõ vai trò). `false`: vào bằng link mời — không
   * bao giờ đổi vai trò người đã có, kể cả khi hai lượt bấm "Tham gia" chạy
   * chồng nhau với một lượt Leader nâng vai trò.
   */
  doiVaiTroNeuDaCo: boolean;
}

type CoBangThanhVien = Pick<
  PrismaClient,
  'workspaceMember' | 'projectMember' | 'workspace'
>;

/**
 * Ba lệnh ghi một người vào dự án, để chạy trong MỘT `$transaction([...])`:
 * vào workspace với vai trò MEMBER (đã có thì giữ nguyên), vào dự án, và chạm
 * `Workspace.updatedAt` để danh sách workspace của mọi người xếp lại.
 *
 * Dùng chung cho thêm thành viên bằng ô mời và tham gia bằng link mời: chép
 * hai bản là sớm muộn lệch nhau (từng lệch ở chỗ quên vào workspace, người
 * được thêm không thấy dự án).
 */
export function lenhGhiThanhVien(
  prisma: CoBangThanhVien,
  v: GhiThanhVien,
): Prisma.PrismaPromise<unknown>[] {
  return [
    prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: v.workspaceId, userId: v.userId },
      },
      update: {},
      create: { workspaceId: v.workspaceId, userId: v.userId, role: 'MEMBER' },
    }),
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: v.projectId, userId: v.userId } },
      update: v.doiVaiTroNeuDaCo ? { role: v.vaiTro } : {},
      create: { projectId: v.projectId, userId: v.userId, role: v.vaiTro },
    }),
    prisma.workspace.update({
      where: { id: v.workspaceId },
      data: { updatedAt: new Date() },
    }),
  ];
}
```

Trong `src/projects/projects.service.ts`, thêm import (cạnh các import `./dto/...`):

```ts
import { lenhGhiThanhVien } from './ghi-thanh-vien';
```

Thay nguyên khối trong `addMember`:

```ts
    await this.prisma.$transaction([
      this.prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: targetId,
          },
        },
        update: {},
        create: {
          workspaceId: project.workspaceId,
          userId: targetId,
          role: 'MEMBER',
        },
      }),
      this.prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: targetId } },
        update: { role: vaiTro },
        create: {
          projectId,
          userId: targetId,
          role: vaiTro,
        },
      }),
      this.prisma.workspace.update({
        where: { id: project.workspaceId },
        data: { updatedAt: new Date() },
      }),
    ]);
```

bằng:

```ts
    await this.prisma.$transaction(
      lenhGhiThanhVien(this.prisma, {
        projectId,
        workspaceId: project.workspaceId,
        userId: targetId,
        vaiTro,
        doiVaiTroNeuDaCo: true,
      }),
    );
```

Và đổi dòng `  private async ensureProjectManager(userId: string, projectId: string) {` thành:

```ts
  /**
   * Chủ workspace hoặc Leader của dự án. Public vì service mời vào nhóm dùng
   * đúng quy tắc này cho xem, tạo và tắt link — không chép quy tắc ra chỗ khác.
   */
  async ensureProjectManager(userId: string, projectId: string) {
```

- [ ] **Step 4: Chạy lại, kể cả bài cũ của addMember**

Run: `npx jest src/projects && npx tsc --noEmit -p tsconfig.json && npx eslint src/projects --max-warnings 0`
Expected: PASS — gồm `thanh-vien-du-an.spec.ts` (bài cũ kiểm `update: { role: 'LEADER' }` vẫn xanh) và 4 bài mới.

- [ ] **Step 5: Commit**

```bash
git add src/projects/ghi-thanh-vien.ts src/projects/ghi-thanh-vien.spec.ts src/projects/projects.service.ts
git commit -m "refactor(du-an): tach lenhGhiThanhVien de them thanh vien va link moi dung chung" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B4: Service + controller cho Leader: xem, tạo lại, tắt link

**Files:**
- Create: `src/projects/loi-moi/loi-moi.errors.ts`
- Create: `src/projects/loi-moi/project-invites.service.ts`
- Create: `src/projects/loi-moi/project-invites.controller.ts`
- Modify: `src/projects/projects.module.ts`
- Test: `src/projects/loi-moi/project-invites.service.spec.ts`, `src/projects/loi-moi/project-invites.controller.spec.ts`

**Interfaces:**
- Consumes: `ProjectsService.ensureProjectManager` (B3), `sinhMaMoi`, `duongDanMoi` (B2), model `ProjectInvite` (B1).
- Produces:
  - `export const HAN_LOI_MOI_MS = 604_800_000` (7 ngày)
  - `export interface LoiMoiChoLeader { code: string; url: string; expiresAt: Date; useCount: number }`
  - `ProjectInvitesService.layLoiMoi(userId: string, projectId: string): Promise<LoiMoiChoLeader | null>`
  - `ProjectInvitesService.taoLoiMoi(userId: string, projectId: string): Promise<LoiMoiChoLeader>`
  - `ProjectInvitesService.tatLoiMoi(userId: string, projectId: string): Promise<{ ok: true }>`
  - `loi-moi.errors.ts`: `MA_LOI_MOI` và `loiMoiKhongThay()`, `loiMoiHetHan()`, `loiMoiDaTat()`, `loiMoiDuAnDong()` (dùng ở B5)
  - HTTP: `GET|POST|DELETE /projects/:id/invite` (JwtAuthGuard). `GET` trả `null` → Nest gửi thân rỗng 200; client coi thân rỗng là `null`.

- [ ] **Step 1: Viết bài kiểm thất bại (service)**

`src/projects/loi-moi/project-invites.service.spec.ts` — phần đầu tệp (các task B5, B6 sẽ thêm `describe` vào cuối tệp này và dùng lại các hàm dựng ở đây):

```ts
import { ForbiddenException, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  HAN_LOI_MOI_MS,
  ProjectInvitesService,
} from './project-invites.service';

type Mock = jest.Mock;

const LEADER = 'u-leader';
const CHU = 'u-chu';
const NGUOI_VAO = 'u-nguoi-vao';
const DU_AN = 'p-1';
const KHONG_GIAN = 'w-1';

function taoPrisma() {
  const prisma = {
    projectInvite: {
      findFirst: jest.fn().mockResolvedValue(null) as Mock,
      findUnique: jest.fn().mockResolvedValue(null) as Mock,
      create: jest.fn() as Mock,
      updateMany: jest.fn().mockResolvedValue({ count: 0 }) as Mock,
      update: jest.fn().mockReturnValue('tang-luot') as Mock,
    },
    projectMember: {
      findUnique: jest.fn().mockResolvedValue(null) as Mock,
      findMany: jest.fn().mockResolvedValue([]) as Mock,
      upsert: jest.fn().mockReturnValue('upsert-du-an') as Mock,
    },
    workspaceMember: { upsert: jest.fn().mockReturnValue('upsert-ws') as Mock },
    workspace: { update: jest.fn().mockReturnValue('cham-ws') as Mock },
    user: {
      findUnique: jest.fn().mockResolvedValue({ fullName: 'Người Vào' }) as Mock,
    },
    $queryRaw: jest.fn().mockResolvedValue([]) as Mock,
    $transaction: jest.fn() as Mock,
  };
  prisma.$transaction.mockImplementation((viec: unknown) =>
    Promise.resolve(
      typeof viec === 'function'
        ? (viec as (tx: unknown) => unknown)(prisma)
        : viec,
    ),
  );
  return prisma;
}

function taoService() {
  const prisma = taoPrisma();
  const projects = {
    ensureProjectManager: jest.fn().mockResolvedValue({
      id: DU_AN,
      workspaceId: KHONG_GIAN,
      workspace: { ownerId: CHU },
      members: [{ role: 'LEADER' }],
    }) as Mock,
  };
  const blocks = { coChanVoiAi: jest.fn().mockResolvedValue(false) as Mock };
  const chatGateway = {
    emitProjectMembership: jest.fn() as Mock,
    emitUserNotification: jest.fn() as Mock,
  };
  const notifications = {
    createSystemNotification: jest.fn().mockResolvedValue({ id: 'tb-1' }) as Mock,
  };
  const service = new ProjectInvitesService(
    prisma as never,
    projects as never,
    blocks as never,
    chatGateway as never,
    notifications as never,
  );
  return { service, prisma, projects, blocks, chatGateway, notifications };
}

/** Một dòng ProjectInvite còn dùng được, kèm dự án như `findUnique` trả về. */
function loiMoiHopLe(ghiDe: Record<string, unknown> = {}) {
  return {
    id: 'moi-1',
    code: '7K3M9QXA',
    projectId: DU_AN,
    createdById: LEADER,
    createdAt: new Date(Date.now() - 60_000),
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    useCount: 2,
    createdBy: { id: LEADER, fullName: 'Lê Leader' },
    project: {
      id: DU_AN,
      name: 'Đồ án EXE',
      status: 'ACTIVE',
      workspaceId: KHONG_GIAN,
      workspace: { name: 'Lớp SE1801', ownerId: CHU },
      _count: { members: 3 },
    },
    ...ghiDe,
  };
}

/** `projectMember.findUnique` trả vai trò theo userId (không có thì `null`). */
function vaiTroTheoNguoi(bang: Record<string, 'LEADER' | 'MEMBER'>) {
  return ({
    where,
  }: {
    where: { projectId_userId: { userId: string } };
  }) => {
    const role = bang[where.projectId_userId.userId];
    return Promise.resolve(role ? { id: 'pm', role } : null);
  };
}

async function loiCua(viec: Promise<unknown>): Promise<HttpException> {
  try {
    await viec;
  } catch (loi) {
    if (loi instanceof HttpException) return loi;
    throw loi;
  }
  throw new Error('Mong đợi một lỗi HTTP nhưng không có lỗi nào');
}

const FRONTEND_CU = process.env.FRONTEND_URL;
beforeAll(() => {
  process.env.FRONTEND_URL = 'https://wedofpt.com.vn/';
});
afterAll(() => {
  if (FRONTEND_CU === undefined) delete process.env.FRONTEND_URL;
  else process.env.FRONTEND_URL = FRONTEND_CU;
});

describe('API của Leader', () => {
  it('chưa có link còn hiệu lực: trả null', async () => {
    const { service, prisma } = taoService();

    await expect(service.layLoiMoi(LEADER, DU_AN)).resolves.toBeNull();
    expect(prisma.projectInvite.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: DU_AN, revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      }),
    );
  });

  it('có link: trả mã, đường dẫn lấy gốc từ FRONTEND_URL, hạn và số người đã vào', async () => {
    const { service, prisma } = taoService();
    const han = new Date('2026-10-09T03:00:00.000Z');
    prisma.projectInvite.findFirst.mockResolvedValue({ code: '7K3M9QXA', expiresAt: han, useCount: 4 });

    await expect(service.layLoiMoi(LEADER, DU_AN)).resolves.toEqual({
      code: '7K3M9QXA',
      url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA',
      expiresAt: han,
      useCount: 4,
    });
  });

  it('tạo link: khoá dự án, tắt link cũ rồi mới tạo, trong cùng một giao dịch', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...data, useCount: 0 }),
    );

    const ketQua = await service.taoLoiMoi(LEADER, DU_AN);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const thuTu = (m: Mock) => m.mock.invocationCallOrder[0];
    expect(thuTu(prisma.$queryRaw)).toBeLessThan(thuTu(prisma.projectInvite.updateMany));
    expect(thuTu(prisma.projectInvite.updateMany)).toBeLessThan(thuTu(prisma.projectInvite.create));
    expect(prisma.projectInvite.updateMany).toHaveBeenCalledWith({
      where: { projectId: DU_AN, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    const { data } = prisma.projectInvite.create.mock.calls[0][0] as {
      data: { code: string; createdById: string; createdAt: Date; expiresAt: Date };
    };
    expect(data.code).toMatch(/^[23456789A-HJ-NP-Z]{8}$/);
    expect(data.createdById).toBe(LEADER);
    expect(data.expiresAt.getTime() - data.createdAt.getTime()).toBe(HAN_LOI_MOI_MS);
    expect(HAN_LOI_MOI_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(ketQua).toEqual({
      code: data.code,
      url: `https://wedofpt.com.vn/#/moi/${data.code}`,
      expiresAt: data.expiresAt,
      useCount: 0,
    });
  });

  it('trùng mã: thử lại với mã khác thay vì báo lỗi 500', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.create
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'kiem-thu',
        }),
      )
      .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...data, useCount: 0 }),
      );

    await expect(service.taoLoiMoi(LEADER, DU_AN)).resolves.toMatchObject({ useCount: 0 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('lỗi khác (mất kết nối) thì không thử lại', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.create.mockRejectedValue(new Error('mat ket noi'));

    await expect(service.taoLoiMoi(LEADER, DU_AN)).rejects.toThrow('mat ket noi');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('tắt link: đặt revokedAt cho mọi link còn sống của dự án', async () => {
    const { service, prisma } = taoService();

    await expect(service.tatLoiMoi(LEADER, DU_AN)).resolves.toEqual({ ok: true });
    expect(prisma.projectInvite.updateMany).toHaveBeenCalledWith({
      where: { projectId: DU_AN, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('không phải Leader hay chủ workspace: không đọc, không tạo, không tắt được', async () => {
    const { service, prisma, projects } = taoService();
    projects.ensureProjectManager.mockRejectedValue(
      new ForbiddenException('Chỉ leader dự án mới được quản lý thành viên'),
    );

    await expect(service.layLoiMoi('u-thuong', DU_AN)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.taoLoiMoi('u-thuong', DU_AN)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.tatLoiMoi('u-thuong', DU_AN)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.projectInvite.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.projectInvite.updateMany).not.toHaveBeenCalled();
  });
});
```

`loiCua`, `loiMoiHopLe`, `vaiTroTheoNguoi`, `NGUOI_VAO` chưa dùng ở task này: ESLint báo `no-unused-vars`. Để tránh, thêm ngay cuối tệp (B5 sẽ thay khối này bằng bài thật):

```ts
// Các hàm dựng dưới đây dùng ở phần xem trước / tham gia (Task B5).
void loiCua;
void loiMoiHopLe;
void vaiTroTheoNguoi;
void NGUOI_VAO;
```

- [ ] **Step 2: Viết bài kiểm thất bại (controller)**

`src/projects/loi-moi/project-invites.controller.spec.ts`:

```ts
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { YeuCauDaXacThuc } from '../../auth/yeu-cau-da-xac-thuc';
import { ProjectInvitesController } from './project-invites.controller';

/** Guard gắn trên lớp (không `ten`) hoặc trên một phương thức. */
function guardCua(lop: { prototype: object }, ten?: string): unknown[] {
  const dich: object = ten
    ? (Object.getOwnPropertyDescriptor(lop.prototype, ten)?.value as object)
    : lop;
  return (Reflect.getMetadata(GUARDS_METADATA, dich) as unknown[] | undefined) ?? [];
}

const req = { user: { id: 'u-leader' } } as YeuCauDaXacThuc;

describe('ProjectInvitesController', () => {
  it('mọi API của Leader đều cần đăng nhập', () => {
    expect(guardCua(ProjectInvitesController)).toContain(JwtAuthGuard);
  });

  it('chuyển đúng người gọi và dự án cho service', async () => {
    const service = {
      layLoiMoi: jest.fn().mockResolvedValue(null),
      taoLoiMoi: jest.fn().mockResolvedValue({ code: 'X' }),
      tatLoiMoi: jest.fn().mockResolvedValue({ ok: true }),
    };
    const controller = new ProjectInvitesController(service as never);

    await controller.lay(req, 'p-1');
    await controller.tao(req, 'p-1');
    await controller.tat(req, 'p-1');

    expect(service.layLoiMoi).toHaveBeenCalledWith('u-leader', 'p-1');
    expect(service.taoLoiMoi).toHaveBeenCalledWith('u-leader', 'p-1');
    expect(service.tatLoiMoi).toHaveBeenCalledWith('u-leader', 'p-1');
  });
});
```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npx jest src/projects/loi-moi/project-invites`
Expected: FAIL — "Cannot find module './project-invites.service'" và "./project-invites.controller".

- [ ] **Step 4: Viết mã**

`src/projects/loi-moi/loi-moi.errors.ts`:

```ts
import { GoneException, NotFoundException } from '@nestjs/common';

/**
 * Mã lỗi của lời mời. Web dịch theo mã (src/i18n/loi.ts), app dịch theo mã
 * (src/lib/loi-moi.ts) — câu tiếng Việt dưới đây chỉ là câu mặc định.
 */
export const MA_LOI_MOI = {
  khongThay: 'INVITE_NOT_FOUND',
  hetHan: 'INVITE_EXPIRED',
  daTat: 'INVITE_REVOKED',
  duAnDong: 'INVITE_PROJECT_CLOSED',
} as const;

/** Cũng dùng khi có quan hệ chặn: không để lộ là bị chặn. */
export function loiMoiKhongThay() {
  return new NotFoundException({
    statusCode: 404,
    code: MA_LOI_MOI.khongThay,
    message: 'Mã mời không đúng hoặc không còn dùng được.',
  });
}

export function loiMoiHetHan() {
  return new GoneException({
    statusCode: 410,
    code: MA_LOI_MOI.hetHan,
    message: 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
  });
}

/** Leader đã tắt link, đã tạo link khác, hoặc người tạo link không còn quyền. */
export function loiMoiDaTat() {
  return new GoneException({
    statusCode: 410,
    code: MA_LOI_MOI.daTat,
    message: 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.',
  });
}

export function loiMoiDuAnDong() {
  return new GoneException({
    statusCode: 410,
    code: MA_LOI_MOI.duAnDong,
    message: 'Dự án này đã đóng, không nhận thêm thành viên.',
  });
}
```

`src/projects/loi-moi/project-invites.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type ProjectInvite } from '@prisma/client';
import { ChatGateway } from '../../chat/chat.gateway';
import { UserBlocksService } from '../../moderation/user-blocks.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects.service';
import { duongDanMoi, sinhMaMoi } from './ma-moi';

/** Link mời tự hết hạn sau 7 ngày (chủ dự án chốt 02/10/2026). */
export const HAN_LOI_MOI_MS = 7 * 24 * 60 * 60 * 1000;

/** Trùng mã 40 bit gần như không xảy ra; vẫn thử lại vài lần thay vì trả 500. */
const SO_LAN_THU_MA = 5;

export interface LoiMoiChoLeader {
  code: string;
  url: string;
  expiresAt: Date;
  useCount: number;
}

function laTrungMa(loi: unknown) {
  return (
    loi instanceof Prisma.PrismaClientKnownRequestError && loi.code === 'P2002'
  );
}

/**
 * Mời vào nhóm bằng link, QR hoặc mã (spec 02/10/2026).
 *
 * Quyền xem, tạo và tắt link dùng đúng `ensureProjectManager` của dự án: chủ
 * workspace hoặc Leader. Mỗi dự án tối đa MỘT link còn hiệu lực.
 */
@Injectable()
export class ProjectInvitesService {
  private readonly logger = new Logger(ProjectInvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly blocks: UserBlocksService,
    private readonly chatGateway: ChatGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async layLoiMoi(
    userId: string,
    projectId: string,
  ): Promise<LoiMoiChoLeader | null> {
    const project = await this.projects.ensureProjectManager(userId, projectId);
    const loiMoi = await this.prisma.projectInvite.findFirst({
      where: {
        projectId: project.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    return loiMoi ? this.choLeader(loiMoi) : null;
  }

  /** Tạo link mới; link cũ (nếu còn) hết hiệu lực trong cùng giao dịch. */
  async taoLoiMoi(userId: string, projectId: string): Promise<LoiMoiChoLeader> {
    const project = await this.projects.ensureProjectManager(userId, projectId);

    for (let lan = 1; ; lan += 1) {
      try {
        const loiMoi = await this.prisma.$transaction(async (tx) => {
          /*
            Khoá dòng dự án trước: hai Leader bấm "Tạo link mới" cùng lúc thì
            lượt sau đợi lượt trước xong, rồi mới tắt link vừa tạo. Không khoá
            thì cả hai cùng thấy "chưa có link" và để lại HAI link sống.
          */
          await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id" = ${project.id} FOR UPDATE`;
          const bayGio = new Date();
          await tx.projectInvite.updateMany({
            where: { projectId: project.id, revokedAt: null },
            data: { revokedAt: bayGio },
          });
          return tx.projectInvite.create({
            data: {
              code: sinhMaMoi(),
              projectId: project.id,
              createdById: userId,
              createdAt: bayGio,
              expiresAt: new Date(bayGio.getTime() + HAN_LOI_MOI_MS),
            },
          });
        });
        return this.choLeader(loiMoi);
      } catch (loi) {
        if (!laTrungMa(loi) || lan >= SO_LAN_THU_MA) throw loi;
        this.logger.warn(`Trùng mã mời lần ${lan}, thử mã khác`);
      }
    }
  }

  async tatLoiMoi(userId: string, projectId: string): Promise<{ ok: true }> {
    const project = await this.projects.ensureProjectManager(userId, projectId);
    await this.prisma.projectInvite.updateMany({
      where: { projectId: project.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private choLeader(
    loiMoi: Pick<ProjectInvite, 'code' | 'expiresAt' | 'useCount'>,
  ): LoiMoiChoLeader {
    return {
      code: loiMoi.code,
      url: duongDanMoi(loiMoi.code),
      expiresAt: loiMoi.expiresAt,
      useCount: loiMoi.useCount,
    };
  }
}
```

(`blocks`, `chatGateway`, `notifications` được tiêm sẵn để Task B5, B6 dùng; tham số thuộc tính của constructor không bị luật `no-unused-vars` bắt.)

`src/projects/loi-moi/project-invites.controller.ts`:

```ts
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { YeuCauDaXacThuc } from '../../auth/yeu-cau-da-xac-thuc';
import { ProjectInvitesService } from './project-invites.service';

/**
 * Link mời của một dự án, cho chủ workspace và Leader. Không trùng đường với
 * `ProjectsController` (`:id` một đoạn, ở đây `:id/invite` hai đoạn).
 */
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectInvitesController {
  constructor(private readonly invites: ProjectInvitesService) {}

  /** Chưa có link còn hiệu lực thì trả `null` (thân rỗng, 200). */
  @Get(':id/invite')
  lay(@Req() req: YeuCauDaXacThuc, @Param('id') id: string) {
    return this.invites.layLoiMoi(req.user.id, id);
  }

  @Post(':id/invite')
  tao(@Req() req: YeuCauDaXacThuc, @Param('id') id: string) {
    return this.invites.taoLoiMoi(req.user.id, id);
  }

  @Delete(':id/invite')
  tat(@Req() req: YeuCauDaXacThuc, @Param('id') id: string) {
    return this.invites.tatLoiMoi(req.user.id, id);
  }
}
```

`src/projects/projects.module.ts` — thay toàn bộ bằng:

```ts
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { UserBlocksModule } from '../moderation/user-blocks.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectInvitesController } from './loi-moi/project-invites.controller';
import { ProjectInvitesService } from './loi-moi/project-invites.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule, ChatModule, UserBlocksModule, NotificationsModule],
  controllers: [ProjectsController, ProjectInvitesController],
  providers: [ProjectsService, ProjectInvitesService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 5: Chạy lại**

Run: `npx jest src/projects src/common/request-rate-limit.wiring.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src/projects --max-warnings 0`
Expected: PASS (bài wiring dựng cả `AppModule` — xác nhận DI tiêm được `ProjectInvitesService`).

- [ ] **Step 6: Commit**

```bash
git add src/projects/loi-moi src/projects/projects.module.ts
git commit -m "feat(loi-moi): Leader xem, tao lai va tat link moi cua du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B5: Xem trước công khai và tham gia bằng mã

**Files:**
- Modify: `src/projects/loi-moi/project-invites.service.ts` (thêm `xemTruoc`, `thamGia`, `timLoiMoiDungDuoc`, `conQuyenMoi`)
- Modify: `src/projects/loi-moi/project-invites.controller.ts` (thêm `InvitesController`)
- Modify: `src/projects/projects.module.ts` (đăng ký `InvitesController`)
- Test: `src/projects/loi-moi/project-invites.service.spec.ts` (thay khối `void …` cuối tệp), `src/projects/loi-moi/project-invites.controller.spec.ts` (thêm cuối tệp)

**Interfaces:**
- Consumes: `lenhGhiThanhVien` (B3), `chuanHoaMaMoi` (B2), `loiMoiKhongThay|HetHan|DaTat|DuAnDong` (B4), `UserBlocksService.coChanVoiAi(userId, otherIds): Promise<boolean>`, `ChatGateway.emitProjectMembership(userId, 'project:member-added', { projectId, workspaceId })`.
- Produces:
  - `export interface XemTruocLoiMoi { projectName: string; workspaceName: string; leaderName: string; memberCount: number; expiresAt: Date }`
  - `export interface KetQuaThamGia { projectId: string; workspaceId: string; alreadyMember: boolean }`
  - `ProjectInvitesService.xemTruoc(maNhap: string): Promise<XemTruocLoiMoi>`
  - `ProjectInvitesService.thamGia(userId: string, maNhap: string): Promise<KetQuaThamGia>`
  - HTTP: `GET /invites/:code` (KHÔNG cần đăng nhập), `POST /invites/:code/join` (JwtAuthGuard, trả 200).
  - Thứ tự kiểm: mã sai dạng/không có → 404 `INVITE_NOT_FOUND`; `revokedAt` → 410 `INVITE_REVOKED`; hết hạn → 410 `INVITE_EXPIRED`; dự án `ARCHIVED` → 410 `INVITE_PROJECT_CLOSED`; người tạo mất quyền hoặc đã xoá tài khoản → 410 `INVITE_REVOKED`; (chỉ `join`) quan hệ chặn với người tạo → 404 `INVITE_NOT_FOUND`; đã là thành viên → `alreadyMember: true`.

- [ ] **Step 1: Viết bài kiểm thất bại (service)**

Trong `project-invites.service.spec.ts`, XOÁ khối bốn dòng `void …` ở cuối tệp và thêm:

```ts
async function thamGiaVoi(
  loiMoi: unknown,
  vaiTro: Record<string, 'LEADER' | 'MEMBER'> = { [LEADER]: 'LEADER' },
  ma = '7K3M9QXA',
) {
  const bo = taoService();
  bo.prisma.projectInvite.findUnique.mockResolvedValue(loiMoi);
  bo.prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi(vaiTro));
  return { ...bo, loi: await loiCua(bo.service.thamGia(NGUOI_VAO, ma)) };
}

describe('Xem trước lời mời', () => {
  it('chỉ trả tên dự án, workspace, Leader, số thành viên và hạn — không email, không id', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.findUnique.mockResolvedValue(loiMoiHopLe());
    prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi({ [LEADER]: 'LEADER' }));

    const ketQua = await service.xemTruoc('7k3m-9qxa');

    expect(prisma.projectInvite.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: '7K3M9QXA' } }),
    );
    expect(Object.keys(ketQua).sort()).toEqual([
      'expiresAt',
      'leaderName',
      'memberCount',
      'projectName',
      'workspaceName',
    ]);
    expect(ketQua).toMatchObject({
      projectName: 'Đồ án EXE',
      workspaceName: 'Lớp SE1801',
      leaderName: 'Lê Leader',
      memberCount: 3,
    });
    const json = JSON.stringify(ketQua);
    for (const biMat of [LEADER, CHU, DU_AN, KHONG_GIAN, '@']) {
      expect(json).not.toContain(biMat);
    }
  });

  it('link hết hạn: xem trước cũng báo 410 INVITE_EXPIRED', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.findUnique.mockResolvedValue(
      loiMoiHopLe({ expiresAt: new Date(Date.now() - 1000) }),
    );

    const loi = await loiCua(service.xemTruoc('7K3M9QXA'));
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_EXPIRED' });
  });
});

describe('Lời mời không dùng được', () => {
  it('mã sai dạng (có chữ O): 404, không hỏi cơ sở dữ liệu', async () => {
    const { loi, prisma } = await thamGiaVoi(loiMoiHopLe(), undefined, '7K3M9QXO');
    expect(loi.getStatus()).toBe(404);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_NOT_FOUND' });
    expect(prisma.projectInvite.findUnique).not.toHaveBeenCalled();
  });

  it('không có mã này: 404 INVITE_NOT_FOUND', async () => {
    const { loi } = await thamGiaVoi(null);
    expect(loi.getStatus()).toBe(404);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_NOT_FOUND' });
  });

  it('đã bị tắt: 410 INVITE_REVOKED', async () => {
    const { loi } = await thamGiaVoi(loiMoiHopLe({ revokedAt: new Date() }));
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_REVOKED' });
  });

  it('đã hết hạn: 410 INVITE_EXPIRED', async () => {
    const { loi } = await thamGiaVoi(loiMoiHopLe({ expiresAt: new Date(Date.now() - 1) }));
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_EXPIRED' });
  });

  it('dự án đã đóng (ARCHIVED): 410 INVITE_PROJECT_CLOSED', async () => {
    const goc = loiMoiHopLe();
    const { loi } = await thamGiaVoi({ ...goc, project: { ...goc.project, status: 'ARCHIVED' } });
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_PROJECT_CLOSED' });
  });

  it('người tạo không còn là Leader hay chủ workspace: coi như đã tắt (410 INVITE_REVOKED)', async () => {
    const { loi } = await thamGiaVoi(loiMoiHopLe(), { [LEADER]: 'MEMBER' });
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_REVOKED' });
  });

  it('người tạo đã xoá tài khoản: 410 INVITE_REVOKED', async () => {
    const { loi } = await thamGiaVoi(loiMoiHopLe({ createdById: null, createdBy: null }));
    expect(loi.getStatus()).toBe(410);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_REVOKED' });
  });

  it('có quan hệ chặn với người tạo link (bất kỳ chiều): 404 như không tìm thấy, không ghi gì', async () => {
    const bo = taoService();
    bo.prisma.projectInvite.findUnique.mockResolvedValue(loiMoiHopLe());
    bo.prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi({ [LEADER]: 'LEADER' }));
    bo.blocks.coChanVoiAi.mockResolvedValue(true);

    const loi = await loiCua(bo.service.thamGia(NGUOI_VAO, '7K3M9QXA'));

    expect(loi.getStatus()).toBe(404);
    expect(loi.getResponse()).toMatchObject({ code: 'INVITE_NOT_FOUND' });
    expect(bo.blocks.coChanVoiAi).toHaveBeenCalledWith(NGUOI_VAO, [LEADER]);
    expect(bo.prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Tham gia', () => {
  it('người mới: vào workspace và dự án với vai trò MEMBER, tăng lượt dùng, báo socket', async () => {
    const { service, prisma, chatGateway } = taoService();
    prisma.projectInvite.findUnique.mockResolvedValue(loiMoiHopLe());
    prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi({ [LEADER]: 'LEADER' }));

    await expect(service.thamGia(NGUOI_VAO, '7K3M-9QXA')).resolves.toEqual({
      projectId: DU_AN,
      workspaceId: KHONG_GIAN,
      alreadyMember: false,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith([
      'upsert-ws',
      'upsert-du-an',
      'cham-ws',
      'tang-luot',
    ]);
    expect(prisma.workspaceMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { workspaceId: KHONG_GIAN, userId: NGUOI_VAO, role: 'MEMBER' },
      }),
    );
    expect(prisma.projectMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {},
        create: { projectId: DU_AN, userId: NGUOI_VAO, role: 'MEMBER' },
      }),
    );
    expect(prisma.projectInvite.update).toHaveBeenCalledWith({
      where: { id: 'moi-1' },
      data: { useCount: { increment: 1 } },
    });
    expect(chatGateway.emitProjectMembership).toHaveBeenCalledWith(
      NGUOI_VAO,
      'project:member-added',
      { projectId: DU_AN, workspaceId: KHONG_GIAN },
    );
  });

  it('người tạo là chủ workspace (không cần là thành viên dự án): vẫn dùng được', async () => {
    const { service, prisma } = taoService();
    prisma.projectInvite.findUnique.mockResolvedValue(
      loiMoiHopLe({ createdById: CHU, createdBy: { id: CHU, fullName: 'Chủ Nhóm' } }),
    );
    prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi({}));

    await expect(service.thamGia(NGUOI_VAO, '7K3M9QXA')).resolves.toMatchObject({
      alreadyMember: false,
    });
  });

  it('đã là thành viên: trả alreadyMember, không ghi gì, không tăng lượt dùng', async () => {
    const { service, prisma, chatGateway } = taoService();
    prisma.projectInvite.findUnique.mockResolvedValue(loiMoiHopLe());
    prisma.projectMember.findUnique.mockImplementation(
      vaiTroTheoNguoi({ [LEADER]: 'LEADER', [NGUOI_VAO]: 'MEMBER' }),
    );

    await expect(service.thamGia(NGUOI_VAO, '7K3M9QXA')).resolves.toEqual({
      projectId: DU_AN,
      workspaceId: KHONG_GIAN,
      alreadyMember: true,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.projectInvite.update).not.toHaveBeenCalled();
    expect(chatGateway.emitProjectMembership).not.toHaveBeenCalled();
  });
});
```

Thêm vào CUỐI `project-invites.controller.spec.ts` (và sửa dòng import controller thành `import { InvitesController, ProjectInvitesController } from './project-invites.controller';`):

```ts
describe('InvitesController', () => {
  it('xem trước KHÔNG cần đăng nhập (người nhận link chưa có tài khoản)', () => {
    expect(guardCua(InvitesController)).toEqual([]);
    expect(guardCua(InvitesController, 'xemTruoc')).toEqual([]);
  });

  it('tham gia cần đăng nhập', () => {
    expect(guardCua(InvitesController, 'thamGia')).toContain(JwtAuthGuard);
  });

  it('chuyển mã và người gọi cho service', async () => {
    const service = {
      xemTruoc: jest.fn().mockResolvedValue({}),
      thamGia: jest.fn().mockResolvedValue({}),
    };
    const controller = new InvitesController(service as never);

    await controller.xemTruoc('7k3m-9qxa');
    await controller.thamGia(req, '7k3m-9qxa');

    expect(service.xemTruoc).toHaveBeenCalledWith('7k3m-9qxa');
    expect(service.thamGia).toHaveBeenCalledWith('u-leader', '7k3m-9qxa');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/projects/loi-moi/project-invites`
Expected: FAIL — lỗi TS "Property 'xemTruoc' does not exist on type 'ProjectInvitesService'" và "Module has no exported member 'InvitesController'".

- [ ] **Step 3: Viết mã — service**

Trong `project-invites.service.ts`, thêm vào các import:

```ts
import { lenhGhiThanhVien } from '../ghi-thanh-vien';
import {
  loiMoiDaTat,
  loiMoiDuAnDong,
  loiMoiHetHan,
  loiMoiKhongThay,
} from './loi-moi.errors';
```

và đổi `import { duongDanMoi, sinhMaMoi } from './ma-moi';` thành `import { chuanHoaMaMoi, duongDanMoi, sinhMaMoi } from './ma-moi';`.

Ngay sau `export interface LoiMoiChoLeader { … }` thêm:

```ts
/** Trang xem trước công khai: đủ để biết mình được mời vào đâu, không lộ email hay id. */
export interface XemTruocLoiMoi {
  projectName: string;
  workspaceName: string;
  leaderName: string;
  memberCount: number;
  expiresAt: Date;
}

export interface KetQuaThamGia {
  projectId: string;
  workspaceId: string;
  alreadyMember: boolean;
}
```

Ngay trước `private choLeader(` thêm:

```ts
  /** Công khai: không cần đăng nhập, nên không xét quan hệ chặn (chưa biết ai đang xem). */
  async xemTruoc(maNhap: string): Promise<XemTruocLoiMoi> {
    const loiMoi = await this.timLoiMoiDungDuoc(maNhap);
    return {
      projectName: loiMoi.project.name,
      workspaceName: loiMoi.project.workspace.name,
      leaderName: loiMoi.nguoiTao.fullName,
      memberCount: loiMoi.project._count.members,
      expiresAt: loiMoi.expiresAt,
    };
  }

  /**
   * Vào thẳng dự án với vai trò MEMBER, không chờ Leader duyệt (chủ dự án
   * chốt 02/10/2026). Leader nâng vai trò bằng cách hiện có.
   */
  async thamGia(userId: string, maNhap: string): Promise<KetQuaThamGia> {
    const loiMoi = await this.timLoiMoiDungDuoc(maNhap);
    const { project } = loiMoi;
    const dich = { projectId: project.id, workspaceId: project.workspaceId };

    // Cùng câu với "không tìm thấy": không để lộ là có quan hệ chặn.
    if (await this.blocks.coChanVoiAi(userId, [loiMoi.nguoiTao.id])) {
      throw loiMoiKhongThay();
    }

    const daCo = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId } },
      select: { id: true },
    });
    if (daCo) return { ...dich, alreadyMember: true };

    await this.prisma.$transaction([
      ...lenhGhiThanhVien(this.prisma, {
        projectId: project.id,
        workspaceId: project.workspaceId,
        userId,
        vaiTro: 'MEMBER',
        doiVaiTroNeuDaCo: false,
      }),
      this.prisma.projectInvite.update({
        where: { id: loiMoi.id },
        data: { useCount: { increment: 1 } },
      }),
    ]);

    // Cùng sự kiện như khi Leader thêm bằng ô mời: app và web tự vào phòng dự án.
    this.chatGateway.emitProjectMembership(userId, 'project:member-added', dich);
    return { ...dich, alreadyMember: false };
  }

  /**
   * Link còn dùng được, hoặc ném đúng lỗi. Mã sai dạng không chạm cơ sở dữ liệu.
   *
   * `revokedAt` xét trước hạn: link Leader đã tắt (hay đã thay bằng link mới)
   * thì nói "đã tắt" dù cũng đã quá hạn — đó là điều người nhận cần biết.
   */
  private async timLoiMoiDungDuoc(maNhap: string) {
    const code = chuanHoaMaMoi(maNhap);
    if (!code) throw loiMoiKhongThay();

    const loiMoi = await this.prisma.projectInvite.findUnique({
      where: { code },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            workspaceId: true,
            workspace: { select: { name: true, ownerId: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });
    if (!loiMoi) throw loiMoiKhongThay();
    if (loiMoi.revokedAt) throw loiMoiDaTat();
    if (loiMoi.expiresAt.getTime() <= Date.now()) throw loiMoiHetHan();
    if (loiMoi.project.status === 'ARCHIVED') throw loiMoiDuAnDong();

    // Người tạo mất quyền (bị hạ vai trò, rời dự án) hay xoá tài khoản: link coi như đã tắt.
    const nguoiTao = loiMoi.createdBy;
    if (!nguoiTao || !(await this.conQuyenMoi(nguoiTao.id, loiMoi.project))) {
      throw loiMoiDaTat();
    }
    return { ...loiMoi, nguoiTao };
  }

  /** Cùng quy tắc với `ensureProjectManager`: chủ workspace hoặc Leader dự án. */
  private async conQuyenMoi(
    userId: string,
    project: { id: string; workspace: { ownerId: string } },
  ) {
    if (project.workspace.ownerId === userId) return true;
    const thanhVien = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId } },
      select: { role: true },
    });
    return thanhVien?.role === 'LEADER';
  }
```

- [ ] **Step 4: Viết mã — controller và module**

Thêm vào cuối `project-invites.controller.ts` (và thêm `HttpCode` vào dòng import từ `@nestjs/common`):

```ts
/**
 * Lời mời theo mã. Xem trước KHÔNG cần đăng nhập — người nhận link có thể chưa
 * có tài khoản; hạn mức theo IP nằm ở RequestRateLimitGuard.
 */
@Controller('invites')
export class InvitesController {
  constructor(private readonly invites: ProjectInvitesService) {}

  @Get(':code')
  xemTruoc(@Param('code') code: string) {
    return this.invites.xemTruoc(code);
  }

  /** 200 chứ không 201: người đã là thành viên thì không tạo gì cả. */
  @UseGuards(JwtAuthGuard)
  @Post(':code/join')
  @HttpCode(200)
  thamGia(@Req() req: YeuCauDaXacThuc, @Param('code') code: string) {
    return this.invites.thamGia(req.user.id, code);
  }
}
```

Trong `projects.module.ts`: đổi import thành `import { InvitesController, ProjectInvitesController } from './loi-moi/project-invites.controller';` và `controllers: [ProjectsController, ProjectInvitesController, InvitesController],`.

- [ ] **Step 5: Chạy lại**

Run: `npx jest src/projects src/common/request-rate-limit.wiring.spec.ts && npx tsc --noEmit -p tsconfig.json && npx eslint src/projects --max-warnings 0`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/projects/loi-moi src/projects/projects.module.ts
git commit -m "feat(loi-moi): xem truoc cong khai va tham gia du an bang ma moi" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B6: Báo Leader và chủ workspace bằng thông báo `PROJECT_MEMBER_JOINED`

**Files:**
- Modify: `src/notifications/notifications.service.ts` (interface `SystemNotificationInput` ~dòng 56-66; khối `createMany` trong `createSystemNotification` ~121-133)
- Modify: `src/projects/loi-moi/project-invites.service.ts` (thêm `baoLeader`, gọi trong `thamGia`)
- Test: `src/notifications/thong-bao-nguoi-lam.spec.ts` (tạo), `src/projects/loi-moi/project-invites.service.spec.ts` (thêm cuối tệp)

**Interfaces:**
- Consumes: `NotificationsService.createSystemNotification(input)` (ghi dòng + push, bỏ qua `dedupeKey` trùng), `ChatGateway.emitUserNotification(userId, notification)`.
- Produces:
  - `SystemNotificationInput.actorId?: string | null` (tuỳ chọn, thêm mới).
  - `export const TIEU_DE_THANH_VIEN_MOI = 'Thành viên mới tham gia dự án'` (web dịch tiêu đề này ở W2).
  - Mỗi người nhận (chủ workspace ∪ mọi LEADER, trừ người vào) nhận đúng một dòng: `{ type: 'PROJECT_MEMBER_JOINED', title: TIEU_DE_THANH_VIEN_MOI, message: '<tên> đã tham gia dự án "<dự án>" qua link mời.', dedupeKey: 'project-member-joined:<inviteId>:<joinerId>:<recipientId>', userId, actorId: joinerId, workspaceId, projectId }`. Không có `actionUrl`, không có `taskId`. Push `data` = `{ notificationId, type: 'PROJECT_MEMBER_JOINED', projectId }`.

Quyết định đã kiểm (xem "Kiểm tra tương thích loại thông báo lạ" ở đầu kế hoạch): GHI dòng Notification.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/notifications/thong-bao-nguoi-lam.spec.ts`:

```ts
import { NotificationsService } from './notifications.service';

it('thông báo người vào nhóm: ghi actorId, không cần đọc cài đặt, đẩy push kèm projectId', async () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    notification: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue({ id: 'tb-1' }),
    },
  };
  const expoPush = { sendToUser: jest.fn().mockResolvedValue(undefined) };
  const service = new NotificationsService(prisma as never, expoPush as never);

  await service.createSystemNotification({
    type: 'PROJECT_MEMBER_JOINED',
    title: 'Thành viên mới tham gia dự án',
    message: 'Lan đã tham gia dự án "Đồ án" qua link mời.',
    dedupeKey: 'project-member-joined:moi-1:u-ban:u-leader',
    userId: 'u-leader',
    actorId: 'u-ban',
    workspaceId: 'w-1',
    projectId: 'p-1',
  });

  expect(prisma.notification.createMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ type: 'PROJECT_MEMBER_JOINED', actorId: 'u-ban' }),
    }),
  );
  // Loại này không có công tắc tắt trong Cài đặt: không đọc tuỳ chọn của người nhận.
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
  expect(expoPush.sendToUser).toHaveBeenCalledWith(
    'u-leader',
    expect.objectContaining({
      data: expect.objectContaining({ type: 'PROJECT_MEMBER_JOINED', projectId: 'p-1' }),
    }),
  );
});
```

Thêm vào CUỐI `src/projects/loi-moi/project-invites.service.spec.ts`:

```ts
describe('Báo Leader và chủ workspace', () => {
  function chuanBi() {
    const bo = taoService();
    bo.prisma.projectInvite.findUnique.mockResolvedValue(loiMoiHopLe());
    bo.prisma.projectMember.findUnique.mockImplementation(vaiTroTheoNguoi({ [LEADER]: 'LEADER' }));
    bo.prisma.projectMember.findMany.mockResolvedValue([{ userId: LEADER }, { userId: 'u-leader-2' }]);
    bo.prisma.user.findUnique.mockResolvedValue({ fullName: 'Trần Lan' });
    bo.notifications.createSystemNotification.mockImplementation((dl: { userId: string }) =>
      Promise.resolve({ id: `tb-${dl.userId}` }),
    );
    return bo;
  }

  it('mỗi Leader và chủ workspace nhận đúng một thông báo, kèm socket', async () => {
    const { service, prisma, notifications, chatGateway } = chuanBi();

    await service.thamGia(NGUOI_VAO, '7K3M9QXA');

    expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
      where: { projectId: DU_AN, role: 'LEADER' },
      select: { userId: true },
    });
    const nguoiNhan = (notifications.createSystemNotification.mock.calls as Array<[{ userId: string }]>)
      .map(([dl]) => dl.userId)
      .sort();
    expect(nguoiNhan).toEqual([CHU, LEADER, 'u-leader-2'].sort());
    expect(notifications.createSystemNotification).toHaveBeenCalledWith({
      type: 'PROJECT_MEMBER_JOINED',
      title: 'Thành viên mới tham gia dự án',
      message: 'Trần Lan đã tham gia dự án "Đồ án EXE" qua link mời.',
      dedupeKey: `project-member-joined:moi-1:${NGUOI_VAO}:${LEADER}`,
      userId: LEADER,
      actorId: NGUOI_VAO,
      workspaceId: KHONG_GIAN,
      projectId: DU_AN,
    });
    expect(chatGateway.emitUserNotification).toHaveBeenCalledWith(LEADER, { id: `tb-${LEADER}` });
    expect(chatGateway.emitUserNotification).toHaveBeenCalledTimes(3);
  });

  it('chủ workspace cũng là Leader: chỉ một thông báo cho người đó', async () => {
    const { service, prisma, notifications } = chuanBi();
    prisma.projectMember.findMany.mockResolvedValue([{ userId: CHU }]);

    await service.thamGia(NGUOI_VAO, '7K3M9QXA');

    expect(notifications.createSystemNotification).toHaveBeenCalledTimes(1);
  });

  it('thông báo trùng (dedupe trả null): không bắn socket', async () => {
    const { service, notifications, chatGateway } = chuanBi();
    notifications.createSystemNotification.mockResolvedValue(null);

    await service.thamGia(NGUOI_VAO, '7K3M9QXA');

    expect(chatGateway.emitUserNotification).not.toHaveBeenCalled();
  });

  it('ghi thông báo hỏng: người vào vẫn tham gia thành công', async () => {
    const { service, notifications } = chuanBi();
    notifications.createSystemNotification.mockRejectedValue(new Error('csdl ban'));

    await expect(service.thamGia(NGUOI_VAO, '7K3M9QXA')).resolves.toMatchObject({
      alreadyMember: false,
    });
  });

  it('đã là thành viên: không báo ai', async () => {
    const { service, prisma, notifications } = chuanBi();
    prisma.projectMember.findUnique.mockImplementation(
      vaiTroTheoNguoi({ [LEADER]: 'LEADER', [NGUOI_VAO]: 'MEMBER' }),
    );

    await service.thamGia(NGUOI_VAO, '7K3M9QXA');

    expect(notifications.createSystemNotification).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/notifications/thong-bao-nguoi-lam.spec.ts src/projects/loi-moi/project-invites.service.spec.ts`
Expected: FAIL — lỗi TS "Object literal may only specify known properties, and 'actorId' does not exist in type 'SystemNotificationInput'", và các bài "Báo Leader…" nhận 0 lượt gọi `createSystemNotification`.

- [ ] **Step 3: Viết mã — NotificationsService**

Trong `interface SystemNotificationInput`, thêm sau dòng `  userId: string;`:

```ts
  /** Người gây ra thông báo (ví dụ người vừa vào nhóm) — danh sách hiện ảnh của họ. */
  actorId?: string | null;
```

Trong `createSystemNotification`, thay:

```ts
        actionUrl: input.actionUrl,
        userId: input.userId,
```

bằng:

```ts
        actionUrl: input.actionUrl,
        userId: input.userId,
        actorId: input.actorId,
```

- [ ] **Step 4: Viết mã — báo Leader trong ProjectInvitesService**

Thêm hằng số ngay dưới `const SO_LAN_THU_MA = 5;`:

```ts
/** Tiêu đề cố định: web dịch nguyên văn câu này sang tiếng Anh (tieu-de-thong-bao). */
export const TIEU_DE_THANH_VIEN_MOI = 'Thành viên mới tham gia dự án';
```

Trong `thamGia`, ngay sau dòng `this.chatGateway.emitProjectMembership(userId, 'project:member-added', dich);` thêm:

```ts
    await this.baoLeader(userId, loiMoi.id, project);
```

Thêm phương thức (trước `private async timLoiMoiDungDuoc`):

```ts
  /**
   * Báo chủ workspace và mọi Leader rằng có người vừa vào qua link — vào thẳng
   * không cần duyệt thì đây là cách duy nhất Leader biết nhóm vừa có ai.
   *
   * Ghi dòng Notification loại mới là an toàn: app Android 1.0.13/1.0.14 và iOS
   * 1.0.14 vẽ loại lạ bằng biểu tượng mặc định (NotificationRow FALLBACK).
   * Hỏng ở đây không được làm hỏng lượt tham gia đã ghi xong.
   */
  private async baoLeader(
    nguoiVaoId: string,
    loiMoiId: string,
    project: {
      id: string;
      name: string;
      workspaceId: string;
      workspace: { ownerId: string };
    },
  ) {
    try {
      const [nguoiVao, leaders] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: nguoiVaoId },
          select: { fullName: true },
        }),
        this.prisma.projectMember.findMany({
          where: { projectId: project.id, role: 'LEADER' },
          select: { userId: true },
        }),
      ]);
      const nguoiNhan = new Set([
        project.workspace.ownerId,
        ...leaders.map((leader) => leader.userId),
      ]);
      nguoiNhan.delete(nguoiVaoId);
      const ten = nguoiVao?.fullName || 'Một người';

      for (const recipientId of nguoiNhan) {
        const notification = await this.notifications.createSystemNotification({
          type: 'PROJECT_MEMBER_JOINED',
          title: TIEU_DE_THANH_VIEN_MOI,
          message: `${ten} đã tham gia dự án "${project.name}" qua link mời.`,
          dedupeKey: `project-member-joined:${loiMoiId}:${nguoiVaoId}:${recipientId}`,
          userId: recipientId,
          actorId: nguoiVaoId,
          workspaceId: project.workspaceId,
          projectId: project.id,
        });
        if (notification) {
          this.chatGateway.emitUserNotification(recipientId, notification);
        }
      }
    } catch (loi) {
      this.logger.warn(
        `Không báo được Leader về người vừa vào dự án ${project.id}: ${String(loi)}`,
      );
    }
  }
```

- [ ] **Step 5: Chạy lại**

Run: `npx jest src/notifications src/projects && npx tsc --noEmit -p tsconfig.json && npx eslint src/notifications src/projects --max-warnings 0`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/notifications/notifications.service.ts src/notifications/thong-bao-nguoi-lam.spec.ts src/projects/loi-moi/project-invites.service.ts src/projects/loi-moi/project-invites.service.spec.ts
git commit -m "feat(loi-moi): bao Leader va chu workspace khi co nguoi vao qua link" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B7: Giới hạn tần suất cho xem trước và tham gia

**Files:**
- Modify: `src/common/request-rate-limit.guard.ts` (`canActivate` ~dòng 61-104; thêm `tieuHanMuc`, `resolveRules`)
- Test: `src/common/request-rate-limit.guard.spec.ts` (thêm `describe` mới, trước `describe('chuanHoaDiaChiIp'`)

**Interfaces:**
- Consumes: `RateLimitRule`, `resolveRule`, `clientKey` có sẵn.
- Produces: `private resolveRules(request): RateLimitRule[]` — `GET /invites/:code` → `[{ key: 'invite-preview', max: 30, perUser: false }]`; `POST /invites/:code/join` → `[{ key: 'invite-join', max: 10, perUser: true }, { key: 'invite-join-ip', max: 30, perUser: false }]`; còn lại `[resolveRule()]` như cũ. `POST|DELETE /projects/:id/invite` rơi vào luật `write` 180/phút có sẵn.

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào `request-rate-limit.guard.spec.ts`, bên trong `describe('RequestRateLimitGuard', () => {` (trước dấu `});` đóng nó):

```ts
  describe('mời vào nhóm bằng mã', () => {
    const tokenCua = (sub: string) => jwt.sign({ sub, email: `${sub}@wedo.vn` });

    it('xem trước lời mời: 30 lượt mỗi phút theo IP', () => {
      expect(goi(guard, { method: 'GET', url: '/invites/7K3M9QXA' }, 31)).toBe(1);
    });

    it('xem trước theo IP: máy khác IP vẫn xem được', () => {
      goi(guard, { method: 'GET', url: '/invites/AAAA2222', ip: '1.1.1.1' }, 30);
      expect(goi(guard, { method: 'GET', url: '/invites/AAAA2222', ip: '2.2.2.2' }, 1)).toBe(0);
    });

    it('tham gia: 10 lượt mỗi phút cho mỗi người', () => {
      const token = tokenCua('u-1');
      expect(goi(guard, { method: 'POST', url: '/invites/7K3M9QXA/join', token }, 11)).toBe(1);
    });

    it('tham gia: thêm trần 30 lượt mỗi phút theo IP, để nhiều tài khoản phụ trên một máy không dò được mã', () => {
      for (const sub of ['u-1', 'u-2', 'u-3']) {
        goi(guard, { method: 'POST', url: '/invites/X/join', token: tokenCua(sub) }, 10);
      }
      expect(goi(guard, { method: 'POST', url: '/invites/X/join', token: tokenCua('u-9') }, 1)).toBe(1);
    });

    it('tạo và tắt link đi chung hạn mức ghi 180 mỗi phút', () => {
      const token = tokenCua('u-leader');
      expect(goi(guard, { method: 'POST', url: '/projects/p1/invite', token }, 180)).toBe(0);
      expect(goi(guard, { method: 'DELETE', url: '/projects/p1/invite', token }, 1)).toBe(1);
    });
  });
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/common/request-rate-limit.guard.spec.ts`
Expected: FAIL ở 4 bài đầu của "mời vào nhóm bằng mã" (GET không có hạn mức nên 0 lượt bị chặn; join đang theo luật `write` 180).

- [ ] **Step 3: Viết mã**

Trong `canActivate`, thay đoạn từ `    const rule = this.resolveRule(request);` tới hết phương thức (dòng `    return true;\n  }` đầu tiên) bằng:

```ts
    const rules = this.resolveRules(request);
    if (rules.length === 0) return true;

    const now = Date.now();
    for (const rule of rules) this.tieuHanMuc(request, response, rule, now);
    return true;
  }

  /** Tính một lượt vào hạn mức `rule`; vượt trần thì ném 429. */
  private tieuHanMuc(
    request: Request,
    response: Response,
    rule: RateLimitRule,
    now: number,
  ) {
    const bucketKey = `${this.clientKey(request, rule)}:${rule.key}`;
    const current = this.buckets.get(bucketKey);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + rule.windowMs }
        : current;

    bucket.count += 1;
    this.buckets.set(bucketKey, bucket);
    response.setHeader('X-RateLimit-Limit', String(rule.max));
    response.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, rule.max - bucket.count)),
    );

    if (this.buckets.size > 10_000) {
      for (const [key, value] of this.buckets) {
        if (value.resetAt <= now) this.buckets.delete(key);
      }
    }

    if (bucket.count > rule.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      response.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Mọi hạn mức áp lên yêu cầu này. Phần lớn đường chỉ có một. Tham gia nhóm
   * bằng mã có hai — theo người VÀ theo IP: mã 40 bit đã khó dò, nhưng không
   * để một máy dùng nhiều tài khoản phụ nhân hạn mức lên.
   */
  private resolveRules(request: Request): RateLimitRule[] {
    const path = request.originalUrl.split('?')[0].toLowerCase();
    const method = request.method.toUpperCase();

    if (method === 'GET' && /^\/invites\/[^/]+\/?$/.test(path)) {
      // Xem trước công khai, chưa đăng nhập: chỉ IP nói được ai đang thử.
      return [
        { key: 'invite-preview', max: 30, windowMs: 60_000, perUser: false },
      ];
    }
    if (method === 'POST' && /^\/invites\/[^/]+\/join\/?$/.test(path)) {
      return [
        { key: 'invite-join', max: 10, windowMs: 60_000, perUser: true },
        { key: 'invite-join-ip', max: 30, windowMs: 60_000, perUser: false },
      ];
    }
    const rule = this.resolveRule(request);
    return rule ? [rule] : [];
  }
```

(Phần thân `tieuHanMuc` là nguyên văn đoạn cũ của `canActivate`, chỉ chuyển chỗ.)

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/common && npx tsc --noEmit -p tsconfig.json && npx eslint src/common --max-warnings 0`
Expected: PASS — gồm mọi bài cũ của guard và bài wiring.

- [ ] **Step 5: Commit**

```bash
git add src/common/request-rate-limit.guard.ts src/common/request-rate-limit.guard.spec.ts
git commit -m "feat(han-muc): gioi han xem truoc va tham gia bang ma moi theo IP va nguoi dung" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B8: Bộ 6 mẫu dự án và `GET /project-templates`

**Files:**
- Create: `src/projects/mau-du-an.ts`
- Create: `src/projects/project-templates.controller.ts`
- Modify: `src/projects/projects.module.ts`
- Test: `src/projects/mau-du-an.spec.ts`

**Interfaces:**
- Produces:
  - `export type NgonNguMau = 'vi' | 'en'`
  - `export interface ChuSongNgu { vi: string; en: string }`
  - `export interface ViecMau { title: ChuSongNgu; description: ChuSongNgu; offsetDays: number }`
  - `export interface MauDuAn { id: string; name: ChuSongNgu; description: ChuSongNgu; tasks: readonly ViecMau[] }`
  - `export const MAU_DU_AN: readonly MauDuAn[]` — id theo thứ tự: `exe101`, `exe201`, `do-an-mon-hoc`, `thuyet-trinh-nhom`, `nghien-cuu-khoa-hoc`, `su-kien-clb`
  - `export const MA_MAU_DU_AN: readonly string[]`
  - `export function timMauDuAn(id: string): MauDuAn | undefined`
  - `export interface MauDuAnTheoNgonNgu { id: string; name: string; description: string; tasks: Array<{ title: string; offsetDays: number }> }`
  - `export function mauTheoNgonNgu(lang: NgonNguMau): MauDuAnTheoNgonNgu[]`
  - HTTP: `GET /project-templates?lang=vi|en` (JwtAuthGuard; `lang` khác `en` → `vi`).

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/projects/mau-du-an.spec.ts`:

```ts
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MA_MAU_DU_AN, MAU_DU_AN, mauTheoNgonNgu, timMauDuAn } from './mau-du-an';
import { ProjectTemplatesController } from './project-templates.controller';

const CO_DAU = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

describe('Bộ mẫu dự án', () => {
  it('đúng 6 mẫu theo thứ tự của spec', () => {
    expect(MA_MAU_DU_AN).toEqual([
      'exe101',
      'exe201',
      'do-an-mon-hoc',
      'thuyet-trinh-nhom',
      'nghien-cuu-khoa-hoc',
      'su-kien-clb',
    ]);
  });

  it('số ngày của từng việc khớp spec mục 5.3', () => {
    const theoMau = Object.fromEntries(
      MAU_DU_AN.map((mau) => [mau.id, mau.tasks.map((viec) => viec.offsetDays)]),
    );
    expect(theoMau).toEqual({
      exe101: [3, 7, 14, 21, 28, 35, 49, 56, 66, 70],
      exe201: [7, 28, 35, 42, 56, 63, 70, 77],
      'do-an-mon-hoc': [3, 10, 14, 21, 42, 49, 53, 56],
      'thuyet-trinh-nhom': [2, 5, 8, 10, 12, 14],
      'nghien-cuu-khoa-hoc': [7, 21, 28, 49, 63, 77, 84, 90],
      'su-kien-clb': [3, 7, 10, 14, 14, 21, 27, 28, 31],
    });
  });

  it('tên việc tiếng Việt khớp spec (EXE101 làm mẫu)', () => {
    expect(timMauDuAn('exe101')?.tasks.map((viec) => viec.title.vi)).toEqual([
      'Lập nhóm và chia vai trò',
      'Chọn ý tưởng',
      'Xác định vấn đề và khách hàng mục tiêu',
      'Phỏng vấn khách hàng',
      'Phân tích đối thủ',
      'Lean Canvas',
      'Làm prototype',
      'Thử với khách hàng',
      'Slide pitching',
      'Nộp báo cáo cuối kỳ',
    ]);
  });

  it('mọi tên và mô tả đều có đủ hai ngôn ngữ; bản tiếng Anh không còn dấu tiếng Việt', () => {
    for (const mau of MAU_DU_AN) {
      for (const chu of [mau.name, mau.description, ...mau.tasks.flatMap((v) => [v.title, v.description])]) {
        expect(chu.vi.trim()).not.toBe('');
        expect(chu.en.trim()).not.toBe('');
        expect(chu.en).not.toMatch(CO_DAU);
        expect(chu.vi).toBe(chu.vi.normalize('NFC'));
      }
    }
  });

  it('mỗi mô tả việc nói rõ nộp gì thì coi là xong', () => {
    for (const viec of MAU_DU_AN.flatMap((mau) => mau.tasks)) {
      expect(viec.description.vi).toMatch(/Xong khi/);
      expect(viec.description.en).toMatch(/Done when/);
    }
  });

  it('id lạ: không có mẫu', () => {
    expect(timMauDuAn('khong-co')).toBeUndefined();
  });

  it('theo ngôn ngữ: chỉ id, tên, mô tả và việc gồm tên + số ngày', () => {
    const [dau] = mauTheoNgonNgu('en');
    expect(dau.name).toBe('EXE101 – Startup idea');
    expect(Object.keys(dau.tasks[0]).sort()).toEqual(['offsetDays', 'title']);
    expect(dau.tasks[0]).toEqual({ title: 'Form the team and assign roles', offsetDays: 3 });
    expect(mauTheoNgonNgu('vi')[0].name).toBe('EXE101 – Ý tưởng khởi nghiệp');
  });
});

describe('ProjectTemplatesController', () => {
  it('cần đăng nhập', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ProjectTemplatesController)).toContain(JwtAuthGuard);
  });

  it('lang=en ra tiếng Anh; thiếu hay lạ thì tiếng Việt', () => {
    const controller = new ProjectTemplatesController();
    expect(controller.danhSach('en')[0].name).toBe('EXE101 – Startup idea');
    expect(controller.danhSach()[0].name).toBe('EXE101 – Ý tưởng khởi nghiệp');
    expect(controller.danhSach('fr')[0].name).toBe('EXE101 – Ý tưởng khởi nghiệp');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/projects/mau-du-an.spec.ts`
Expected: FAIL — "Cannot find module './mau-du-an'".

- [ ] **Step 3: Viết mã — danh mục**

`src/projects/mau-du-an.ts`:

```ts
/**
 * Bộ mẫu dự án cố định do WeDo soạn (spec 02/10/2026, mục 5.3).
 *
 * Nằm trong code, không cần bảng: đổi nội dung là một lần deploy. Mốc ngày của
 * EXE101 và EXE201 ước theo một kỳ khoảng 10 tuần; chủ dự án có đề cương thật
 * thì sửa số ngày ở đây. Mô tả mỗi việc nói làm gì và nộp gì thì coi là xong.
 */
export type NgonNguMau = 'vi' | 'en';

export interface ChuSongNgu {
  vi: string;
  en: string;
}

export interface ViecMau {
  title: ChuSongNgu;
  description: ChuSongNgu;
  /** Số ngày tính từ ngày bắt đầu; hạn là 23:59 giờ Việt Nam của ngày đó. */
  offsetDays: number;
}

export interface MauDuAn {
  id: string;
  name: ChuSongNgu;
  description: ChuSongNgu;
  tasks: readonly ViecMau[];
}

function viec(offsetDays: number, title: ChuSongNgu, description: ChuSongNgu): ViecMau {
  return { title, description, offsetDays };
}

export const MAU_DU_AN: readonly MauDuAn[] = [
  {
    id: 'exe101',
    name: { vi: 'EXE101 – Ý tưởng khởi nghiệp', en: 'EXE101 – Startup idea' },
    description: {
      vi: 'Đi từ ý tưởng tới prototype và bài pitching trong một kỳ học.',
      en: 'Go from an idea to a prototype and a pitch in one term.',
    },
    tasks: [
      viec(3, { vi: 'Lập nhóm và chia vai trò', en: 'Form the team and assign roles' }, {
        vi: 'Thống nhất vai trò, kênh liên lạc và lịch họp. Xong khi có bảng phân vai đã chốt.',
        en: 'Agree on roles, a contact channel and a meeting schedule. Done when the role sheet is agreed.',
      }),
      viec(7, { vi: 'Chọn ý tưởng', en: 'Pick an idea' }, {
        vi: 'Mỗi người đề xuất ý tưởng, cả nhóm chấm điểm và chọn một. Xong khi có ý tưởng được chọn kèm lý do.',
        en: 'Everyone pitches ideas, the team scores them and picks one. Done when the chosen idea and the reasons are written down.',
      }),
      viec(14, { vi: 'Xác định vấn đề và khách hàng mục tiêu', en: 'Define the problem and target customers' }, {
        vi: 'Viết rõ vấn đề và chân dung khách hàng. Xong khi có một trang mô tả vấn đề và persona.',
        en: 'Describe the problem and the customer clearly. Done when there is a one-page problem statement and persona.',
      }),
      viec(21, { vi: 'Phỏng vấn khách hàng', en: 'Interview customers' }, {
        vi: 'Phỏng vấn ít nhất 10 người trong nhóm khách hàng mục tiêu. Xong khi có bảng tổng hợp câu trả lời và điều rút ra.',
        en: 'Interview at least 10 people from the target group. Done when the answers and key takeaways are summarised.',
      }),
      viec(28, { vi: 'Phân tích đối thủ', en: 'Analyse competitors' }, {
        vi: 'So sánh các giải pháp đang có về giá, tính năng và điểm yếu. Xong khi có bảng so sánh đối thủ.',
        en: 'Compare existing solutions on price, features and weaknesses. Done when the competitor table is ready.',
      }),
      viec(35, { vi: 'Lean Canvas', en: 'Lean Canvas' }, {
        vi: 'Điền đủ 9 ô Lean Canvas từ những gì đã tìm hiểu. Xong khi canvas được cả nhóm duyệt.',
        en: 'Fill in all nine Lean Canvas boxes from your research. Done when the whole team signs off on the canvas.',
      }),
      viec(49, { vi: 'Làm prototype', en: 'Build a prototype' }, {
        vi: 'Làm bản mẫu đủ để khách hàng thử luồng chính. Xong khi có link hoặc tệp prototype dùng được.',
        en: 'Build a prototype good enough for customers to try the main flow. Done when there is a working link or file.',
      }),
      viec(56, { vi: 'Thử với khách hàng', en: 'Test with customers' }, {
        vi: 'Cho khách hàng dùng thử prototype và ghi lại phản hồi. Xong khi có biên bản thử nghiệm và danh sách điều cần sửa.',
        en: 'Let customers try the prototype and record their feedback. Done when the test notes and a fix list are written.',
      }),
      viec(66, { vi: 'Slide pitching', en: 'Pitch deck' }, {
        vi: 'Làm slide trình bày vấn đề, giải pháp, thị trường và kết quả thử nghiệm. Xong khi slide được nộp lên nhóm.',
        en: 'Make slides covering the problem, solution, market and test results. Done when the deck is shared with the team.',
      }),
      viec(70, { vi: 'Nộp báo cáo cuối kỳ', en: 'Submit the final report' }, {
        vi: 'Hoàn thiện báo cáo theo mẫu của môn và nộp đúng hạn. Xong khi đã nộp báo cáo.',
        en: 'Finish the report in the course format and submit it on time. Done when the report is submitted.',
      }),
    ],
  },
  {
    id: 'exe201',
    name: { vi: 'EXE201 – MVP và thị trường', en: 'EXE201 – MVP and market' },
    description: {
      vi: 'Đưa sản phẩm tối thiểu ra thị trường, đo chỉ số và chứng minh doanh thu.',
      en: 'Launch a minimum viable product, measure it and prove revenue.',
    },
    tasks: [
      viec(7, { vi: 'Chốt mô hình kinh doanh', en: 'Finalise the business model' }, {
        vi: 'Chốt khách hàng, kênh bán và cách thu tiền. Xong khi có Business Model Canvas đã duyệt.',
        en: 'Settle the customers, sales channels and revenue model. Done when the Business Model Canvas is approved.',
      }),
      viec(28, { vi: 'Xây MVP', en: 'Build the MVP' }, {
        vi: 'Làm phiên bản tối thiểu có giá trị cốt lõi. Xong khi MVP chạy được và có link để dùng thử.',
        en: 'Build the smallest version that delivers the core value. Done when the MVP runs and has a link to try.',
      }),
      viec(35, { vi: 'Ra mắt, có người dùng đầu tiên', en: 'Launch and get the first users' }, {
        vi: 'Ra mắt MVP và kéo những người dùng đầu tiên. Xong khi có danh sách người dùng thật đầu tiên.',
        en: 'Launch the MVP and bring in the first users. Done when you have a list of your first real users.',
      }),
      viec(42, { vi: 'Kế hoạch marketing', en: 'Marketing plan' }, {
        vi: 'Lên kênh, nội dung, ngân sách và lịch đăng. Xong khi kế hoạch marketing được duyệt.',
        en: 'Plan channels, content, budget and a posting schedule. Done when the marketing plan is approved.',
      }),
      viec(56, { vi: 'Đo lường chỉ số', en: 'Track key metrics' }, {
        vi: 'Theo dõi người dùng, tỉ lệ chuyển đổi và giữ chân. Xong khi có bảng số liệu cập nhật hằng tuần.',
        en: 'Track users, conversion and retention. Done when a weekly metrics sheet is in place.',
      }),
      viec(63, { vi: 'Bằng chứng doanh thu', en: 'Proof of revenue' }, {
        vi: 'Thu thập hoá đơn, sao kê hoặc đơn hàng thật. Xong khi có hồ sơ chứng minh doanh thu.',
        en: 'Collect invoices, statements or real orders. Done when the revenue evidence file is ready.',
      }),
      viec(70, { vi: 'Báo cáo tài chính', en: 'Financial report' }, {
        vi: 'Tổng hợp thu, chi, lãi lỗ của dự án. Xong khi báo cáo tài chính được nộp lên nhóm.',
        en: 'Summarise income, costs and profit or loss. Done when the financial report is shared with the team.',
      }),
      viec(77, { vi: 'Demo day / pitching', en: 'Demo day pitch' }, {
        vi: 'Chuẩn bị demo và bài pitching cho buổi trình bày cuối. Xong khi nhóm đã tập đủ và trình bày.',
        en: 'Prepare the demo and pitch for the final presentation. Done when the team has rehearsed and presented.',
      }),
    ],
  },
  {
    id: 'do-an-mon-hoc',
    name: { vi: 'Đồ án môn học', en: 'Course project' },
    description: {
      vi: 'Khung việc cho một đồ án nhóm kéo dài khoảng tám tuần.',
      en: 'A task plan for a group course project of about eight weeks.',
    },
    tasks: [
      viec(3, { vi: 'Lập kế hoạch và chia việc', en: 'Plan and split the work' }, {
        vi: 'Đọc đề, chia phần việc và chốt các mốc. Xong khi mỗi người biết phần của mình và hạn nộp.',
        en: 'Read the brief, split the work and set milestones. Done when everyone knows their part and deadline.',
      }),
      viec(10, { vi: 'Nghiên cứu tài liệu', en: 'Research' }, {
        vi: 'Tìm và đọc tài liệu liên quan tới đề tài. Xong khi có danh sách tài liệu kèm ghi chú.',
        en: 'Find and read sources on the topic. Done when there is an annotated source list.',
      }),
      viec(14, { vi: 'Phân tích yêu cầu', en: 'Analyse requirements' }, {
        vi: 'Liệt kê yêu cầu và phạm vi của đồ án. Xong khi tài liệu yêu cầu được cả nhóm duyệt.',
        en: 'List the requirements and scope. Done when the team approves the requirements document.',
      }),
      viec(21, { vi: 'Thiết kế', en: 'Design' }, {
        vi: 'Thiết kế giải pháp: sơ đồ, giao diện hoặc mô hình. Xong khi bản thiết kế được duyệt.',
        en: 'Design the solution: diagrams, screens or models. Done when the design is approved.',
      }),
      viec(42, { vi: 'Thực hiện', en: 'Build' }, {
        vi: 'Làm phần chính của đồ án theo thiết kế. Xong khi sản phẩm chạy được đủ chức năng chính.',
        en: 'Build the main part of the project from the design. Done when the core features work.',
      }),
      viec(49, { vi: 'Kiểm thử, hoàn thiện', en: 'Test and polish' }, {
        vi: 'Kiểm thử, sửa lỗi và hoàn thiện chi tiết. Xong khi không còn lỗi lớn.',
        en: 'Test, fix bugs and polish the details. Done when no major bugs remain.',
      }),
      viec(53, { vi: 'Viết báo cáo', en: 'Write the report' }, {
        vi: 'Viết báo cáo theo mẫu của môn. Xong khi bản báo cáo hoàn chỉnh được nộp lên nhóm.',
        en: 'Write the report in the course format. Done when the complete report is shared with the team.',
      }),
      viec(56, { vi: 'Slide và tập thuyết trình', en: 'Slides and rehearsal' }, {
        vi: 'Làm slide và tập trình bày ít nhất một lần. Xong khi slide hoàn chỉnh và cả nhóm đã tập.',
        en: 'Make the slides and rehearse at least once. Done when the deck is final and the team has rehearsed.',
      }),
    ],
  },
  {
    id: 'thuyet-trinh-nhom',
    name: { vi: 'Thuyết trình nhóm', en: 'Group presentation' },
    description: {
      vi: 'Chuẩn bị một bài thuyết trình nhóm trong hai tuần.',
      en: 'Prepare a group presentation in two weeks.',
    },
    tasks: [
      viec(2, { vi: 'Chọn chủ đề và dàn ý', en: 'Choose the topic and outline' }, {
        vi: 'Chốt chủ đề và dàn ý các phần. Xong khi dàn ý được cả nhóm đồng ý.',
        en: 'Settle the topic and the outline. Done when the team agrees on the outline.',
      }),
      viec(5, { vi: 'Tìm tư liệu', en: 'Gather material' }, {
        vi: 'Tìm số liệu, hình ảnh và nguồn cho từng phần. Xong khi mỗi phần có đủ tư liệu.',
        en: 'Find data, images and sources for each part. Done when every part has enough material.',
      }),
      viec(8, { vi: 'Làm slide từng phần', en: 'Make slides for each part' }, {
        vi: 'Mỗi người làm slide phần của mình. Xong khi mọi phần đều đã có slide.',
        en: 'Each person makes the slides for their part. Done when every part has slides.',
      }),
      viec(10, { vi: 'Ghép và chỉnh slide', en: 'Merge and polish the slides' }, {
        vi: 'Ghép thành một bộ, thống nhất kiểu chữ và màu. Xong khi có bộ slide hoàn chỉnh.',
        en: 'Merge into one deck with consistent fonts and colours. Done when the deck is complete.',
      }),
      viec(12, { vi: 'Tập thuyết trình', en: 'Rehearse' }, {
        vi: 'Tập cả bài, canh thời gian và chuyển phần. Xong khi bài trình bày vừa thời lượng.',
        en: 'Rehearse the whole talk, timing and handovers. Done when the talk fits the time limit.',
      }),
      viec(14, { vi: 'Thuyết trình', en: 'Present' }, {
        vi: 'Trình bày trước lớp và trả lời câu hỏi. Xong khi đã thuyết trình.',
        en: 'Present to the class and answer questions. Done when the presentation is given.',
      }),
    ],
  },
  {
    id: 'nghien-cuu-khoa-hoc',
    name: { vi: 'Nghiên cứu khoa học', en: 'Research project' },
    description: {
      vi: 'Từ câu hỏi nghiên cứu tới bài viết hoàn chỉnh trong khoảng ba tháng.',
      en: 'From a research question to a finished paper in about three months.',
    },
    tasks: [
      viec(7, { vi: 'Chọn đề tài và câu hỏi nghiên cứu', en: 'Choose the topic and research question' }, {
        vi: 'Chốt đề tài, câu hỏi và mục tiêu nghiên cứu. Xong khi người hướng dẫn đồng ý.',
        en: 'Settle the topic, question and objectives. Done when the supervisor approves.',
      }),
      viec(21, { vi: 'Tổng quan tài liệu', en: 'Literature review' }, {
        vi: 'Đọc và tổng hợp các nghiên cứu liên quan. Xong khi có bản tổng quan tài liệu.',
        en: 'Read and summarise related studies. Done when the literature review draft is written.',
      }),
      viec(28, { vi: 'Thiết kế phương pháp', en: 'Design the method' }, {
        vi: 'Chọn phương pháp, mẫu và công cụ thu thập dữ liệu. Xong khi đề cương phương pháp được duyệt.',
        en: 'Choose the method, sample and data collection tools. Done when the method plan is approved.',
      }),
      viec(49, { vi: 'Thu thập dữ liệu', en: 'Collect data' }, {
        vi: 'Khảo sát, phỏng vấn hoặc làm thí nghiệm theo kế hoạch. Xong khi đủ dữ liệu cần thiết.',
        en: 'Run the surveys, interviews or experiments as planned. Done when all the needed data is in.',
      }),
      viec(63, { vi: 'Phân tích dữ liệu', en: 'Analyse data' }, {
        vi: 'Xử lý và phân tích dữ liệu, rút ra kết quả. Xong khi có bảng và biểu đồ kết quả.',
        en: 'Process and analyse the data to get results. Done when the result tables and charts are ready.',
      }),
      viec(77, { vi: 'Viết bài', en: 'Write the paper' }, {
        vi: 'Viết đủ các phần: mở đầu, phương pháp, kết quả, thảo luận. Xong khi có bản thảo hoàn chỉnh.',
        en: 'Write every section: introduction, method, results, discussion. Done when the full draft is ready.',
      }),
      viec(84, { vi: 'Xin góp ý và chỉnh sửa', en: 'Get feedback and revise' }, {
        vi: 'Gửi người hướng dẫn góp ý rồi sửa theo. Xong khi đã sửa hết các góp ý.',
        en: 'Send the draft to your supervisor and revise. Done when all comments are addressed.',
      }),
      viec(90, { vi: 'Nộp hoặc báo cáo', en: 'Submit or present' }, {
        vi: 'Nộp bài cho hội nghị, tạp chí hoặc trình bày nghiệm thu. Xong khi đã nộp hoặc đã báo cáo.',
        en: 'Submit to a conference or journal, or present the final report. Done when it is submitted or presented.',
      }),
    ],
  },
  {
    id: 'su-kien-clb',
    name: { vi: 'Sự kiện / CLB', en: 'Event / Club' },
    description: {
      vi: 'Tổ chức một sự kiện hoặc hoạt động CLB trong khoảng một tháng.',
      en: 'Run an event or club activity in about a month.',
    },
    tasks: [
      viec(3, { vi: 'Mục tiêu và ý tưởng', en: 'Goals and concept' }, {
        vi: 'Chốt mục tiêu, đối tượng và ý tưởng chính của sự kiện. Xong khi có bản mô tả sự kiện.',
        en: 'Settle the goals, audience and main concept. Done when the event brief is written.',
      }),
      viec(7, { vi: 'Kế hoạch và ngân sách', en: 'Plan and budget' }, {
        vi: 'Lập kế hoạch chi tiết và dự trù kinh phí. Xong khi kế hoạch và ngân sách được duyệt.',
        en: 'Draw up a detailed plan and budget. Done when both are approved.',
      }),
      viec(10, { vi: 'Địa điểm và giấy phép', en: 'Venue and permits' }, {
        vi: 'Đặt địa điểm và xin các giấy phép cần thiết. Xong khi có xác nhận địa điểm và giấy phép.',
        en: 'Book the venue and get the required permits. Done when the venue and permits are confirmed.',
      }),
      viec(14, { vi: 'Tìm nhà tài trợ', en: 'Find sponsors' }, {
        vi: 'Gửi hồ sơ tài trợ và chốt nhà tài trợ. Xong khi có cam kết tài trợ.',
        en: 'Send sponsorship packages and close sponsors. Done when sponsorship is confirmed.',
      }),
      viec(14, { vi: 'Truyền thông', en: 'Promotion' }, {
        vi: 'Lên nội dung và đăng bài trên các kênh. Xong khi kế hoạch truyền thông đã chạy.',
        en: 'Create content and post on your channels. Done when the promotion plan is running.',
      }),
      viec(21, { vi: 'Hậu cần', en: 'Logistics' }, {
        vi: 'Chuẩn bị thiết bị, vật dụng, nhân sự và kịch bản chương trình. Xong khi danh sách hậu cần đã kiểm đủ.',
        en: 'Prepare equipment, supplies, staff and the run sheet. Done when the logistics checklist is ticked off.',
      }),
      viec(27, { vi: 'Tổng duyệt', en: 'Dress rehearsal' }, {
        vi: 'Chạy thử toàn bộ chương trình tại địa điểm. Xong khi đã tổng duyệt và gỡ hết vướng mắc.',
        en: 'Run the full programme at the venue. Done when the rehearsal is over and issues are fixed.',
      }),
      viec(28, { vi: 'Tổ chức sự kiện', en: 'Run the event' }, {
        vi: 'Tổ chức sự kiện theo kịch bản. Xong khi sự kiện đã diễn ra.',
        en: 'Run the event to the run sheet. Done when the event has taken place.',
      }),
      viec(31, { vi: 'Tổng kết, báo cáo', en: 'Wrap-up report' }, {
        vi: 'Tổng kết số liệu, chi phí và bài học. Xong khi báo cáo tổng kết được nộp.',
        en: 'Summarise the numbers, costs and lessons learned. Done when the wrap-up report is submitted.',
      }),
    ],
  },
];

export const MA_MAU_DU_AN: readonly string[] = MAU_DU_AN.map((mau) => mau.id);

export function timMauDuAn(id: string): MauDuAn | undefined {
  return MAU_DU_AN.find((mau) => mau.id === id);
}

export interface MauDuAnTheoNgonNgu {
  id: string;
  name: string;
  description: string;
  tasks: Array<{ title: string; offsetDays: number }>;
}

/** Bản gửi cho web: mô tả từng việc không cần cho phần xem trước, nên không gửi. */
export function mauTheoNgonNgu(lang: NgonNguMau): MauDuAnTheoNgonNgu[] {
  return MAU_DU_AN.map((mau) => ({
    id: mau.id,
    name: mau.name[lang],
    description: mau.description[lang],
    tasks: mau.tasks.map((viecMau) => ({
      title: viecMau.title[lang],
      offsetDays: viecMau.offsetDays,
    })),
  }));
}
```

Chạy `npx prettier --write src/projects/mau-du-an.ts` để Prettier tự ngắt dòng theo cấu hình repo.

- [ ] **Step 4: Viết mã — controller**

`src/projects/project-templates.controller.ts`:

```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { mauTheoNgonNgu } from './mau-du-an';

@UseGuards(JwtAuthGuard)
@Controller('project-templates')
export class ProjectTemplatesController {
  /** `lang` lạ hay thiếu thì tiếng Việt — ngôn ngữ mặc định của WeDo. */
  @Get()
  danhSach(@Query('lang') lang?: string) {
    return mauTheoNgonNgu(lang === 'en' ? 'en' : 'vi');
  }
}
```

Trong `projects.module.ts`: thêm `import { ProjectTemplatesController } from './project-templates.controller';` và đổi thành `controllers: [ProjectsController, ProjectInvitesController, InvitesController, ProjectTemplatesController],`.

- [ ] **Step 5: Chạy lại**

Run: `npx jest src/projects && npx tsc --noEmit -p tsconfig.json && npx eslint src/projects --max-warnings 0`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/projects/mau-du-an.ts src/projects/mau-du-an.spec.ts src/projects/project-templates.controller.ts src/projects/projects.module.ts
git commit -m "feat(mau-du-an): bo 6 mau du an song ngu va GET /project-templates" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B9: `POST /projects` tạo dự án và toàn bộ việc từ mẫu trong một giao dịch

**Files:**
- Modify: `src/common/ngay-vn.ts` (thêm `hanCuoiNgayVN`), test `src/common/ngay-vn.spec.ts`
- Modify: `src/projects/dto/create-project.dto.ts`
- Modify: `src/projects/projects.service.ts:83-102` (`create`)
- Test: `src/projects/tao-du-an-tu-mau.spec.ts` (tạo)

**Interfaces:**
- Consumes: `timMauDuAn`, `MA_MAU_DU_AN`, `MauDuAn` (B8); `ngayVN`, `LECH_VN_MS` (có sẵn).
- Produces:
  - `export function hanCuoiNgayVN(ngay: string, soNgay?: number): Date` — 23:59:00.000 giờ Việt Nam của `ngay + soNgay` (tức 16:59 UTC).
  - `CreateProjectDto` thêm `templateId?: string` (`@IsIn(MA_MAU_DU_AN)`), `startDate?: string` (`YYYY-MM-DD` có thật), `lang?: 'vi' | 'en'`.
  - `ProjectsService.create(userId, dto)`: có `templateId` → `$transaction` (tạo dự án + `task.createMany` + đọc lại kèm include); không có → y như cũ, KHÔNG mở giao dịch.

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào cuối `src/common/ngay-vn.spec.ts` (và thêm `hanCuoiNgayVN` vào dòng import từ `./ngay-vn`):

```ts
describe('hanCuoiNgayVN', () => {
  it('23:59 giờ Việt Nam là 16:59 UTC cùng ngày', () => {
    expect(hanCuoiNgayVN('2026-10-02').toISOString()).toBe('2026-10-02T16:59:00.000Z');
  });

  it('cộng ngày lăn qua tháng và năm', () => {
    expect(hanCuoiNgayVN('2026-10-30', 3).toISOString()).toBe('2026-11-02T16:59:00.000Z');
    expect(hanCuoiNgayVN('2026-12-30', 5).toISOString()).toBe('2027-01-04T16:59:00.000Z');
  });
});
```

`src/projects/tao-du-an-tu-mau.spec.ts`:

```ts
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

const NGUOI_TAO = 'u-1';
const DU_AN_DA_TAO = {
  id: 'p-moi',
  name: 'EXE101 nhóm 3',
  members: [{ user: { id: NGUOI_TAO, email: 'a@wedo.vn' } }],
};

function taoPrisma() {
  const prisma = {
    workspace: { findFirst: jest.fn().mockResolvedValue({ id: 'w-1' }) },
    project: {
      create: jest.fn().mockResolvedValue(DU_AN_DA_TAO),
      findUniqueOrThrow: jest.fn().mockResolvedValue(DU_AN_DA_TAO),
    },
    task: { createMany: jest.fn().mockResolvedValue({ count: 10 }) },
    friendship: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((viec: (tx: unknown) => unknown) =>
    Promise.resolve(viec(prisma)),
  );
  return prisma;
}

function taoService(prisma: ReturnType<typeof taoPrisma>) {
  return new ProjectsService(prisma as never, {} as never, {} as never, {} as never);
}

afterEach(() => jest.useRealTimers());

describe('POST /projects không có mẫu', () => {
  it('chạy y như cũ: một lệnh create, không mở giao dịch, không tạo việc', async () => {
    const prisma = taoPrisma();

    await taoService(prisma).create(NGUOI_TAO, { name: 'Dự án', description: 'Mô tả', workspaceId: 'w-1' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.task.createMany).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Dự án',
        description: 'Mô tả',
        workspaceId: 'w-1',
        members: { create: { userId: NGUOI_TAO, role: 'LEADER' } },
      },
      include: expect.any(Object),
    });
  });
});

describe('POST /projects từ mẫu', () => {
  it('tạo dự án và đủ 10 việc của EXE101 trong MỘT giao dịch, hạn lúc 23:59 giờ Việt Nam', async () => {
    const prisma = taoPrisma();

    await taoService(prisma).create(NGUOI_TAO, {
      name: 'EXE101 nhóm 3',
      workspaceId: 'w-1',
      templateId: 'exe101',
      startDate: '2026-10-05',
      lang: 'vi',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const { data } = prisma.task.createMany.mock.calls[0][0] as {
      data: Array<Record<string, unknown> & { dueDate: Date }>;
    };
    expect(data).toHaveLength(10);
    expect(data[0]).toEqual({
      title: 'Lập nhóm và chia vai trò',
      description: expect.stringContaining('Xong khi'),
      status: 'TODO',
      dueDate: new Date('2026-10-08T16:59:00.000Z'),
      workspaceId: 'w-1',
      projectId: 'p-moi',
      creatorId: NGUOI_TAO,
    });
    expect(data[9].dueDate.toISOString()).toBe('2026-12-14T16:59:00.000Z');
    // Chưa giao cho ai: không có assigneeId, không có thông báo giao việc.
    expect(data.every((viec) => !('assigneeId' in viec))).toBe(true);
    expect(prisma.project.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p-moi' } }),
    );
  });

  it('lang=en ghi tên và mô tả việc bằng tiếng Anh', async () => {
    const prisma = taoPrisma();

    await taoService(prisma).create(NGUOI_TAO, {
      name: 'Talk',
      workspaceId: 'w-1',
      templateId: 'thuyet-trinh-nhom',
      startDate: '2026-10-05',
      lang: 'en',
    });

    const { data } = prisma.task.createMany.mock.calls[0][0] as { data: Array<{ title: string }> };
    expect(data.map((viec) => viec.title)).toEqual([
      'Choose the topic and outline',
      'Gather material',
      'Make slides for each part',
      'Merge and polish the slides',
      'Rehearse',
      'Present',
    ]);
  });

  it('thiếu startDate: lấy hôm nay theo giờ Việt Nam dù máy chủ chạy UTC (20:00 UTC = 03:00 sáng hôm sau ở VN)', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-02T20:00:00.000Z'), doNotFake: ['nextTick', 'setImmediate'] });
    const prisma = taoPrisma();

    await taoService(prisma).create(NGUOI_TAO, { name: 'Đồ án', workspaceId: 'w-1', templateId: 'do-an-mon-hoc' });

    const { data } = prisma.task.createMany.mock.calls[0][0] as { data: Array<{ dueDate: Date; title: string }> };
    expect(data[0].dueDate.toISOString()).toBe('2026-10-06T16:59:00.000Z');
    expect(data[0].title).toBe('Lập kế hoạch và chia việc');
  });

  it('templateId lạ gọi thẳng service: 400, không tạo gì', async () => {
    const prisma = taoPrisma();

    await expect(
      taoService(prisma).create(NGUOI_TAO, { name: 'X', workspaceId: 'w-1', templateId: 'khong-co' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });
});

describe('CreateProjectDto qua ValidationPipe như main.ts', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const kiem = (than: unknown) => pipe.transform(than, { type: 'body', metatype: CreateProjectDto });

  it('thân cũ của app và web vẫn qua', async () => {
    await expect(kiem({ name: 'Dự án', description: 'x', workspaceId: 'w-1' })).resolves.toBeInstanceOf(
      CreateProjectDto,
    );
  });

  it('thân có mẫu hợp lệ qua', async () => {
    await expect(
      kiem({ name: 'A', workspaceId: 'w-1', templateId: 'exe201', startDate: '2026-10-05', lang: 'en' }),
    ).resolves.toBeInstanceOf(CreateProjectDto);
  });

  it.each([
    ['templateId lạ', { templateId: 'khong-co' }],
    ['ngày không có thật', { templateId: 'exe101', startDate: '2026-02-30' }],
    ['ngày sai dạng', { templateId: 'exe101', startDate: '05/10/2026' }],
    ['ngày kèm giờ', { templateId: 'exe101', startDate: '2026-10-05T00:00:00Z' }],
    ['ngôn ngữ lạ', { templateId: 'exe101', lang: 'fr' }],
    ['trường lạ vẫn bị chặn như trước', { foo: 1 }],
  ])('%s: 400', async (_ten, them) => {
    await expect(kiem({ name: 'A', workspaceId: 'w-1', ...them })).rejects.toBeInstanceOf(BadRequestException);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/common/ngay-vn.spec.ts src/projects/tao-du-an-tu-mau.spec.ts`
Expected: FAIL — `hanCuoiNgayVN` không tồn tại; TS báo `templateId` không có trong `CreateProjectDto`.

- [ ] **Step 3: Viết mã — ngày**

Thêm vào `src/common/ngay-vn.ts` (sau `dauNgayVN`):

```ts
/**
 * Hạn chót 23:59 giờ Việt Nam của ngày `ngay` (YYYY-MM-DD) cộng `soNgay` ngày.
 *
 * Tính bằng `Date.UTC` rồi trừ độ lệch, nên đúng bất kể máy chủ đặt múi giờ
 * nào (Azure chạy UTC) và tự lăn qua tháng, qua năm.
 */
export function hanCuoiNgayVN(ngay: string, soNgay = 0): Date {
  const [y, m, d] = ngay.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + soNgay, 23, 59) - LECH_VN_MS);
}
```

- [ ] **Step 4: Viết mã — DTO**

Thay toàn bộ `src/projects/dto/create-project.dto.ts`:

```ts
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { MA_MAU_DU_AN } from '../mau-du-an';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  workspaceId: string;

  /** Mẫu dự án (src/projects/mau-du-an.ts). Thiếu thì tạo dự án trống như trước. */
  @IsOptional()
  @IsIn([...MA_MAU_DU_AN], { message: 'Mẫu dự án không tồn tại.' })
  templateId?: string;

  /** Ngày bắt đầu `YYYY-MM-DD`; thiếu thì hôm nay theo giờ Việt Nam. Chỉ dùng khi có mẫu. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày bắt đầu phải có dạng YYYY-MM-DD.',
  })
  @IsISO8601({ strict: true }, { message: 'Ngày bắt đầu không có thật.' })
  startDate?: string;

  /** Ngôn ngữ của tên và mô tả việc trong mẫu; mặc định `vi`. */
  @IsOptional()
  @IsIn(['vi', 'en'], { message: 'Ngôn ngữ chỉ nhận vi hoặc en.' })
  lang?: 'vi' | 'en';
}
```

- [ ] **Step 5: Viết mã — service**

Trong `src/projects/projects.service.ts`, thêm import:

```ts
import { hanCuoiNgayVN, ngayVN } from '../common/ngay-vn';
import { timMauDuAn, type MauDuAn } from './mau-du-an';
```

Thay phương thức `create` (dòng 83-102) bằng:

```ts
  async create(userId: string, dto: CreateProjectDto) {
    await this.ensureWorkspaceAccess(userId, dto.workspaceId);

    if (dto.templateId) {
      const mau = timMauDuAn(dto.templateId);
      // DTO đã chặn bằng @IsIn; giữ chốt này cho đường gọi thẳng service.
      if (!mau) throw new BadRequestException('Mẫu dự án không tồn tại.');
      return this.taoTuMau(userId, dto, mau);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId: dto.workspaceId,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: this.projectInclude(),
    });
    const [ketQua] = await this.anEmailThanhVien(userId, [project]);
    return ketQua;
  }

  /**
   * Dự án kèm toàn bộ việc của mẫu, trong MỘT giao dịch: hỏng giữa chừng thì
   * không để lại dự án thiếu việc. Việc chưa giao cho ai nên không có thông
   * báo giao việc; hạn mỗi việc là 23:59 giờ Việt Nam.
   */
  private async taoTuMau(userId: string, dto: CreateProjectDto, mau: MauDuAn) {
    const lang = dto.lang ?? 'vi';
    const ngayBatDau = dto.startDate ?? ngayVN(new Date());

    const project = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          workspaceId: dto.workspaceId,
          members: { create: { userId, role: 'LEADER' } },
        },
        select: { id: true },
      });
      await tx.task.createMany({
        data: mau.tasks.map((viec) => ({
          title: viec.title[lang],
          description: viec.description[lang],
          status: 'TODO' as const,
          dueDate: hanCuoiNgayVN(ngayBatDau, viec.offsetDays),
          workspaceId: dto.workspaceId,
          projectId: moi.id,
          creatorId: userId,
        })),
      });
      return tx.project.findUniqueOrThrow({
        where: { id: moi.id },
        include: this.projectInclude(),
      });
    });

    const [ketQua] = await this.anEmailThanhVien(userId, [project]);
    return ketQua;
  }
```

- [ ] **Step 6: Chạy lại**

Run: `npx jest src/common src/projects && npx tsc --noEmit -p tsconfig.json && npx eslint src/common src/projects --max-warnings 0`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/common/ngay-vn.ts src/common/ngay-vn.spec.ts src/projects/dto/create-project.dto.ts src/projects/projects.service.ts src/projects/tao-du-an-tu-mau.spec.ts
git commit -m "feat(mau-du-an): POST /projects tao du an va viec tu mau trong mot giao dich" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task B10: Kiểm trên Postgres thật và cổng cuối của backend

**Files:**
- Create: `src/projects/loi-moi/loi-moi.integration.spec.ts`

**Interfaces:**
- Consumes: mọi thứ từ B1–B9; Postgres thử ở `127.0.0.1:55902` đã có đủ migration (B1 Step 5).
- Produces: bằng chứng migration chạy trên bảng thật, khoá chống hai link sống, enum mới ghi được, tạo từ mẫu đúng hạn.

- [ ] **Step 1: Viết bài kiểm**

`src/projects/loi-moi/loi-moi.integration.spec.ts`:

```ts
import { HttpException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserBlocksService } from '../../moderation/user-blocks.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects.service';
import { ProjectInvitesService } from './project-invites.service';

/**
 * Lời mời và mẫu dự án — chạy trên Postgres THẬT.
 *
 * Bài giả lập không thấy được: khoá FOR UPDATE có thật sự giữ MỘT link sống khi
 * hai Leader bấm cùng lúc, giá trị enum mới có ghi được không, hạn 23:59 giờ
 * Việt Nam đi qua cột TIMESTAMP(3) có còn đúng không.
 *
 * Chạy (cơ sở dữ liệu vứt đi, KHÔNG BAO GIỜ trỏ vào production):
 *   docker run -d --name wedo-thu-loi-moi -e POSTGRES_PASSWORD=thu \
 *     -e POSTGRES_DB=wedo -p 127.0.0.1:55902:5432 postgres:17
 *   DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate deploy
 *   WEDO_TEST_DATABASE_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo \
 *     npx jest loi-moi.integration
 *
 * Không có biến đó thì bộ kiểm thử này tự bỏ qua — `npm test` không cần Postgres.
 */

const URL_THU = process.env.WEDO_TEST_DATABASE_URL;

// Bộ kiểm thử này XOÁ SẠCH bảng. Chỉ chạy với máy cục bộ.
function laMayCucBo(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

const moTa = URL_THU ? describe : describe.skip;

moTa('Lời mời và mẫu dự án — Postgres thật', () => {
  let prisma: PrismaClient;
  let projects: ProjectsService;
  let invites: ProjectInvitesService;
  const chatGateway = {
    emitProjectMembership: jest.fn(),
    emitUserNotification: jest.fn(),
    roiPhongDuAn: jest.fn(),
  };
  const expoPush = { sendToUser: jest.fn().mockResolvedValue(undefined) };

  beforeAll(async () => {
    if (!laMayCucBo(URL_THU!)) {
      throw new Error('Từ chối chạy: WEDO_TEST_DATABASE_URL không trỏ về localhost. Kiểm thử này xoá sạch bảng.');
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_THU! }) });
    const csdl = prisma as unknown as PrismaService;
    const blocks = new UserBlocksService(csdl);
    projects = new ProjectsService(csdl, blocks, chatGateway as never, expoPush as never);
    invites = new ProjectInvitesService(
      csdl,
      projects,
      blocks,
      chatGateway as never,
      new NotificationsService(csdl, expoPush as never),
    );

    await prisma.$executeRawUnsafe(
      'TRUNCATE "ProjectInvite", "Notification", "Task", "ProjectMember", "WorkspaceMember", "Project", "Workspace", "UserBlock", "User" RESTART IDENTITY CASCADE',
    );
    for (const [id, ten] of [
      ['u-leader', 'Lê Leader'],
      ['u-ban', 'Bạn Mới'],
      ['u-bi-chan', 'Người Bị Chặn'],
    ]) {
      await prisma.user.create({
        data: { id, email: `${id}@thu.vn`, passwordHash: 'khong-dung', fullName: ten },
      });
    }
    await prisma.workspace.create({ data: { id: 'w-1', name: 'Lớp SE1801', ownerId: 'u-leader' } });
    await prisma.project.create({
      data: {
        id: 'p-1',
        name: 'Đồ án EXE',
        workspaceId: 'w-1',
        members: { create: { userId: 'u-leader', role: 'LEADER' } },
      },
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('hai lần tạo link cùng lúc vẫn chỉ còn MỘT link sống', async () => {
    await Promise.all([invites.taoLoiMoi('u-leader', 'p-1'), invites.taoLoiMoi('u-leader', 'p-1')]);

    const song = await prisma.projectInvite.count({
      where: { projectId: 'p-1', revokedAt: null, expiresAt: { gt: new Date() } },
    });
    expect(song).toBe(1);
  });

  it('tham gia hai lần: lần hai alreadyMember, useCount chỉ tăng 1, Leader có thông báo loại mới', async () => {
    const loiMoi = await invites.taoLoiMoi('u-leader', 'p-1');

    const lan1 = await invites.thamGia('u-ban', loiMoi.code.toLowerCase());
    const lan2 = await invites.thamGia('u-ban', `${loiMoi.code.slice(0, 4)}-${loiMoi.code.slice(4)}`);

    expect(lan1).toEqual({ projectId: 'p-1', workspaceId: 'w-1', alreadyMember: false });
    expect(lan2.alreadyMember).toBe(true);
    const dong = await prisma.projectInvite.findUniqueOrThrow({ where: { code: loiMoi.code } });
    expect(dong.useCount).toBe(1);
    await expect(
      prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: 'w-1', userId: 'u-ban' } } }),
    ).resolves.toMatchObject({ role: 'MEMBER' });
    await expect(
      prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: 'p-1', userId: 'u-ban' } } }),
    ).resolves.toMatchObject({ role: 'MEMBER' });

    const thongBao = await prisma.notification.findMany({
      where: { userId: 'u-leader', type: 'PROJECT_MEMBER_JOINED' },
    });
    expect(thongBao).toHaveLength(1);
    expect(thongBao[0]).toMatchObject({ actorId: 'u-ban', projectId: 'p-1', workspaceId: 'w-1' });
  });

  it('người có quan hệ chặn với người tạo link nhận 404 như mã sai', async () => {
    await prisma.userBlock.create({ data: { blockerId: 'u-leader', blockedId: 'u-bi-chan' } });
    const loiMoi = await invites.taoLoiMoi('u-leader', 'p-1');

    const loi = await invites.thamGia('u-bi-chan', loiMoi.code).then(
      () => null,
      (e: unknown) => e,
    );

    expect(loi).toBeInstanceOf(HttpException);
    expect((loi as HttpException).getResponse()).toMatchObject({ code: 'INVITE_NOT_FOUND' });
  });

  it('tạo dự án từ mẫu: đủ việc, hạn 23:59 giờ Việt Nam, không giao cho ai, không thông báo giao việc', async () => {
    const duAn = await projects.create('u-leader', {
      name: 'EXE101 nhóm 3',
      workspaceId: 'w-1',
      templateId: 'exe101',
      startDate: '2026-10-05',
      lang: 'vi',
    });

    const viec = await prisma.task.findMany({ where: { projectId: duAn.id }, orderBy: { dueDate: 'asc' } });
    expect(viec).toHaveLength(10);
    expect(viec[0].dueDate?.toISOString()).toBe('2026-10-08T16:59:00.000Z');
    expect(viec[9].dueDate?.toISOString()).toBe('2026-12-14T16:59:00.000Z');
    expect(
      viec.every(
        (v) => v.status === 'TODO' && v.assigneeId === null && v.creatorId === 'u-leader' && v.workspaceId === 'w-1',
      ),
    ).toBe(true);
    await expect(prisma.notification.count({ where: { type: 'TASK_ASSIGNED' } })).resolves.toBe(0);
  });
});
```

- [ ] **Step 2: Chạy trên Postgres thử**

```bash
docker exec wedo-thu-loi-moi pg_isready -U postgres
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate deploy
WEDO_TEST_DATABASE_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx jest loi-moi.integration
```

Expected: "No pending migrations to apply."; 4 bài PASS. Nếu bài đầu thấy 2 link sống, khoá `FOR UPDATE` trong `taoLoiMoi` (B4) đang không chạy trong giao dịch — sửa ở đó, không nới bài kiểm.

- [ ] **Step 3: Kiểm migration từ đầu trên cơ sở dữ liệu mới tinh (đúng như lần chạy tự động sau khi push)**

```bash
docker rm -f wedo-thu-loi-moi
docker run -d --name wedo-thu-loi-moi -e POSTGRES_PASSWORD=thu -e POSTGRES_DB=wedo -p 127.0.0.1:55902:5432 postgres:17
docker exec wedo-thu-loi-moi pg_isready -U postgres
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate deploy
DIRECT_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code; echo "ma thoat: $?"
WEDO_TEST_DATABASE_URL=postgresql://postgres:thu@127.0.0.1:55902/wedo npx jest --runInBand loi-moi.integration trang-thong-bao.integration
```

Expected: mọi migration áp xong; `ma thoat: 0`; cả hai bộ integration PASS (`--runInBand` vì cả hai cùng TRUNCATE bảng; bộ phân trang thông báo cũ xác nhận bảng `Notification` vẫn đọc tốt sau khi enum đổi).

- [ ] **Step 4: Cổng cuối của backend**

```bash
npx tsc --noEmit -p tsconfig.json
npx jest
npm run lint -- --max-warnings 0
npm run build
git diff -w sua-toan-dien-3 -- prisma/schema.prisma prisma/migrations prisma.config.ts | grep '^-[^-]'; echo "ma thoat grep: $?"
docker rm -f wedo-thu-loi-moi
```

Expected: tsc sạch; jest PASS (integration tự bỏ qua); lint 0 lỗi 0 cảnh báo; build xong; grep không in dòng nào (`ma thoat grep: 1`); container đã xoá.

- [ ] **Step 5: Commit**

```bash
git add src/projects/loi-moi/loi-moi.integration.spec.ts
git commit -m "test(loi-moi): kiem link moi, enum moi va tao tu mau tren Postgres that" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

# PHẦN 2 — WEB (`D:\WEDO_PC\wt\fe-moi`)

Mọi lệnh chạy trong `D:\WEDO_PC\wt\fe-moi` bằng Git Bash. Kiểm thử: `npx tsx --test <tệp>`; cả bộ: `npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')`.

### Task W0: Tạo worktree web với `node_modules` riêng và thêm `qrcode`

**Files:**
- Modify: `package.json`, `package-lock.json` (chỉ thêm `qrcode`, `@types/qrcode`)

**Interfaces:**
- Consumes: nhánh `sua-toan-dien-3` của FE (`D:\WEDO_PC\wt\fe-dot3`, đỉnh `212c4c7`).
- Produces: worktree `D:\WEDO_PC\wt\fe-moi` (nhánh `feat/moi-vao-nhom`), dùng được `import { toDataURL } from 'qrcode'`.

`fe-dot3` dùng junction `node_modules` trỏ sang `D:\WEDO_PC\FE_WEDO-ios\node_modules`. Worktree này phải có `node_modules` THẬT của riêng nó, vì nó thêm thư viện — cài vào junction là sửa `node_modules` của worktree khác.

- [ ] **Step 1: Tạo worktree và cài**

```bash
# Gốc là feat/co-ngon-ngu (4088d16) = web production hiện tại (sua-toan-dien-3 + nút chọn ngôn ngữ có cờ).
git -C D:/WEDO_PC/FE_WEDO worktree add D:/WEDO_PC/wt/fe-moi -b feat/moi-vao-nhom feat/co-ngon-ngu
cd D:/WEDO_PC/wt/fe-moi && npm ci
cmd //c "dir /AL D:\\WEDO_PC\\wt\\fe-moi" | grep -i junction; echo "ma thoat: $?"
```

Expected: `npm ci` xong; lệnh `dir /AL` không có dòng `<JUNCTION>` (`ma thoat: 1`) — `node_modules` là thư mục thật.

- [ ] **Step 2: Kiểm mốc xanh**

```bash
npm run lint && npm run kiem-dich && npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')
```

Expected: tsc sạch, kiem-dich báo 0 chuỗi, mọi bài PASS. Không sạch thì dừng và báo người giao việc.

- [ ] **Step 3: Thêm thư viện QR (thuần JS, chạy trên trình duyệt)**

```bash
npm install qrcode@1.5.4
npm install -D @types/qrcode@1.5.5
git diff --stat package.json
```

Expected: `package.json` chỉ thêm hai dòng (`"qrcode": "^1.5.4"` trong `dependencies`, `"@types/qrcode": "^1.5.5"` trong `devDependencies`).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(web): them thu vien qrcode cho hop thoai moi vao nhom" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W1: API client, kiểu dữ liệu, từ điển và dịch mã lỗi `INVITE_*`

**Files:**
- Modify: `src/lib/api.ts` (union `NotificationType` dòng 30-31; sau `interface Project` dòng 74-84; `createProject` dòng 1342-1346)
- Modify: `src/i18n/loi.ts` (bảng `TIENG_ANH_THEO_MA`)
- Create: `src/i18n/tu-dien/moi-vao-nhom.ts`, `src/i18n/tu-dien/mau-du-an.ts`
- Test: `src/i18n/loi.test.ts` (thêm cuối tệp); `src/i18n/tu-dien.test.ts` tự quét hai từ điển mới

**Interfaces:**
- Produces (trong `src/lib/api.ts`):
  - `NotificationType` thêm `'PROJECT_MEMBER_JOINED'`
  - `export interface LoiMoiDuAn { code: string; url: string; expiresAt: string; useCount: number }`
  - `export interface XemTruocLoiMoi { projectName: string; workspaceName: string; leaderName: string; memberCount: number; expiresAt: string }`
  - `export interface KetQuaThamGia { projectId: string; workspaceId: string; alreadyMember: boolean }`
  - `export interface MauDuAn { id: string; name: string; description: string; tasks: Array<{ title: string; offsetDays: number }> }`
  - `api.layLoiMoi(projectId): Promise<LoiMoiDuAn | null>`, `api.taoLoiMoi(projectId): Promise<LoiMoiDuAn>`, `api.tatLoiMoi(projectId): Promise<{ ok: boolean }>`, `api.xemLoiMoi(ma): Promise<XemTruocLoiMoi>` (không gắn phiên), `api.thamGiaLoiMoi(ma): Promise<KetQuaThamGia>`, `api.layMauDuAn(ngonNgu: 'vi' | 'en'): Promise<MauDuAn[]>`
  - `api.createProject(body: { name; description?; workspaceId; templateId?: string; startDate?: string; lang?: 'vi' | 'en' })`
- Produces (từ điển): `tuDienMoiVaoNhom` (`nut`, `hopThoai.*`, `trang.*`), `tuDienMauDuAn` (`the.*`, `dangTaiMau`, …, `batDauNhanh.*`) — khoá dùng ở W4, W5, W7, W8 đúng như khai báo dưới đây.

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào cuối `src/i18n/loi.test.ts`:

```ts
describe('tiếng Anh: lời mời vào nhóm', () => {
  const ca: Array<[string, number, string]> = [
    ['INVITE_NOT_FOUND', 404, 'This invite code is wrong or no longer valid.'],
    ['INVITE_EXPIRED', 410, 'This invite link has expired. Ask your Leader for a new one.'],
    ['INVITE_REVOKED', 410, 'This invite link has been turned off. Ask your Leader for a new one.'],
    ['INVITE_PROJECT_CLOSED', 410, 'This project is closed and is not taking new members.'],
  ];
  for (const [ma, status, cau] of ca) {
    it(ma, () => {
      const loi = loiTuPhanHoi(status, JSON.stringify({ code: ma, message: 'Câu tiếng Việt của máy chủ.' }));
      assert.equal(dichThongBaoLoi(loi, 'Fallback', 'en'), cau);
      // Tiếng Việt giữ nguyên câu máy chủ gửi.
      assert.equal(dichThongBaoLoi(loi, 'Dự phòng', 'vi'), 'Câu tiếng Việt của máy chủ.');
    });
  }
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx tsx --test src/i18n/loi.test.ts`
Expected: FAIL 4 bài mới — bản tiếng Anh trả nguyên câu tiếng Việt.

- [ ] **Step 3: Dịch mã lỗi**

Trong `src/i18n/loi.ts`, ngay sau dòng `  APPLE_TOKEN_INVALID: () => 'Sign in with Apple failed. Please try again.',` thêm:

```ts
  // Lời mời vào nhóm (BE src/projects/loi-moi/loi-moi.errors.ts).
  INVITE_NOT_FOUND: () => 'This invite code is wrong or no longer valid.',
  INVITE_EXPIRED: () => 'This invite link has expired. Ask your Leader for a new one.',
  INVITE_REVOKED: () => 'This invite link has been turned off. Ask your Leader for a new one.',
  INVITE_PROJECT_CLOSED: () => 'This project is closed and is not taking new members.',
```

- [ ] **Step 4: API client**

Trong `src/lib/api.ts`, thay dòng union:

```ts
  'TASK_ASSIGNED' | 'TASK_ACCEPTED' | 'TASK_REJECTED' | 'TASK_SUBMITTED' | 'TASK_REVIEW_APPROVED' | 'TASK_REVIEW_REJECTED' | 'TASK_DEADLINE_REMINDER' | 'MEETING_SCHEDULED' | 'SUBSCRIPTION_RENEWAL_DUE' | 'PAYMENT_CONFIRMED';
```

bằng:

```ts
  'TASK_ASSIGNED' | 'TASK_ACCEPTED' | 'TASK_REJECTED' | 'TASK_SUBMITTED' | 'TASK_REVIEW_APPROVED' | 'TASK_REVIEW_REJECTED' | 'TASK_DEADLINE_REMINDER' | 'MEETING_SCHEDULED' | 'SUBSCRIPTION_RENEWAL_DUE' | 'PAYMENT_CONFIRMED' | 'PROJECT_MEMBER_JOINED';
```

Thay:

```ts
  _count?: { tasks: number; members?: number };
}

export interface Task {
```

bằng:

```ts
  _count?: { tasks: number; members?: number };
}

/** Link mời đang dùng của một dự án (GET/POST /projects/:id/invite). */
export interface LoiMoiDuAn {
  code: string;
  url: string;
  expiresAt: string;
  useCount: number;
}

/** Trang xem trước công khai: không có email hay id của ai. */
export interface XemTruocLoiMoi {
  projectName: string;
  workspaceName: string;
  leaderName: string;
  memberCount: number;
  expiresAt: string;
}

export interface KetQuaThamGia {
  projectId: string;
  workspaceId: string;
  alreadyMember: boolean;
}

/** Mẫu dự án theo ngôn ngữ đang dùng (GET /project-templates?lang=). */
export interface MauDuAn {
  id: string;
  name: string;
  description: string;
  tasks: Array<{ title: string; offsetDays: number }>;
}

export interface Task {
```

Thay:

```ts
  createProject: (body: { name: string; description?: string; workspaceId: string }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
```

bằng:

```ts
  /** `templateId` (kèm `startDate` YYYY-MM-DD và `lang`) tạo luôn danh sách việc của mẫu. */
  createProject: (body: {
    name: string;
    description?: string;
    workspaceId: string;
    templateId?: string;
    startDate?: string;
    lang?: 'vi' | 'en';
  }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  layMauDuAn: (ngonNgu: 'vi' | 'en') => request<MauDuAn[]>(`/project-templates?lang=${ngonNgu}`),
  /** Chưa có link còn hiệu lực thì máy chủ trả thân rỗng — `docPhanHoi` đọc ra `null`. */
  layLoiMoi: async (projectId: string) =>
    (await request<LoiMoiDuAn | null>(`/projects/${encodeURIComponent(projectId)}/invite`)) ?? null,
  taoLoiMoi: (projectId: string) =>
    request<LoiMoiDuAn>(`/projects/${encodeURIComponent(projectId)}/invite`, { method: 'POST' }),
  tatLoiMoi: (projectId: string) =>
    request<{ ok: boolean }>(`/projects/${encodeURIComponent(projectId)}/invite`, { method: 'DELETE' }),
  /** Công khai: người mở link có thể chưa đăng nhập, nên không gắn phiên và không gia hạn. */
  xemLoiMoi: (ma: string) => goiJson<XemTruocLoiMoi>(`${API_URL}/invites/${encodeURIComponent(ma)}`),
  thamGiaLoiMoi: (ma: string) =>
    request<KetQuaThamGia>(`/invites/${encodeURIComponent(ma)}/join`, { method: 'POST' }),
```

- [ ] **Step 5: Hai từ điển**

`src/i18n/tu-dien/moi-vao-nhom.ts`:

```ts
import { khaiBaoTuDien, soNhieu } from '../dich';

/** Hộp thoại "Mời vào nhóm" (MoiVaoNhomDialog) và trang mở link mời (LoiMoiView). */
export const tuDienMoiVaoNhom = khaiBaoTuDien(
  {
    nut: 'Mời vào nhóm',
    hopThoai: {
      tieuDe: 'Mời vào nhóm',
      moTa: (duAn: string) => `Ai có link hoặc mã này sẽ vào thẳng dự án ${duAn} với vai trò Thành viên.`,
      dong: 'Đóng',
      dangTai: 'Đang tải link mời…',
      chuaCo: 'Dự án chưa có link mời nào đang dùng.',
      taoLink: 'Tạo link mời',
      lienKet: 'Link mời',
      saoChep: 'Sao chép',
      daSaoChep: 'Đã sao chép link mời',
      khongSaoChepDuoc: 'Không sao chép được. Hãy chọn link rồi sao chép thủ công.',
      maMoi: 'Mã mời',
      maQr: (ma: string) => `Mã QR của link mời ${ma}`,
      taiQr: 'Tải ảnh QR',
      hetHan: (ngay: string) => `Hết hạn ${ngay}`,
      daThamGia: (so: number) => `${so} người đã tham gia`,
      taoLinkMoi: 'Tạo link mới',
      xacNhanTaoMoi: 'Link và mã cũ sẽ không dùng được nữa. Tạo link mới?',
      tatLink: 'Tắt link',
      xacNhanTat: 'Tắt link thì không ai vào được bằng link hay mã này nữa. Tắt link?',
      daTat: 'Đã tắt link mời',
      loiTai: 'Không tải được link mời',
      loiTao: 'Không tạo được link mời',
      loiTat: 'Không tắt được link mời',
    },
    trang: {
      dangTai: 'Đang mở lời mời…',
      tieuDe: 'Bạn được mời vào dự án',
      chiTiet: (khongGian: string, leader: string, so: number) =>
        `Workspace ${khongGian} · Leader ${leader} · ${so} thành viên`,
      hetHan: (ngay: string) => `Link dùng được tới ${ngay}`,
      thamGia: 'Tham gia',
      dangThamGia: 'Đang tham gia…',
      canDangNhap: 'Đăng nhập hoặc tạo tài khoản để tham gia. Xong bước đó bạn sẽ quay lại đây.',
      dangNhap: 'Đăng nhập',
      dangKy: 'Tạo tài khoản',
      khongMoDuoc: 'Không mở được lời mời',
      loiTai: 'Không tải được lời mời',
      loiThamGia: 'Không tham gia được dự án',
      veTrangChu: 'Về trang chủ',
    },
  },
  {
    nut: 'Invite to team',
    hopThoai: {
      tieuDe: 'Invite to team',
      moTa: (duAn: string) => `Anyone with this link or code joins ${duAn} straight away as a Member.`,
      dong: 'Close',
      dangTai: 'Loading the invite link…',
      chuaCo: 'This project has no active invite link.',
      taoLink: 'Create invite link',
      lienKet: 'Invite link',
      saoChep: 'Copy',
      daSaoChep: 'Invite link copied',
      khongSaoChepDuoc: 'Couldn’t copy. Select the link and copy it yourself.',
      maMoi: 'Invite code',
      maQr: (ma: string) => `QR code for invite link ${ma}`,
      taiQr: 'Download QR image',
      hetHan: (ngay: string) => `Expires ${ngay}`,
      daThamGia: (so: number) =>
        soNhieu('en', so, { mot: '{so} person has joined', nhieu: '{so} people have joined' }),
      taoLinkMoi: 'Create new link',
      xacNhanTaoMoi: 'The old link and code will stop working. Create a new link?',
      tatLink: 'Turn off link',
      xacNhanTat: 'Nobody will be able to join with this link or code. Turn it off?',
      daTat: 'Invite link turned off',
      loiTai: 'Couldn’t load the invite link',
      loiTao: 'Couldn’t create an invite link',
      loiTat: 'Couldn’t turn off the invite link',
    },
    trang: {
      dangTai: 'Opening your invite…',
      tieuDe: 'You’re invited to a project',
      chiTiet: (khongGian: string, leader: string, so: number) =>
        `Workspace ${khongGian} · Leader ${leader} · ${soNhieu('en', so, { mot: '{so} member', nhieu: '{so} members' })}`,
      hetHan: (ngay: string) => `Link valid until ${ngay}`,
      thamGia: 'Join',
      dangThamGia: 'Joining…',
      canDangNhap: 'Sign in or create an account to join. You’ll come back here afterwards.',
      dangNhap: 'Sign in',
      dangKy: 'Create account',
      khongMoDuoc: 'Couldn’t open this invite',
      loiTai: 'Couldn’t load the invite',
      loiThamGia: 'Couldn’t join the project',
      veTrangChu: 'Back to home',
    },
  },
);
```

`src/i18n/tu-dien/mau-du-an.ts`:

```ts
import { khaiBaoTuDien } from '../dich';

/** Thẻ "Bắt đầu từ mẫu" trong hộp thoại tạo dự án và thẻ "Bắt đầu nhanh" ở Tổng quan. */
export const tuDienMauDuAn = khaiBaoTuDien(
  {
    the: {
      nhanNhom: 'Cách tạo dự án',
      trong: 'Dự án trống',
      mau: 'Bắt đầu từ mẫu',
    },
    dangTaiMau: 'Đang tải mẫu…',
    loiTaiMau: 'Không tải được danh sách mẫu',
    chonMau: 'Chọn một mẫu',
    soViec: (so: number) => `${so} việc`,
    ngayBatDau: 'Ngày bắt đầu',
    goiYNgay: 'Hạn của từng việc tính từ ngày bắt đầu, lúc 23:59 giờ Việt Nam.',
    viecSeTao: 'Việc sẽ được tạo',
    han: (ngay: string) => `Hạn ${ngay}, 23:59`,
    chuaChonMau: 'Chọn một mẫu để xem trước danh sách việc.',
    batDauNhanh: {
      tieuDe: 'Bắt đầu nhanh với mẫu',
      moTa: 'Tạo dự án kèm sẵn danh sách việc và hạn chót cho EXE101, EXE201, đồ án, thuyết trình, nghiên cứu hay sự kiện CLB.',
      nut: 'Chọn mẫu',
    },
  },
  {
    the: {
      nhanNhom: 'How to create the project',
      trong: 'Blank project',
      mau: 'Start from a template',
    },
    dangTaiMau: 'Loading templates…',
    loiTaiMau: 'Couldn’t load the templates',
    chonMau: 'Choose a template',
    soViec: (so: number) => (so === 1 ? '1 task' : `${so} tasks`),
    ngayBatDau: 'Start date',
    goiYNgay: 'Each task is due a set number of days after the start date, at 23:59 Vietnam time.',
    viecSeTao: 'Tasks to be created',
    han: (ngay: string) => `Due ${ngay}, 23:59`,
    chuaChonMau: 'Choose a template to preview its tasks.',
    batDauNhanh: {
      tieuDe: 'Get started with a template',
      moTa: 'Create a project with tasks and deadlines ready for EXE101, EXE201, course projects, presentations, research or club events.',
      nut: 'Choose a template',
    },
  },
);
```

- [ ] **Step 6: Chạy lại**

Run: `npx tsx --test src/i18n/loi.test.ts src/i18n/tu-dien.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS; tsc sạch; kiem-dich 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/api.ts src/i18n/loi.ts src/i18n/loi.test.ts src/i18n/tu-dien/moi-vao-nhom.ts src/i18n/tu-dien/mau-du-an.ts
git commit -m "feat(web): API moi vao nhom va mau du an, tu dien va dich ma loi INVITE" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W2: Hiển thị thông báo `PROJECT_MEMBER_JOINED`

**Files:**
- Modify: `src/i18n/tu-dien/thong-bao.ts` (nhãn `nhan.thanhVienMoi`, nút `xemDuAn`, bảng `TIEU_DE_THONG_BAO_TIENG_ANH`)
- Modify: `src/i18n/tu-dien/khung.ts` (`nhan.thanhVienMoi` của thanh trên, vi và en)
- Modify: `src/views/NotificationsView.tsx` (import lucide dòng 3; `notificationTone`; nhãn nút ~dòng 423-427)
- Modify: `src/components/layout/Topbar.tsx` (import lucide dòng 3; `notificationTone`)
- Test: `src/lib/tieu-de-thong-bao.test.ts` (thêm cuối tệp)

**Interfaces:**
- Consumes: `NotificationType` có `'PROJECT_MEMBER_JOINED'` (W1); tiêu đề máy chủ `'Thành viên mới tham gia dự án'` (B6).
- Produces: nhãn "Thành viên mới"/"New member", nút "Xem dự án"/"View project". Bấm thông báo đi đường có sẵn `dichTuThongBao` → bảng công việc đúng workspace và dự án (thông báo có `workspaceId`, `projectId`, không có `taskId`, `actionUrl`).

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào cuối `src/lib/tieu-de-thong-bao.test.ts`:

```ts
describe('thông báo có người vào nhóm qua link mời', () => {
  it('tiêu đề cố định của máy chủ có bản tiếng Anh', () => {
    assert.equal(dichTieuDeThongBao('Thành viên mới tham gia dự án', 'en'), 'New member joined your project');
    assert.equal(dichTieuDeThongBao('Thành viên mới tham gia dự án', 'vi'), 'Thành viên mới tham gia dự án');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx tsx --test src/lib/tieu-de-thong-bao.test.ts`
Expected: FAIL — nhận lại nguyên câu tiếng Việt.

- [ ] **Step 3: Từ điển**

Trong `src/i18n/tu-dien/thong-bao.ts`:
- Thay `      daTuChoi: 'Đã từ chối',\n    },\n    loiTai: 'Không thể tải thông báo',` bằng:

```ts
      daTuChoi: 'Đã từ chối',
      thanhVienMoi: 'Thành viên mới',
    },
    loiTai: 'Không thể tải thông báo',
```

- Thay `      daTuChoi: 'Declined',\n    },\n    loiTai: 'Couldn’t load notifications',` bằng:

```ts
      daTuChoi: 'Declined',
      thanhVienMoi: 'New member',
    },
    loiTai: 'Couldn’t load notifications',
```

- Thay `    xemTask: 'Xem task',` bằng `    xemTask: 'Xem task',\n    xemDuAn: 'Xem dự án',` và `    xemTask: 'View task',` bằng `    xemTask: 'View task',\n    xemDuAn: 'View project',`.
- Trong `TIEU_DE_THONG_BAO_TIENG_ANH`, sau dòng `  'Bạn được thêm vào dự án': 'You were added to a project',` thêm:

```ts
  'Thành viên mới tham gia dự án': 'New member joined your project',
```

Trong `src/i18n/tu-dien/khung.ts`:
- Thay `        daTuChoi: 'Đã từ chối',\n      },\n      /** Trùng` bằng:

```ts
        daTuChoi: 'Đã từ chối',
        thanhVienMoi: 'Thành viên mới',
      },
      /** Trùng
```

- Thay `        daTuChoi: 'Declined',\n      },\n      nhanCuocHop: {` bằng:

```ts
        daTuChoi: 'Declined',
        thanhVienMoi: 'New member',
      },
      nhanCuocHop: {
```

- [ ] **Step 4: Tông màu và nút**

`src/views/NotificationsView.tsx`: thêm `UserPlus` vào import lucide dòng 3 (giữ thứ tự chữ cái: `…, RefreshCcw, UserPlus, Video, XCircle }`). Trong `notificationTone`, ngay trước `  if (type === 'TASK_ASSIGNED') {` thêm:

```tsx
  if (type === 'PROJECT_MEMBER_JOINED') {
    return {
      icon: UserPlus,
      badge: t.nhan.thanhVienMoi,
      className: 'border-primary/20 bg-primary/5 text-primary',
      avatarBadgeClassName: 'bg-surface-container-lowest text-primary ring-primary/35',
    };
  }
```

Thay:

```tsx
                            : laThongBaoCuocHop(notification.actionUrl)
                              ? t.xemCuocHop
                              : t.xemTask}
```

bằng:

```tsx
                            : laThongBaoCuocHop(notification.actionUrl)
                              ? t.xemCuocHop
                              : notification.type === 'PROJECT_MEMBER_JOINED'
                                ? t.xemDuAn
                                : t.xemTask}
```

`src/components/layout/Topbar.tsx`: thêm `UserPlus` vào import lucide dòng 3 (`…, Sparkles, UserPlus, Video, XCircle }`). Trong `notificationTone`, ngay trước `  if (type === 'TASK_ASSIGNED') {` thêm:

```tsx
  if (type === 'PROJECT_MEMBER_JOINED') {
    return {
      icon: UserPlus,
      badge: t.nhan.thanhVienMoi,
      className: 'bg-primary/10 text-primary',
      avatarBadgeClassName: 'bg-surface-container-lowest text-primary ring-primary/35',
    };
  }
```

- [ ] **Step 5: Chạy lại**

Run: `npx tsx --test src/lib/tieu-de-thong-bao.test.ts src/i18n/tu-dien.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS, tsc sạch, kiem-dich 0.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/tu-dien/thong-bao.ts src/i18n/tu-dien/khung.ts src/views/NotificationsView.tsx src/components/layout/Topbar.tsx src/lib/tieu-de-thong-bao.test.ts
git commit -m "feat(web): hien thong bao co thanh vien moi vao nhom qua link" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W3: Mã mời, đọc `#/moi/:code` và lời mời chờ qua bước đăng nhập

**Files:**
- Create: `src/lib/loi-moi.ts`
- Test: `src/lib/loi-moi.test.ts`

**Interfaces:**
- Produces:
  - `export const KHOA_LOI_MOI_CHO = 'wedo:loi-moi-cho'`
  - `export const HAN_LOI_MOI_CHO_MS = 604_800_000`
  - `export type KhoLuu = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>`
  - `export function chuanHoaMaMoi(nhap: string): string | null` (cùng luật với máy chủ)
  - `export function hienThiMaMoi(ma: string): string`
  - `export function docMaMoiTuDuongDan(route: string): string | null` — `route` là phần sau `#/`; không phải trang mời → `null`; mã sai dạng vẫn trả nguyên văn để trang mời hiện "mã không đúng"
  - `export function duongDanTrangMoi(ma: string): string` → `#/moi/<ma>`
  - `export function ghiLoiMoiCho(kho: KhoLuu | null, ma: string, bayGio?: number): void`
  - `export function docLoiMoiCho(kho: KhoLuu | null, bayGio?: number): string | null`
  - `export function quenLoiMoiCho(kho: KhoLuu | null): void`
  - `export function laLoiMoiHetDung(code: string | undefined): boolean` (bốn mã `INVITE_*`)
  - `export function tenTepQr(ma: string): string` → `wedo-moi-<ma>.png`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/loi-moi.test.ts`:

```ts
/*
  Mã mời và lời mời đang chờ qua bước đăng nhập.

    npx tsx --test src/lib/loi-moi.test.ts
*/
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HAN_LOI_MOI_CHO_MS,
  KHOA_LOI_MOI_CHO,
  chuanHoaMaMoi,
  docLoiMoiCho,
  docMaMoiTuDuongDan,
  duongDanTrangMoi,
  ghiLoiMoiCho,
  hienThiMaMoi,
  laLoiMoiHetDung,
  quenLoiMoiCho,
  tenTepQr,
} from './loi-moi';

function khoGia() {
  const bang = new Map<string, string>();
  return {
    bang,
    getItem: (khoa: string) => bang.get(khoa) ?? null,
    setItem: (khoa: string, giaTri: string) => void bang.set(khoa, giaTri),
    removeItem: (khoa: string) => void bang.delete(khoa),
  };
}

const khoHong = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('chuanHoaMaMoi', () => {
  it('viết hoa, bỏ khoảng trắng và dấu gạch — cùng luật với máy chủ', () => {
    assert.equal(chuanHoaMaMoi(' 7k3m-9qxa '), '7K3M9QXA');
    assert.equal(chuanHoaMaMoi('7K3M 9QXA'), '7K3M9QXA');
  });

  it('có 0, O, 1, I hoặc sai độ dài là mã sai', () => {
    for (const sai of ['7K3M9QX0', '7K3M9QXO', '7K3M9QX1', '7K3M9QXI', '7K3M9QX', '7K3M9QXAB', '']) {
      assert.equal(chuanHoaMaMoi(sai), null, sai);
    }
  });

  it('hiển thị chia đôi bằng gạch', () => {
    assert.equal(hienThiMaMoi('7K3M9QXA'), '7K3M-9QXA');
  });
});

describe('docMaMoiTuDuongDan', () => {
  it('đọc mã từ #/moi/:code, chuẩn hoá luôn', () => {
    assert.equal(docMaMoiTuDuongDan('moi/7k3m-9qxa'), '7K3M9QXA');
    assert.equal(docMaMoiTuDuongDan('moi/7K3M9QXA/'), '7K3M9QXA');
    assert.equal(docMaMoiTuDuongDan('moi/7K3M%2D9QXA'), '7K3M9QXA');
  });

  it('mã sai dạng vẫn mở trang mời (để báo mã không đúng), không rơi về trang chủ', () => {
    assert.equal(docMaMoiTuDuongDan('moi/abc'), 'abc');
  });

  it('đường dẫn khác không phải trang mời', () => {
    for (const route of ['dashboard', 'moi', 'moi/', 'moix/7K3M9QXA', 'moi/a/b', 'admin/login', '']) {
      assert.equal(docMaMoiTuDuongDan(route), null, route);
    }
  });

  it('dựng lại địa chỉ trang mời', () => {
    assert.equal(duongDanTrangMoi('7K3M9QXA'), '#/moi/7K3M9QXA');
  });
});

describe('lời mời chờ qua bước đăng nhập', () => {
  it('ghi trước khi sang Đăng nhập, đọc lại được sau khi đăng nhập', () => {
    const kho = khoGia();
    ghiLoiMoiCho(kho, '7k3m-9qxa', 1_000);
    assert.ok(kho.bang.has(KHOA_LOI_MOI_CHO));
    assert.equal(docLoiMoiCho(kho, 2_000), '7K3M9QXA');
  });

  it('quá 7 ngày thì bỏ và xoá khoá', () => {
    const kho = khoGia();
    ghiLoiMoiCho(kho, '7K3M9QXA', 0);
    assert.equal(docLoiMoiCho(kho, HAN_LOI_MOI_CHO_MS + 1), null);
    assert.equal(kho.bang.has(KHOA_LOI_MOI_CHO), false);
  });

  it('mã sai không ghi', () => {
    const kho = khoGia();
    ghiLoiMoiCho(kho, 'abc', 0);
    assert.equal(kho.bang.size, 0);
  });

  it('dữ liệu hỏng trong kho thì bỏ qua', () => {
    const kho = khoGia();
    kho.setItem(KHOA_LOI_MOI_CHO, '{khong phai json');
    assert.equal(docLoiMoiCho(kho, 0), null);
  });

  it('quên sau khi tham gia xong hoặc khi link báo lỗi', () => {
    const kho = khoGia();
    ghiLoiMoiCho(kho, '7K3M9QXA', 0);
    quenLoiMoiCho(kho);
    assert.equal(docLoiMoiCho(kho, 0), null);
  });

  it('trình duyệt chặn kho (chế độ riêng tư) hay không có kho: không bao giờ ném', () => {
    assert.doesNotThrow(() => ghiLoiMoiCho(khoHong, '7K3M9QXA', 0));
    assert.equal(docLoiMoiCho(khoHong, 0), null);
    assert.doesNotThrow(() => quenLoiMoiCho(khoHong));
    assert.equal(docLoiMoiCho(null, 0), null);
  });
});

describe('phụ trợ', () => {
  it('bốn mã lỗi khiến link hết dùng được', () => {
    for (const ma of ['INVITE_NOT_FOUND', 'INVITE_EXPIRED', 'INVITE_REVOKED', 'INVITE_PROJECT_CLOSED']) {
      assert.equal(laLoiMoiHetDung(ma), true, ma);
    }
    assert.equal(laLoiMoiHetDung('NETWORK_ERROR'), false);
    assert.equal(laLoiMoiHetDung(undefined), false);
  });

  it('tên tệp ảnh QR', () => {
    assert.equal(tenTepQr('7K3M9QXA'), 'wedo-moi-7K3M9QXA.png');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx tsx --test src/lib/loi-moi.test.ts`
Expected: FAIL — "Cannot find module './loi-moi'".

- [ ] **Step 3: Viết mã**

`src/lib/loi-moi.ts`:

```ts
/**
 * Mã mời vào nhóm và lời mời đang chờ qua bước đăng nhập.
 *
 * Cùng luật với máy chủ (BE src/projects/loi-moi/ma-moi.ts). Tách khỏi api.ts
 * để chạy được dưới node:test (api.ts đọc import.meta.env ngay khi nạp).
 */

/** Bỏ 0, O, 1, I: gõ nhầm chỉ ra "mã không đúng", không ra mã của dự án khác. */
export const BANG_KY_TU_MA_MOI = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const DO_DAI_MA_MOI = 8;

/**
 * Người mở link mời khi chưa đăng nhập: giữ mã ở localStorage (phải sống qua
 * màn đăng nhập, đăng ký), giống cách luồng thanh toán giữ `wedo:kiem-tra-don`.
 */
export const KHOA_LOI_MOI_CHO = 'wedo:loi-moi-cho';
/** Link sống tối đa 7 ngày; giữ lời mời chờ lâu hơn là vô ích. */
export const HAN_LOI_MOI_CHO_MS = 7 * 24 * 60 * 60 * 1000;

const MA_LOI_HET_DUNG: ReadonlySet<string> = new Set([
  'INVITE_NOT_FOUND',
  'INVITE_EXPIRED',
  'INVITE_REVOKED',
  'INVITE_PROJECT_CLOSED',
]);

export type KhoLuu = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function chuanHoaMaMoi(nhap: string): string | null {
  const gon = nhap.toUpperCase().replace(/[\s\-–—]/g, '');
  if (gon.length !== DO_DAI_MA_MOI) return null;
  return [...gon].every((kyTu) => BANG_KY_TU_MA_MOI.includes(kyTu)) ? gon : null;
}

export function hienThiMaMoi(ma: string): string {
  return ma.length === DO_DAI_MA_MOI ? `${ma.slice(0, 4)}-${ma.slice(4)}` : ma;
}

/**
 * Mã trong địa chỉ `#/moi/:code` (`route` là phần sau `#/`). Đây là đường dẫn
 * đầu tiên của web có tham số; mọi đường khác vẫn so nguyên chuỗi như cũ.
 *
 * Mã sai dạng vẫn trả nguyên văn (tối đa 32 ký tự): trang mời gọi máy chủ và
 * hiện "mã không đúng", thay vì lặng lẽ rơi về trang chủ.
 */
export function docMaMoiTuDuongDan(route: string): string | null {
  const khop = /^moi\/([^/?#]+)\/?$/.exec(route);
  if (!khop) return null;
  let doan = khop[1];
  try {
    doan = decodeURIComponent(doan);
  } catch {
    // Chuỗi % hỏng: dùng nguyên văn.
  }
  const gon = doan.trim().slice(0, 32);
  if (!gon) return null;
  return chuanHoaMaMoi(gon) ?? gon;
}

export function duongDanTrangMoi(ma: string): string {
  return `#/moi/${encodeURIComponent(ma)}`;
}

/*
  Kho trình duyệt có thể ném (chế độ riêng tư, chặn dữ liệu trang): mọi lượt
  đọc/ghi bọc try/catch, không bao giờ làm vỡ trang.
*/

export function ghiLoiMoiCho(kho: KhoLuu | null, ma: string, bayGio = Date.now()) {
  const sach = chuanHoaMaMoi(ma);
  if (!sach) return;
  try {
    kho?.setItem(KHOA_LOI_MOI_CHO, JSON.stringify({ ma: sach, luc: bayGio }));
  } catch {
    // Không ghi được: đăng nhập xong về bảng điều khiển như thường, mở lại link là được.
  }
}

export function docLoiMoiCho(kho: KhoLuu | null, bayGio = Date.now()): string | null {
  try {
    const giaTri = kho?.getItem(KHOA_LOI_MOI_CHO);
    if (!giaTri) return null;
    const { ma, luc } = JSON.parse(giaTri) as { ma?: unknown; luc?: unknown };
    const sach = typeof ma === 'string' ? chuanHoaMaMoi(ma) : null;
    if (!sach || typeof luc !== 'number' || bayGio - luc > HAN_LOI_MOI_CHO_MS || luc > bayGio + 60_000) {
      kho?.removeItem(KHOA_LOI_MOI_CHO);
      return null;
    }
    return sach;
  } catch {
    return null;
  }
}

/** Gọi khi đã tham gia xong, khi link báo lỗi, và khi đăng xuất. */
export function quenLoiMoiCho(kho: KhoLuu | null) {
  try {
    kho?.removeItem(KHOA_LOI_MOI_CHO);
  } catch {
    // Bỏ qua: kho không dùng được thì cũng chẳng còn gì để quên.
  }
}

export function laLoiMoiHetDung(code: string | undefined): boolean {
  return Boolean(code && MA_LOI_HET_DUNG.has(code));
}

export function tenTepQr(ma: string): string {
  return `wedo-moi-${ma}.png`;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx tsx --test src/lib/loi-moi.test.ts && npm run lint && npm run kiem-dich`
Expected: PASS (tệp không có chuỗi tiếng Việt ngoài bình luận nên kiem-dich vẫn 0).

- [ ] **Step 5: Commit**

```bash
git add src/lib/loi-moi.ts src/lib/loi-moi.test.ts
git commit -m "feat(web): doc ma moi tu #/moi/:code va giu loi moi qua buoc dang nhap" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W4: Trang `#/moi/:code`, quay lại sau đăng nhập, mở đúng bảng sau khi tham gia

**Files:**
- Modify: `src/lib/dieu-huong-phien.ts` (thêm `chonDichSauDangNhap`)
- Test: `src/lib/dieu-huong-sau-dang-nhap.test.ts` (tạo)
- Create: `src/views/LoiMoiView.tsx`
- Modify: `src/App.tsx` (kiểu `Screen` dòng 111; `hashForScreen` 122-126; `getInitialState` 134-170; state; popstate ~273-276; đồng bộ hash ~358-363; `quenDonThanhToanCuaPhien` ~413-416; `vaoSauDangNhap` 511-522; khối render mới trước `if (currentScreen === 'payment-result')`)

**Interfaces:**
- Consumes: W1 (`api.xemLoiMoi`, `api.thamGiaLoiMoi`, `KetQuaThamGia`, `XemTruocLoiMoi`, `tuDienMoiVaoNhom.trang`), W3 (`docMaMoiTuDuongDan`, `duongDanTrangMoi`, `ghiLoiMoiCho`, `docLoiMoiCho`, `quenLoiMoiCho`, `laLoiMoiHetDung`), `moDich({ workspaceId, projectId })` từ `src/lib/mo-dich.ts`.
- Produces:
  - `export type DichSauDangNhap<T extends string> = { man: 'payment-result' } | { man: 'moi'; ma: string } | { man: 'app'; view: T | null }`
  - `export function chonDichSauDangNhap<T extends string>(dauVao: { coDonCho: boolean; maMoiCho: string | null; dich: T | null }): DichSauDangNhap<T>`
  - `LoiMoiView` props: `{ ma: string; daDangNhap: boolean; onCanDangNhap: (man: 'login' | 'register') => void; onDaThamGia: (ketQua: KetQuaThamGia) => void; onLinkHetDung: () => void; onVeTrangChu: () => void }`
  - Màn `Screen` mới `'moi'`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/dieu-huong-sau-dang-nhap.test.ts`:

```ts
/*
  Đăng nhập xong thì đi đâu: đơn thanh toán đang chờ, rồi lời mời vào nhóm,
  rồi màn đã định mở.

    npx tsx --test src/lib/dieu-huong-sau-dang-nhap.test.ts
*/
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chonDichSauDangNhap } from './dieu-huong-phien';

describe('chonDichSauDangNhap', () => {
  it('đơn thanh toán đang chờ đi trước — tiền thật của khách', () => {
    assert.deepEqual(chonDichSauDangNhap({ coDonCho: true, maMoiCho: '7K3M9QXA', dich: 'chat' }), {
      man: 'payment-result',
    });
  });

  it('có lời mời đang chờ thì quay lại trang mời', () => {
    assert.deepEqual(chonDichSauDangNhap({ coDonCho: false, maMoiCho: '7K3M9QXA', dich: 'chat' }), {
      man: 'moi',
      ma: '7K3M9QXA',
    });
  });

  it('không có gì chờ thì vào app, đúng màn đã định mở', () => {
    assert.deepEqual(chonDichSauDangNhap({ coDonCho: false, maMoiCho: null, dich: 'chat' }), {
      man: 'app',
      view: 'chat',
    });
    assert.deepEqual(chonDichSauDangNhap({ coDonCho: false, maMoiCho: null, dich: null }), {
      man: 'app',
      view: null,
    });
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx tsx --test src/lib/dieu-huong-sau-dang-nhap.test.ts`
Expected: FAIL — "chonDichSauDangNhap" không được xuất.

- [ ] **Step 3: Viết `chonDichSauDangNhap`**

Thêm vào cuối `src/lib/dieu-huong-phien.ts`:

```ts
export type DichSauDangNhap<T extends string> =
  | { man: 'payment-result' }
  | { man: 'moi'; ma: string }
  | { man: 'app'; view: T | null };

/**
 * Đăng nhập (hay đăng ký) xong thì đi đâu.
 *
 * Đơn thanh toán đang chờ kiểm tra đi trước: đó là tiền thật của khách. Rồi tới
 * lời mời vào nhóm người dùng mở trước khi đăng nhập (`wedo:loi-moi-cho`). Không
 * có gì chờ thì vào app, đúng màn đã định mở (hoặc bảng điều khiển).
 */
export function chonDichSauDangNhap<T extends string>(dauVao: {
  coDonCho: boolean;
  maMoiCho: string | null;
  dich: T | null;
}): DichSauDangNhap<T> {
  if (dauVao.coDonCho) return { man: 'payment-result' };
  if (dauVao.maMoiCho) return { man: 'moi', ma: dauVao.maMoiCho };
  return { man: 'app', view: dauVao.dich };
}
```

Run: `npx tsx --test src/lib/dieu-huong-sau-dang-nhap.test.ts` → PASS.

- [ ] **Step 4: Trang mời**

`src/views/LoiMoiView.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { ChuyenNgonNgu } from '../components/ChuyenNgonNgu';
import { WedoLogo } from '../components/WedoLogo';
import { api, type KetQuaThamGia, type XemTruocLoiMoi } from '../lib/api';
import { ApiError } from '../lib/loi-api';
import { laLoiMoiHetDung } from '../lib/loi-moi';
import { dinhDangNgayGio } from '../i18n/dinh-dang';
import { useDichLoi, useNgonNgu, useTuDien } from '../i18n/NgonNguProvider';
import { tuDienMoiVaoNhom } from '../i18n/tu-dien/moi-vao-nhom';

interface LoiMoiViewProps {
  ma: string;
  daDangNhap: boolean;
  /** Chưa đăng nhập: App ghi lời mời chờ rồi mở màn này. */
  onCanDangNhap: (man: 'login' | 'register') => void;
  onDaThamGia: (ketQua: KetQuaThamGia) => void;
  /** Link báo lỗi INVITE_*: App quên lời mời chờ để lần đăng nhập sau không quay lại đây. */
  onLinkHetDung: () => void;
  onVeTrangChu: () => void;
}

/**
 * Trang mở từ link mời `#/moi/:code`: xem trước dự án rồi Tham gia.
 *
 * Xem trước không cần đăng nhập. Tham gia cần đăng nhập; chưa có phiên thì
 * đưa sang Đăng nhập/Đăng ký và quay lại đây sau đó (xem App.vaoSauDangNhap).
 */
export function LoiMoiView({ ma, daDangNhap, onCanDangNhap, onDaThamGia, onLinkHetDung, onVeTrangChu }: LoiMoiViewProps) {
  const t = useTuDien(tuDienMoiVaoNhom).trang;
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  const [xemTruoc, setXemTruoc] = useState<XemTruocLoiMoi | null>(null);
  // Giữ lỗi gốc, dịch lúc vẽ: đổi ngôn ngữ thì câu báo lỗi đổi theo.
  const [loiTai, setLoiTai] = useState<unknown>(null);
  const [loiThamGia, setLoiThamGia] = useState<unknown>(null);
  const [dangThamGia, setDangThamGia] = useState(false);

  useEffect(() => {
    let huy = false;
    setXemTruoc(null);
    setLoiTai(null);
    api.xemLoiMoi(ma).then(
      (ketQua) => {
        if (!huy) setXemTruoc(ketQua);
      },
      (loi: unknown) => {
        if (huy) return;
        setLoiTai(loi);
        if (loi instanceof ApiError && laLoiMoiHetDung(loi.code)) onLinkHetDung();
      },
    );
    return () => {
      huy = true;
    };
    // Chỉ chạy lại khi đổi mã: các hàm gọi lại của App tạo mới mỗi lần vẽ.
  }, [ma]);

  const thamGia = async () => {
    setDangThamGia(true);
    setLoiThamGia(null);
    try {
      onDaThamGia(await api.thamGiaLoiMoi(ma));
    } catch (loi) {
      // Phiên đã hết hạn và gia hạn không được: đăng nhập lại rồi quay về đây.
      if (loi instanceof ApiError && loi.status === 401) {
        onCanDangNhap('login');
        return;
      }
      if (loi instanceof ApiError && laLoiMoiHetDung(loi.code)) onLinkHetDung();
      setLoiThamGia(loi);
    } finally {
      setDangThamGia(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <ChuyenNgonNgu className="absolute right-4 top-4 z-20" />
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl">
        <WedoLogo className="mb-6 h-8 text-primary" />

        {!xemTruoc && loiTai === null && (
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            {t.dangTai}
          </div>
        )}

        {loiTai !== null && (
          <div>
            <h1 className="text-xl font-bold text-on-surface">{t.khongMoDuoc}</h1>
            <p role="alert" className="mt-2 text-sm leading-6 text-on-surface-variant">
              {dichLoi(loiTai, t.loiTai)}
            </p>
            <button
              type="button"
              onClick={onVeTrangChu}
              className="mt-6 w-full rounded-xl border border-outline-variant px-4 py-3 font-bold text-on-surface transition-colors hover:bg-surface-container"
            >
              {t.veTrangChu}
            </button>
          </div>
        )}

        {xemTruoc && (
          <div>
            <p className="text-sm font-semibold text-primary">{t.tieuDe}</p>
            <h1 className="mt-1 break-words text-2xl font-black text-on-surface">{xemTruoc.projectName}</h1>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
              <Users className="mt-1 h-4 w-4 shrink-0" />
              <span>{t.chiTiet(xemTruoc.workspaceName, xemTruoc.leaderName, xemTruoc.memberCount)}</span>
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">{t.hetHan(dinhDangNgayGio(xemTruoc.expiresAt, ngonNgu))}</p>

            {loiThamGia !== null && (
              <p role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error">
                {dichLoi(loiThamGia, t.loiThamGia)}
              </p>
            )}

            {daDangNhap ? (
              <button
                type="button"
                onClick={() => void thamGia()}
                disabled={dangThamGia}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dangThamGia && <Loader2 className="h-4 w-4 animate-spin" />}
                {dangThamGia ? t.dangThamGia : t.thamGia}
              </button>
            ) : (
              <div className="mt-6 grid gap-2">
                <p className="text-sm leading-6 text-on-surface-variant">{t.canDangNhap}</p>
                <button
                  type="button"
                  onClick={() => onCanDangNhap('login')}
                  className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-primary/90"
                >
                  {t.dangNhap}
                </button>
                <button
                  type="button"
                  onClick={() => onCanDangNhap('register')}
                  className="w-full rounded-xl border border-outline-variant px-5 py-3 font-bold text-on-surface transition-colors hover:bg-surface-container"
                >
                  {t.dangKy}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Nối vào App**

Trong `src/App.tsx`:

1. Import (cạnh các import `./lib/...`):

```tsx
import { chonDichSauDangNhap } from './lib/dieu-huong-phien';
import { docLoiMoiCho, docMaMoiTuDuongDan, duongDanTrangMoi, ghiLoiMoiCho, quenLoiMoiCho } from './lib/loi-moi';
import { moDich } from './lib/mo-dich';
```

và thêm vào khối `lazy`, sau dòng `PaymentResultView`:

```tsx
const LoiMoiView = lazy(() => import('./views/LoiMoiView').then((module) => ({ default: module.LoiMoiView })));
```

2. Thay `type Screen = 'landing' | 'login' | 'forgot-password' | 'register' | 'pricing' | 'app' | 'admin-login' | 'admin' | 'checkout' | 'payment-result';` bằng:

```tsx
type Screen = 'landing' | 'login' | 'forgot-password' | 'register' | 'pricing' | 'app' | 'admin-login' | 'admin' | 'checkout' | 'payment-result' | 'moi';

type TrangThaiDau = {
  screen: Screen;
  view: NavItem;
  adminView: AdminView;
  settingsTab: SettingsTab | undefined;
  /** Mã của trang `#/moi/:code`; chỉ có khi `screen === 'moi'`. */
  maMoi?: string;
};
```

3. Thay:

```tsx
function hashForScreen(screen: Screen, activeView: NavItem, adminView: AdminView) {
  if (screen === 'admin') return adminHash(adminView);
```

bằng:

```tsx
function hashForScreen(screen: Screen, activeView: NavItem, adminView: AdminView, maMoi?: string | null) {
  if (screen === 'moi') return maMoi ? duongDanTrangMoi(maMoi) : '#/landing';
  if (screen === 'admin') return adminHash(adminView);
```

4. Thay:

```tsx
const getInitialState = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) {
    const route = hash.replace('#/', '');
    if (route === 'admin/login') {
```

bằng:

```tsx
const getInitialState = (): TrangThaiDau => {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) {
    const route = hash.replace('#/', '');
    // Đường dẫn duy nhất có tham số. Mọi đường khác vẫn so nguyên chuỗi như cũ.
    const maMoi = docMaMoiTuDuongDan(route);
    if (maMoi) {
      return { screen: 'moi', view: 'dashboard', adminView: 'overview', settingsTab: undefined, maMoi };
    }
    if (route === 'admin/login') {
```

5. Ngay sau dòng `  const [currentScreen, setCurrentScreen] = useState<Screen>(initialState.screen);` thêm:

```tsx
  const [maMoi, setMaMoi] = useState<string | null>(initialState.maMoi ?? null);
```

6. Trong `handlePopState`, thay:

```tsx
          } else if (laManHinhTheoDuongDan(route)) {
            setCurrentScreen(route as Screen);
```

bằng:

```tsx
          } else if (docMaMoiTuDuongDan(route)) {
            setMaMoi(docMaMoiTuDuongDan(route));
            setCurrentScreen('moi');
          } else if (laManHinhTheoDuongDan(route)) {
            setCurrentScreen(route as Screen);
```

7. Thay effect đồng bộ hash:

```tsx
  useEffect(() => {
    const newHash = hashForScreen(currentScreen, activeView, adminView);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, [currentScreen, activeView, adminView]);
```

bằng:

```tsx
  useEffect(() => {
    const newHash = hashForScreen(currentScreen, activeView, adminView, maMoi);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, [currentScreen, activeView, adminView, maMoi]);
```

8. Thay:

```tsx
  const quenDonThanhToanCuaPhien = () => {
    quenMoiDonThanhToan(layKhoCucBo(), layKhoPhien());
    boThamSoThanhToanTrenTrinhDuyet();
  };
```

bằng:

```tsx
  const quenDonThanhToanCuaPhien = () => {
    quenMoiDonThanhToan(layKhoCucBo(), layKhoPhien());
    boThamSoThanhToanTrenTrinhDuyet();
    // Lời mời đang chờ cũng vậy: người đăng nhập sau trên máy này không được tự vào nhóm của người trước.
    quenLoiMoiCho(layKhoCucBo());
  };
```

9. Thay toàn bộ `vaoSauDangNhap`:

```tsx
  const vaoSauDangNhap = () => {
    // Màn người dùng định mở trước khi bị đưa sang đăng nhập (liên kết, hết phiên).
    const dich = layDichSauDangNhap(layKhoPhien(), APP_VIEWS);
    if (docDonChoKiemTra(layKhoCucBo())) {
      setCurrentScreen('payment-result');
      return;
    }
    const tab = dich ? TAB_CAI_DAT_THEO_ROUTE[dich] : undefined;
    setSettingsTab(tab);
    setActiveView(tab ? 'settings' : (dich ?? 'dashboard'));
    setCurrentScreen('app');
  };
```

bằng:

```tsx
  const vaoSauDangNhap = () => {
    // Màn người dùng định mở trước khi bị đưa sang đăng nhập (liên kết, hết phiên).
    const ketQua = chonDichSauDangNhap({
      coDonCho: Boolean(docDonChoKiemTra(layKhoCucBo())),
      maMoiCho: docLoiMoiCho(layKhoCucBo()),
      dich: layDichSauDangNhap(layKhoPhien(), APP_VIEWS),
    });
    if (ketQua.man === 'payment-result') {
      setCurrentScreen('payment-result');
      return;
    }
    if (ketQua.man === 'moi') {
      setMaMoi(ketQua.ma);
      setCurrentScreen('moi');
      return;
    }
    const tab = ketQua.view ? TAB_CAI_DAT_THEO_ROUTE[ketQua.view] : undefined;
    setSettingsTab(tab);
    setActiveView(tab ? 'settings' : (ketQua.view ?? 'dashboard'));
    setCurrentScreen('app');
  };
```

10. Ngay trước `  if (currentScreen === 'payment-result') {` thêm:

```tsx
  if (currentScreen === 'moi' && maMoi) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <LoiMoiView
          ma={maMoi}
          daDangNhap={coPhienTrongKho(layKhoCucBo())}
          onCanDangNhap={(man) => {
            ghiLoiMoiCho(layKhoCucBo(), maMoi);
            setCurrentScreen(man);
          }}
          onLinkHetDung={() => quenLoiMoiCho(layKhoCucBo())}
          onDaThamGia={({ projectId, workspaceId }) => {
            quenLoiMoiCho(layKhoCucBo());
            // Chọn đúng workspace và dự án vừa vào rồi mở Bảng công việc của nó.
            moDich({ workspaceId, projectId });
            setMaMoi(null);
            setSettingsTab(undefined);
            setActiveView('taskboard');
            setCurrentScreen('app');
          }}
          onVeTrangChu={() => {
            setMaMoi(null);
            setCurrentScreen(coPhienTrongKho(layKhoCucBo()) ? 'app' : 'landing');
          }}
        />
      </Suspense>
    );
  }
```

- [ ] **Step 6: Kiểm**

Run: `npm run lint && npm run kiem-dich && npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx') && npm run build`
Expected: tsc sạch, kiem-dich 0, mọi bài PASS, build xong (có chunk `LoiMoiView`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/dieu-huong-phien.ts src/lib/dieu-huong-sau-dang-nhap.test.ts src/views/LoiMoiView.tsx src/App.tsx
git commit -m "feat(web): trang #/moi/:code, quay lai sau dang nhap va mo dung bang du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W5: Hộp thoại "Mời vào nhóm" có QR cho Leader

**Files:**
- Create: `src/components/du-an/MoiVaoNhomDialog.tsx`
- Modify: `src/views/ProjectBoardView.tsx` (import lucide dòng 3; sau dòng `const canManageTasks = useMemo(…)` ~259; khối nút đầu trang ~912-917)
- Modify: `src/views/WorkspaceView.tsx` (state ~106; `ProjectDetailDrawer` props và khối "moiThem" ~1064-1260; nơi dựng drawer ~726-754)

**Interfaces:**
- Consumes: `api.layLoiMoi|taoLoiMoi|tatLoiMoi` + `LoiMoiDuAn` (W1), `hienThiMaMoi`, `tenTepQr` (W3), `tuDienMoiVaoNhom` (W1), `toDataURL` từ `qrcode`, `useToast` (`showToast(title, message?, 'success'|'error'|'warning'|'info')`), `LopPhu`.
- Produces: `export function MoiVaoNhomDialog(props: { projectId: string; projectName: string; onClose: () => void })`.

Bước kiểm của task này là tsc + build + kiem-dich (thành phần giao diện; logic thuần đã kiểm ở W3).

- [ ] **Step 1: Viết hộp thoại**

`src/components/du-an/MoiVaoNhomDialog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import { Copy, Download, Link2Off, Loader2, RefreshCw, X } from 'lucide-react';
import { LopPhu } from '../LopPhu';
import { useToast } from '../../contexts/ToastContext';
import { api, type LoiMoiDuAn } from '../../lib/api';
import { hienThiMaMoi, tenTepQr } from '../../lib/loi-moi';
import { dinhDangNgayGio } from '../../i18n/dinh-dang';
import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienMoiVaoNhom } from '../../i18n/tu-dien/moi-vao-nhom';

interface MoiVaoNhomDialogProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

type KhoaLoi = 'loiTai' | 'loiTao' | 'loiTat';

/** Ảnh QR để chiếu lên màn hình lớp hay in ra: đủ to, lề rộng cho máy quét. */
const CO_QR_TAI_VE = 1024;

/**
 * Leader (hoặc chủ workspace) lấy link mời: sao chép, QR (tải PNG), mã in to,
 * hạn và số người đã vào; tạo link mới hay tắt link.
 */
export function MoiVaoNhomDialog({ projectId, projectName, onClose }: MoiVaoNhomDialogProps) {
  const t = useTuDien(tuDienMoiVaoNhom).hopThoai;
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  const { showToast } = useToast();
  const [loiMoi, setLoiMoi] = useState<LoiMoiDuAn | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangLam, setDangLam] = useState<'tao' | 'tat' | null>(null);
  // Giữ nguồn lỗi, dịch lúc vẽ.
  const [loi, setLoi] = useState<{ loi: unknown; khoa: KhoaLoi } | null>(null);
  const [anhQr, setAnhQr] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    api
      .layLoiMoi(projectId)
      .then(
        (ketQua) => {
          if (!huy) setLoiMoi(ketQua);
        },
        (e: unknown) => {
          if (!huy) setLoi({ loi: e, khoa: 'loiTai' });
        },
      )
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!loiMoi) {
      setAnhQr(null);
      return;
    }
    let huy = false;
    toDataURL(loiMoi.url, { width: 320, margin: 1, errorCorrectionLevel: 'M' }).then(
      (anh) => {
        if (!huy) setAnhQr(anh);
      },
      () => {
        if (!huy) setAnhQr(null);
      },
    );
    return () => {
      huy = true;
    };
  }, [loiMoi]);

  const saoChep = async () => {
    if (!loiMoi) return;
    try {
      await navigator.clipboard.writeText(loiMoi.url);
      showToast(t.daSaoChep, undefined, 'success');
    } catch {
      showToast(t.khongSaoChepDuoc, undefined, 'error');
    }
  };

  const taiAnhQr = async () => {
    if (!loiMoi) return;
    const anh = await toDataURL(loiMoi.url, { width: CO_QR_TAI_VE, margin: 4, errorCorrectionLevel: 'M' });
    const lienKet = document.createElement('a');
    lienKet.href = anh;
    lienKet.download = tenTepQr(loiMoi.code);
    document.body.appendChild(lienKet);
    lienKet.click();
    lienKet.remove();
  };

  const taoLinkMoi = async () => {
    // Đã có link thì hỏi: link và mã cũ sẽ hết dùng được.
    if (loiMoi && !window.confirm(t.xacNhanTaoMoi)) return;
    setDangLam('tao');
    setLoi(null);
    try {
      setLoiMoi(await api.taoLoiMoi(projectId));
    } catch (e) {
      setLoi({ loi: e, khoa: 'loiTao' });
    } finally {
      setDangLam(null);
    }
  };

  const tatLink = async () => {
    if (!window.confirm(t.xacNhanTat)) return;
    setDangLam('tat');
    setLoi(null);
    try {
      await api.tatLoiMoi(projectId);
      setLoiMoi(null);
      showToast(t.daTat, undefined, 'info');
    } catch (e) {
      setLoi({ loi: e, khoa: 'loiTat' });
    } finally {
      setDangLam(null);
    }
  };

  return (
    <LopPhu className="flex items-center justify-center bg-scrim/50 p-4 backdrop-blur-sm">
      <button type="button" aria-label={t.dong} className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="moi-vao-nhom-tieu-de"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/20 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="moi-vao-nhom-tieu-de" className="text-2xl font-bold text-on-surface">
              {t.tieuDe}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t.moTa(projectName)}</p>
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

        {loi && (
          <p role="alert" className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">
            {dichLoi(loi.loi, t[loi.khoa])}
          </p>
        )}

        {dangTai ? (
          <div className="flex items-center gap-3 py-6 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            {t.dangTai}
          </div>
        ) : loiMoi ? (
          <div className="grid gap-4">
            <div>
              <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.lienKet}</span>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={loiMoi.url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => void saoChep()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
                >
                  <Copy className="h-4 w-4" />
                  {t.saoChep}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl border border-outline-variant/40 bg-white p-2">
                {anhQr ? (
                  <img src={anhQr} alt={t.maQr(hienThiMaMoi(loiMoi.code))} className="h-full w-full" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
              <div className="grid gap-2 text-center sm:text-left">
                <span className="text-sm font-bold text-on-surface">{t.maMoi}</span>
                <span className="font-mono text-3xl font-black tracking-widest text-primary">
                  {hienThiMaMoi(loiMoi.code)}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {t.hetHan(dinhDangNgayGio(loiMoi.expiresAt, ngonNgu))} · {t.daThamGia(loiMoi.useCount)}
                </span>
                <button
                  type="button"
                  onClick={() => void taiAnhQr()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-3 py-2 text-sm font-bold text-on-surface hover:bg-surface-container sm:justify-start"
                >
                  <Download className="h-4 w-4" />
                  {t.taiQr}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-sm text-on-surface-variant">{t.chuaCo}</p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {loiMoi && (
            <button
              type="button"
              onClick={() => void tatLink()}
              disabled={dangLam !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/40 px-4 py-3 font-bold text-error hover:bg-error/10 disabled:opacity-60"
            >
              {dangLam === 'tat' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
              {t.tatLink}
            </button>
          )}
          <button
            type="button"
            onClick={() => void taoLinkMoi()}
            disabled={dangLam !== null || dangTai}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
          >
            {dangLam === 'tao' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loiMoi ? t.taoLinkMoi : t.taoLink}
          </button>
        </div>
      </div>
    </LopPhu>
  );
}
```

- [ ] **Step 2: Nút trong Bảng công việc**

`src/views/ProjectBoardView.tsx`:
- Dòng 3: thêm `UserPlus` vào import lucide (`…, Upload, UserPlus, UserRound, X, XCircle }`).
- Thêm import:

```tsx
import { MoiVaoNhomDialog } from '../components/du-an/MoiVaoNhomDialog';
import { tuDienMoiVaoNhom } from '../i18n/tu-dien/moi-vao-nhom';
```

- Ngay sau dòng `  const canManageTasks = useMemo(() => canManageProjectTasks(project, currentUser?.id), [project, currentUser?.id]);` thêm:

```tsx
  /** Mời vào nhóm: Leader dự án hoặc chủ workspace — cùng quy tắc `ensureProjectManager` của máy chủ. */
  const coTheMoi = canManageTasks || (Boolean(currentUser) && workspace?.ownerId === currentUser?.id);
  const [moiOpen, setMoiOpen] = useState(false);
  const tMoi = useTuDien(tuDienMoiVaoNhom);
```

- Thay:

```tsx
        <div className="hidden items-center gap-4 md:flex">
          {canManageTasks && <button onClick={() => openCreatePanel()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            {t.taoTask}
          </button>}
        </div>
```

bằng:

```tsx
        <div className="flex items-center gap-2 md:gap-4">
          {coTheMoi && project && (
            <button
              type="button"
              onClick={() => setMoiOpen(true)}
              aria-label={tMoi.nut}
              className="flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">{tMoi.nut}</span>
            </button>
          )}
          <div className="hidden items-center gap-4 md:flex">
            {canManageTasks && <button onClick={() => openCreatePanel()} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {t.taoTask}
            </button>}
          </div>
          {moiOpen && project && (
            <MoiVaoNhomDialog projectId={project.id} projectName={project.name} onClose={() => setMoiOpen(false)} />
          )}
        </div>
```

- [ ] **Step 3: Nút trong ngăn chi tiết dự án (trang Dự án)**

`src/views/WorkspaceView.tsx`:
- Thêm `UserPlus` vào import lucide (sau `Trash2,`: `  Trash2,\n  UserPlus,\n  Users,`).
- Thêm import: `import { MoiVaoNhomDialog } from '../components/du-an/MoiVaoNhomDialog';`
- Sau dòng `  const [error, setError] = useState<LoiKhongGian | null>(null);` thêm:

```tsx
  /** Dự án đang mở hộp thoại "Mời vào nhóm". */
  const [moiDuAn, setMoiDuAn] = useState<Project | null>(null);
```

- Thay:

```tsx
          onOpenBoard={() => openProjectBoard(detailProject)}
        />
      )}
```

bằng:

```tsx
          onOpenBoard={() => openProjectBoard(detailProject)}
          onMoiVaoNhom={() => setMoiDuAn(detailProject)}
        />
      )}

      {moiDuAn && (
        <MoiVaoNhomDialog projectId={moiDuAn.id} projectName={moiDuAn.name} onClose={() => setMoiDuAn(null)} />
      )}
```

- Trong `function ProjectDetailDrawer({`: thêm `  onMoiVaoNhom,` sau `  onOpenBoard,` trong danh sách tham số, và `  onMoiVaoNhom: () => void;` sau `  onOpenBoard: () => void;` trong kiểu.
- Trong thân drawer, thay:

```tsx
              <p className="mb-4 text-sm text-on-surface-variant">
                {t.huongDanMoi}
              </p>
```

bằng:

```tsx
              <p className="mb-4 text-sm text-on-surface-variant">
                {t.huongDanMoi}
              </p>
              <button
                type="button"
                onClick={onMoiVaoNhom}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 font-bold text-primary transition-colors hover:bg-primary/10"
              >
                <UserPlus className="h-4 w-4" />
                {tMoi.nut}
              </button>
```

và ngay dưới dòng `  const t = useTuDien(tuDienKhongGian).chiTiet;` của drawer thêm `  const tMoi = useTuDien(tuDienMoiVaoNhom);` cùng import `import { tuDienMoiVaoNhom } from '../i18n/tu-dien/moi-vao-nhom';` ở đầu tệp.

- [ ] **Step 4: Kiểm**

Run: `npm run lint && npm run kiem-dich && npm run build`
Expected: sạch; build có `qrcode` trong một chunk nạp theo nhu cầu (không nằm ở gói đầu vì `ProjectBoardView` và `WorkspaceView` đều `lazy`).

- [ ] **Step 5: Commit**

```bash
git add src/components/du-an/MoiVaoNhomDialog.tsx src/views/ProjectBoardView.tsx src/views/WorkspaceView.tsx
git commit -m "feat(web): hop thoai Moi vao nhom co link, QR tai PNG, ma, tao lai va tat link" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W6: Tính hạn việc khi xem trước mẫu

**Files:**
- Create: `src/lib/mau-du-an.ts`
- Test: `src/lib/mau-du-an.test.ts`

**Interfaces:**
- Consumes: `hanCuoiNgayVietNam`, `homNayVietNam` từ `src/lib/gio-viet-nam.ts`.
- Produces:
  - `export type CheDoTaoDuAn = 'trong' | 'mau'`
  - `export function laNgayHopLe(ngay: string): boolean`
  - `export function congNgayLich(ngay: string, soNgay: number): string`
  - `export function hanViecTheoMau(ngayBatDau: string, offsetDays: number): string` (ISO; khớp `hanCuoiNgayVN` của máy chủ)
  - `export interface ViecXemTruoc { title: string; offsetDays: number; hanIso: string }`
  - `export function xemTruocViecMau(tasks: Array<{ title: string; offsetDays: number }>, ngayBatDau: string): ViecXemTruoc[]`
  - `export function ngayBatDauMacDinh(bayGio?: Date): string`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/mau-du-an.test.ts`:

```ts
/*
  Hạn việc khi xem trước mẫu dự án. Phải khớp máy chủ (BE hanCuoiNgayVN):
  23:59 giờ Việt Nam của ngày bắt đầu + offsetDays.

    npx tsx --test src/lib/mau-du-an.test.ts
*/
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { congNgayLich, hanViecTheoMau, laNgayHopLe, ngayBatDauMacDinh, xemTruocViecMau } from './mau-du-an';

describe('congNgayLich', () => {
  it('cộng ngày lăn qua tháng và năm', () => {
    assert.equal(congNgayLich('2026-10-30', 3), '2026-11-02');
    assert.equal(congNgayLich('2026-12-30', 5), '2027-01-04');
    assert.equal(congNgayLich('2026-10-05', 70), '2026-12-14');
  });
});

describe('hanViecTheoMau', () => {
  it('23:59 giờ Việt Nam là 16:59 UTC', () => {
    assert.equal(hanViecTheoMau('2026-10-02', 3), '2026-10-05T16:59:00.000Z');
  });
});

describe('laNgayHopLe', () => {
  it('chỉ nhận YYYY-MM-DD có thật', () => {
    assert.equal(laNgayHopLe('2026-10-05'), true);
    assert.equal(laNgayHopLe('2026-02-30'), false);
    assert.equal(laNgayHopLe('05/10/2026'), false);
    assert.equal(laNgayHopLe(''), false);
  });
});

describe('xemTruocViecMau', () => {
  const viec = [
    { title: 'A', offsetDays: 2 },
    { title: 'B', offsetDays: 14 },
  ];

  it('mỗi việc kèm hạn theo ngày bắt đầu đang chọn', () => {
    assert.deepEqual(xemTruocViecMau(viec, '2026-10-05'), [
      { title: 'A', offsetDays: 2, hanIso: '2026-10-07T16:59:00.000Z' },
      { title: 'B', offsetDays: 14, hanIso: '2026-10-19T16:59:00.000Z' },
    ]);
  });

  it('đổi ngày bắt đầu là đổi hạn ngay', () => {
    assert.equal(xemTruocViecMau(viec, '2026-11-01')[0].hanIso, '2026-11-03T16:59:00.000Z');
  });

  it('ngày bắt đầu đang gõ dở: không ném, hạn rỗng', () => {
    assert.deepEqual(xemTruocViecMau(viec, '2026-1'), [
      { title: 'A', offsetDays: 2, hanIso: '' },
      { title: 'B', offsetDays: 14, hanIso: '' },
    ]);
  });
});

describe('ngayBatDauMacDinh', () => {
  it('hôm nay theo giờ Việt Nam, kể cả lúc 0h-7h sáng', () => {
    assert.equal(ngayBatDauMacDinh(new Date('2026-10-02T20:00:00.000Z')), '2026-10-03');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx tsx --test src/lib/mau-du-an.test.ts`
Expected: FAIL — "Cannot find module './mau-du-an'".

- [ ] **Step 3: Viết mã**

`src/lib/mau-du-an.ts`:

```ts
import { hanCuoiNgayVietNam, homNayVietNam } from './gio-viet-nam';

/** Hai thẻ của hộp thoại tạo dự án. */
export type CheDoTaoDuAn = 'trong' | 'mau';

const DINH_DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Ngày lịch (YYYY-MM-DD) cộng `soNgay` — tính trên UTC nên không lệch theo múi giờ máy. */
export function congNgayLich(ngay: string, soNgay: number): string {
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  return new Date(Date.UTC(nam, thang - 1, ngayTrongThang + soNgay)).toISOString().slice(0, 10);
}

/** YYYY-MM-DD và là ngày có thật (30/02 thì không). */
export function laNgayHopLe(ngay: string): boolean {
  return DINH_DANG_NGAY.test(ngay) && congNgayLich(ngay, 0) === ngay;
}

/**
 * Hạn của một việc trong mẫu: 23:59 giờ Việt Nam, `offsetDays` ngày sau ngày
 * bắt đầu. Cùng công thức với máy chủ (BE hanCuoiNgayVN), để hạn xem trước
 * đúng bằng hạn được tạo.
 */
export function hanViecTheoMau(ngayBatDau: string, offsetDays: number): string {
  return hanCuoiNgayVietNam(congNgayLich(ngayBatDau, offsetDays));
}

export interface ViecXemTruoc {
  title: string;
  offsetDays: number;
  /** Rỗng khi ngày bắt đầu chưa hợp lệ (người dùng đang gõ dở). */
  hanIso: string;
}

export function xemTruocViecMau(tasks: Array<{ title: string; offsetDays: number }>, ngayBatDau: string): ViecXemTruoc[] {
  const hopLe = laNgayHopLe(ngayBatDau);
  return tasks.map((viec) => ({
    title: viec.title,
    offsetDays: viec.offsetDays,
    hanIso: hopLe ? hanViecTheoMau(ngayBatDau, viec.offsetDays) : '',
  }));
}

/** Mặc định là hôm nay ở Việt Nam, giống máy chủ khi không gửi `startDate`. */
export function ngayBatDauMacDinh(bayGio: Date = new Date()): string {
  return homNayVietNam(bayGio);
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx tsx --test src/lib/mau-du-an.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mau-du-an.ts src/lib/mau-du-an.test.ts
git commit -m "feat(web): tinh han viec 23:59 gio Viet Nam khi xem truoc mau du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W7: Thẻ "Bắt đầu từ mẫu" trong hộp thoại tạo dự án

**Files:**
- Create: `src/components/du-an/ChonMauDuAn.tsx`
- Modify: `src/views/WorkspaceView.tsx` (props `WorkspaceViewProps` ~dòng 53-56 và chữ ký ~80; state; effect `createProjectRequest` 179-183; `closeCreateProjectDialog` 185-192; `handleCreateProject` 223-276; nơi dựng `CreateProjectDialog` 711-725; hàm `CreateProjectDialog` 776-939)

**Interfaces:**
- Consumes: `api.layMauDuAn`, `MauDuAn`, `api.createProject({ templateId, startDate, lang })`, `api.getTasks` (W1); `xemTruocViecMau`, `laNgayHopLe`, `ngayBatDauMacDinh`, `CheDoTaoDuAn` (W6); `tuDienMauDuAn` (W1); `VietnameseDateInput` (default export, nhận `value` YYYY-MM-DD và `onChange`).
- Produces:
  - `export function ChonMauDuAn(props: { danhSach: MauDuAn[] | null; loi: unknown; mauDangChon: string | null; ngayBatDau: string; busy: boolean; onChonMau: (mau: MauDuAn) => void; onNgayBatDauChange: (ngay: string) => void })`
  - `WorkspaceViewProps.createProjectMode?: CheDoTaoDuAn` (W8 dùng)
  - `CreateProjectDialog` nhận thêm `cheDo`, `onCheDoChange`, `noiDungMau: React.ReactNode`, `coTheTao: boolean`.

- [ ] **Step 1: Thành phần chọn mẫu**

`src/components/du-an/ChonMauDuAn.tsx`:

```tsx
import { Loader2 } from 'lucide-react';
import VietnameseDateInput from '../VietnameseDateInput';
import type { MauDuAn } from '../../lib/api';
import { xemTruocViecMau } from '../../lib/mau-du-an';
import { dinhDangNgay } from '../../i18n/dinh-dang';
import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienMauDuAn } from '../../i18n/tu-dien/mau-du-an';

interface ChonMauDuAnProps {
  danhSach: MauDuAn[] | null;
  loi: unknown;
  mauDangChon: string | null;
  ngayBatDau: string;
  busy: boolean;
  onChonMau: (mau: MauDuAn) => void;
  onNgayBatDauChange: (ngay: string) => void;
}

/** Chọn mẫu và ngày bắt đầu; danh sách việc cập nhật hạn ngay khi đổi ngày. */
export function ChonMauDuAn({ danhSach, loi, mauDangChon, ngayBatDau, busy, onChonMau, onNgayBatDauChange }: ChonMauDuAnProps) {
  const t = useTuDien(tuDienMauDuAn);
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();

  if (loi) {
    return <p role="alert" className="rounded-xl bg-error/10 p-3 text-sm text-error">{dichLoi(loi, t.loiTaiMau)}</p>;
  }
  if (!danhSach) {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        {t.dangTaiMau}
      </div>
    );
  }

  const mau = danhSach.find((item) => item.id === mauDangChon) ?? null;
  const viec = mau ? xemTruocViecMau(mau.tasks, ngayBatDau) : [];

  return (
    <div className="grid gap-4">
      <div role="radiogroup" aria-label={t.chonMau} className="grid gap-2 sm:grid-cols-2">
        {danhSach.map((item) => {
          const dangChon = item.id === mauDangChon;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={dangChon}
              disabled={busy}
              onClick={() => onChonMau(item)}
              className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-60 ${
                dangChon ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface hover:bg-primary/5'
              }`}
            >
              <span className="block font-bold text-on-surface">{item.name}</span>
              <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{item.description}</span>
              <span className="mt-2 block text-xs font-semibold text-primary">{t.soViec(item.tasks.length)}</span>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-on-surface">{t.ngayBatDau}</span>
        <VietnameseDateInput
          value={ngayBatDau}
          onChange={(event) => onNgayBatDauChange(event.target.value)}
          disabled={busy}
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-[15px] font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
        />
        <span className="mt-1 block text-xs text-on-surface-variant">{t.goiYNgay}</span>
      </label>

      <div>
        <h3 className="mb-2 text-sm font-bold text-on-surface">{t.viecSeTao}</h3>
        {mau ? (
          <ol className="grid max-h-64 gap-1.5 overflow-y-auto">
            {viec.map((item, index) => (
              <li
                key={`${index}-${item.offsetDays}`}
                className="flex items-start justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-on-surface">{item.title}</span>
                <span className="shrink-0 text-xs text-on-surface-variant">
                  {item.hanIso ? t.han(dinhDangNgay(item.hanIso, ngonNgu)) : ''}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-on-surface-variant">{t.chuaChonMau}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: State và dữ liệu trong WorkspaceView**

Thêm import ở đầu `src/views/WorkspaceView.tsx`:

```tsx
import type { MauDuAn } from '../lib/api';
import { laNgayHopLe, ngayBatDauMacDinh, type CheDoTaoDuAn } from '../lib/mau-du-an';
import { ChonMauDuAn } from '../components/du-an/ChonMauDuAn';
import { tuDienMauDuAn } from '../i18n/tu-dien/mau-du-an';
```

Trong `interface WorkspaceViewProps`, sau `  createProjectRequest?: number;` thêm:

```tsx
  /** Thẻ mở sẵn khi có yêu cầu tạo dự án: "Dự án trống" hay "Bắt đầu từ mẫu". */
  createProjectMode?: CheDoTaoDuAn;
```

Thay `export function WorkspaceView({ onNavigate, createProjectRequest = 0 }: WorkspaceViewProps) {` bằng:

```tsx
export function WorkspaceView({ onNavigate, createProjectRequest = 0, createProjectMode = 'trong' }: WorkspaceViewProps) {
```

Sau dòng `  const [moiDuAn, setMoiDuAn] = useState<Project | null>(null);` (W5) thêm:

```tsx
  const [cheDoTao, setCheDoTao] = useState<CheDoTaoDuAn>('trong');
  const [mauDuAn, setMauDuAn] = useState<MauDuAn[] | null>(null);
  const [loiMauDuAn, setLoiMauDuAn] = useState<unknown>(null);
  const [mauDangChon, setMauDangChon] = useState<string | null>(null);
  const [ngayBatDau, setNgayBatDau] = useState(() => ngayBatDauMacDinh());
```

Thay:

```tsx
  useEffect(() => {
    if (createProjectRequest > 0) {
      setCreatingProject(true);
    }
  }, [createProjectRequest]);
```

bằng:

```tsx
  useEffect(() => {
    if (createProjectRequest > 0) {
      setCheDoTao(createProjectMode);
      setCreatingProject(true);
    }
  }, [createProjectRequest]);

  /*
    Tải danh sách mẫu khi mở thẻ Mẫu, theo ngôn ngữ đang dùng: tên mẫu và tên
    việc do máy chủ gửi, nên đổi ngôn ngữ là tải lại.
  */
  useEffect(() => {
    if (!creatingProject || cheDoTao !== 'mau') return;
    let huy = false;
    setLoiMauDuAn(null);
    api.layMauDuAn(ngonNgu).then(
      (danhSach) => {
        if (!huy) setMauDuAn(danhSach);
      },
      (loi: unknown) => {
        if (!huy) setLoiMauDuAn(loi);
      },
    );
    return () => {
      huy = true;
    };
  }, [creatingProject, cheDoTao, ngonNgu]);
```

Trong `closeCreateProjectDialog`, thay:

```tsx
    setNewProjectMemberText('');
    setNewProjectMemberRole('MEMBER');
  };

  const handleSelectWorkspace
```

bằng:

```tsx
    setNewProjectMemberText('');
    setNewProjectMemberRole('MEMBER');
    setCheDoTao('trong');
    setMauDangChon(null);
    setNgayBatDau(ngayBatDauMacDinh());
  };

  const handleSelectWorkspace
```

- [ ] **Step 3: Gửi mẫu khi tạo**

Trong `handleCreateProject`, thay:

```tsx
      const project = await api.createProject({
        workspaceId: workspace.id,
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });
```

bằng:

```tsx
      const tuMau = cheDoTao === 'mau' && mauDangChon ? mauDangChon : null;
      const project = await api.createProject({
        workspaceId: workspace.id,
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        ...(tuMau ? { templateId: tuMau, startDate: ngayBatDau, lang: ngonNgu } : {}),
      });
      if (tuMau) {
        // Việc của mẫu được tạo cùng dự án trên máy chủ: tải lại để tiến độ khớp ngay.
        api.getTasks(workspace.id).then(setTasks, () => undefined);
      }
```

và thay:

```tsx
      setNewProjectMemberRole('MEMBER');
      setCreatingProject(false);
```

bằng:

```tsx
      setNewProjectMemberRole('MEMBER');
      setCheDoTao('trong');
      setMauDangChon(null);
      setNgayBatDau(ngayBatDauMacDinh());
      setCreatingProject(false);
```

- [ ] **Step 4: Hai thẻ trong hộp thoại**

Thay khối dựng hộp thoại:

```tsx
        <CreateProjectDialog
          banThan={currentUser}
          name={newProjectName}
          description={newProjectDescription}
          memberText={newProjectMemberText}
          memberRole={newProjectMemberRole}
          busy={busyProjectId === 'new'}
```

bằng:

```tsx
        <CreateProjectDialog
          banThan={currentUser}
          name={newProjectName}
          description={newProjectDescription}
          memberText={newProjectMemberText}
          memberRole={newProjectMemberRole}
          busy={busyProjectId === 'new'}
          cheDo={cheDoTao}
          onCheDoChange={setCheDoTao}
          coTheTao={cheDoTao === 'trong' || (Boolean(mauDangChon) && laNgayHopLe(ngayBatDau))}
          noiDungMau={
            <ChonMauDuAn
              danhSach={mauDuAn}
              loi={loiMauDuAn}
              mauDangChon={mauDangChon}
              ngayBatDau={ngayBatDau}
              busy={busyProjectId === 'new'}
              onChonMau={(mau) => {
                setMauDangChon(mau.id);
                // Chưa đặt tên thì lấy tên mẫu, người dùng sửa lại được.
                if (!newProjectName.trim()) setNewProjectName(mau.name);
              }}
              onNgayBatDauChange={setNgayBatDau}
            />
          }
```

Trong `function CreateProjectDialog({`: thêm vào danh sách tham số (sau `  busy,`):

```tsx
  cheDo,
  onCheDoChange,
  noiDungMau,
  coTheTao,
```

và vào kiểu (sau `  busy: boolean;`):

```tsx
  cheDo: CheDoTaoDuAn;
  onCheDoChange: (cheDo: CheDoTaoDuAn) => void;
  noiDungMau: React.ReactNode;
  coTheTao: boolean;
```

Ngay dưới dòng `  const t = useTuDien(tuDienKhongGian).taoMoi;` của hàm này thêm `  const tMau = useTuDien(tuDienMauDuAn);`.

Thay:

```tsx
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-on-surface">
              {t.tenDuAn} <span className="text-error">*</span>
```

bằng:

```tsx
        <div role="tablist" aria-label={tMau.the.nhanNhom} className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
          {(['trong', 'mau'] as const).map((muc) => (
            <button
              key={muc}
              type="button"
              role="tab"
              aria-selected={cheDo === muc}
              onClick={() => onCheDoChange(muc)}
              disabled={busy}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
                cheDo === muc ? 'bg-primary text-white' : 'text-on-surface hover:bg-primary/10'
              }`}
            >
              {tMau.the[muc]}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {cheDo === 'mau' && noiDungMau}
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-on-surface">
              {t.tenDuAn} <span className="text-error">*</span>
```

Thay `            disabled={!name.trim() || busy}` (nút submit của `CreateProjectDialog`) bằng `            disabled={!name.trim() || busy || !coTheTao}`.

- [ ] **Step 5: Kiểm**

Run: `npm run lint && npm run kiem-dich && npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx') && npm run build`
Expected: sạch, PASS, build xong.

- [ ] **Step 6: Commit**

```bash
git add src/components/du-an/ChonMauDuAn.tsx src/views/WorkspaceView.tsx
git commit -m "feat(web): hop thoai tao du an co the Bat dau tu mau, xem truoc viec kem han" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task W8: Thẻ "Bắt đầu nhanh với mẫu" ở Tổng quan và cổng cuối của web

**Files:**
- Create: `src/components/du-an/TheBatDauVoiMau.tsx`
- Modify: `src/views/DashboardView.tsx` (props dòng ~19-21; khối `projects.length === 0` dòng 252-260)
- Modify: `src/App.tsx` (state cạnh `createProjectRequest` ~dòng 205; `handleCreateProjectRequest` ~558-561; `renderView` cho `dashboard` và `projects`)

**Interfaces:**
- Consumes: `tuDienMauDuAn.batDauNhanh` (W1), `CheDoTaoDuAn` (W6), `WorkspaceViewProps.createProjectMode` (W7).
- Produces: `export function TheBatDauVoiMau(props: { onChon: () => void })`; `DashboardViewProps.onCreateFromTemplate?: () => void`.

- [ ] **Step 1: Thẻ**

`src/components/du-an/TheBatDauVoiMau.tsx`:

```tsx
import { LayoutTemplate } from 'lucide-react';
import { useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienMauDuAn } from '../../i18n/tu-dien/mau-du-an';

/** Workspace chưa có dự án nào: mời tạo nhanh từ mẫu thay vì một dự án trống trơn. */
export function TheBatDauVoiMau({ onChon }: { onChon: () => void }) {
  const t = useTuDien(tuDienMauDuAn).batDauNhanh;
  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <LayoutTemplate className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-on-surface">{t.tieuDe}</h4>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{t.moTa}</p>
          <button
            type="button"
            onClick={onChon}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            {t.nut}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Gắn vào Tổng quan**

`src/views/DashboardView.tsx`: thêm `import { TheBatDauVoiMau } from '../components/du-an/TheBatDauVoiMau';`. Thay:

```tsx
interface DashboardViewProps {
  onNavigate?: (view: NavItem) => void;
}
```

bằng:

```tsx
interface DashboardViewProps {
  onNavigate?: (view: NavItem) => void;
  /** Mở hộp thoại tạo dự án ở thẻ "Bắt đầu từ mẫu". */
  onCreateFromTemplate?: () => void;
}
```

Thay `export function DashboardView({ onNavigate }: DashboardViewProps) {` bằng `export function DashboardView({ onNavigate, onCreateFromTemplate }: DashboardViewProps) {`.

Thay:

```tsx
              {projects.length === 0 && (
                <EmptyState
                  compact
                  icon={FolderOpen}
                  title={t.chuaCoDuAn.tieuDe}
                  description={t.chuaCoDuAn.moTa}
                  actionLabel={t.chuaCoDuAn.nut}
                  onAction={() => onNavigate?.('projects')}
                />
              )}
```

bằng:

```tsx
              {projects.length === 0 && (
                <>
                  <EmptyState
                    compact
                    icon={FolderOpen}
                    title={t.chuaCoDuAn.tieuDe}
                    description={t.chuaCoDuAn.moTa}
                    actionLabel={t.chuaCoDuAn.nut}
                    onAction={() => onNavigate?.('projects')}
                  />
                  <TheBatDauVoiMau onChon={() => (onCreateFromTemplate ? onCreateFromTemplate() : onNavigate?.('projects'))} />
                </>
              )}
```

- [ ] **Step 3: Nối trong App**

`src/App.tsx`: thêm `import type { CheDoTaoDuAn } from './lib/mau-du-an';`. Sau `  const [createProjectRequest, setCreateProjectRequest] = useState(0);` thêm:

```tsx
  const [createProjectMode, setCreateProjectMode] = useState<CheDoTaoDuAn>('trong');
```

Thay:

```tsx
  const handleCreateProjectRequest = () => {
    setCreateProjectRequest((request) => request + 1);
    handleNavigate('projects');
  };
```

bằng:

```tsx
  const handleCreateProjectRequest = () => {
    setCreateProjectMode('trong');
    setCreateProjectRequest((request) => request + 1);
    handleNavigate('projects');
  };

  /** Thẻ "Bắt đầu nhanh với mẫu" ở Tổng quan: mở hộp thoại tạo dự án ở thẻ Mẫu. */
  const moTaoDuAnTuMau = () => {
    setCreateProjectMode('mau');
    setCreateProjectRequest((request) => request + 1);
    handleNavigate('projects');
  };
```

Trong `renderView`, thay `        return <DashboardView onNavigate={handleNavigate} />;` bằng `        return <DashboardView onNavigate={handleNavigate} onCreateFromTemplate={moTaoDuAnTuMau} />;` và `        return <WorkspaceView onNavigate={handleNavigate} createProjectRequest={createProjectRequest} />;` bằng `        return <WorkspaceView onNavigate={handleNavigate} createProjectRequest={createProjectRequest} createProjectMode={createProjectMode} />;`.

- [ ] **Step 4: Cổng cuối của web**

```bash
npm run lint
npm run kiem-dich
npx tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx')
npm run build
git diff --stat sua-toan-dien-3 -- package.json
```

Expected: tsc sạch; kiem-dich "0"; mọi bài PASS; build xong; `package.json` chỉ khác hai dòng thư viện QR.

Kiểm bằng mắt (không bắt buộc, chỉ khi có backend cục bộ): chạy backend `be-moi` với Postgres thử và `.env` cục bộ tự soạn (KHÔNG chép `.env` production), rồi `VITE_API_URL=http://localhost:3000 npm run dev`. Không chạy dev server khi `VITE_API_URL` trỏ ra API thật.

- [ ] **Step 5: Commit**

```bash
git add src/components/du-an/TheBatDauVoiMau.tsx src/views/DashboardView.tsx src/App.tsx
git commit -m "feat(web): the Bat dau nhanh voi mau o Tong quan khi workspace chua co du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

# PHẦN 3 — MOBILE (`D:\WEDO_PC\wt\mb-moi`)

Chỉ phần phát được qua OTA. Không sửa `package.json`, `package-lock.json`, `app.json`, `app.config.js`, `eas.json`; không thêm thư viện; không thêm màn hình mới vào `src/app/` (nên không phải sinh lại `.expo/types/router.d.ts`). Kiểm thử: `npx jest <tệp>`; kiểu: `npx tsc --noEmit`. KHÔNG chạy `npx expo lint`.

### Task M0: Tạo worktree mobile và đo mốc

**Files:** không sửa tệp nào trong repo.

**Interfaces:**
- Consumes: nhánh `sua-mobile-dot-2` (đỉnh `330196a`, chỉ đổi `src/` so với `main`).
- Produces: worktree `D:\WEDO_PC\wt\mb-moi` (nhánh `feat/moi-vao-nhom`), `node_modules` là junction sang `D:\WeDo_ChPlay\node_modules`, có `.env` và `.expo\types\router.d.ts`.

- [ ] **Step 1: Tạo worktree (PowerShell)**

```powershell
git -C D:\WeDo_ChPlay worktree add D:\WEDO_PC\wt\mb-moi -b feat/moi-vao-nhom sua-mobile-dot-2
New-Item -ItemType Junction -Path D:\WEDO_PC\wt\mb-moi\node_modules -Target D:\WeDo_ChPlay\node_modules
Copy-Item D:\WEDO_PC\wt\mb-dot2\.env D:\WEDO_PC\wt\mb-moi\.env
New-Item -ItemType Directory -Force D:\WEDO_PC\wt\mb-moi\.expo\types
Copy-Item D:\WEDO_PC\wt\mb-dot2\.expo\types\router.d.ts D:\WEDO_PC\wt\mb-moi\.expo\types\router.d.ts
```

Expected: worktree tạo xong; `Get-Item D:\WEDO_PC\wt\mb-moi\node_modules` có `LinkType = Junction`.

**CẢNH BÁO:** khi dọn worktree này về sau, KHÔNG `Remove-Item -Recurse` và KHÔNG `git worktree remove` khi junction còn đó — cả hai sẽ xoá luôn `D:\WeDo_ChPlay\node_modules` (sự cố 02/10/2026). Luôn chạy `cmd /c rmdir D:\WEDO_PC\wt\mb-moi\node_modules` TRƯỚC.

- [ ] **Step 2: Kiểm mốc (Git Bash, trong `D:/WEDO_PC/wt/mb-moi`)**

```bash
npx tsc --noEmit && npx jest
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: tsc sạch, jest PASS. Ghi lại giá trị vân tay in ra làm MỐC của worktree (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`; nếu worktree cho số khác do đường dẫn hay junction thì vẫn dùng số này làm mốc so sánh ở Task M7 — số chính thức đo lại ở checkout thật của `main` lúc deploy). Không commit.

---

### Task M1: API lời mời

**Files:**
- Create: `src/lib/api/loi-moi.ts`
- Test: `src/lib/api/__tests__/loi-moi.test.ts`

**Interfaces:**
- Consumes: `apiRequest<T>(path, options?)` từ `src/lib/api/client.ts` (thân rỗng → `undefined`).
- Produces:
  - `export interface LoiMoiDuAn { code: string; url: string; expiresAt: string; useCount: number }`
  - `export interface XemTruocLoiMoi { projectName: string; workspaceName: string; leaderName: string; memberCount: number; expiresAt: string }`
  - `export interface KetQuaThamGia { projectId: string; workspaceId: string; alreadyMember: boolean }`
  - `layLoiMoi(projectId): Promise<LoiMoiDuAn | null>`, `taoLoiMoi(projectId): Promise<LoiMoiDuAn>`, `tatLoiMoi(projectId): Promise<{ ok: boolean }>`, `xemTruocLoiMoi(ma): Promise<XemTruocLoiMoi>`, `thamGiaLoiMoi(ma): Promise<KetQuaThamGia>`

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/api/__tests__/loi-moi.test.ts`:

```ts
import { apiRequest } from '../client';
import { layLoiMoi, taoLoiMoi, tatLoiMoi, thamGiaLoiMoi, xemTruocLoiMoi } from '../loi-moi';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API lời mời vào nhóm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET link mời của dự án; thân rỗng nghĩa là chưa có link', async () => {
    mockedRequest.mockResolvedValueOnce(undefined as never);

    await expect(layLoiMoi('p 1')).resolves.toBeNull();
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p%201/invite');
  });

  it('POST tạo link mới, DELETE tắt link', async () => {
    await taoLoiMoi('p1');
    await tatLoiMoi('p1');

    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/projects/p1/invite', { method: 'POST' });
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/projects/p1/invite', { method: 'DELETE' });
  });

  it('xem trước và tham gia theo mã', async () => {
    await xemTruocLoiMoi('7K3M9QXA');
    await thamGiaLoiMoi('7K3M9QXA');

    expect(mockedRequest).toHaveBeenNthCalledWith(1, '/invites/7K3M9QXA');
    expect(mockedRequest).toHaveBeenNthCalledWith(2, '/invites/7K3M9QXA/join', { method: 'POST' });
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/lib/api/__tests__/loi-moi.test.ts`
Expected: FAIL — "Cannot find module '../loi-moi'".

- [ ] **Step 3: Viết mã**

`src/lib/api/loi-moi.ts`:

```ts
import { apiRequest } from './client';

/** Link mời đang dùng của một dự án. Chỉ Leader và chủ không gian gọi được. */
export interface LoiMoiDuAn {
  code: string;
  url: string;
  expiresAt: string;
  useCount: number;
}

/** Đủ để biết mình được mời vào đâu; máy chủ không gửi email hay id của ai. */
export interface XemTruocLoiMoi {
  projectName: string;
  workspaceName: string;
  leaderName: string;
  memberCount: number;
  expiresAt: string;
}

export interface KetQuaThamGia {
  projectId: string;
  workspaceId: string;
  alreadyMember: boolean;
}

/** Chưa có link còn hiệu lực thì máy chủ trả thân rỗng. */
export async function layLoiMoi(projectId: string): Promise<LoiMoiDuAn | null> {
  const ketQua = await apiRequest<LoiMoiDuAn | null | undefined>(
    `/projects/${encodeURIComponent(projectId)}/invite`,
  );
  return ketQua ?? null;
}

/** Tạo link mới; link cũ hết dùng được ngay. */
export function taoLoiMoi(projectId: string): Promise<LoiMoiDuAn> {
  return apiRequest<LoiMoiDuAn>(`/projects/${encodeURIComponent(projectId)}/invite`, {
    method: 'POST',
  });
}

export function tatLoiMoi(projectId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/projects/${encodeURIComponent(projectId)}/invite`, {
    method: 'DELETE',
  });
}

export function xemTruocLoiMoi(ma: string): Promise<XemTruocLoiMoi> {
  return apiRequest<XemTruocLoiMoi>(`/invites/${encodeURIComponent(ma)}`);
}

export function thamGiaLoiMoi(ma: string): Promise<KetQuaThamGia> {
  return apiRequest<KetQuaThamGia>(`/invites/${encodeURIComponent(ma)}/join`, {
    method: 'POST',
  });
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/lib/api/__tests__/loi-moi.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/loi-moi.ts src/lib/api/__tests__/loi-moi.test.ts
git commit -m "feat(mobile): API xem, tao, tat link moi va tham gia bang ma" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M2: Ô mã tự định dạng, câu lỗi theo mã, nội dung chia sẻ

**Files:**
- Create: `src/lib/loi-moi.ts`
- Test: `src/lib/__tests__/loi-moi.test.ts`

**Interfaces:**
- Consumes: `ApiError` (có `status`, `code`) từ `src/lib/api/client.ts`.
- Produces:
  - `export const DO_DAI_MA_MOI = 8`
  - `export function dinhDangOMaMoi(nhap: string): string`
  - `export function maGuiDi(oNhap: string): string | null`
  - `export function hienThiMaMoi(ma: string): string`
  - `export function cauLoiMoi(loi: unknown): string`
  - `export function noiDungChiaSe(tenDuAn: string, loiMoi: { url: string; code: string }): string`
  - `export function hienThiHanMoi(iso: string): string` (`HH:mm dd/MM/yyyy` giờ Việt Nam)

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/lib/__tests__/loi-moi.test.ts`:

```ts
import { ApiError } from '../api/client';
import {
  cauLoiMoi,
  dinhDangOMaMoi,
  hienThiHanMoi,
  maGuiDi,
  noiDungChiaSe,
} from '../loi-moi';

describe('dinhDangOMaMoi', () => {
  it('tự viết hoa và tự thêm gạch giữa khi gõ', () => {
    expect(dinhDangOMaMoi('7k3')).toBe('7K3');
    expect(dinhDangOMaMoi('7k3m')).toBe('7K3M');
    expect(dinhDangOMaMoi('7k3m9')).toBe('7K3M-9');
    expect(dinhDangOMaMoi('7k3m9qxa')).toBe('7K3M-9QXA');
  });

  it('dán mã có khoảng trắng hay gạch vẫn ra đúng dạng, cắt ở 8 ký tự', () => {
    expect(dinhDangOMaMoi(' 7k3m - 9qxa ')).toBe('7K3M-9QXA');
    expect(dinhDangOMaMoi('7K3M-9QXA-THUA')).toBe('7K3M-9QXA');
  });

  it('xoá lùi qua dấu gạch không bị kẹt', () => {
    expect(dinhDangOMaMoi('7K3M-')).toBe('7K3M');
  });
});

describe('maGuiDi', () => {
  it('bỏ gạch; chưa đủ 8 ký tự thì chưa gửi', () => {
    expect(maGuiDi('7K3M-9QXA')).toBe('7K3M9QXA');
    expect(maGuiDi('7K3M-9Q')).toBeNull();
  });
});

describe('cauLoiMoi', () => {
  it.each([
    ['INVITE_NOT_FOUND', 404, 'Mã mời không đúng hoặc không còn dùng được.'],
    ['INVITE_EXPIRED', 410, 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.'],
    ['INVITE_REVOKED', 410, 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.'],
    ['INVITE_PROJECT_CLOSED', 410, 'Dự án này đã đóng, không nhận thêm thành viên.'],
  ])('dịch theo mã %s, không theo câu máy chủ gửi', (ma, status, cau) => {
    expect(cauLoiMoi(new ApiError('Not Found', status, ma))).toBe(cau);
  });

  it('thử quá nhanh (429) thì bảo đợi', () => {
    expect(cauLoiMoi(new ApiError('Bạn thao tác quá nhanh.', 429))).toBe(
      'Bạn thử quá nhiều lần. Đợi một phút rồi thử lại.',
    );
  });

  it('lỗi khác giữ câu của lớp gọi mạng; lỗi lạ có câu chung', () => {
    expect(cauLoiMoi(new ApiError('Không thể kết nối máy chủ.', 0))).toBe('Không thể kết nối máy chủ.');
    expect(cauLoiMoi(new Error('x'))).toBe('Có lỗi xảy ra. Thử lại sau ít phút.');
  });
});

describe('noiDungChiaSe', () => {
  it('đúng câu của spec, mã chia đôi bằng gạch', () => {
    expect(
      noiDungChiaSe('Đồ án EXE', { url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA', code: '7K3M9QXA' }),
    ).toBe(
      'Tham gia dự án Đồ án EXE trên WeDo: https://wedofpt.com.vn/#/moi/7K3M9QXA. Hoặc nhập mã 7K3M-9QXA trong app.',
    );
  });
});

describe('hienThiHanMoi', () => {
  it('giờ Việt Nam, không phụ thuộc múi giờ của máy', () => {
    expect(hienThiHanMoi('2026-10-09T03:30:00.000Z')).toBe('10:30 09/10/2026');
    expect(hienThiHanMoi('khong-phai-ngay')).toBe('');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/lib/__tests__/loi-moi.test.ts`
Expected: FAIL — "Cannot find module '../loi-moi'".

- [ ] **Step 3: Viết mã**

`src/lib/loi-moi.ts`:

```ts
import { ApiError } from './api/client';

/** Mã mời có 8 ký tự (máy chủ: src/projects/loi-moi/ma-moi.ts). */
export const DO_DAI_MA_MOI = 8;

/**
 * Định dạng ô "Nhập mã mời" ngay khi gõ: viết hoa, bỏ mọi ký tự không phải chữ
 * hay số, tối đa 8 ký tự, tự thêm gạch giữa (7K3M-9QXA).
 *
 * Không lọc 0/O/1/I: máy chủ trả "mã không đúng" — rõ ràng hơn một ô nuốt mất
 * phím người dùng vừa gõ.
 */
export function dinhDangOMaMoi(nhap: string): string {
  const gon = nhap.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, DO_DAI_MA_MOI);
  return gon.length > 4 ? `${gon.slice(0, 4)}-${gon.slice(4)}` : gon;
}

/** Mã gửi lên máy chủ. Chưa đủ 8 ký tự thì `null` — nút Xem lời mời còn tắt. */
export function maGuiDi(oNhap: string): string | null {
  const gon = oNhap.replace(/-/g, '');
  return gon.length === DO_DAI_MA_MOI ? gon : null;
}

export function hienThiMaMoi(ma: string): string {
  return ma.length === DO_DAI_MA_MOI ? `${ma.slice(0, 4)}-${ma.slice(4)}` : ma;
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  INVITE_NOT_FOUND: 'Mã mời không đúng hoặc không còn dùng được.',
  INVITE_EXPIRED: 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
  INVITE_REVOKED: 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.',
  INVITE_PROJECT_CLOSED: 'Dự án này đã đóng, không nhận thêm thành viên.',
};

export function cauLoiMoi(loi: unknown): string {
  if (loi instanceof ApiError) {
    if (loi.code && CAU_THEO_MA[loi.code]) return CAU_THEO_MA[loi.code];
    if (loi.status === 429) return 'Bạn thử quá nhiều lần. Đợi một phút rồi thử lại.';
    return loi.message;
  }
  return 'Có lỗi xảy ra. Thử lại sau ít phút.';
}

/** Nội dung bảng chia sẻ của hệ điều hành (spec mục 3.4). */
export function noiDungChiaSe(tenDuAn: string, loiMoi: { url: string; code: string }): string {
  return `Tham gia dự án ${tenDuAn} trên WeDo: ${loiMoi.url}. Hoặc nhập mã ${hienThiMaMoi(loiMoi.code)} trong app.`;
}

const LECH_VN_MS = 7 * 60 * 60 * 1000;
const haiSo = (so: number) => String(so).padStart(2, '0');

/** `HH:mm dd/MM/yyyy` theo giờ Việt Nam (UTC+7 quanh năm), bất kể máy đặt múi giờ nào. */
export function hienThiHanMoi(iso: string): string {
  const luc = new Date(iso);
  if (Number.isNaN(luc.getTime())) return '';
  const vn = new Date(luc.getTime() + LECH_VN_MS);
  return `${haiSo(vn.getUTCHours())}:${haiSo(vn.getUTCMinutes())} ${haiSo(vn.getUTCDate())}/${haiSo(
    vn.getUTCMonth() + 1,
  )}/${vn.getUTCFullYear()}`;
}
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/lib/__tests__/loi-moi.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/loi-moi.ts src/lib/__tests__/loi-moi.test.ts
git commit -m "feat(mobile): o ma moi tu dinh dang, dich loi theo ma va noi dung chia se" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M3: Bảng "Nhập mã mời"

**Files:**
- Create: `src/components/chat/NhapMaMoiSheet.tsx`
- Test: `src/components/chat/__tests__/NhapMaMoiSheet.test.tsx`

**Interfaces:**
- Consumes: `xemTruocLoiMoi`, `thamGiaLoiMoi`, `KetQuaThamGia`, `XemTruocLoiMoi` (M1); `dinhDangOMaMoi`, `maGuiDi`, `cauLoiMoi` (M2); `Button` (`src/components/ui/Button.tsx`: `label`, `onPress`, `variant?`, `loading?`, `disabled?`, `testID?`).
- Produces: `export function NhapMaMoiSheet(props: { visible: boolean; onDismiss: () => void; onDaThamGia: (ketQua: KetQuaThamGia) => void })`. testID: `o-ma-moi`, `nut-xem-loi-moi`, `xem-truoc-loi-moi`, `nut-tham-gia`, `loi-ma-moi`.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/components/chat/__tests__/NhapMaMoiSheet.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NhapMaMoiSheet } from '../NhapMaMoiSheet';
import { ApiError } from '../../../lib/api/client';
import { thamGiaLoiMoi, xemTruocLoiMoi } from '../../../lib/api/loi-moi';

jest.mock('../../../lib/api/loi-moi');

const XEM_TRUOC = {
  projectName: 'Đồ án EXE',
  workspaceName: 'Nhóm 3',
  leaderName: 'Lan',
  memberCount: 4,
  expiresAt: '2026-10-09T03:30:00.000Z',
};

function dung(onDaThamGia = jest.fn()) {
  return render(<NhapMaMoiSheet visible onDismiss={jest.fn()} onDaThamGia={onDaThamGia} />);
}

beforeEach(() => jest.clearAllMocks());

it('ô mã tự viết hoa và thêm gạch giữa khi gõ', async () => {
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9q');

  expect(man.getByTestId('o-ma-moi').props.value).toBe('7K3M-9Q');
});

it('chưa đủ 8 ký tự thì chưa hỏi máy chủ', async () => {
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9q');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));

  expect(xemTruocLoiMoi).not.toHaveBeenCalled();
});

it('xem trước rồi tham gia: báo đúng kết quả ra ngoài', async () => {
  (xemTruocLoiMoi as jest.Mock).mockResolvedValue(XEM_TRUOC);
  (thamGiaLoiMoi as jest.Mock).mockResolvedValue({
    projectId: 'p-moi',
    workspaceId: 'w2',
    alreadyMember: false,
  });
  const onDaThamGia = jest.fn();
  const man = await dung(onDaThamGia);

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m-9qxa');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
  await waitFor(() => man.getByText('Đồ án EXE'));

  expect(xemTruocLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
  expect(man.getByText('Không gian Nhóm 3 · Leader Lan · 4 thành viên')).toBeTruthy();

  await fireEvent.press(man.getByTestId('nut-tham-gia'));

  await waitFor(() =>
    expect(onDaThamGia).toHaveBeenCalledWith({ projectId: 'p-moi', workspaceId: 'w2', alreadyMember: false }),
  );
  expect(thamGiaLoiMoi).toHaveBeenCalledWith('7K3M9QXA');
});

it('link hết hạn: hiện câu dịch theo mã lỗi', async () => {
  (xemTruocLoiMoi as jest.Mock).mockRejectedValue(new ApiError('Gone', 410, 'INVITE_EXPIRED'));
  const man = await dung();

  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7K3M9QXA');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));

  await waitFor(() =>
    expect(man.getByTestId('loi-ma-moi').props.children).toBe(
      'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
    ),
  );
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/components/chat/__tests__/NhapMaMoiSheet.test.tsx`
Expected: FAIL — "Cannot find module '../NhapMaMoiSheet'".

- [ ] **Step 3: Viết mã**

`src/components/chat/NhapMaMoiSheet.tsx`:

```tsx
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../ui/Button';
import {
  thamGiaLoiMoi,
  xemTruocLoiMoi,
  type KetQuaThamGia,
  type XemTruocLoiMoi,
} from '../../lib/api/loi-moi';
import { cauLoiMoi, dinhDangOMaMoi, maGuiDi } from '../../lib/loi-moi';
import {
  colors,
  fontSize,
  lineHeight,
  radius,
  scaleWithFont,
  shadows,
  spacing,
} from '../../theme/tokens';

interface NhapMaMoiSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onDaThamGia: (ketQua: KetQuaThamGia) => void;
}

/**
 * Vào nhóm bằng mã Leader gửi (bản này chưa mở được link hay quét QR — phần đó
 * chờ bản build mới). Gõ mã → xem trước dự án → Tham gia.
 */
export function NhapMaMoiSheet({ visible, onDismiss, onDaThamGia }: NhapMaMoiSheetProps) {
  const [oNhap, setONhap] = useState('');
  const [xemTruoc, setXemTruoc] = useState<XemTruocLoiMoi | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState<'xem' | 'vao' | null>(null);
  const ma = maGuiDi(oNhap);

  const datLai = () => {
    setONhap('');
    setXemTruoc(null);
    setLoi(null);
    setDang(null);
  };

  const dong = () => {
    datLai();
    onDismiss();
  };

  const xem = async () => {
    if (!ma || dang) return;
    setDang('xem');
    setLoi(null);
    try {
      setXemTruoc(await xemTruocLoiMoi(ma));
    } catch (e) {
      setLoi(cauLoiMoi(e));
    } finally {
      setDang(null);
    }
  };

  const vao = async () => {
    if (!ma || dang) return;
    setDang('vao');
    setLoi(null);
    try {
      const ketQua = await thamGiaLoiMoi(ma);
      datLai();
      onDaThamGia(ketQua);
    } catch (e) {
      setLoi(cauLoiMoi(e));
      setDang(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dong}>
      <Pressable style={styles.nen} onPress={dong} accessibilityLabel="Đóng" />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        <Text style={styles.tieuDe}>Nhập mã mời</Text>
        <Text style={styles.moTa}>Mã gồm 8 ký tự Leader gửi kèm link mời, ví dụ 7K3M-9QXA.</Text>

        <TextInput
          testID="o-ma-moi"
          accessibilityLabel="Mã mời"
          value={oNhap}
          onChangeText={(giaTri) => {
            setONhap(dinhDangOMaMoi(giaTri));
            setXemTruoc(null);
            setLoi(null);
          }}
          placeholder="XXXX-XXXX"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
          maxLength={9}
          style={styles.o}
        />

        {loi ? (
          <Text testID="loi-ma-moi" style={styles.loi}>
            {loi}
          </Text>
        ) : null}

        {xemTruoc ? (
          <View testID="xem-truoc-loi-moi" style={styles.theDuAn}>
            <Text style={styles.tenDuAn}>{xemTruoc.projectName}</Text>
            <Text style={styles.chiTiet}>
              {`Không gian ${xemTruoc.workspaceName} · Leader ${xemTruoc.leaderName} · ${xemTruoc.memberCount} thành viên`}
            </Text>
          </View>
        ) : null}

        {xemTruoc ? (
          <Button testID="nut-tham-gia" label="Tham gia" onPress={() => void vao()} loading={dang === 'vao'} />
        ) : (
          <Button
            testID="nut-xem-loi-moi"
            label="Xem lời mời"
            onPress={() => void xem()}
            loading={dang === 'xem'}
            disabled={!ma}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
    boxShadow: shadows.card,
  },
  tay: {
    alignSelf: 'center',
    width: scaleWithFont(44),
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  tieuDe: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: '700', color: colors.text },
  moTa: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted },
  // Ô có chữ: `minHeight` để chữ phóng to thì ô cao theo.
  o: {
    minHeight: scaleWithFont(52),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  loi: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.danger },
  theDuAn: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  tenDuAn: { fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: '700', color: colors.text },
  chiTiet: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted, marginTop: spacing.xxs },
});
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/components/chat/__tests__/NhapMaMoiSheet.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/NhapMaMoiSheet.tsx src/components/chat/__tests__/NhapMaMoiSheet.test.tsx
git commit -m "feat(mobile): bang Nhap ma moi, xem truoc du an roi tham gia" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M4: Nút "Nhập mã mời" ở Trò chuyện → Dự án và mở đúng chat sau khi vào

**Files:**
- Modify: `src/app/(tabs)/chat/index.tsx` (import; `useWorkspace` dòng ~44; state ~48; sau `openProject` ~207-210; `FlatList testID="ds-du-an"` ~399-402; trước `<NewConversationSheet` ~455)
- Test: `src/app/(tabs)/chat/__tests__/nhap-ma-moi.test.tsx` (tạo)

**Interfaces:**
- Consumes: `NhapMaMoiSheet` (M3), `KetQuaThamGia` (M1), `saveActiveWorkspaceId(id)` từ `src/lib/auth/token-storage.ts`, `useWorkspace().refresh(): Promise<void>` (nạp lại danh sách không gian, chọn theo id đã lưu).
- Produces: testID `nut-nhap-ma-moi`. Sau khi tham gia: lưu `workspaceId` làm không gian đang chọn → `refresh()` → làm mới `['projects']` → `router.push('/chat/<projectId>')`.

Vì sao lưu id rồi `refresh()` chứ không `switchTo`: `switchTo` chỉ tìm trong danh sách đang có, mà không gian vừa vào (người lạ mời) chưa nằm trong đó; `refresh()` đọc id đã lưu qua `pickActiveWorkspace` nên chọn đúng không gian mới.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/app/(tabs)/chat/__tests__/nhap-ma-moi.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManDanhSachChat from '../index';
import { listProjects } from '../../../../lib/api/projects';
import { listFriends } from '../../../../lib/api/friends';
import { thamGiaLoiMoi, xemTruocLoiMoi } from '../../../../lib/api/loi-moi';
import { saveActiveWorkspaceId } from '../../../../lib/auth/token-storage';
import { useAuth } from '../../../../lib/auth/auth-context';
import { useSocket } from '../../../../lib/socket/socket-context';
import { useWorkspace } from '../../../../lib/workspace/workspace-context';
import { TEST_SAFE_AREA } from '../../../../test-utils/render';

jest.mock('../../../../lib/api/chat');
jest.mock('../../../../lib/api/projects');
jest.mock('../../../../lib/api/friends');
jest.mock('../../../../lib/api/direct-chat');
jest.mock('../../../../lib/api/workspaces');
jest.mock('../../../../lib/api/loi-moi');
jest.mock('../../../../lib/auth/token-storage', () => ({
  ...jest.requireActual('../../../../lib/auth/token-storage'),
  saveActiveWorkspaceId: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../lib/auth/auth-context');
jest.mock('../../../../lib/socket/socket-context');
jest.mock('../../../../lib/workspace/workspace-context');
jest.mock('../../../../lib/version/use-phien-ban', () => ({
  usePhienBan: () => ({ muc: 'moi-nhat', latest: '', notes: '' }),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

let queryClient: QueryClient;
const refresh = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', fullName: 'Lê Hữu Đại' } });
  (useSocket as jest.Mock).mockReturnValue({ onlineUserIds: new Set() });
  (useWorkspace as jest.Mock).mockReturnValue({
    active: { id: 'w1', name: 'Lớp' },
    workspaces: [],
    switchTo: jest.fn(),
    refresh,
  });
  (listProjects as jest.Mock).mockResolvedValue([]);
  (listFriends as jest.Mock).mockResolvedValue({ friends: [], incoming: [], outgoing: [] });
  (xemTruocLoiMoi as jest.Mock).mockResolvedValue({
    projectName: 'Đồ án EXE',
    workspaceName: 'Nhóm 3',
    leaderName: 'Lan',
    memberCount: 4,
    expiresAt: '2026-10-09T03:30:00.000Z',
  });
  (thamGiaLoiMoi as jest.Mock).mockResolvedValue({ projectId: 'p-moi', workspaceId: 'w2', alreadyMember: false });
});

afterEach(() => queryClient.clear());

it('nhập mã, tham gia xong: chọn đúng không gian, tải lại, mở chat dự án vừa vào', async () => {
  const man = await render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManDanhSachChat />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

  await waitFor(() => man.getByTestId('nut-nhap-ma-moi'));
  await fireEvent.press(man.getByTestId('nut-nhap-ma-moi'));
  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9qxa');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
  await waitFor(() => man.getByText('Đồ án EXE'));
  await fireEvent.press(man.getByTestId('nut-tham-gia'));

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/chat/p-moi'));
  expect(saveActiveWorkspaceId).toHaveBeenCalledWith('w2');
  expect(refresh).toHaveBeenCalled();
  // Lưu không gian TRƯỚC khi tải lại, để `refresh` chọn đúng không gian mới.
  expect((saveActiveWorkspaceId as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
    refresh.mock.invocationCallOrder[0],
  );
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest "src/app/\(tabs\)/chat/__tests__/nhap-ma-moi.test.tsx"`
Expected: FAIL — không tìm thấy testID `nut-nhap-ma-moi`.

- [ ] **Step 3: Viết mã**

Trong `src/app/(tabs)/chat/index.tsx`:

1. Thêm import (cạnh các import components/lib):

```tsx
import { NhapMaMoiSheet } from '../../../components/chat/NhapMaMoiSheet';
import type { KetQuaThamGia } from '../../../lib/api/loi-moi';
import { saveActiveWorkspaceId } from '../../../lib/auth/token-storage';
```

2. Thay `  const { active, workspaces, switchTo } = useWorkspace();` bằng `  const { active, workspaces, switchTo, refresh } = useWorkspace();`.

3. Sau `  const [taoMoiOpen, setTaoMoiOpen] = useState(false);` thêm `  const [nhapMaOpen, setNhapMaOpen] = useState(false);`.

4. Ngay sau khối `const openProject = useCallback(…);` thêm:

```tsx
  /*
    Vừa vào nhóm bằng mã: chọn đúng không gian chứa dự án rồi mở chat của nó.
    Lưu id trước rồi nạp lại danh sách — `switchTo` không dùng được vì không
    gian của người lạ mời chưa có trong danh sách đang giữ.
  */
  const daThamGia = useCallback(
    async (ketQua: KetQuaThamGia) => {
      setNhapMaOpen(false);
      await saveActiveWorkspaceId(ketQua.workspaceId);
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/chat/${ketQua.projectId}`);
    },
    [queryClient, refresh, router],
  );
```

5. Thay:

```tsx
          <FlatList
            testID="ds-du-an"
            data={visible}
```

bằng:

```tsx
          <FlatList
            testID="ds-du-an"
            data={visible}
            ListHeaderComponent={
              <Pressable
                testID="nut-nhap-ma-moi"
                accessibilityRole="button"
                onPress={() => setNhapMaOpen(true)}
                style={styles.nutNhanTinMoi}
              >
                <Ionicons name="enter-outline" size={18} color={colors.primary} />
                <Text style={styles.nutNhanTinMoiChu}>Nhập mã mời</Text>
              </Pressable>
            }
```

6. Ngay trước `      <NewConversationSheet` thêm:

```tsx
      <NhapMaMoiSheet
        visible={nhapMaOpen}
        onDismiss={() => setNhapMaOpen(false)}
        onDaThamGia={(ketQua) => void daThamGia(ketQua)}
      />

```

- [ ] **Step 4: Chạy lại, kể cả bài cũ của màn này**

Run: `npx jest "src/app/\(tabs\)/chat/__tests__" && npx tsc --noEmit`
Expected: PASS — gồm `danh-sach-chat.test.tsx` (mock `useWorkspace` ở đó không có `refresh`; màn chỉ gọi nó sau khi tham gia nên vẫn xanh).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(tabs)/chat/index.tsx" "src/app/(tabs)/chat/__tests__/nhap-ma-moi.test.tsx"
git commit -m "feat(mobile): nut Nhap ma moi o Tro chuyen, vao xong mo dung chat du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M5: Leader chia sẻ, tạo lại, tắt link từ đầu màn chat dự án

**Files:**
- Create: `src/components/chat/MoiVaoNhomSheet.tsx`, `src/components/chat/NutMoiVaoNhom.tsx`
- Modify: `src/app/(tabs)/chat/[projectId].tsx` (sau dòng `const duocDungAI = …` ~673; `GradientHeader` chính ~811)
- Test: `src/components/chat/__tests__/NutMoiVaoNhom.test.tsx`

**Interfaces:**
- Consumes: `layLoiMoi`, `taoLoiMoi`, `tatLoiMoi`, `LoiMoiDuAn` (M1); `cauLoiMoi`, `noiDungChiaSe`, `hienThiMaMoi`, `hienThiHanMoi` (M2); `laLeaderDuAn(meId, project?, workspace?)` từ `src/lib/tasks/task-permissions.ts`; `Share.share`, `Alert.alert` của React Native.
- Produces:
  - `export function NutMoiVaoNhom(props: { meId: string; project: Project; workspace?: Workspace | null })` — `null` nếu không phải Leader/chủ không gian.
  - `export function MoiVaoNhomSheet(props: { visible: boolean; projectId: string; projectName: string; onDismiss: () => void })`.
  - testID: `nut-moi-vao-nhom`, `ma-moi-hien-tai`, `nut-chia-se-loi-moi`, `nut-tao-link-moi`, `nut-tat-link`.

Đầu màn chat dự án chưa có menu; `Alert.alert` trên Android chỉ có tối đa 3 nút, nên "menu" là một nút biểu tượng ở `GradientHeader.right` mở bảng trượt có ba thao tác.

- [ ] **Step 1: Viết bài kiểm thất bại**

`src/components/chat/__tests__/NutMoiVaoNhom.test.tsx`:

```tsx
import React from 'react';
import { Alert, Share } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { NutMoiVaoNhom } from '../NutMoiVaoNhom';
import { layLoiMoi, taoLoiMoi, tatLoiMoi } from '../../../lib/api/loi-moi';
import type { Project, Workspace } from '../../../lib/types';

jest.mock('../../../lib/api/loi-moi');

const LOI_MOI = {
  code: '7K3M9QXA',
  url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA',
  expiresAt: '2026-10-09T03:30:00.000Z',
  useCount: 2,
};

function duAn(vaiTro: Record<string, 'LEADER' | 'MEMBER'>): Project {
  return {
    id: 'p1',
    name: 'Đồ án EXE',
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '',
    updatedAt: '',
    members: Object.entries(vaiTro).map(([id, role]) => ({
      id: `m-${id}`,
      role,
      user: { id, fullName: id, email: `${id}@wedo.vn` },
    })),
  } as Project;
}

const KHONG_GIAN = { id: 'w1', name: 'Lớp', ownerId: 'u-chu', createdAt: '', updatedAt: '' } as Workspace;

beforeEach(() => jest.clearAllMocks());

it('thành viên thường không thấy nút mời', async () => {
  const man = await render(
    <NutMoiVaoNhom meId="u-tv" project={duAn({ 'u-tv': 'MEMBER' })} workspace={KHONG_GIAN} />,
  );
  expect(man.queryByTestId('nut-moi-vao-nhom')).toBeNull();
});

it('Leader thấy nút mời', async () => {
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );
  expect(man.getByTestId('nut-moi-vao-nhom')).toBeTruthy();
});

it('chủ không gian thấy nút mời dù không ở trong dự án', async () => {
  const man = await render(<NutMoiVaoNhom meId="u-chu" project={duAn({})} workspace={KHONG_GIAN} />);
  expect(man.getByTestId('nut-moi-vao-nhom')).toBeTruthy();
});

it('chưa có link: Chia sẻ tạo link rồi mở bảng chia sẻ với đúng nội dung', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(null);
  (taoLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  const chiaSe = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => expect(layLoiMoi).toHaveBeenCalledWith('p1'));
  await fireEvent.press(man.getByTestId('nut-chia-se-loi-moi'));

  await waitFor(() =>
    expect(chiaSe).toHaveBeenCalledWith({
      message:
        'Tham gia dự án Đồ án EXE trên WeDo: https://wedofpt.com.vn/#/moi/7K3M9QXA. Hoặc nhập mã 7K3M-9QXA trong app.',
    }),
  );
  expect(taoLoiMoi).toHaveBeenCalledWith('p1');
  chiaSe.mockRestore();
});

it('có link: hiện mã; Tắt link hỏi xác nhận rồi mới gọi máy chủ', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  (tatLoiMoi as jest.Mock).mockResolvedValue({ ok: true });
  const hoi = jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => expect(man.getByTestId('ma-moi-hien-tai').props.children).toBe('7K3M-9QXA'));
  await fireEvent.press(man.getByTestId('nut-tat-link'));

  await waitFor(() => expect(tatLoiMoi).toHaveBeenCalledWith('p1'));
  expect(hoi).toHaveBeenCalledTimes(1);
  hoi.mockRestore();
});

it('có link: Tạo link mới hỏi xác nhận rồi thay mã đang hiện', async () => {
  (layLoiMoi as jest.Mock).mockResolvedValue(LOI_MOI);
  (taoLoiMoi as jest.Mock).mockResolvedValue({ ...LOI_MOI, code: 'ABCD2345', useCount: 0 });
  const hoi = jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nut?.find((n) => n.style === 'destructive')?.onPress?.();
  });
  const man = await render(
    <NutMoiVaoNhom meId="u-leader" project={duAn({ 'u-leader': 'LEADER' })} workspace={KHONG_GIAN} />,
  );

  await fireEvent.press(man.getByTestId('nut-moi-vao-nhom'));
  await waitFor(() => man.getByTestId('ma-moi-hien-tai'));
  await fireEvent.press(man.getByTestId('nut-tao-link-moi'));

  await waitFor(() => expect(man.getByTestId('ma-moi-hien-tai').props.children).toBe('ABCD-2345'));
  hoi.mockRestore();
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/components/chat/__tests__/NutMoiVaoNhom.test.tsx`
Expected: FAIL — "Cannot find module '../NutMoiVaoNhom'".

- [ ] **Step 3: Viết bảng mời**

`src/components/chat/MoiVaoNhomSheet.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '../ui/Button';
import { layLoiMoi, taoLoiMoi, tatLoiMoi, type LoiMoiDuAn } from '../../lib/api/loi-moi';
import { cauLoiMoi, hienThiHanMoi, hienThiMaMoi, noiDungChiaSe } from '../../lib/loi-moi';
import { colors, fontSize, lineHeight, radius, scaleWithFont, shadows, spacing } from '../../theme/tokens';

interface MoiVaoNhomSheetProps {
  visible: boolean;
  projectId: string;
  projectName: string;
  onDismiss: () => void;
}

/**
 * Leader chia sẻ link mời qua bảng chia sẻ của hệ điều hành (Zalo, Messenger…),
 * tạo link mới hay tắt link. Hiện và quét QR trong app chờ bản build mới.
 */
export function MoiVaoNhomSheet({ visible, projectId, projectName, onDismiss }: MoiVaoNhomSheetProps) {
  const [loiMoi, setLoiMoi] = useState<LoiMoiDuAn | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [dang, setDang] = useState<'chia-se' | 'tao' | 'tat' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let huy = false;
    setDangTai(true);
    setLoi(null);
    layLoiMoi(projectId)
      .then(
        (ketQua) => {
          if (!huy) setLoiMoi(ketQua);
        },
        (e: unknown) => {
          if (!huy) setLoi(cauLoiMoi(e));
        },
      )
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [visible, projectId]);

  const chiaSe = async () => {
    setDang('chia-se');
    setLoi(null);
    try {
      // Chưa có link thì tạo luôn: Leader bấm "Chia sẻ" là muốn mời ngay.
      const hienCo = loiMoi ?? (await taoLoiMoi(projectId));
      setLoiMoi(hienCo);
      await Share.share({ message: noiDungChiaSe(projectName, hienCo) });
    } catch (e) {
      setLoi(cauLoiMoi(e));
    } finally {
      setDang(null);
    }
  };

  const lamTaoMoi = async () => {
    setDang('tao');
    setLoi(null);
    try {
      setLoiMoi(await taoLoiMoi(projectId));
    } catch (e) {
      setLoi(cauLoiMoi(e));
    } finally {
      setDang(null);
    }
  };

  const taoMoi = () => {
    if (!loiMoi) {
      void lamTaoMoi();
      return;
    }
    Alert.alert('Tạo link mới?', 'Link và mã cũ sẽ không dùng được nữa.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Tạo link mới', style: 'destructive', onPress: () => void lamTaoMoi() },
    ]);
  };

  const lamTat = async () => {
    setDang('tat');
    setLoi(null);
    try {
      await tatLoiMoi(projectId);
      setLoiMoi(null);
    } catch (e) {
      setLoi(cauLoiMoi(e));
    } finally {
      setDang(null);
    }
  };

  const tat = () => {
    Alert.alert('Tắt link mời?', 'Không ai vào được bằng link hay mã này nữa.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Tắt link', style: 'destructive', onPress: () => void lamTat() },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.nen} onPress={onDismiss} accessibilityLabel="Đóng" />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        <Text style={styles.tieuDe}>Mời vào nhóm</Text>
        <Text style={styles.moTa}>Ai có link hoặc mã sẽ vào thẳng dự án với vai trò Thành viên.</Text>

        {dangTai ? (
          <ActivityIndicator color={colors.primary} />
        ) : loiMoi ? (
          <View style={styles.theMa}>
            <Text testID="ma-moi-hien-tai" style={styles.ma}>
              {hienThiMaMoi(loiMoi.code)}
            </Text>
            <Text style={styles.chiTiet}>
              {`Hết hạn ${hienThiHanMoi(loiMoi.expiresAt)} · ${loiMoi.useCount} người đã tham gia`}
            </Text>
          </View>
        ) : (
          <Text style={styles.chiTiet}>Dự án chưa có link mời đang dùng.</Text>
        )}

        {loi ? <Text style={styles.loi}>{loi}</Text> : null}

        <Button
          testID="nut-chia-se-loi-moi"
          label="Chia sẻ link mời"
          onPress={() => void chiaSe()}
          loading={dang === 'chia-se'}
          disabled={dangTai || dang !== null}
        />
        <Button
          testID="nut-tao-link-moi"
          label="Tạo link mới"
          variant="secondary"
          onPress={taoMoi}
          loading={dang === 'tao'}
          disabled={dangTai || dang !== null}
        />
        {loiMoi ? (
          <Button
            testID="nut-tat-link"
            label="Tắt link"
            variant="danger"
            onPress={tat}
            loading={dang === 'tat'}
            disabled={dang !== null}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
    boxShadow: shadows.card,
  },
  tay: {
    alignSelf: 'center',
    width: scaleWithFont(44),
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  tieuDe: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: '700', color: colors.text },
  moTa: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted },
  theMa: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  ma: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: 3, color: colors.primary },
  chiTiet: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted, marginTop: spacing.xxs },
  loi: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.danger },
});
```


- [ ] **Step 4: Viết nút**

`src/components/chat/NutMoiVaoNhom.tsx`:

```tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MoiVaoNhomSheet } from './MoiVaoNhomSheet';
import { laLeaderDuAn } from '../../lib/tasks/task-permissions';
import type { Project, Workspace } from '../../lib/types';
import { colors, radius, scale } from '../../theme/tokens';

interface NutMoiVaoNhomProps {
  meId: string;
  project: Project;
  /** Không gian CHỨA dự án (không phải không gian đang chọn) — chủ của nó cũng được mời. */
  workspace?: Workspace | null;
}

/**
 * Nút "Mời vào nhóm" ở đầu màn chat dự án. Chỉ hiện cho Leader dự án và chủ
 * không gian — đúng quy tắc máy chủ (`ensureProjectManager`), không bày nút
 * mà bấm vào chỉ nhận 403.
 */
export function NutMoiVaoNhom({ meId, project, workspace }: NutMoiVaoNhomProps) {
  const [mo, setMo] = useState(false);
  if (!laLeaderDuAn(meId, project, workspace)) return null;

  return (
    <>
      <Pressable
        testID="nut-moi-vao-nhom"
        accessibilityRole="button"
        accessibilityLabel="Mời vào nhóm"
        onPress={() => setMo(true)}
        hitSlop={8}
        style={styles.nut}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.onPrimary} />
      </Pressable>
      <MoiVaoNhomSheet
        visible={mo}
        projectId={project.id}
        projectName={project.name}
        onDismiss={() => setMo(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  nut: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 5: Gắn vào đầu màn chat dự án**

Trong `src/app/(tabs)/chat/[projectId].tsx`: thêm `import { NutMoiVaoNhom } from '../../../components/chat/NutMoiVaoNhom';`. Ngay sau dòng `  const duocDungAI = !project || laLeaderDuAn(user?.id ?? '', project, khongGianCuaDuAn);` thêm:

```tsx
  // Chỉ khi biết chắc dự án và vai trò: khác AI, nút mời giấu nhầm không làm mất gì.
  const nutMoi = project ? (
    <NutMoiVaoNhom meId={user?.id ?? ''} project={project} workspace={khongGianCuaDuAn} />
  ) : undefined;
```

Thay:

```tsx
      {/* Trạng thái "đang gõ" vẫn nằm sát ô soạn tin, không đưa lên header. */}
      <GradientHeader title={projectName} onBack={goBack} dense />
```

bằng:

```tsx
      {/* Trạng thái "đang gõ" vẫn nằm sát ô soạn tin, không đưa lên header. */}
      <GradientHeader title={projectName} onBack={goBack} dense right={nutMoi} />
```

- [ ] **Step 6: Chạy lại**

Run: `npx jest src/components/chat "src/app/\(tabs\)/chat" && npx tsc --noEmit`
Expected: PASS — gồm `khung-chat-du-an.test.tsx` (bài đó thay `GradientHeader` bằng bản chỉ in tiêu đề nên không bị ảnh hưởng).

- [ ] **Step 7: Commit**

```bash
git add src/components/chat/MoiVaoNhomSheet.tsx src/components/chat/NutMoiVaoNhom.tsx src/components/chat/__tests__/NutMoiVaoNhom.test.tsx "src/app/(tabs)/chat/[projectId].tsx"
git commit -m "feat(mobile): Leader moi vao nhom tu dau man chat, chia se, tao lai va tat link" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M6: Chạm thông báo thành viên dự án mở đúng chat

**Files:**
- Modify: `src/lib/notifications/handler.ts` (`duongDanTuThongBao`, trước `case 'FRIEND_REQUEST':`)
- Modify: `src/lib/types.ts` (union `NotificationType` dòng 5-15)
- Modify: `src/components/notifications/NotificationRow.tsx` (bảng `LOOK`)
- Modify: `src/app/(tabs)/notifications/index.tsx` (`handlePress`, sau nhánh `item.taskId`)
- Test: `src/lib/notifications/__tests__/handler.test.ts` (thêm cuối tệp), `src/components/notifications/__tests__/cham-thanh-vien-moi.test.tsx` (tạo)

**Interfaces:**
- Consumes: push `data` của máy chủ — `PROJECT_MEMBER_ADDED` `{ type, projectId, workspaceId }` (có từ trước), `PROJECT_MEMBER_JOINED` `{ notificationId, type, projectId }` (B6).
- Produces: `duongDanTuThongBao` trả `/chat/<projectId>` cho hai loại trên; chạm dòng `PROJECT_MEMBER_JOINED` trong màn Thông báo cũng mở `/chat/<projectId>`.

- [ ] **Step 1: Viết bài kiểm thất bại**

Thêm vào cuối `src/lib/notifications/__tests__/handler.test.ts`:

```ts
describe('duongDanTuThongBao — thành viên dự án', () => {
  it('được Leader thêm vào dự án: mở chat dự án (trước đây chạm không làm gì)', () => {
    expect(
      duongDanTuThongBao(makeResponse({ type: 'PROJECT_MEMBER_ADDED', projectId: 'p1', workspaceId: 'w1' })),
    ).toBe('/chat/p1');
  });

  it('có người vào nhóm qua link mời: mở chat dự án', () => {
    expect(
      duongDanTuThongBao(makeResponse({ type: 'PROJECT_MEMBER_JOINED', projectId: 'p1', notificationId: 'n1' })),
    ).toBe('/chat/p1');
  });

  it('thiếu projectId thì không mở gì', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'PROJECT_MEMBER_JOINED' }))).toBeNull();
  });
});
```

`src/components/notifications/__tests__/cham-thanh-vien-moi.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManThongBao from '../../../app/(tabs)/notifications/index';
import { getUnreadCount, listNotifications, markNotificationRead } from '../../../lib/api/notifications';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { NotificationItem } from '../../../lib/types';

jest.mock('../../../lib/api/notifications');
jest.mock('../../../lib/api/tasks');
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/notifications/local', () => ({ syncScheduledReminders: jest.fn() }));
jest.mock('../../../lib/notifications/permission', () => ({
  checkNotificationPermission: jest.fn(async () => 'blocked'),
  ensureNotificationPermission: jest.fn(),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const THANH_VIEN_MOI: NotificationItem = {
  id: 'n2',
  type: 'PROJECT_MEMBER_JOINED',
  title: 'Thành viên mới tham gia dự án',
  message: 'Lan đã tham gia dự án "Đồ án EXE" qua link mời.',
  userId: 'u1',
  projectId: 'p-1',
  workspaceId: 'w-1',
  readAt: null,
  createdAt: '2026-10-02T09:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
  (useWorkspace as jest.Mock).mockReturnValue({ active: { id: 'w1' } });
  (listNotifications as jest.Mock).mockResolvedValue([THANH_VIEN_MOI]);
  (getUnreadCount as jest.Mock).mockResolvedValue({ count: 1 });
  (markNotificationRead as jest.Mock).mockResolvedValue({});
});

it('chạm thông báo có người vào nhóm: mở chat của dự án đó', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const man = await renderScreen(
    <QueryClientProvider client={client}>
      <ManThongBao />
    </QueryClientProvider>,
  );

  await waitFor(() => man.getByText('Thành viên mới tham gia dự án'));
  await fireEvent.press(man.getByTestId('notification-n2'));

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/chat/p-1'));
  expect(markNotificationRead).toHaveBeenCalledWith('n2');
  client.clear();
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx jest src/lib/notifications/__tests__/handler.test.ts src/components/notifications/__tests__/cham-thanh-vien-moi.test.tsx`
Expected: FAIL — `duongDanTuThongBao` trả `null`; lỗi TS `'PROJECT_MEMBER_JOINED'` không thuộc `NotificationType`; `mockPush` không được gọi.

- [ ] **Step 3: Viết mã**

`src/lib/notifications/handler.ts` — ngay trước `    case 'FRIEND_REQUEST':` thêm:

```ts
    /*
      Được thêm vào dự án, hoặc (với Leader) có người vừa vào nhóm qua link mời:
      mở chat của dự án đó. Trước 02/10/2026 chạm `PROJECT_MEMBER_ADDED` không
      làm gì. Dự án ở không gian khác vẫn mở được — màn chat tự tra không gian
      từ tin nhắn.
    */
    case 'PROJECT_MEMBER_ADDED':
    case 'PROJECT_MEMBER_JOINED': {
      const projectId = chuoi(kho, 'projectId');
      return projectId ? `/chat/${projectId}` : null;
    }

```

`src/lib/types.ts` — thay `  | 'PAYMENT_CONFIRMED';` (cuối union `NotificationType`) bằng:

```ts
  | 'PAYMENT_CONFIRMED'
  | 'PROJECT_MEMBER_JOINED';
```

`src/components/notifications/NotificationRow.tsx` — trong `LOOK`, sau dòng `  PAYMENT_CONFIRMED: { icon: 'receipt-outline', tone: 'done' },` thêm:

```tsx
  PROJECT_MEMBER_JOINED: { icon: 'people-outline', tone: 'info' },
```

`src/app/(tabs)/notifications/index.tsx` — trong `handlePress`, thay:

```tsx
      if (item.taskId) {
        router.push({ pathname: '/tasks/[taskId]', params: { taskId: item.taskId, tu: 'thong-bao' } });
        return;
      }
```

bằng:

```tsx
      if (item.taskId) {
        router.push({ pathname: '/tasks/[taskId]', params: { taskId: item.taskId, tu: 'thong-bao' } });
        return;
      }

      // Có người vào nhóm qua link mời: mở chat của dự án đó.
      if (item.type === 'PROJECT_MEMBER_JOINED' && item.projectId) {
        router.push(`/chat/${item.projectId}`);
        return;
      }
```

- [ ] **Step 4: Chạy lại**

Run: `npx jest src/lib/notifications src/components/notifications && npx tsc --noEmit`
Expected: PASS — gồm `NotificationRow.test.tsx` và `man-thong-bao.test.tsx` cũ.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications/handler.ts src/lib/notifications/__tests__/handler.test.ts src/lib/types.ts src/components/notifications/NotificationRow.tsx "src/app/(tabs)/notifications/index.tsx" src/components/notifications/__tests__/cham-thanh-vien-moi.test.tsx
git commit -m "feat(mobile): cham thong bao thanh vien du an mo dung chat du an" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task M7: Cổng cuối của mobile — kiểu, toàn bộ kiểm thử, dấu vân tay

**Files:** không sửa tệp nào.

**Interfaces:**
- Consumes: M1–M6.
- Produces: bằng chứng nhánh phát được qua OTA.

- [ ] **Step 1: Kiểu và kiểm thử**

```bash
npx tsc --noEmit
npx jest
```

Expected: sạch, mọi bộ PASS.

- [ ] **Step 2: Không đụng cấu hình native**

```bash
git diff --name-only sua-mobile-dot-2...HEAD -- package.json package-lock.json app.json app.config.js eas.json plugins
git diff --name-only sua-mobile-dot-2...HEAD | grep -v '^src/'; echo "ma thoat grep: $?"
```

Expected: lệnh đầu không in gì; lệnh hai không in gì (`ma thoat grep: 1`) — chỉ `src/` thay đổi.

- [ ] **Step 3: Dấu vân tay Android**

```bash
npx expo-updates fingerprint:generate --platform android | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).hash))"
```

Expected: đúng bằng MỐC đã ghi ở Task M0 Step 2 (kỳ vọng `82cd990037afe065754c48a9a004f293c0d84be9`). Khác mốc → có thứ ngoài `src/` bị đổi: tìm và hoàn lại, không đưa lên OTA.

- [ ] **Step 4: Báo cáo, không commit**

Ghi vào báo cáo cho người giao việc: số commit, kết quả `tsc`/`jest`, giá trị vân tay. Việc gộp vào `main` và `eas update` là của chủ dự án (mục "Execution order and deploy").

---

## Self-Review

### Spec coverage (mục spec → task)

| Mục spec | Nội dung | Task |
|---|---|---|
| 1.1 | Mở link là vào thẳng, không chờ duyệt | B5 (`thamGia`), W4, M3/M4 |
| 1.1 | Leader tắt hoặc tạo lại link bất cứ lúc nào; hết hạn sau 7 ngày | B4 (`HAN_LOI_MOI_MS`, `taoLoiMoi`, `tatLoiMoi`), W5, M5 |
| 1.2 | App chỉ phần OTA: nút "Mời vào nhóm" (chia sẻ), ô "Nhập mã mời"; không universal link, không QR trong app | M1–M6, M7 (vân tay) |
| 1.3 | 6 mẫu cố định, chỉ trên web | B8, B9, W6–W8 |
| 2 | Bảng `ProjectInvite`, migration chỉ thêm, chỉ mục `[projectId, revokedAt]`, SetNull người tạo | B1, B10 Step 3 |
| 2 | Tối đa một link sống; tạo mới thì tắt link cũ trong cùng giao dịch | B4 (khoá `FOR UPDATE`), B10 (hai lần tạo đồng thời) |
| 2 | `PROJECT_MEMBER_JOINED` bằng `ALTER TYPE … ADD VALUE`; kiểm app cũ trước khi ghi dòng | B1, mục "Kiểm tra tương thích loại thông báo lạ", B6 |
| 3.1 | Mã 8 ký tự từ bảng 32 ký tự bằng `crypto.randomInt`; hiển thị `XXXX-XXXX`; chuẩn hoá trước khi so; link `FRONTEND_URL/#/moi/CODE` | B2, W3, M2 |
| 3.2 | 5 API, phân quyền `ensureProjectManager`, xem trước không đăng nhập và không lộ email/id | B3, B4, B5 |
| 3.2 | Thứ tự lỗi 404/410 + chặn → 404 + `alreadyMember` + upsert dùng chung `addMember` + tăng `useCount` + socket `project:member-added` | B3, B5 |
| 3.2 | Báo Leader và chủ workspace bằng push + thông báo "{tên} đã tham gia dự án {dự án} qua link mời" | B6 |
| 3.2 | Hạn mức: xem trước 30/phút/IP; tham gia 10/phút/người + 30/phút/IP; tạo/tắt theo luật ghi chung | B7 |
| 3.2 | Lỗi tiếng Việt kèm `code`; web dịch sang tiếng Anh | B4 (`loi-moi.errors.ts`), W1 |
| 3.3 | Hộp thoại Leader: link + Sao chép, QR (`qrcode`) + tải PNG, mã in to, hạn, số người, Tạo link mới (xác nhận), Tắt link | W0, W5 |
| 3.3 | `#/moi/:code` có bộ đọc tham số; các đường khác như cũ | W3, W4 |
| 3.3 | Chưa đăng nhập: lưu `wedo:loi-moi-cho` (try/catch), sang Đăng nhập/Đăng ký, `vaoSauDangNhap` quay lại; xoá khi xong hoặc khi link lỗi | W3, W4 |
| 3.3 | Tham gia xong: chọn đúng workspace, mở bảng dự án | W4 (`moDich` + `taskboard`) |
| 3.3 | Đủ hai từ điển, `kiem-dich` = 0 | W1, W2, W8 Step 4 |
| 3.4 | Leader: mục "Mời vào nhóm" ở đầu màn chat dự án, GET rồi POST nếu chưa có, `Share.share` đúng câu; Tạo link mới, Tắt link | M5 |
| 3.4 | Ô nhập tự viết hoa + gạch giữa; xem trước → xác nhận → join; tải lại, chuyển workspace, mở chat; lỗi dịch theo mã | M2, M3, M4 |
| 3.4 | Push `PROJECT_MEMBER_JOINED` và `PROJECT_MEMBER_ADDED` mở chat dự án | M6 |
| 3.4 | Không thư viện native, không sửa `app.json`/`package.json`/`eas.json`; vân tay `82cd9900…` | M7, "Execution order and deploy" bước 3 |
| 4 | Xem trước chỉ trả đúng 5 trường; người bị đình chỉ không đăng nhập được (JwtStrategy có sẵn); 40 bit + hạn mức; vào bằng link chỉ là MEMBER | B5, B7 |
| 5.1 | `mau-du-an.ts`, `GET /project-templates?lang=`, `POST /projects` + `templateId`/`startDate`/`lang`, một giao dịch, TODO, không người nhận, `creatorId`, hạn 23:59 Asia/Ho_Chi_Minh, không thông báo; không mẫu thì y như cũ | B8, B9, B10 |
| 5.2 | Hai thẻ "Dự án trống"/"Bắt đầu từ mẫu"; xem trước việc với hạn tính sẵn, đổi ngày là cập nhật ngay; thẻ "Bắt đầu nhanh với mẫu" khi workspace chưa có dự án | W6, W7, W8 |
| 5.3 | Đủ 6 mẫu, tên vi + en, mô tả một câu "làm gì / nộp gì là xong" | B8 (bài kiểm khớp số ngày, đủ hai ngôn ngữ, "Xong khi"/"Done when") |
| 6 | Tương thích ngược; `forbidNonWhitelisted` vẫn chặn | B9 (DTO qua ValidationPipe), B1 Step 6, B10 Step 4 |
| 7 | Kiểm thử backend (jest + Postgres trong Docker), web (node:test + lint/build/kiem-dich), app (jest + tsc + vân tay) | mỗi task; B10; W8 Step 4; M7 |
| 8 | Thứ tự đưa lên | mục dưới |

### Quét chỗ trống
Không có "TBD"/"TODO"/"tương tự task N". Ba task giao diện thuần (W5, W7, W8) không có bài kiểm thất bại riêng vì logic đã tách ra hàm thuần có kiểm thử (W3, W6); cổng của chúng là `tsc` + `kiem-dich` + `build`.

### Nhất quán tên và kiểu
- Backend: `lenhGhiThanhVien`/`GhiThanhVien.doiVaiTroNeuDaCo` (B3 → B5); `ensureProjectManager` public (B3 → B4); `HAN_LOI_MOI_MS`, `LoiMoiChoLeader` (B4); `XemTruocLoiMoi`, `KetQuaThamGia`, `xemTruoc`, `thamGia` (B5); `TIEU_DE_THANH_VIEN_MOI` (B6) = khoá dịch ở W2; `timMauDuAn`, `MA_MAU_DU_AN`, `MauDuAn` (B8 → B9); `hanCuoiNgayVN` (B9).
- Web: `LoiMoiDuAn`, `XemTruocLoiMoi`, `KetQuaThamGia`, `MauDuAn`, `api.layLoiMoi|taoLoiMoi|tatLoiMoi|xemLoiMoi|thamGiaLoiMoi|layMauDuAn` (W1 → W4, W5, W7); `docMaMoiTuDuongDan`, `duongDanTrangMoi`, `ghiLoiMoiCho`, `docLoiMoiCho`, `quenLoiMoiCho`, `laLoiMoiHetDung`, `tenTepQr` (W3 → W4, W5); `chonDichSauDangNhap` (W4); `CheDoTaoDuAn`, `xemTruocViecMau`, `laNgayHopLe`, `ngayBatDauMacDinh` (W6 → W7, W8).
- Mobile: `layLoiMoi|taoLoiMoi|tatLoiMoi|xemTruocLoiMoi|thamGiaLoiMoi` (M1 → M3, M5); `dinhDangOMaMoi`, `maGuiDi`, `cauLoiMoi`, `noiDungChiaSe`, `hienThiMaMoi`, `hienThiHanMoi` (M2 → M3, M5); `NhapMaMoiSheet` (M3 → M4); `NutMoiVaoNhom`, `MoiVaoNhomSheet` (M5).
- Mã lỗi giống nhau ở ba nơi: `INVITE_NOT_FOUND`, `INVITE_EXPIRED`, `INVITE_REVOKED`, `INVITE_PROJECT_CLOSED`.

### Chỗ spec chưa nói rõ và cách kế hoạch chốt
1. **`GET /projects/:id/invite` trả `null`:** Nest gửi 200 với thân rỗng; web (`docPhanHoi`) và app (`apiRequest`) đều đọc thân rỗng thành `null`/`undefined`, client quy về `null`.
2. **Thứ tự lỗi khi link vừa bị tắt vừa hết hạn:** xét `revokedAt` trước (410 `INVITE_REVOKED`) — điều người nhận cần biết là Leader đã tắt/thay link.
3. **Xem trước cũng áp các lỗi 404/410** (trừ kiểm chặn, vì chưa biết ai xem). `leaderName` là tên người tạo link (đã được xác nhận còn quyền).
4. **Hạn mức hai tầng cho `join`:** guard cũ chỉ có một luật cho mỗi yêu cầu; B7 thêm `resolveRules` trả nhiều luật, các đường khác không đổi.
5. **"Menu ở đầu màn" chat dự án chưa tồn tại:** dùng nút biểu tượng ở `GradientHeader.right` mở bảng trượt (Android `Alert` tối đa 3 nút). Chỉ hiện khi đã biết dự án và vai trò.
6. **Không đổi vai trò người đã có khi join chạy chồng:** `doiVaiTroNeuDaCo: false` → `update: {}`.
7. **Thông báo:** thêm `actorId` (tuỳ chọn) vào `SystemNotificationInput` để danh sách hiện ảnh người vừa vào; `dedupeKey` theo link + người vào + người nhận (rời rồi vào lại bằng cùng link không báo lần hai); không `actionUrl` để web đi đường `dichTuThongBao` → bảng dự án, app đi `/chat/:projectId`.
8. **Nút mời trên web đặt ở hai chỗ:** đầu Bảng công việc và ngăn chi tiết dự án (trang Dự án, nơi quản lý thành viên).
9. **Mã sai dạng trong `#/moi/:code`** vẫn mở trang mời để báo "mã không đúng" (không rơi về trang chủ).
10. **Đăng xuất quên lời mời đang chờ** (máy dùng chung ở triển lãm): người sau không tự vào nhóm của người trước.
11. **`startDate`/`lang` khi không có `templateId`:** được DTO nhận nhưng bỏ qua — `POST /projects` chạy y như cũ.
12. **Id mẫu:** `exe101`, `exe201`, `do-an-mon-hoc`, `thuyet-trinh-nhom`, `nghien-cuu-khoa-hoc`, `su-kien-clb`; tên tiếng Anh viết trong B8.
13. **Sau khi tạo dự án từ mẫu trên web:** tải lại danh sách việc của workspace để tiến độ khớp ngay.
14. **App vào nhóm ở không gian mới:** lưu `workspaceId` rồi `refresh()` thay vì `switchTo` (không gian mới chưa có trong danh sách).

---

## Execution order and deploy

### Thứ tự làm
1. **Backend** B0 → B10 (tuần tự; B5 phụ thuộc B3, B4; B9 phụ thuộc B8).
2. **Web** W0 → W8 (W1 trước mọi task web khác; W7 sau W5 vì cùng sửa `WorkspaceView.tsx`; W8 sau W7).
3. **Mobile** M0 → M7.

Ba repo không phụ thuộc nhau lúc làm (web và app chỉ cần hợp đồng API ghi ở các khối **Interfaces**), nhưng làm theo thứ tự trên để lỗi hợp đồng lộ ra sớm ở phía máy chủ.

### Đưa lên (chủ dự án làm — người thực hiện kế hoạch KHÔNG push, KHÔNG deploy)
1. **Backend.** Gộp `feat/moi-vao-nhom` vào nhánh phát hành backend (`sua-toan-dien-3` → `backend`) rồi push. Migration chỉ THÊM, nên lần chạy tự động sau push đi qua cổng "Block destructive database changes" (không cần `DEPLOY_REVIEWED`). Trước khi push: kiểm biến Azure `FRONTEND_URL=https://wedofpt.com.vn` (đã đặt 29/09/2026) — link mời lấy gốc từ biến này. Sau deploy:
   - `GET https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/health/ready` → 200;
   - `GET …/invites/AAAAAAAA` → 404 với `"code":"INVITE_NOT_FOUND"`.
2. **Web.** Gộp `feat/moi-vao-nhom` của FE vào `sua-toan-dien-3` → `main`; Vercel tự build. Kiểm `https://wedofpt.com.vn/#/moi/AAAAAAAA` hiện "Mã mời không đúng…", rồi thử trọn luồng với một dự án thật của nhóm: tạo link, mở ở trình duyệt ẩn danh, đăng nhập tài khoản thứ hai, tham gia.
3. **App.**
   - Dọn worktree: `cmd /c rmdir D:\WEDO_PC\wt\mb-moi\node_modules` TRƯỚC, rồi mới `git -C D:\WeDo_ChPlay worktree remove D:\WEDO_PC\wt\mb-moi`.
   - Gộp `feat/moi-vao-nhom` vào `sua-mobile-dot-2`, rồi gộp vào `main` ở `D:\WeDo_ChPlay`.
   - Đo vân tay ở checkout thật của `main`: `npx expo-updates fingerprint:generate --platform android` phải ra `82cd990037afe065754c48a9a004f293c0d84be9`.
   - Chủ dự án chạy `eas update` cho Android. OTA chỉ tới bản Android runtime `82cd9900…` (1.0.13); bản iOS và Android build sau (20) có tính năng này khi build lần tới.
   - Khi Apple duyệt 1.0.14: cherry-pick các commit mobile của kế hoạch này sang nhánh `ios`.
4. **Dọn worktree backend và web** (không có junction): `git -C D:\WEDO_PC\BE_WEDO worktree remove D:\WEDO_PC\wt\be-moi`, `git -C D:\WEDO_PC\FE_WEDO worktree remove D:\WEDO_PC\wt\fe-moi` — sau khi đã gộp.
