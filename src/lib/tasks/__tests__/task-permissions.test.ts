import { quyenTrenTask } from '../task-permissions';
import type { Project, Task, Workspace } from '../../types';

const TOI = 'u-toi';

function task(ghiDe: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Viết báo cáo',
    status: 'IN_PROGRESS',
    assignmentStatus: 'ACCEPTED',
    assigneeId: TOI,
    projectId: 'p1',
    workspaceId: 'w1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...ghiDe,
  };
}

function duAn(vaiTro: string, userId: string): Project {
  return {
    id: 'p1',
    name: 'WeDo',
    workspaceId: 'w1',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    members: [
      { id: 'm1', role: vaiTro, user: { id: userId, email: 'a@b.c', fullName: 'Ai đó' } },
    ],
  };
}

function khongGian(ownerId: string): Workspace {
  return {
    id: 'w1',
    name: 'Không gian của tôi',
    ownerId,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('nộp tài liệu', () => {
  it('cho phép khi tôi là người phụ trách, đã nhận việc và việc đang làm', () => {
    expect(quyenTrenTask({ task: task(), meId: TOI }).nopTaiLieu).toBe(true);
  });

  it('không cho người khác nộp hộ', () => {
    expect(quyenTrenTask({ task: task({ assigneeId: 'u-khac' }), meId: TOI }).nopTaiLieu).toBe(
      false,
    );
  });

  it('không cho nộp khi chưa bấm nhận việc', () => {
    expect(
      quyenTrenTask({ task: task({ assignmentStatus: 'PENDING' }), meId: TOI }).nopTaiLieu,
    ).toBe(false);
  });

  it('không cho nộp thêm khi bài đang chờ duyệt', () => {
    /*
      Máy chủ chỉ nhận tệp lúc trạng thái IN_PROGRESS. Hiện nút ở bước Chờ duyệt
      là dụ người dùng bấm để nhận 400.
    */
    expect(quyenTrenTask({ task: task({ status: 'REVIEW' }), meId: TOI }).nopTaiLieu).toBe(false);
  });
});

describe('gửi bài đi duyệt', () => {
  it('chỉ mở khi đã có ít nhất một tệp', () => {
    const chuaCoTep = quyenTrenTask({ task: task({ submissions: [] }), meId: TOI });
    expect(chuaCoTep.guiDuyet).toBe(false);

    const daCoTep = quyenTrenTask({
      task: task({
        submissions: [
          {
            id: 's1',
            taskId: 't1',
            uploaderId: TOI,
            fileName: 'a.pdf',
            originalName: 'a.pdf',
            size: 10,
            url: '/uploads/a.pdf',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
        ],
      }),
      meId: TOI,
    });
    expect(daCoTep.guiDuyet).toBe(true);
  });
});

describe('duyệt bài', () => {
  it('mở cho leader của dự án khi bài đang chờ duyệt', () => {
    expect(
      quyenTrenTask({
        task: task({ status: 'REVIEW', assigneeId: 'u-khac' }),
        meId: TOI,
        project: duAn('LEADER', TOI),
      }).duyetBai,
    ).toBe(true);
  });

  it('mở cho chủ không gian làm việc, dù không có tên trong dự án', () => {
    // Máy chủ coi chủ workspace ngang leader; bỏ sót thì chủ nhóm không duyệt được gì.
    expect(
      quyenTrenTask({
        task: task({ status: 'REVIEW', assigneeId: 'u-khac' }),
        meId: TOI,
        project: duAn('MEMBER', 'u-khac'),
        workspace: khongGian(TOI),
      }).duyetBai,
    ).toBe(true);
  });

  it('đóng với thành viên thường', () => {
    expect(
      quyenTrenTask({
        task: task({ status: 'REVIEW', assigneeId: 'u-khac' }),
        meId: TOI,
        project: duAn('MEMBER', TOI),
        workspace: khongGian('u-khac'),
      }).duyetBai,
    ).toBe(false);
  });

  it('đóng khi bài chưa được gửi duyệt', () => {
    expect(
      quyenTrenTask({
        task: task({ status: 'IN_PROGRESS' }),
        meId: TOI,
        project: duAn('LEADER', TOI),
      }).duyetBai,
    ).toBe(false);
  });

  it('đóng khi công việc chưa thuộc dự án nào', () => {
    // approveReview phía máy chủ ném 400 cho task lẻ không có projectId.
    expect(
      quyenTrenTask({
        task: task({ status: 'REVIEW', projectId: null }),
        meId: TOI,
        workspace: khongGian(TOI),
      }).duyetBai,
    ).toBe(false);
  });

  it('vẫn mở khi leader tự giao việc cho chính mình', () => {
    /*
      Máy chủ KHÔNG cấm tự duyệt. Nhóm nhỏ thì leader tự nhận việc là chuyện
      thường — chặn ở đây sẽ khiến việc của họ kẹt ở Chờ duyệt trên di động
      trong khi bản web vẫn duyệt được.
    */
    expect(
      quyenTrenTask({
        task: task({ status: 'REVIEW', assigneeId: TOI }),
        meId: TOI,
        project: duAn('LEADER', TOI),
      }).duyetBai,
    ).toBe(true);
  });
});
