import AsyncStorage from '@react-native-async-storage/async-storage';

/*
  Workspace người dùng chọn LÚC BẤM MUA gói Team, theo mã gói.

  Giao dịch có thể về rất lâu sau (tắt app giữa chừng, máy chủ hỏng nên chưa
  finish, StoreKit đưa lại ở lần mở sau). Giữ trong bộ nhớ thì tắt app là mất,
  và gói Team sẽ gắn nhầm vào workspace đang tô sáng. Nên ghi xuống bộ nhớ bền
  trước khi mở bảng Apple, xoá sau khi máy chủ nhận và đã finish.

  Bộ nhớ hỏng thì nuốt lỗi: màn Nâng cấp còn phương án dự phòng là workspace
  đang chọn trên màn.
*/
const KHOA = 'wedo.iap.workspaceTheoGoi';

async function docBang(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KHOA);
    const bang = raw ? (JSON.parse(raw) as unknown) : null;
    return bang && typeof bang === 'object' ? (bang as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Workspace đã ghi cho mã gói này, hoặc `null` nếu chưa ghi. */
export async function docWorkspaceLucMua(sku: string): Promise<string | null> {
  const id = (await docBang())[sku];
  return typeof id === 'string' && id ? id : null;
}

export async function ghiWorkspaceLucMua(sku: string, workspaceId: string): Promise<void> {
  try {
    const bang = await docBang();
    bang[sku] = workspaceId;
    await AsyncStorage.setItem(KHOA, JSON.stringify(bang));
  } catch {
    // Không ghi được thì lúc nhận dùng workspace đang chọn trên màn.
  }
}

export async function xoaWorkspaceLucMua(sku: string): Promise<void> {
  try {
    const bang = await docBang();
    if (!(sku in bang)) return;
    delete bang[sku];
    await AsyncStorage.setItem(KHOA, JSON.stringify(bang));
  } catch {
    // Để lại một dòng thừa cũng không sao: lần mua sau ghi đè.
  }
}
