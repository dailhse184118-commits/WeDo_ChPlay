import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { colors, fontSize, spacing } from '../../../theme/tokens';

export default function NotificationsScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Thông báo</Text>
      <Text style={styles.body}>Thông báo của bạn sẽ hiển thị ở đây.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  body: { fontSize: fontSize.sm, color: colors.textMuted },
});
