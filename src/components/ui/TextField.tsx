import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
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
        style={[styles.input, multiline ? styles.inputMultiline : null, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
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
