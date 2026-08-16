import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

/**
 * Web client ID dự phòng, dùng khi bản build không khai biến môi trường.
 *
 * Đây là OAuth client dạng **Web** của project `alert-rush-501204-b6`. Nó không
 * phải bí mật — client ID Web nằm sẵn trong mọi bản web đã phát hành — nên nhúng
 * ở đây an toàn, và tránh được cảnh quên khai biến trên EAS là hỏng cả bản build.
 *
 * Hai client dạng **Android** (khoá tải lên EAS và khoá ký của Play) cố tình
 * không xuất hiện trong mã: chúng chỉ để Google cho phép gói `vn.wedo.app` ký
 * bằng hai chứng chỉ đó xin token.
 */
/**
 * Mã `DEVELOPER_ERROR` của Google Sign-In trên Android.
 *
 * Thư viện KHÔNG xuất hằng số cho mã này — `statusCodes` chỉ có
 * SIGN_IN_CANCELLED, IN_PROGRESS, PLAY_SERVICES_NOT_AVAILABLE, SIGN_IN_REQUIRED
 * và NULL_PRESENTER, đều lấy từ lớp native. Nên buộc phải so với số thô, và đặt
 * tên ở đây để chỗ dùng đọc ra nghĩa.
 *
 * Gần như luôn là sai SHA-1 hoặc OAuth client chưa đúng. Ngày 15/08/2026 mã này
 * làm người kiểm thử chỉ thấy con số "(10)" và mất một tiếng mới lần ra nguyên
 * nhân, vì phép so trước đó dùng chuỗi 'DEVELOPER_ERROR' — thứ Android không
 * bao giờ trả về.
 */
const MA_DEVELOPER_ERROR_ANDROID = '10';

const CLIENT_ID_DU_PHONG =
  '108450458549-b3g83it3kjnpihupihmj9kvd23fj8am3.apps.googleusercontent.com';

/**
 * Máy chủ đối chiếu `aud` của ID token với đúng một `GOOGLE_CLIENT_ID` — chính
 * là client dạng Web này. Khai sai giá trị thì máy chủ trả "Google token không
 * thuộc ứng dụng WEDO".
 *
 * `process.env.EXPO_PUBLIC_*` được thay bằng hằng số ngay lúc build, nên phải
 * viết nguyên cả biểu thức chứ không tra động qua `process.env[ten]`.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || CLIENT_ID_DU_PHONG;

/**
 * Bảo Google quên phiên đã chọn trên máy này.
 *
 * Không gọi hàm này thì đăng xuất khỏi WeDo chỉ xoá token của WeDo, còn Google
 * vẫn nhớ tài khoản — lần sau bấm "Tiếp tục với Google" là vào thẳng tài khoản
 * cũ, không hiện hộp chọn. Người dùng không đổi được tài khoản.
 *
 * Nuốt mọi lỗi: người đăng nhập bằng email chưa hề chạm tới Google, và việc
 * đăng xuất khỏi WeDo không được phụ thuộc vào việc Google có hợp tác hay không.
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Không có phiên Google nào để xoá. Đúng ý muốn.
  }
}

function maNativeCuaLoi(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return null;
}

/**
 * Mở hộp thoại chọn tài khoản Google và lấy ID token để gửi cho máy chủ.
 *
 * Trả về `null` khi người dùng tự đóng hộp thoại — đó không phải lỗi, màn hình
 * gọi hàm này không nên hiện băng đỏ trong trường hợp đó.
 *
 * Ném lỗi kèm thông báo tiếng Việt cho những trường hợp người dùng cần biết.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  // `configure` là thao tác nhẹ và `signIn` luôn chờ nó xong, nên gọi ngay trước
  // mỗi lần đăng nhập là đủ — khỏi cần một bước khởi tạo riêng lúc mở app.
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch (error) {
    if (maNativeCuaLoi(error) === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Máy chưa có Google Play Services nên không dùng được đăng nhập Google.');
    }
    throw error;
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    // Thư viện thường tự dịch mã huỷ thành kết quả `cancelled`, nhưng vẫn có
    // đường ném thẳng lên. Coi cả hai là một.
    const ma = maNativeCuaLoi(error);
    if (ma === statusCodes.SIGN_IN_CANCELLED) return null;

    /*
      Màn hình hiện thẳng `error.message` nên nếu không dịch, người dùng nhận
      được một băng đỏ ghi mã lỗi trần — vô nghĩa với họ.

      Vẫn giữ mã trong ngoặc: đó là thứ duy nhất lần ra được nguyên nhân khi
      người kiểm thử chụp màn hình gửi về.
    */
    if (ma === MA_DEVELOPER_ERROR_ANDROID || ma === 'DEVELOPER_ERROR') {
      throw new Error(
        'Google chưa chấp nhận ứng dụng này (DEVELOPER_ERROR). ' +
          'Kiểm tra SHA-1 của chứng chỉ ký và trạng thái Publish trong Google Cloud Console.',
      );
    }
    if (ma) {
      throw new Error(
        `Đăng nhập Google không thành công (${ma}). ` +
          'Vui lòng thử lại, hoặc đăng nhập bằng email và mật khẩu.',
      );
    }
    throw error;
  }

  if (response.type !== 'success') return null;

  const idToken = response.data.idToken;
  if (!idToken) {
    // Google chỉ cấp ID token khi `webClientId` khai đúng một client dạng Web.
    throw new Error('Google không trả về ID token. Kiểm tra lại Web client ID của ứng dụng.');
  }

  return idToken;
}
