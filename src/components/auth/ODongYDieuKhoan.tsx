import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PRIVACY_URL, TERMS_URL, openLegalLink } from '../../lib/legal-links';
import { colors, fontSize, lineHeight, sizes, spacing } from '../../theme/tokens';

/** Câu đầy đủ của ô, đọc cho trình đọc màn hình và dùng trong kiểm thử. */
export const CAU_DONG_Y_DIEU_KHOAN =
  'Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư';

interface ODongYDieuKhoanProps {
  daChon: boolean;
  onDoi: (daChon: boolean) => void;
  disabled?: boolean;
}

/**
 * Ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản…" — dùng chung cho màn đăng ký và
 * màn đồng ý một lần sau khi đăng nhập.
 *
 * Apple đòi người dùng đồng ý điều khoản "không khoan nhượng nội dung phản cảm"
 * trước khi dùng chat (Guideline 1.2), và tuổi tối thiểu 18 phải có chỗ dựa ngay
 * trong app. Ô KHÔNG được đánh dấu sẵn: đánh sẵn thì không còn là đồng ý.
 *
 * Hai tên văn bản là đường dẫn bấm được; chạm vào phần chữ còn lại thì đổi ô,
 * như ô đánh dấu của hệ thống.
 */
export function ODongYDieuKhoan({ daChon, onDoi, disabled = false }: ODongYDieuKhoanProps) {
  const doi = () => {
    if (!disabled) onDoi(!daChon);
  };

  return (
    <View style={styles.hang}>
      <Pressable
        testID="dong-y-dieu-khoan"
        accessibilityRole="checkbox"
        accessibilityLabel={CAU_DONG_Y_DIEU_KHOAN}
        accessibilityState={{ checked: daChon, disabled }}
        onPress={doi}
        hitSlop={10}
        style={styles.o}
      >
        <Ionicons
          name={daChon ? 'checkbox' : 'square-outline'}
          size={sizes.icon}
          color={daChon ? colors.primary : colors.textMuted}
        />
      </Pressable>

      <Text style={styles.chu} onPress={doi}>
        Tôi đủ 18 tuổi và đồng ý với{' '}
        <Text
          testID="lien-ket-dieu-khoan"
          accessibilityRole="link"
          style={styles.lienKet}
          onPress={() => void openLegalLink(TERMS_URL)}
        >
          Điều khoản sử dụng
        </Text>{' '}
        và{' '}
        <Text
          testID="lien-ket-quyen-rieng-tu"
          accessibilityRole="link"
          style={styles.lienKet}
          onPress={() => void openLegalLink(PRIVACY_URL)}
        >
          Chính sách quyền riêng tư
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hang: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  o: { paddingTop: spacing.xxs },
  chu: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.text,
  },
  lienKet: { color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
});
