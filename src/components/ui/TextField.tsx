import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { KeyboardTypeOptions } from 'react-native';

import { colors, fontSize, radius, sizes, spacing } from '../../theme/tokens';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Cho xuống dòng. Dùng cho ô mô tả, nơi nội dung thường dài hơn một dòng. */
  multiline?: boolean;
  testID?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  multiline,
  testID,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  /*
    Bàn phím di động gõ sai rất dễ mà ô mật khẩu thì che hết, người dùng không
    soát lại được nên cứ bị báo sai mật khẩu mà không hiểu vì sao. Mặc định vẫn
    che — chỉ mở khi người dùng chủ động chạm.
  */
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const laOMatKhau = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={laOMatKhau && !hienMatKhau}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        /*
          Bộ kiểm tra chính tả của Android dùng từ điển tiếng Anh, nên nó gạch đỏ
          gần như mọi từ tiếng Việt — người dùng nhìn tưởng app báo lỗi. Tự sửa
          từ còn tệ hơn: nó biến từ tiếng Việt thành từ tiếng Anh gần giống.
        */
        spellCheck={false}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        /*
          Giá trị điền sẵn dài hơn bề ngang ô thì Android đặt con trỏ ở cuối và
          cuộn theo, người dùng chỉ thấy phần đuôi. Ép con trỏ về đầu khi ô chưa
          được chạm vào, và thả tay ra ngay khi họ bắt đầu sửa.
        */
        selection={focused ? undefined : { start: 0, end: 0 }}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          error ? styles.inputError : null,
          laOMatKhau ? styles.inputWithToggle : null,
        ]}
      />

        {laOMatKhau ? (
          <Pressable
            testID={testID ? `${testID}-toggle` : undefined}
            accessibilityRole="button"
            accessibilityLabel={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setHienMatKhau((truoc) => !truoc)}
            hitSlop={8}
            style={({ pressed }) => [styles.toggle, pressed ? styles.togglePressed : null]}
          >
            <Ionicons
              name={hienMatKhau ? 'eye-off-outline' : 'eye-outline'}
              size={sizes.icon}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  /* Ô nhập và con mắt xếp chồng: con mắt nổi lên trên mép phải của ô. */
  inputRow: { position: 'relative', justifyContent: 'center' },
  /* Chừa chỗ cho con mắt để chữ dài không chạy xuống dưới nó. */
  inputWithToggle: { paddingRight: sizes.icon + spacing.md * 2 },
  toggle: { position: 'absolute', right: spacing.md, padding: spacing.xs },
  togglePressed: { opacity: 0.5 },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    minHeight: sizes.control,
    // Nền chìm thay vì trắng có viền: thẻ chứa nó đã là màu trắng, nên ô nhập
    // phải lõm xuống mới phân biệt được.
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputMultiline: { minHeight: 88, paddingTop: spacing.sm + 4, textAlignVertical: 'top' },
  inputError: { borderWidth: 1, borderColor: colors.danger },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: fontSize.xs },
});
