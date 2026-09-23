import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Quay lại một chỗ CỐ ĐỊNH, cho cả mũi tên trên đầu màn lẫn phím Back của Android.
 *
 * VÌ SAO KHÔNG DÙNG `router.back()`:
 *
 * Màn ẩn nằm trong nhóm `(tabs)` là một ROUTE CỦA BỘ ĐIỀU HƯỚNG TAB, không phải
 * một màn chồng lên ngăn xếp. Bộ điều hướng tab của Expo Router mặc định
 * `backBehavior: 'firstRoute'` — quay lại là nhảy về tab ĐẦU TIÊN được khai báo,
 * ở app này là Trò chuyện. Người đang xem một cuộc họp bấm Quay lại mà văng sang
 * màn chat là không hiểu chuyện gì vừa xảy ra.
 *
 * `router.canGoBack()` cũng không cứu được: với `firstRoute`, mọi tab không phải
 * tab đầu đều "quay lại được", nên nhánh dự phòng không bao giờ chạy.
 *
 * VÌ SAO PHẢI BẮT CẢ PHÍM BACK CỨNG:
 *
 * Phần lớn người dùng Android quay lại bằng cử chỉ vuốt hoặc phím Back, không
 * bấm mũi tên. Phím đó đi theo đúng lịch sử tab kể trên. Chỉ sửa mũi tên là để
 * lại một nửa số lần quay lại vẫn sai.
 *
 * Chỉ đăng ký khi màn đang được focus — không thì màn đã rời đi vẫn nuốt phím
 * Back của màn khác.
 */
export function useQuayLai(quayLai: () => void): () => void {
  useFocusEffect(
    useCallback(() => {
      const dangKy = BackHandler.addEventListener('hardwareBackPress', () => {
        quayLai();
        return true;
      });
      return () => dangKy.remove();
    }, [quayLai]),
  );

  return quayLai;
}
