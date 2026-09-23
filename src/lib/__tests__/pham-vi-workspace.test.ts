/*
  Kiểm thử DUY NHẤT trong app đọc hệ thống tệp — nó chạy trong Node của Jest,
  không phải trên máy điện thoại. Cấu hình TypeScript của app không nạp kiểu Node
  (đúng thôi, app không chạy trên Node), nên khai riêng ở đây.
*/
/// <reference types="node" />
import fs from 'fs';
import path from 'path';

/**
 * Canh một luật cấu trúc mà kiểm thử màn hình KHÔNG BAO GIỜ bắt được.
 *
 * `WorkspaceProvider` chỉ được gắn ở `src/app/(tabs)/_layout.tsx`. Màn nào nằm
 * ngoài nhóm `(tabs)` mà gọi `useWorkspace()` thì hook ném lỗi ngay lúc render.
 *
 * Lỗi này đã xảy ra HAI LẦN:
 *   - 17/08/2026: màn Bảng đóng góp đặt ở `src/app/account/`. Cả app chết, văng
 *     về màn hình chính — lý do `ErrorBoundary` ở layout gốc ra đời.
 *   - 23/09/2026: màn Cuộc họp đặt ở `src/app/meetings/`. Nhờ `ErrorBoundary`
 *     nên chỉ màn đó chết, nhưng nó đã được đẩy lên máy người thử nghiệm.
 *
 * Kiểm thử của từng màn đều giả lập `useWorkspace`, nên chúng xanh cả hai lần.
 * Chỉ một phép kiểm tra đọc thẳng cây thư mục mới thấy được màn nào nằm sai chỗ.
 */

const APP = path.resolve(__dirname, '../../app');

function moiTepManHinh(thuMuc: string): string[] {
  const ra: string[] = [];
  for (const muc of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) {
      if (muc.name === '__tests__') continue;
      ra.push(...moiTepManHinh(duongDan));
    } else if (/\.tsx?$/.test(muc.name)) {
      ra.push(duongDan);
    }
  }
  return ra;
}

/**
 * Khớp LỜI GỌI thật (`useWorkspace(`) trong mã, bỏ qua mọi dòng chú thích.
 * Layout gốc nhắc tên hook trong một đoạn chú thích kể lại vụ 17/08 — đếm cả
 * chú thích thì chính cái lời cảnh báo lại bị bắt là vi phạm.
 */
function goiUseWorkspace(noiDung: string): boolean {
  const boChuThich = noiDung
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((dong) => !dong.trim().startsWith('//'))
    .join('\n');
  return /\buseWorkspace\s*\(/.test(boChuThich);
}

describe('phạm vi của WorkspaceProvider', () => {
  const tatCa = moiTepManHinh(APP);

  it('tìm thấy cây màn hình để kiểm — không thì phép kiểm này vô nghĩa', () => {
    expect(tatCa.length).toBeGreaterThan(10);
  });

  it('không màn nào ngoài nhóm (tabs) được gọi useWorkspace()', () => {
    const viPham = tatCa
      .filter((tep) => !tep.split(path.sep).includes('(tabs)'))
      .filter((tep) => goiUseWorkspace(fs.readFileSync(tep, 'utf8')))
      .map((tep) => path.relative(APP, tep).split(path.sep).join('/'));

    /*
      Nếu phép kiểm này đỏ: dời màn hình vào `src/app/(tabs)/…` và khai nó bằng
      `<Tabs.Screen name="…" options={{ href: null }} />` trong
      `(tabs)/_layout.tsx`. Đường dẫn không đổi, vì `(tabs)` là một nhóm và
      không nằm trong URL.
    */
    expect(viPham).toEqual([]);
  });
});
