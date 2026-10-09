import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MoiVaoNhomSheet } from './MoiVaoNhomSheet';
import { useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChat } from '../../i18n/tu-dien/chat';
import { laLeaderDuAn } from '../../lib/tasks/task-permissions';
import type { Project, Workspace } from '../../lib/types';
import { colors, radius, scale } from '../../theme/tokens';

interface NutMoiVaoNhomProps {
  meId: string;
  project: Project;
  /** Không gian CHỨA dự án (không phải không gian đang chọn) — chủ của nó cũng được mời. */
  workspace?: Workspace | null;
}

/**
 * Nút "Mời vào nhóm" ở đầu màn chat dự án. Chỉ hiện cho Leader dự án và chủ
 * không gian — đúng quy tắc máy chủ (`ensureProjectManager`), không bày nút
 * mà bấm vào chỉ nhận 403.
 */
export function NutMoiVaoNhom({ meId, project, workspace }: NutMoiVaoNhomProps) {
  const t = useTuDien(tuDienChat);
  const [mo, setMo] = useState(false);
  if (!laLeaderDuAn(meId, project, workspace)) return null;

  return (
    <>
      <Pressable
        testID="nut-moi-vao-nhom"
        accessibilityRole="button"
        accessibilityLabel={t.moi.moiVaoNhom}
        onPress={() => setMo(true)}
        hitSlop={8}
        style={styles.nut}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.onPrimary} />
      </Pressable>
      <MoiVaoNhomSheet
        visible={mo}
        projectId={project.id}
        projectName={project.name}
        onDismiss={() => setMo(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  nut: {
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
