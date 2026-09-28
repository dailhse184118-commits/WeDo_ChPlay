/**
 * SHA-256, trả về chuỗi hex chữ thường — chỉ để băm nonce của Sign in with Apple.
 *
 * Tự viết chứ không dùng thư viện vì app không có sẵn thứ nào làm được việc này
 * trên máy thật: Hermes không có `crypto.subtle`, còn `expo-crypto` chưa cài và
 * cài thêm là thêm một module native chỉ để băm đúng một chuỗi 64 ký tự mỗi lần
 * đăng nhập. Thuật toán theo FIPS 180-4; bộ kiểm thử đối chiếu với `node:crypto`.
 *
 * Chuỗi được mã hoá UTF-8 trước khi băm, khớp `createHash('sha256').update(chuoi)`
 * phía máy chủ.
 */

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function xoayPhai(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function maHoaUtf8(chuoi: string): number[] {
  const byte: number[] = [];
  for (const kyTu of chuoi) {
    const ma = kyTu.codePointAt(0) ?? 0;
    if (ma < 0x80) {
      byte.push(ma);
    } else if (ma < 0x800) {
      byte.push(0xc0 | (ma >> 6), 0x80 | (ma & 0x3f));
    } else if (ma < 0x10000) {
      byte.push(0xe0 | (ma >> 12), 0x80 | ((ma >> 6) & 0x3f), 0x80 | (ma & 0x3f));
    } else {
      byte.push(
        0xf0 | (ma >> 18),
        0x80 | ((ma >> 12) & 0x3f),
        0x80 | ((ma >> 6) & 0x3f),
        0x80 | (ma & 0x3f),
      );
    }
  }
  return byte;
}

export function sha256Hex(chuoi: string): string {
  const byte = maHoaUtf8(chuoi);
  const soBit = byte.length * 8;

  // Đệm: một bit 1, rồi các bit 0 cho tới khi còn đúng 64 bit cuối cho độ dài.
  byte.push(0x80);
  while (byte.length % 64 !== 56) byte.push(0);
  const cao = Math.floor(soBit / 0x100000000);
  const thap = soBit >>> 0;
  byte.push(
    (cao >>> 24) & 0xff,
    (cao >>> 16) & 0xff,
    (cao >>> 8) & 0xff,
    cao & 0xff,
    (thap >>> 24) & 0xff,
    (thap >>> 16) & 0xff,
    (thap >>> 8) & 0xff,
    thap & 0xff,
  );

  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const w = new Array<number>(64);

  for (let khoi = 0; khoi < byte.length; khoi += 64) {
    for (let t = 0; t < 16; t++) {
      const i = khoi + t * 4;
      w[t] = (byte[i] << 24) | (byte[i + 1] << 16) | (byte[i + 2] << 8) | byte[i + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = xoayPhai(w[t - 15], 7) ^ xoayPhai(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = xoayPhai(w[t - 2], 17) ^ xoayPhai(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = xoayPhai(e, 6) ^ xoayPhai(e, 11) ^ xoayPhai(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = xoayPhai(a, 2) ^ xoayPhai(a, 13) ^ xoayPhai(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
