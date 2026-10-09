import { nguoiKiaTrongTinhBan } from './quan-he';
import type { FriendsList, Friendship, NguoiTrongTinhBan } from '../types';

/**
 * Một dòng để vẽ: người kia là ai, và quan hệ nào sinh ra dòng này.
 *
 * Giữ `tinhBanId` chứ không chỉ giữ người, vì duyệt và từ chối gọi theo id lời
 * mời — không phải theo id người gửi.
 */
export interface DongBanBe {
  tinhBanId: string;
  nguoi: NguoiTrongTinhBan;
}

export interface NhomBanBe {
  banBe: DongBanBe[];
  /** Lời mời người khác gửi cho mình, chờ mình duyệt. */
  denMinh: DongBanBe[];
  /** Lời mời mình đã gửi, chờ người kia. */
  daGui: DongBanBe[];
}

/**
 * Bỏ những dòng không vẽ được.
 *
 * Máy chủ có thể trả bản ghi thiếu hồ sơ người kia, hoặc một quan hệ mình không
 * thuộc vào. Một dòng hỏng chỉ được mất một dòng, không được làm sập cả màn.
 */
function doiSangDong(ds: Friendship[], userId: string): DongBanBe[] {
  const ketQua: DongBanBe[] = [];

  ds.forEach((tinhBan) => {
    const nguoi = nguoiKiaTrongTinhBan(tinhBan, userId);
    if (nguoi) ketQua.push({ tinhBanId: tinhBan.id, nguoi });
  });

  return ketQua;
}

/** Đổi kết quả `GET /friends` sang ba nhóm dòng sẵn sàng để vẽ. */
export function nhomBanBe(ds: FriendsList, userId: string): NhomBanBe {
  return {
    banBe: doiSangDong(ds.friends ?? [], userId),
    denMinh: doiSangDong(ds.incoming ?? [], userId),
    daGui: doiSangDong(ds.outgoing ?? [], userId),
  };
}
