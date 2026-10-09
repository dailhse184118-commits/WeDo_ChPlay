import { Alert, type AlertButton } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';

import { datDongYAI } from '../../api/account';
import { useAuth } from '../../auth/auth-context';
import { theoNgonNgu } from '../../../i18n/dich';
import { tuDienChat } from '../../../i18n/tu-dien/chat';
import { useDongYAI } from '../dong-y-ai';

jest.mock('../../api/account', () => ({ datDongYAI: jest.fn() }));
jest.mock('../../auth/auth-context', () => ({ useAuth: jest.fn() }));

const mockedDongY = datDongYAI as jest.MockedFunction<typeof datDongYAI>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const hoSo = { id: 'u1', email: 'a@wedo.vn', fullName: 'An' };
let capNhatHoSo: jest.Mock;
let nutCuaHopThoai: AlertButton[] = [];

function datHoSo(aiConsentAt: string | null | undefined) {
  mockedAuth.mockReturnValue({ user: { ...hoSo, aiConsentAt }, capNhatHoSo } as never);
}

function bam(nhan: string) {
  nutCuaHopThoai.find((nut) => nut.text === nhan)?.onPress?.();
}

beforeEach(() => {
  jest.clearAllMocks();
  capNhatHoSo = jest.fn();
  nutCuaHopThoai = [];
  jest.spyOn(Alert, 'alert').mockImplementation((_tieuDe, _noiDung, nut) => {
    nutCuaHopThoai = nut ?? [];
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

/*
  Chính sách quyền riêng tư hứa app hỏi trước lần đầu gửi tin nhắn cho AI. Bản
  Android từng gửi thẳng khi nhấn giữ, không hỏi gì.
*/
describe('useDongYAI', () => {
  it('chưa đồng ý: hỏi trước, chưa chạy gì', async () => {
    datHoSo(null);
    const hanhDong = jest.fn();
    const { result } = await renderHook(() => useDongYAI());

    result.current.xinDongYRoiChay(hanhDong);

    const t = theoNgonNgu(tuDienChat).dongYAI;
    expect(Alert.alert).toHaveBeenCalledWith(t.tieuDe, t.noiDung, expect.any(Array));
    expect(hanhDong).not.toHaveBeenCalled();
    expect(mockedDongY).not.toHaveBeenCalled();
  });

  it('bấm Đồng ý: lưu lên máy chủ, ghi vào hồ sơ rồi mới chạy', async () => {
    datHoSo(undefined);
    mockedDongY.mockResolvedValue({ aiConsentAt: '2026-10-01T00:00:00.000Z' });
    const hanhDong = jest.fn();
    const { result } = await renderHook(() => useDongYAI());

    result.current.xinDongYRoiChay(hanhDong);
    bam('Đồng ý');

    await waitFor(() => expect(hanhDong).toHaveBeenCalledTimes(1));
    expect(mockedDongY).toHaveBeenCalledWith(true);
    expect(capNhatHoSo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', aiConsentAt: '2026-10-01T00:00:00.000Z' }),
    );
  });

  it('từ chối: không gửi gì cho AI', async () => {
    datHoSo(null);
    const hanhDong = jest.fn();
    const { result } = await renderHook(() => useDongYAI());

    result.current.xinDongYRoiChay(hanhDong);
    bam('Không, cảm ơn');

    expect(hanhDong).not.toHaveBeenCalled();
    expect(mockedDongY).not.toHaveBeenCalled();
  });

  it('lưu lựa chọn hỏng: báo lỗi, không chạy', async () => {
    datHoSo(null);
    mockedDongY.mockRejectedValue(new Error('Mất mạng'));
    const hanhDong = jest.fn();
    const { result } = await renderHook(() => useDongYAI());

    result.current.xinDongYRoiChay(hanhDong);
    bam('Đồng ý');

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Chưa lưu được lựa chọn', 'Mất mạng'));
    expect(hanhDong).not.toHaveBeenCalled();
  });

  it('đã đồng ý: chạy luôn, không hỏi lại', async () => {
    datHoSo('2026-09-01T00:00:00.000Z');
    const hanhDong = jest.fn();
    const { result } = await renderHook(() => useDongYAI());

    expect(result.current.daDongY).toBe(true);
    result.current.xinDongYRoiChay(hanhDong);

    expect(hanhDong).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
