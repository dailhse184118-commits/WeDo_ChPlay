import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import type { Project } from '../../lib/types';
import { colors, fontSize, gradients, radius, sizes, spacing } from '../../theme/tokens';

interface ProjectRowProps {
  project: Project;
  unreadCount: number;
  onPress: () => void;
  /** Vị trí trong danh sách, quyết định màu avatar. */
  index?: number;
}

/**
 * Dự án đầu tô gradient, các dự án sau luân phiên vàng nhạt và lục nhạt.
 * Danh sách toàn avatar cùng màu trông chết cứng; luân phiên làm nó có nhịp
 * mà không cần thêm màu mới vào bảng màu.
 */
function avatarStyle(index: number) {
  if (index === 0) {
    return { experimental_backgroundImage: gradients.header, textColor: '#ffffff' };
  }
  return index % 2 === 1
    ? { backgroundColor: colors.warningSoft, textColor: colors.warningText }
    : { backgroundColor: colors.successSoft, textColor: colors.success };
}

export function ProjectRow({ project, unreadCount, onPress, index = 0 }: ProjectRowProps) {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const { textColor, ...avatarBg } = avatarStyle(index);

  return (
    <Card testID={`project-row-${project.id}`} onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, avatarBg]}>
          <Text style={[styles.avatarText, { color: textColor }]}>
            {project.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {project._count?.members
              ? `${project._count.members} thành viên`
              : 'Kênh trò chuyện dự án'}
            {project._count?.tasks ? ` · ${project._count.tasks} việc` : ''}
          </Text>
        </View>

        {unreadCount > 0 ? (
          <View testID="unread-badge" style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { fontWeight: '700', fontSize: fontSize.lg },
  body: { flex: 1, marginLeft: spacing.sm + 4 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs + 2,
    marginLeft: spacing.sm,
  },
  badgeText: { color: '#ffffff', fontSize: fontSize.xs, fontWeight: '700' },
});
