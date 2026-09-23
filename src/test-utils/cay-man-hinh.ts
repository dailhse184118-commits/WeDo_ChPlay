/*
  Chỉ dùng trong kiểm thử — chạy trong Node của Jest, không phải trên điện thoại.
  Cấu hình TypeScript của app không nạp kiểu Node, nên khai riêng ở đây.
*/
/// <reference types="node" />
import fs from 'fs';
import path from 'path';

/**
 * Đọc thẳng cây màn hình `src/app/` để kiểm những luật cấu trúc mà kiểm thử
 * từng màn KHÔNG BAO GIỜ bắt được — vì kiểm thử màn hình giả lập hết router và
 * provider, nên màn đặt sai chỗ vẫn xanh.
 *
 * Nằm ở `test-utils/` chứ không ở `__tests__/`: Jest coi mọi tệp trong
 * `__tests__/` là một bộ kiểm thử, và một tệp không có `it()` sẽ bị báo lỗi.
 */

export const THU_MUC_APP = path.resolve(__dirname, '../app');

export interface TepManHinh {
  /** Đường dẫn tương đối từ `src/app`, dùng dấu `/`. Ví dụ `(tabs)/tasks/new.tsx`. */
  ten: string;
  /** Nội dung đã bỏ hết chú thích — để lời cảnh báo không bị đếm là vi phạm. */
  ma: string;
}

function boChuThich(noiDung: string): string {
  return noiDung
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((dong) => !dong.trim().startsWith('//'))
    .join('\n');
}

function duyet(thuMuc: string, ra: TepManHinh[]): void {
  for (const muc of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const duongDan = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) {
      if (muc.name !== '__tests__') duyet(duongDan, ra);
    } else if (/\.tsx?$/.test(muc.name)) {
      ra.push({
        ten: path.relative(THU_MUC_APP, duongDan).split(path.sep).join('/'),
        ma: boChuThich(fs.readFileSync(duongDan, 'utf8')),
      });
    }
  }
}

export function docCayManHinh(): TepManHinh[] {
  const ra: TepManHinh[] = [];
  duyet(THU_MUC_APP, ra);
  return ra;
}
