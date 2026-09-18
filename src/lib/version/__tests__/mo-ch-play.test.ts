import { Linking } from 'react-native';

import { moChPlay } from '../mo-ch-play';

describe('moChPlay', () => {
  /*
    `clearAllMocks` là bắt buộc, `restoreAllMocks` một mình KHÔNG đủ.

    `Linking.openURL` vốn đã là hàm giả do preset React Native dựng sẵn. `spyOn`
    chỉ bọc lên nó, nên `restore` trả về đúng cái hàm giả cũ — kèm nguyên lịch
    sử gọi của test trước. Hệ quả: `toHaveBeenNthCalledWith(2, ...)` đếm cả
    những lượt gọi không thuộc test này và báo sai một cách rất khó hiểu.
  */
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('mở thẳng ứng dụng CH Play trước', async () => {
    const mo = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);

    await moChPlay();

    expect(mo).toHaveBeenCalledWith('market://details?id=vn.wedo.app');
  });

  /*
    Máy không có CH Play (máy ảo, ROM cọc cằn) sẽ ném lỗi ở lược đồ market://.
    Khi đó phải rơi về đường https, nếu không nút bấm im lặng không làm gì cả.
  */
  it('rơi về đường https khi không mở được market://', async () => {
    const mo = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('no handler'))
      .mockResolvedValueOnce(true as never);

    await moChPlay();

    expect(mo).toHaveBeenNthCalledWith(
      2,
      'https://play.google.com/store/apps/details?id=vn.wedo.app',
    );
  });

  it('không ném ra ngoài khi cả hai đường đều hỏng', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('hong'));

    await expect(moChPlay()).resolves.toBeUndefined();
  });
});
