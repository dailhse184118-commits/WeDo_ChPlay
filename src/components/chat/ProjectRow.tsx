import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Project } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface ProjectRowProps {
  project: Project;
  unreadCount: number;
  onPress: () => void;
}

export function ProjectRow({ project, unreadCount, onPress }: ProjectRowProps) {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      testID={`project-row-${project.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{project.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        {project.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {project.description}
          </Text>
        ) : null}
      </View>

      {unreadCount > 0 ? (
        <View testID="unread-badge" style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  body: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  description: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  badgeText: { color: '#ffffff', fontSize: fontSize.xs, fontWeight: '700' },
});
