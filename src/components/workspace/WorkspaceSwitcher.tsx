import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Workspace } from '../../lib/types';
import {
  colors,
  fontSize,
  lineHeight,
  radius,
  scaleWithFont,
  shadows,
  sizes,
  spacing,
} from '../../theme/tokens';

interface WorkspaceSwitcherProps {
  visible: boolean;
  workspaces: Workspace[];
  activeId?: string;
  /** Chỉ gọi khi người dùng chọn một cái KHÁC cái đang dùng. */
  onSelect: (workspaceId: string) => void;
  onDismiss: () => void;
}

/**
 * Sheet chọn không gian làm việc.
 *
 * Người dùng thuộc nhiều workspace vẫn chỉ thấy được cái đầu tiên, vì trước đây
 * không có chỗ nào bấm để đổi — `WorkspaceProvider` đã trả về cả danh sách từ
 * lâu nhưng không ai dùng tới.
 */
export function WorkspaceSwitcher({
  visible,
  workspaces,
  activeId,
  onSelect,
  onDismiss,
}: WorkspaceSwitcherProps) {
  const handlePress = (workspaceId: string) => {
    // Chọn lại chính cái đang dùng thì không có gì để đổi, chỉ đóng sheet.
    if (workspaceId !== activeId) {
      onSelect(workspaceId);
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.heading}>Không gian làm việc</Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {workspaces.map((workspace) => {
            const dangDung = workspace.id === activeId;

            return (
              <Pressable
                key={workspace.id}
                testID={`workspace-${workspace.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: dangDung }}
                onPress={() => handlePress(workspace.id)}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <View style={[styles.avatar, dangDung ? styles.avatarActive : null]}>
                  <Text style={[styles.avatarText, dangDung ? styles.avatarTextActive : null]}>
                    {workspace.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.name, dangDung ? styles.nameActive : null]} numberOfLines={2}>
                  {workspace.name}
                </Text>

                {dangDung ? (
                  <Ionicons name="checkmark-circle" size={sizes.icon} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    boxShadow: shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: scaleWithFont(44),
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  /* Nhiều workspace thì cuộn, không đẩy sheet cao quá nửa màn hình. */
  list: { maxHeight: scaleWithFont(320) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  rowPressed: { opacity: 0.6 },
  avatar: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: { backgroundColor: colors.primarySoft },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textMuted },
  avatarTextActive: { color: colors.primary },
  name: { flex: 1, fontSize: fontSize.md, lineHeight: lineHeight.md, color: colors.text },
  nameActive: { fontWeight: '700', color: colors.primary },
});
