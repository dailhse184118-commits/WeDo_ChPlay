import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { configureNotificationHandler, duongDanTuThongBao, taskIdFromResponse } from '../handler';
import {
  anTrenMayNay,
  demChuaDocHienThi,
  laThongBaoThanhToan,
  locThongBaoHienThi,
} from '../thanh-toan';
import type { NotificationItem } from '../../types';

jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));

/*
  App iPhone là bản đồng hành miễn phí (Guideline 3.1.3(f)): không được có lời
  nhắc gia hạn gói hay lối nào sang chỗ mua. Thông báo gói/thanh toán bị giấu
  trên iPhone; Android giữ nguyên như cũ.
*/

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

function tb(phan: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'Bạn được giao việc',
    message: '',
    userId: 'u1',
    createdAt: '2026-09-26T10:00:00.000Z',
    readAt: null,
    ...phan,
  };
}

const GIA_HAN = tb({ id: 'n2', type: 'SUBSCRIPTION_RENEWAL_DUE', title: 'Gói sắp hết hạn', actionUrl: '#/upgrade' });
const DA_TRA = tb({ id: 'n3', type: 'PAYMENT_CONFIRMED', title: 'Thanh toán thành công' });
const VIEC = tb({ id: 'n1', taskId: 't1' });

function phanHoi(data: unknown): Notifications.NotificationResponse {
  return { notification: { request: { content: { data } } } } as never;
}

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

describe('laThongBaoThanhToan', () => {
  it('nhận hai loại máy chủ đang có, và loại mới cùng tiền tố', () => {
    expect(laThongBaoThanhToan('SUBSCRIPTION_RENEWAL_DUE')).toBe(true);
    expect(laThongBaoThanhToan('PAYMENT_CONFIRMED')).toBe(true);
    expect(laThongBaoThanhToan('SUBSCRIPTION_EXPIRED')).toBe(true);
  });

  it('không đụng tới thông báo công việc, cuộc họp, tin nhắn', () => {
    expect(laThongBaoThanhToan('TASK_ASSIGNED')).toBe(false);
    expect(laThongBaoThanhToan('MEETING_SCHEDULED')).toBe(false);
    expect(laThongBaoThanhToan('DIRECT_MESSAGE')).toBe(false);
    expect(laThongBaoThanhToan(undefined)).toBe(false);
  });
});

describe('trên iPhone', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('danh sách không còn thông báo gói/thanh toán', () => {
    expect(locThongBaoHienThi([VIEC, GIA_HAN, DA_TRA])).toEqual([VIEC]);
    expect(anTrenMayNay('SUBSCRIPTION_RENEWAL_DUE')).toBe(true);
  });

  it('chạm vào push gói/thanh toán không mở màn nào', () => {
    expect(duongDanTuThongBao(phanHoi({ type: 'SUBSCRIPTION_RENEWAL_DUE', actionUrl: '#/upgrade' }))).toBeNull();
    expect(taskIdFromResponse(phanHoi({ type: 'PAYMENT_CONFIRMED', taskId: 't9' }))).toBeNull();
  });

  it('app đang mở: không hiện banner cho push gói/thanh toán', async () => {
    configureNotificationHandler();
    const cauHinh = (Notifications.setNotificationHandler as jest.Mock).mock.calls.at(-1)?.[0];

    const giaHan = await cauHinh.handleNotification({
      request: { content: { data: { type: 'SUBSCRIPTION_RENEWAL_DUE' } } },
    });
    const viec = await cauHinh.handleNotification({
      request: { content: { data: { type: 'TASK_ASSIGNED', taskId: 't1' } } },
    });

    expect(giaHan.shouldShowBanner).toBe(false);
    expect(viec.shouldShowBanner).toBe(true);
  });

  it('push khác vẫn mở như cũ', () => {
    expect(duongDanTuThongBao(phanHoi({ type: 'PROJECT_MESSAGE', projectId: 'p1' }))).toBe('/chat/p1');
    expect(taskIdFromResponse(phanHoi({ type: 'TASK_ASSIGNED', taskId: 't1' }))).toBe('t1');
  });

  /*
    Máy chủ đếm cả thông báo thanh toán chưa đọc. Không trừ ra thì huy hiệu
    báo "2" mà mở tab chỉ thấy một dòng.
  */
  it('huy hiệu trừ đi thông báo đang bị giấu', async () => {
    const dem = jest.fn(async () => ({ count: 3 }));
    const lay = jest.fn(async () => [VIEC, GIA_HAN, DA_TRA, tb({ id: 'n4', type: 'PAYMENT_CONFIRMED', readAt: 'x' })]);

    await expect(demChuaDocHienThi(dem, lay)).resolves.toEqual({ count: 1 });
  });

  it('không có gì chưa đọc thì không tải danh sách', async () => {
    const lay = jest.fn();

    await expect(demChuaDocHienThi(async () => ({ count: 0 }), lay)).resolves.toEqual({ count: 0 });
    expect(lay).not.toHaveBeenCalled();
  });

  it('tải danh sách hỏng thì giữ con số của máy chủ', async () => {
    const lay = jest.fn(async () => {
      throw new Error('mạng');
    });

    await expect(demChuaDocHienThi(async () => ({ count: 2 }), lay)).resolves.toEqual({ count: 2 });
  });
});

describe('trên Android — giữ nguyên như cũ', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('danh sách giữ đủ mọi thông báo', () => {
    expect(locThongBaoHienThi([VIEC, GIA_HAN, DA_TRA])).toEqual([VIEC, GIA_HAN, DA_TRA]);
    expect(anTrenMayNay('SUBSCRIPTION_RENEWAL_DUE')).toBe(false);
  });

  it('huy hiệu dùng đúng con số máy chủ, không tải thêm danh sách', async () => {
    const lay = jest.fn();

    await expect(demChuaDocHienThi(async () => ({ count: 3 }), lay)).resolves.toEqual({ count: 3 });
    expect(lay).not.toHaveBeenCalled();
  });

  it('push có taskId vẫn mở công việc như cũ, kể cả loại thanh toán', () => {
    expect(taskIdFromResponse(phanHoi({ type: 'PAYMENT_CONFIRMED', taskId: 't9' }))).toBe('t9');
  });
});
