import { createHash, randomBytes } from 'node:crypto';

import { sha256Hex } from '../sha256';

function sha256CuaNode(chuoi: string): string {
  return createHash('sha256').update(chuoi, 'utf8').digest('hex');
}

describe('SHA-256 tự viết', () => {
  it('khớp các vectơ chuẩn của FIPS 180-4', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('khớp node:crypto ở mọi độ dài quanh ranh giới khối 64 byte', () => {
    // 55, 56, 63, 64, 65 byte là chỗ phần đệm dễ sai nhất.
    for (let doDai = 0; doDai <= 130; doDai++) {
      const chuoi = 'a'.repeat(doDai);
      expect(sha256Hex(chuoi)).toBe(sha256CuaNode(chuoi));
    }
  });

  it('khớp node:crypto với nonce ngẫu nhiên dạng hex, đúng thứ máy chủ sẽ băm', () => {
    for (let lan = 0; lan < 50; lan++) {
      const nonce = randomBytes(32).toString('hex');
      expect(sha256Hex(nonce)).toBe(sha256CuaNode(nonce));
    }
  });

  it('mã hoá UTF-8 như máy chủ, kể cả tiếng Việt và ký tự ngoài BMP', () => {
    for (const chuoi of ['Lê Hữu Đại', 'Nghĩ ít hơn, làm nhiều hơn', '😀 emoji', '€']) {
      expect(sha256Hex(chuoi)).toBe(sha256CuaNode(chuoi));
    }
  });
});
