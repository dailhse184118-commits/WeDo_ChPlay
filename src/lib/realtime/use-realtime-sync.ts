import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listProjects } from '../api/projects';
import { useSocket } from '../socket/socket-context';
import { useWorkspace } from '../workspace/workspace-context';
import { keysToInvalidate, projectRoomsToJoin } from './sync-rules';

/**
 * Giữ dữ liệu tươi bằng socket có sẵn, thay cho việc hỏi vòng theo nhịp.
 *
 * Máy chủ đã bắn `notification:new` tới phòng riêng của từng người và
 * `task:project:updated` tới phòng dự án. Trước đây app không nghe hai sự kiện
 * này, nên việc và thông báo chỉ hiện sau khi kéo làm mới bằng tay.
 *
 * Hỏi vòng mỗi vài giây là lựa chọn sai: dưới nền thì Android chặn, còn ở tiền
 * cảnh thì đốt pin và dội tải máy chủ để phần lớn lượt gọi trả về y hệt lần trước.
 */
export function useRealtimeSync(): void {
  const { socket, connected } = useSocket();
  const { active } = useWorkspace();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', active?.id],
    queryFn: () => listProjects(active?.id),
    enabled: Boolean(active?.id),
  });

  const projectIds = projectRoomsToJoin(projectsQuery.data ?? []).join(',');

  // Xin vào phòng của mọi dự án. Phải chạy lại sau mỗi lần kết nối lại: máy chủ
  // quên sạch danh sách phòng khi socket cũ đứt.
  useEffect(() => {
    if (!socket || !connected || !projectIds) return;

    for (const projectId of projectIds.split(',')) {
      socket.emit('join:project', { projectId });
    }
  }, [socket, connected, projectIds]);

  useEffect(() => {
    if (!socket) return;

    function invalidate(event: Parameters<typeof keysToInvalidate>[0]) {
      for (const queryKey of keysToInvalidate(event)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }

    const onNotification = () => invalidate('notification:new');
    const onTask = () => invalidate('task:project:updated');

    socket.on('notification:new', onNotification);
    socket.on('task:project:updated', onTask);

    return () => {
      socket.off('notification:new', onNotification);
      socket.off('task:project:updated', onTask);
    };
  }, [socket, queryClient]);
}
