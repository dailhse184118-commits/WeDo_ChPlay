import { docCayManHinh } from '../../test-utils/cay-man-hinh';

/**
 * Hai luật cấu trúc của nhóm `(tabs)` — cả hai đều đã gây lỗi thật trên máy
 * người thử nghiệm, và kiểm thử của từng màn không bắt được lần nào, vì chúng
 * giả lập hết router lẫn provider.
 */

const tatCa = docCayManHinh();

it('tìm thấy cây màn hình để kiểm — không thì các luật dưới vô nghĩa', () => {
  expect(tatCa.length).toBeGreaterThan(10);
  expect(tatCa.some((t) => t.ten.startsWith('(tabs)/'))).toBe(true);
});

/**
 * `WorkspaceProvider` chỉ được gắn ở `src/app/(tabs)/_layout.tsx`. Màn nào ngoài
 * nhóm đó gọi `useWorkspace()` là hook ném lỗi ngay lúc render.
 *
 *   - 17/08/2026: Bảng đóng góp đặt ở `src/app/account/`. Cả app chết.
 *   - 23/09/2026: Cuộc họp đặt ở `src/app/meetings/`, đã lên máy người thử
 *     nghiệm qua bản cập nhật.
 */
describe('phạm vi của WorkspaceProvider', () => {
  it('không màn nào ngoài nhóm (tabs) được gọi useWorkspace()', () => {
    const viPham = tatCa
      .filter((t) => !t.ten.startsWith('(tabs)/'))
      .filter((t) => /\buseWorkspace\s*\(/.test(t.ma))
      .map((t) => t.ten);

    /*
      Đỏ thì: dời màn vào `src/app/(tabs)/…` và khai
      `<Tabs.Screen name="…" options={{ href: null }} />` trong `(tabs)/_layout.tsx`.
      Đường dẫn không đổi — `(tabs)` là nhóm, không nằm trong URL.
    */
    expect(viPham).toEqual([]);
  });
});

/**
 * Màn ẩn trong nhóm `(tabs)` là ROUTE CỦA BỘ ĐIỀU HƯỚNG TAB, không phải màn chồng
 * lên ngăn xếp. Bộ điều hướng tab mặc định `backBehavior: 'firstRoute'`, nên
 * `router.back()` nhảy về tab đầu tiên — Trò chuyện.
 *
 * 23/09/2026: chủ dự án mở một công việc, bấm Quay lại, văng sang Trò chuyện.
 * Lỗi này có từ ngày đầu, ở cả chi tiết công việc, tạo công việc (tạo XONG cũng
 * bị đá sang chat) và Bảng đóng góp.
 */
describe('quay lại trong nhóm tab', () => {
  /*
    Các màn con của Trò chuyện được miễn — nhưng chỉ là TÌNH CỜ ĐÚNG: tab đầu
    tiên chính là danh sách chat, nên "về tab đầu" trùng với "về chỗ cũ". Đổi
    thứ tự tab trong `(tabs)/_layout.tsx` là chúng hỏng theo.
  */
  const DUOC_MIEN = /^\(tabs\)\/chat\//;

  it('không màn nào trong (tabs) ngoài Trò chuyện gọi router.back()', () => {
    const viPham = tatCa
      .filter((t) => t.ten.startsWith('(tabs)/') && !DUOC_MIEN.test(t.ten))
      .filter((t) => /\brouter\.back\s*\(/.test(t.ma))
      .map((t) => t.ten);

    /* Đỏ thì: dùng `useQuayLai` trong `src/lib/use-quay-lai.ts`. */
    expect(viPham).toEqual([]);
  });
});
