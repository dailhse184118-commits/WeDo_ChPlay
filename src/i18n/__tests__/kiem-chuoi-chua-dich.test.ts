/*
  Bộ quét chữ tiếng Việt nằm ngoài từ điển (scripts/kiem-chuoi-chua-dich.ts),
  và danh sách tệp đã dịch xong phải sạch. Việc dịch từng khu vực thêm tệp vào
  TEP_DA_DICH; tệp đã có trong danh sách mà thêm chữ tiếng Việt viết thẳng là đỏ.
*/
import { join } from 'node:path';
import { danhSachTep, quetTatCa, timChuoiChuaDich } from '../../../scripts/kiem-chuoi-chua-dich';
import { chuVietConSot } from '../chu-viet-con-sot';

const GOC = join(__dirname, '..', '..', '..');

/** Các tệp đã đưa hết chữ vào từ điển (đường dẫn từ gốc dự án, dấu `/`). */
const TEP_DA_DICH: string[] = [
  'src/components/account/BangChonNgonNgu.tsx',
  'src/lib/i18n/dong-bo-ngon-ngu.ts',
  'src/i18n/NgonNguProvider.tsx',
  'src/i18n/dich.ts',
  'src/i18n/dinh-dang.ts',
  'src/i18n/loi.ts',
  'src/i18n/ngon-ngu.ts',
  'src/app/(auth)/login.tsx',
  'src/app/(auth)/register.tsx',
  'src/app/(auth)/forgot-password.tsx',
  'src/app/(onboarding)/create-workspace.tsx',
  'src/components/auth/CongDieuKhoan.tsx',
  'src/components/auth/ODongYDieuKhoan.tsx',
  'src/components/auth/VeDangNhapKhiDangXuat.tsx',
  'src/components/ui/GoogleButton.tsx',
  'src/components/ui/AppleButton.tsx',
  'src/components/ui/TextField.tsx',
  'src/components/workspace/CreateWorkspaceForm.tsx',
  'src/lib/auth/apple-signin.ts',
  'src/lib/auth/google-signin.ts',
  'src/lib/auth/auth-context.tsx',
  'src/lib/auth/nguon-loi.ts',
  'src/app/(tabs)/account/index.tsx',
  'src/app/(tabs)/account/nang-cap.tsx',
  'src/app/(tabs)/account/contributions.tsx',
  'src/app/account/profile.tsx',
  'src/app/account/delete-account.tsx',
  'src/app/account/notification-settings.tsx',
  'src/app/account/feedback.tsx',
  'src/app/account/blocked.tsx',
  'src/lib/payments/mua-goi.ts',
  'src/lib/payments/quyen-loi.ts',
  'src/lib/payments/goi-hien-tai.ts',
  'src/lib/ai/han-muc.ts',
  'src/lib/ngay-sinh.ts',
  'src/lib/feedback/kiem-tra.ts',
  'src/components/ui/GradientHeader.tsx',
  'src/app/(tabs)/chat/index.tsx',
  'src/app/(tabs)/chat/[projectId].tsx',
  'src/app/(tabs)/chat/friends.tsx',
  'src/app/(tabs)/chat/dm/[conversationId].tsx',
  'src/components/chat/ConversationRow.tsx',
  'src/components/chat/EmptyChat.tsx',
  'src/components/chat/ImageViewer.tsx',
  'src/components/chat/MessageBubble.tsx',
  'src/components/chat/MessageComposer.tsx',
  'src/components/chat/MoiVaoNhomSheet.tsx',
  'src/components/chat/NewConversationSheet.tsx',
  'src/components/chat/NhapMaMoiSheet.tsx',
  'src/components/chat/NutMoiVaoNhom.tsx',
  'src/components/chat/ProjectRow.tsx',
  'src/components/chat/SegmentedTabs.tsx',
  'src/components/chat/TaskSuggestionSheet.tsx',
  'src/components/friends/FriendRow.tsx',
  'src/components/moderation/BangThaoTac.tsx',
  'src/components/moderation/PhieuBaoCao.tsx',
  'src/lib/moderation/noi-dung.ts',
  'src/lib/moderation/use-kiem-duyet.ts',
  'src/lib/ai/dong-y-ai.ts',
  'src/lib/api/chat-files.ts',
  'src/lib/chat/create-task-from-message.ts',
  'src/lib/chat/typing-state.ts',
  'src/lib/loi-moi.ts',
  'src/app/(tabs)/tasks/index.tsx',
  'src/app/(tabs)/tasks/new.tsx',
  'src/app/(tabs)/tasks/[taskId].tsx',
  'src/components/tasks/RejectTaskSheet.tsx',
  'src/components/tasks/TaskRow.tsx',
  'src/components/tasks/TaskSubmissionPanel.tsx',
  'src/lib/tasks/deadline-groups.ts',
  'src/lib/tasks/tao-task.ts',
  'src/lib/tasks/task-permissions.ts',
  'src/app/(tabs)/meetings/index.tsx',
  'src/app/(tabs)/meetings/new.tsx',
  'src/app/(tabs)/meetings/[id].tsx',
  'src/app/(tabs)/calendar/index.tsx',
  'src/app/account/calendar-sync.tsx',
  'src/components/meetings/TheCuocHop.tsx',
  'src/lib/meetings/thoi-diem.ts',
  'src/lib/meetings/sap-xep.ts',
  'src/lib/calendar/nhom-theo-ngay.ts',
  'src/lib/api/dong-bo-lich.ts',
];

describe('bộ quét chữ chưa dịch', () => {
  it('bắt chữ trong JSX, thuộc tính, chuỗi thường và chuỗi mẫu', () => {
    const ma = [
      'export function A({ n }: { n: number }) {',
      '  const nhan = "Đăng nhập";',
      '  return (',
      '    <View accessibilityLabel="Thông báo" title={`Còn ${n} lượt`}>',
      '      <Text>Xin chào</Text>',
      '    </View>',
      '  );',
      '}',
    ].join('\n');
    expect(timChuoiChuaDich(ma)).toEqual(['Đăng nhập', 'Thông báo', 'Còn ${n} lượt', 'Xin chào']);
  });

  it('bỏ qua chú thích, import, kiểu literal, khoá đối tượng và console', () => {
    const ma = [
      "import anh from './ảnh.webp';",
      '// Chú thích tiếng Việt',
      '/* Một chú thích khác */',
      "type ChuKy = 'tháng' | 'năm';",
      "const bang = { 'Đã hủy': 1 };",
      "console.error('[WeDo] Giao diện gặp lỗi:', 1);",
      'export const A = () => <Text>{/* chú thích */}OK</Text>;',
    ].join('\n');
    expect(timChuoiChuaDich(ma)).toEqual([]);
  });

  it('chữ không dấu không bị bắt nhầm', () => {
    expect(timChuoiChuaDich('export const A = () => <Text>Plan less, Do more</Text>;')).toEqual([]);
  });

  it('chữ lưu dạng tách dấu (NFD) vẫn bị bắt', () => {
    expect(timChuoiChuaDich(`export const A = () => <Text>${'Thông báo'.normalize('NFD')}</Text>;`)).toHaveLength(1);
  });

  it('danh sách cho phép chỉ áp cho đúng tệp được ghi', () => {
    const ma = "export const T = 'Tiếng Việt';";
    expect(timChuoiChuaDich(ma, 'src/i18n/ngon-ngu.ts')).toEqual([]);
    expect(timChuoiChuaDich(ma, 'src/app/khac.ts')).toEqual(['Tiếng Việt']);
  });

  it('không quét từ điển, tệp kiểm thử và thư mục kiểm thử', () => {
    const tep = danhSachTep(GOC);
    expect(tep).toContain('src/i18n/ngon-ngu.ts');
    expect(tep.some((t) => t.startsWith('src/i18n/tu-dien/'))).toBe(false);
    expect(tep.some((t) => t.includes('__tests__') || /\.test\.tsx?$/.test(t))).toBe(false);
  });
});

describe('chữ viết còn sót trong cây hiển thị', () => {
  it('chỉ trả chữ có dấu tiếng Việt, trừ phần được bỏ qua', () => {
    const cay = JSON.stringify([{ type: 'Text', props: { testID: 'x' }, children: ['Hello', 'Đăng nhập', 'Lê Hữu Đại'] }]);
    expect(chuVietConSot(cay)).toEqual(['Đăng nhập', 'Lê Hữu Đại']);
    expect(chuVietConSot(cay, ['Lê Hữu Đại'])).toEqual(['Đăng nhập']);
    expect(chuVietConSot('plain english')).toEqual([]);
  });
});

describe('các tệp đã dịch không còn chữ tiếng Việt viết thẳng', () => {
  it('TEP_DA_DICH quét ra rỗng', () => {
    expect(quetTatCa(GOC, TEP_DA_DICH)).toEqual({});
  });
});

describe('tiến độ', () => {
  it('in số chữ tiếng Việt còn lại toàn repo (không fail)', () => {
    const conLai = quetTatCa(GOC, danhSachTep(GOC));
    const soChuoi = Object.values(conLai).reduce((n, ds) => n + ds.length, 0);
    console.log(`[kiem-dich] Còn ${soChuoi} chữ tiếng Việt chưa dịch trong ${Object.keys(conLai).length} tệp.`);
    expect(soChuoi).toBeGreaterThanOrEqual(0);
  });
});
