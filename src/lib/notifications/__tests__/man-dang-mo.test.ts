import {
  datManDangMo,
  nenHienThongBao,
  quenManDangMo,
} from '../man-dang-mo';

describe('nênHiệnThôngBáo', () => {
  beforeEach(() => quenManDangMo());

  it('không mở màn chat nào thì hiện hết', () => {
    expect(nenHienThongBao({ type: 'DIRECT_MESSAGE', conversationId: 'c1' })).toBe(true);
    expect(nenHienThongBao({ type: 'PROJECT_MESSAGE', projectId: 'p1' })).toBe(true);
  });

  /*
    Đây là lý do tồn tại của mô-đun. Đang đọc đúng cuộc trò chuyện đó mà banner
    vẫn nhảy ra cho chính tin vừa hiện trên màn hình là thừa và trông cẩu thả.
  */
  it('im lặng với tin của đúng hội thoại đang mở', () => {
    datManDangMo('dm:c1');

    expect(nenHienThongBao({ type: 'DIRECT_MESSAGE', conversationId: 'c1' })).toBe(false);
  });

  it('vẫn báo tin của hội thoại khác', () => {
    datManDangMo('dm:c1');

    expect(nenHienThongBao({ type: 'DIRECT_MESSAGE', conversationId: 'c2' })).toBe(true);
  });

  it('im lặng với tin của đúng dự án đang mở', () => {
    datManDangMo('du-an:p1');

    expect(nenHienThongBao({ type: 'PROJECT_MESSAGE', projectId: 'p1' })).toBe(false);
    expect(nenHienThongBao({ type: 'PROJECT_MESSAGE', projectId: 'p2' })).toBe(true);
  });

  /*
    Rời màn thì phải quên đi. Thiếu bước này là người dùng thoát khỏi cuộc trò
    chuyện rồi mà vẫn không nhận được thông báo nào của nó nữa.
  */
  it('rời màn thì báo lại bình thường', () => {
    datManDangMo('dm:c1');
    quenManDangMo();

    expect(nenHienThongBao({ type: 'DIRECT_MESSAGE', conversationId: 'c1' })).toBe(true);
  });

  /*
    Nhắc hạn công việc và mọi thứ khác KHÔNG được chặn, dù đang mở màn nào. Đó
    là thứ có hạn chót, bỏ lỡ là mất việc thật.
  */
  it('không bao giờ chặn thông báo không phải tin nhắn', () => {
    datManDangMo('dm:c1');

    expect(nenHienThongBao({ type: 'TASK_DEADLINE_REMINDER', taskId: 't1' })).toBe(true);
    expect(nenHienThongBao(undefined)).toBe(true);
    expect(nenHienThongBao({})).toBe(true);
  });
});
