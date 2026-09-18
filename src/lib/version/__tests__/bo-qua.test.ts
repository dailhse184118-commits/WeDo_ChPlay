import AsyncStorage from '@react-native-async-storage/async-storage';

import { daBoQua, ghiNhoBoQua } from '../bo-qua';

describe('nhớ việc bỏ qua nhắc cập nhật', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('chưa bỏ qua thì trả false', async () => {
    await expect(daBoQua('1.0.11')).resolves.toBe(false);
  });

  it('bỏ qua rồi thì trả true', async () => {
    await ghiNhoBoQua('1.0.11');
    await expect(daBoQua('1.0.11')).resolves.toBe(true);
  });

  /*
    Tắt nhắc của 1.0.11 không được làm im luôn 1.0.12. Mỗi bản mới là một lần
    đáng nhắc lại, nên khoá phải kèm số phiên bản.
  */
  it('bỏ qua bản này không làm im bản sau', async () => {
    await ghiNhoBoQua('1.0.11');
    await expect(daBoQua('1.0.12')).resolves.toBe(false);
  });

  it('bộ nhớ hỏng thì coi như chưa bỏ qua', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('hong'));

    await expect(daBoQua('1.0.11')).resolves.toBe(false);
  });

  it('ghi hỏng cũng không ném ra ngoài', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('hong'));

    await expect(ghiNhoBoQua('1.0.11')).resolves.toBeUndefined();
  });
});
