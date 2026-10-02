import { duAnCanDemChuaDoc } from '../chua-doc-du-an';

const DS = Array.from({ length: 10 }, (_, i) => ({ id: `p${i + 1}` }));

describe('duAnCanDemChuaDoc', () => {
  it('luôn đếm vài dự án đầu danh sách, kể cả khi chưa biết dòng nào đang hiện', () => {
    expect(duAnCanDemChuaDoc(DS, new Set(), 3)).toEqual(['p1', 'p2', 'p3']);
  });

  /*
    Trước đây chỉ 6 dự án đầu có huy hiệu. Máy chủ xếp theo ngày sửa dự án, tin
    nhắn không đổi thứ tự đó — nhóm chat sôi nổi nằm ở dòng 7 trở đi thì không
    bao giờ hiện tin mới.
  */
  it('đếm thêm những dòng đang hiện trên màn, dù nằm sâu trong danh sách', () => {
    expect(duAnCanDemChuaDoc(DS, new Set(['p8', 'p9']), 3)).toEqual(['p1', 'p2', 'p3', 'p8', 'p9']);
  });

  it('bỏ dòng đang hiện mà không còn trong danh sách (đã lọc bởi ô tìm)', () => {
    expect(duAnCanDemChuaDoc(DS.slice(0, 2), new Set(['p9']), 3)).toEqual(['p1', 'p2']);
  });

  it('không trùng và có trần để không dội lượt gọi', () => {
    const ket = duAnCanDemChuaDoc(DS, new Set(DS.map((d) => d.id)), 3, 5);
    expect(ket).toHaveLength(5);
    expect(new Set(ket).size).toBe(5);
  });
});
