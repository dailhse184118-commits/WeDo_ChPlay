import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { TaskSubmissionPanel } from '../TaskSubmissionPanel';
import type { QuyenTrenTask } from '../../../lib/tasks/task-permissions';
import type { TaskSubmission } from '../../../lib/types';

const KHONG_QUYEN: QuyenTrenTask = { nopTaiLieu: false, guiDuyet: false, duyetBai: false };

function tep(ghiDe: Partial<TaskSubmission> = {}): TaskSubmission {
  return {
    id: 's1',
    taskId: 't1',
    uploaderId: 'u1',
    fileName: '9f3a-bao-cao.pdf',
    originalName: 'Báo cáo tuần 3.pdf',
    mimeType: 'application/pdf',
    size: 2 * 1024 * 1024,
    url: '/uploads/task-submissions/9f3a-bao-cao.pdf',
    createdAt: '2026-08-14T09:00:00.000Z',
    ...ghiDe,
  };
}

function dung(props: Partial<React.ComponentProps<typeof TaskSubmissionPanel>> = {}) {
  return render(
    <TaskSubmissionPanel
      quyen={KHONG_QUYEN}
      onPick={() => {}}
      onSubmitForReview={() => {}}
      onApprove={() => {}}
      onReject={() => {}}
      {...props}
    />,
  );
}

describe('danh sách tài liệu đã nộp', () => {
  it('hiện tên gốc của tệp chứ không phải tên máy chủ đặt lại', async () => {
    /*
      Máy chủ đổi tên tệp để không trùng nhau. Hiện `fileName` ra thì người dùng
      thấy một chuỗi băm vô nghĩa, không nhận ra tệp nào của mình.
    */
    const { getByText, queryByText } = await dung({ submissions: [tep()] });

    expect(getByText('Báo cáo tuần 3.pdf')).toBeTruthy();
    expect(queryByText('9f3a-bao-cao.pdf')).toBeNull();
  });

  it('hiện dung lượng tệp cho dễ ước lượng', async () => {
    const { getByText } = await dung({ submissions: [tep({ size: 2 * 1024 * 1024 })] });
    expect(getByText(/2[.,]0 MB/)).toBeTruthy();
  });

  it('không vẽ gì khi chưa có tệp và người xem cũng không có quyền gì', async () => {
    // Thanh vien thuong xem viec cua nguoi khac: dung bay ra cai the rong vo nghia.
    const { toJSON } = await dung();
    expect(toJSON()).toBeNull();
  });
});

describe('người phụ trách nộp bài', () => {
  it('bấm nộp tài liệu thì mở hộp chọn tệp', async () => {
    const onPick = jest.fn();
    const { getByTestId } = await dung({
      quyen: { ...KHONG_QUYEN, nopTaiLieu: true },
      onPick,
    });

    await fireEvent.press(getByTestId('submission-pick'));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('giấu nút nộp với người không phụ trách việc', async () => {
    const { queryByTestId } = await dung({ submissions: [tep()] });
    expect(queryByTestId('submission-pick')).toBeNull();
  });

  it('khoá nút gửi duyệt chừng nào chưa nộp tệp nào', async () => {
    /*
      `submitForReview` phía máy chủ ném 400 khi chưa có tệp. Khoá nút và nói rõ
      lý do thì hơn là để bấm rồi đọc thông báo lỗi.
    */
    const onSubmitForReview = jest.fn();
    const { getByTestId } = await dung({
      quyen: { nopTaiLieu: true, guiDuyet: false, duyetBai: false },
      onSubmitForReview,
    });

    const nut = getByTestId('submission-send');
    expect(nut.props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(nut);
    expect(onSubmitForReview).not.toHaveBeenCalled();
  });

  it('mở nút gửi duyệt khi đã có tệp', async () => {
    const onSubmitForReview = jest.fn();
    const { getByTestId } = await dung({
      quyen: { nopTaiLieu: true, guiDuyet: true, duyetBai: false },
      submissions: [tep()],
      onSubmitForReview,
    });

    await fireEvent.press(getByTestId('submission-send'));
    expect(onSubmitForReview).toHaveBeenCalledTimes(1);
  });
});

describe('leader duyệt bài', () => {
  const QUYEN_LEADER: QuyenTrenTask = { nopTaiLieu: false, guiDuyet: false, duyetBai: true };

  it('hiện hai nút duyệt và trả lại', async () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    const { getByTestId } = await dung({
      quyen: QUYEN_LEADER,
      submissions: [tep()],
      onApprove,
      onReject,
    });

    await fireEvent.press(getByTestId('review-approve'));
    await fireEvent.press(getByTestId('review-reject'));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('giấu hai nút đó với người không phải leader', async () => {
    const { queryByTestId } = await dung({
      quyen: { ...KHONG_QUYEN, nopTaiLieu: true },
    });
    expect(queryByTestId('review-approve')).toBeNull();
    expect(queryByTestId('review-reject')).toBeNull();
  });
});

describe('bài bị trả lại', () => {
  it('hiện lý do leader trả bài để người làm biết phải sửa gì', async () => {
    const { getByText } = await dung({
      quyen: { nopTaiLieu: true, guiDuyet: true, duyetBai: false },
      submissions: [tep()],
      reviewRejectedReason: 'Thiếu số liệu quý 2',
    });

    expect(getByText('Thiếu số liệu quý 2')).toBeTruthy();
  });
});
