"""Đọc vân tay chứng chỉ đã ký một file APK.

    python tools/doc-chu-ky.py duong-dan-toi-file.apk

Vì sao cần script này thay vì `apksigner verify --print-certs`:

Từ giữa 2026 Play ký thêm chữ ký hậu lượng tử (ML-DSA) theo APK Signature
Scheme v3.2. `apksigner` bản 37.0.0 gặp khối đó là bỏ cuộc — "Malformed public
key: ML-DSA KeyFactory not available" — và KHÔNG in ra chứng chỉ cổ điển, dù
chứng chỉ ấy vẫn nằm nguyên trong file và vẫn là thứ máy Android đang dùng
(chữ ký hậu lượng tử khai `minSdkVersion=37`, chưa máy nào chạm tới).

Script này bỏ qua tầng xác minh, đọc thẳng APK Signing Block để lấy chứng chỉ.
Không xác minh chữ ký — chỉ trả lời đúng một câu hỏi: file này ký bằng khoá nào.

Dùng khi nào: Google Sign-In trả DEVELOPER_ERROR (mã 10) trên bản cài từ CH Play
nhưng bản cài tay lại vào được. Tải "APK chung, đã được ký" ở Play Console →
App bundle explorer → chọn phiên bản → Số lần tải xuống, rồi chạy script này lên
nó. Con số in ra phải có mặt trong `google-services.json` mới tải về; không có
nghĩa là chưa ai tạo OAuth client cho nó.

Ngày 23/08/2026 chính script này tìm ra bản 1.0.8 trên Play ký bằng
0E:00:4A:DA… trong khi Play Console hiển thị một con số khác hẳn.
"""

import hashlib
import struct
import sys

MAGIC = b"APK Sig Block 42"

# Mã khối trong APK Signing Block. v3.1/v3.2 dùng cho chữ ký xoay vòng khoá và
# chữ ký hậu lượng tử; đọc hết để thấy đủ mọi khoá đã ký file.
KHOI = {
    0x7109871A: "v2",
    0xF05368C0: "v3",
    0x1B93AD61: "v3.1",
}


def _chuoi_do_dai(b):
    """Duyệt dãy phần tử, mỗi phần tử có tiền tố độ dài 4 byte little-endian."""
    i = 0
    while i + 4 <= len(b):
        n = struct.unpack_from("<I", b, i)[0]
        i += 4
        yield b[i : i + n]
        i += n


def _tim_signing_block(data):
    # EOCD nằm cuối file và chứa offset của Central Directory. Quét ngược vì
    # EOCD có phần chú thích độ dài tuỳ ý ở đuôi.
    for i in range(len(data) - 22, max(0, len(data) - 65558), -1):
        if data[i : i + 4] == b"PK\x05\x06":
            cd = struct.unpack_from("<I", data, i + 16)[0]
            break
    else:
        raise ValueError("không tìm thấy EOCD — file này không phải ZIP hợp lệ")

    if data[cd - 16 : cd] != MAGIC:
        raise ValueError("file không có APK Signing Block (chưa ký, hoặc chỉ ký v1)")

    kich_thuoc = struct.unpack_from("<Q", data, cd - 24)[0]
    dau = cd - 8 - kich_thuoc
    return data[dau + 8 : cd - 24]


def _cac_khoi(block):
    i = 0
    while i + 12 <= len(block):
        do_dai = struct.unpack_from("<Q", block, i)[0]
        ma = struct.unpack_from("<I", block, i + 8)[0]
        yield ma, block[i + 12 : i + 8 + do_dai]
        i += 8 + do_dai


def van_tay(duong_dan):
    """Trả về {tên sơ đồ chữ ký: [SHA-1 dạng AA:BB:…]}."""
    with open(duong_dan, "rb") as f:
        data = f.read()

    ket_qua = {}
    for ma, noi_dung in _cac_khoi(_tim_signing_block(data)):
        if ma not in KHOI:
            continue
        for signers in _chuoi_do_dai(noi_dung):
            for signer in _chuoi_do_dai(signers):
                # signer → signed data → [digests, certificates, …]
                signed_data = next(_chuoi_do_dai(signer), b"")
                phan = list(_chuoi_do_dai(signed_data))
                if len(phan) < 2:
                    continue
                for cert in _chuoi_do_dai(phan[1]):
                    h = hashlib.sha1(cert).hexdigest().upper()
                    dep = ":".join(h[i : i + 2] for i in range(0, 40, 2))
                    ket_qua.setdefault(KHOI[ma], []).append(dep)
                break
            break
    return ket_qua


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    if len(sys.argv) != 2:
        print(__doc__.strip().splitlines()[2].strip())
        return 2

    duong_dan = sys.argv[1]
    try:
        ket_qua = van_tay(duong_dan)
    except (OSError, ValueError) as e:
        print(f"Không đọc được: {e}")
        return 1

    if not ket_qua:
        print("Không thấy chữ ký v2/v3 nào trong file.")
        return 1

    print(duong_dan)
    for so_do, ds in ket_qua.items():
        for sha1 in ds:
            print(f"  [{so_do}] SHA-1  {sha1}")
    print()
    print("Đối chiếu: chuỗi này phải có trong google-services.json mới tải về.")
    print("Thiếu thì tạo OAuth client Android ở Google Cloud Console → Credentials.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
