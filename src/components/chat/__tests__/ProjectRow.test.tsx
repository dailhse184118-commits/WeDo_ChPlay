import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ProjectRow } from '../ProjectRow';
import type { Project } from '../../../lib/types';

const project: Project = {
  id: 'p1',
  name: 'Đồ án tốt nghiệp',
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '2026-08-04T00:00:00.000Z',
  updatedAt: '2026-08-04T00:00:00.000Z',
};

describe('ProjectRow', () => {
  it('hiện tên dự án', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={() => {}} />,
    );
    expect(getByText('Đồ án tốt nghiệp')).toBeTruthy();
  });

  it('ẩn badge khi không có tin chưa đọc', async () => {
    const { queryByTestId } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={() => {}} />,
    );
    expect(queryByTestId('unread-badge')).toBeNull();
  });

  it('hiện số tin chưa đọc', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={5} onPress={() => {}} />,
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('rút gọn thành 99+ khi quá lớn', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={150} onPress={() => {}} />,
    );
    expect(getByText('99+')).toBeTruthy();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={onPress} />,
    );

    await fireEvent.press(getByTestId('project-row-p1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
