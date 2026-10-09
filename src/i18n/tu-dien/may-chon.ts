import { khaiBaoTuDien } from '../dich';

/** Chọn ảnh, chụp ảnh, chọn tệp nộp bài và ảnh đại diện (lib/images, lib/files). */
export const tuDienMayChon = khaiBaoTuDien(
  {
    chuaCoQuyenMayAnh: 'WeDo chưa được phép dùng máy ảnh. Bạn có thể bật lại trong Cài đặt của điện thoại.',
    chuaCoQuyenMayAnhTieuDe: 'Chưa có quyền dùng máy ảnh',
    deSau: 'Để sau',
    moCaiDat: 'Mở Cài đặt',
    // `ten` có thể rỗng (Android hay trả tên rỗng).
    khongDocDuocAnh: (ten: string) => `Không đọc được ảnh "${ten || 'đã chọn'}". Thử lại với ảnh khác nhé.`,
    anhQuaNang: (ten: string, mb: string) => `Ảnh "${ten || 'đã chọn'}" nặng quá ${mb}MB nên không gửi được.`,
    khongDocDuocAnhVuaChon: 'Không đọc được ảnh vừa chọn. Thử lại với ảnh khác nhé.',
    quaNhieuTep: (toiDa: number) => `Mỗi lần chỉ nộp được tối đa ${toiDa} tệp.`,
    tepQuaNang: (ten: string, mb: string) => `Tệp "${ten || 'đã chọn'}" nặng quá ${mb}MB nên không nộp được.`,
  },
  {
    chuaCoQuyenMayAnh: 'WeDo doesn’t have permission to use the camera. You can turn it back on in your phone’s Settings.',
    chuaCoQuyenMayAnhTieuDe: 'Camera access is off',
    deSau: 'Later',
    moCaiDat: 'Open Settings',
    khongDocDuocAnh: (ten: string) =>
      ten ? `Couldn’t read the photo "${ten}". Try a different one.` : 'Couldn’t read the selected photo. Try a different one.',
    anhQuaNang: (ten: string, mb: string) =>
      ten ? `"${ten}" is over ${mb} MB, so it can’t be sent.` : `That photo is over ${mb} MB, so it can’t be sent.`,
    khongDocDuocAnhVuaChon: 'Couldn’t read the photo you picked. Try a different one.',
    quaNhieuTep: (toiDa: number) => `You can submit up to ${toiDa} files at a time.`,
    tepQuaNang: (ten: string, mb: string) =>
      ten ? `"${ten}" is over ${mb} MB, so it can’t be submitted.` : `That file is over ${mb} MB, so it can’t be submitted.`,
  },
);
