import React from 'react';
import { BackHandler, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { useQuayLai } from '../use-quay-lai';

let mockDangFocus = true;
jest.mock('expo-router', () => ({
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(() => (mockDangFocus ? hieuUng() : undefined), [hieuUng]);
  },
}));

function Man({ quayLai }: { quayLai: () => void }) {
  useQuayLai(quayLai);
  return <Text>man</Text>;
}

/*
  Phần lớn người dùng Android quay lại bằng cử chỉ vuốt hoặc phím Back, không
  bấm mũi tên trên đầu màn. Chỉ sửa mũi tên là để một nửa số lần quay lại vẫn
  văng về tab đầu tiên.
*/
describe('useQuayLai', () => {
  let goBack: () => boolean;
  const go = jest.fn();

  beforeEach(() => {
    mockDangFocus = true;
    go.mockClear();
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_, xuLy) => {
      goBack = xuLy as () => boolean;
      return { remove: go };
    });
  });

  /* `spyOn` gọi lại trên cùng một hàm thì cộng dồn lượt gọi từ ca trước. */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('phím Back cứng gọi đúng hàm quay lại, và nuốt phím', async () => {
    const quayLai = jest.fn();
    await render(<Man quayLai={quayLai} />);

    expect(goBack()).toBe(true);
    expect(quayLai).toHaveBeenCalledTimes(1);
  });

  it('gỡ đăng ký khi rời màn, để không nuốt phím Back của màn khác', async () => {
    const man = await render(<Man quayLai={jest.fn()} />);
    /* Bản 14 của thư viện kiểm thử: `unmount` cũng bất đồng bộ như `render`. */
    await man.unmount();
    expect(go).toHaveBeenCalled();
  });

  it('không đăng ký khi màn không được focus', async () => {
    mockDangFocus = false;
    await render(<Man quayLai={jest.fn()} />);
    expect(BackHandler.addEventListener).not.toHaveBeenCalled();
  });
});
