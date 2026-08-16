import {
  FORM_TAO_TASK_RONG,
  dungInputTaoTask,
  hanChotSangISO,
  type FormTaoTask,
} from '../tao-task';

const form = (ghiDe: Partial<FormTaoTask> = {}): FormTaoTask => ({
  ...FORM_TAO_TASK_RONG,
  ...ghiDe,
});

describe('hanChotSangISO', () => {
  it('đặt hạn vào cuối ngày', () => {
    /*
      "Hạn chót ngày 2/9" nghĩa là hết ngày 2/9. Đặt 0 giờ sáng thì người dùng
      mất trọn một ngày làm việc so với thứ họ nghĩ.
    */
    const iso = hanChotSangISO('02/09/2026');
    const d = new Date(iso!);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(59);
    expect(d.getDate()).toBe(2);
    expect(d.getMonth()).toBe(8);
  });

  it('nhận cả dạng một chữ số', () => {
    expect(hanChotSangISO('2/9/2026')).not.toBeNull();
  });

  it('từ chối ngày không tồn tại thay vì cuộn sang tháng sau', () => {
    /*
      `new Date(2026, 1, 31)` âm thầm thành 03/03. Không kiểm ngược thì người
      dùng gõ 31/02 và nhận về hạn chót đầu tháng 3 mà không ai báo gì.
    */
    expect(hanChotSangISO('31/02/2026')).toBeNull();
  });

  it('từ chối chuỗi sai định dạng', () => {
    expect(hanChotSangISO('2026-09-02')).toBeNull();
    expect(hanChotSangISO('linh tinh')).toBeNull();
  });
});

describe('dungInputTaoTask', () => {
  it('bắt buộc có tên công việc', () => {
    expect(dungInputTaoTask(form({ tieuDe: '   ' }), 'w-1').loi).toBe(
      'Nhập tên công việc trước đã.',
    );
  });

  it('cắt khoảng trắng thừa quanh tên', () => {
    const { input } = dungInputTaoTask(form({ tieuDe: '  Dịch tài liệu  ' }), 'w-1');
    expect(input?.title).toBe('Dịch tài liệu');
  });

  it('chặn khi chưa có không gian làm việc', () => {
    // Máy chủ bắt buộc workspaceId. Chặn ở đây để nhận câu tiếng Việt thay vì 400 thô.
    expect(dungInputTaoTask(form({ tieuDe: 'A' }), null).loi).toBe(
      'Chưa chọn không gian làm việc.',
    );
  });

  it('bỏ hẳn trường rỗng thay vì gửi chuỗi trắng', () => {
    const { input } = dungInputTaoTask(form({ tieuDe: 'A', moTa: '   ' }), 'w-1');

    // Máy chủ phân biệt "không gửi" với "gửi rỗng"; gửi rỗng tạo ra công việc
    // có mô tả là một khoảng trắng.
    expect(input).toEqual({ title: 'A', workspaceId: 'w-1' });
    expect('description' in input!).toBe(false);
  });

  it('kèm dự án và người phụ trách khi có chọn', () => {
    const { input } = dungInputTaoTask(
      form({ tieuDe: 'A', projectId: 'p-1', assigneeId: 'u-9' }),
      'w-1',
    );
    expect(input?.projectId).toBe('p-1');
    expect(input?.assigneeId).toBe('u-9');
  });

  it('báo lỗi khi hạn chót sai định dạng, không lặng lẽ bỏ qua', () => {
    const { input, loi } = dungInputTaoTask(
      form({ tieuDe: 'A', hanChot: '30 thang 2' }),
      'w-1',
    );

    // Bỏ qua lặng lẽ thì người dùng tưởng đã đặt hạn, tới lúc trễ mới biết.
    expect(input).toBeNull();
    expect(loi).toContain('02/09/2026');
  });
});
