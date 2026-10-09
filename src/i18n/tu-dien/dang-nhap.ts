import { khaiBaoTuDien } from '../dich';

/**
 * Chữ của đăng nhập, đăng ký, quên mật khẩu, ô đồng ý điều khoản và màn đồng ý
 * một lần, kèm câu lỗi do `lib/auth` (Apple, Google) tự ném ra.
 * Nút "Tiếp tục với Apple" là nút native của hệ điều hành, tự đổi ngôn ngữ theo máy nên không có ở đây.
 */
export const tuDienDangNhap = khaiBaoTuDien(
  {
    // Dùng chung các màn
    khauHieu: 'Nghĩ ít hơn, làm nhiều hơn',
    matKhau: 'Mật khẩu',
    matKhauGoiY: 'Ít nhất 6 ký tự',
    emailMau: 'ban@example.com',
    hoac: 'hoặc',
    hienMatKhau: 'Hiện mật khẩu',
    anMatKhau: 'Ẩn mật khẩu',
    tiepTucVoiGoogle: 'Tiếp tục với Google',
    thieuEmail: 'Vui lòng nhập email',
    matKhauNgan: 'Mật khẩu phải có ít nhất 6 ký tự',
    // Đăng nhập
    dangNhap: 'Đăng nhập',
    dangNhapThatBai: 'Đăng nhập thất bại. Vui lòng thử lại.',
    dangNhapGoogleThatBai: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
    dangNhapAppleThatBai: 'Đăng nhập Apple thất bại. Vui lòng thử lại.',
    quenMatKhauLink: 'Quên mật khẩu?',
    chuaCoTaiKhoan: 'Chưa có tài khoản? Đăng ký',
    // Đăng ký
    taoTaiKhoan: 'Tạo tài khoản',
    hoTen: 'Họ và tên',
    hoTenMau: 'Nguyễn Văn A',
    dangKy: 'Đăng ký',
    daCoTaiKhoan: 'Đã có tài khoản? Đăng nhập',
    canDongYDieuKhoan: 'Bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng để tạo tài khoản.',
    thieuHoTen: 'Họ và tên không được để trống',
    dangKyThanhCong: 'Đăng ký thành công',
    chaoMung: (ten: string) =>
      `Chào ${ten}, tài khoản của bạn đã sẵn sàng. Tạo dự án đầu tiên để bắt đầu nhé.`,
    dangKyThatBai: 'Đăng ký thất bại. Vui lòng thử lại.',
    // Quên mật khẩu
    quenMatKhau: 'Quên mật khẩu',
    huongDanNhapEmail: 'Nhập email bạn dùng để đăng ký. WeDo sẽ gửi cho bạn một mã gồm 6 chữ số.',
    guiMa: 'Gửi mã',
    khongGuiDuocMa: 'Không gửi được mã. Vui lòng thử lại.',
    daGuiMaDuPhong: 'Nếu email này có tài khoản, WeDo đã gửi mã đặt lại mật khẩu tới hộp thư của bạn.',
    maHieuLuc: 'Mã có hiệu lực trong 10 phút. Nhớ xem cả hộp thư rác.',
    maSau: 'Mã 6 số',
    maSauLoi: 'Mã gồm 6 chữ số',
    matKhauMoi: 'Mật khẩu mới',
    datLaiMatKhau: 'Đặt lại mật khẩu',
    datLaiThatBai: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.',
    daDoiMatKhau: 'Đã đổi mật khẩu',
    dangNhapBangMatKhauMoi: 'Hãy đăng nhập bằng mật khẩu mới.',
    nhapLaiEmail: 'Gõ nhầm email? Nhập lại',
    // Ô đồng ý điều khoản
    cauDongY: 'Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư',
    toiDu18: 'Tôi đủ 18 tuổi và đồng ý với',
    dieuKhoanSuDung: 'Điều khoản sử dụng',
    va: 'và',
    chinhSachRiengTu: 'Chính sách quyền riêng tư',
    // Màn đồng ý một lần
    chuaLuuDuoc: 'Chưa lưu được. Vui lòng thử lại.',
    truocKhiTiepTuc:
      'Trước khi tiếp tục dùng WeDo, bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng.',
    khongKhoanNhuong:
      'WeDo không chấp nhận nội dung phản cảm, quấy rối hay lạm dụng. Bạn có thể báo cáo tin nhắn hoặc chặn người vi phạm ngay trong app, và WeDo xem xét mọi báo cáo trong vòng 24 giờ.',
    dongYVaTiepTuc: 'Đồng ý và tiếp tục',
    dangXuat: 'Đăng xuất',
    // Lỗi do lib/auth ném ra
    appleKhongTaoDuocMa: 'Máy chưa tạo được mã bảo mật cho đăng nhập Apple. Vui lòng thử lại.',
    appleChiCoTrenIphone: 'Đăng nhập bằng Apple chỉ có trên iPhone.',
    appleKhongThanhCong: (ma: string) =>
      `Đăng nhập Apple không thành công (${ma}). Vui lòng thử lại, hoặc đăng nhập bằng email và mật khẩu.`,
    appleThieuMa: 'Apple không trả về mã xác minh. Vui lòng thử lại.',
    googleIphoneChuaHoTro: 'Bản iPhone chưa hỗ trợ đăng nhập Google. Vui lòng dùng email và mật khẩu.',
    googleThieuPlayServices: 'Máy chưa có Google Play Services nên không dùng được đăng nhập Google.',
    googleDeveloperError:
      'Google chưa chấp nhận ứng dụng này (DEVELOPER_ERROR). Kiểm tra SHA-1 của chứng chỉ ký và trạng thái Publish trong Google Cloud Console.',
    googleKhongThanhCong: (ma: string) =>
      `Đăng nhập Google không thành công (${ma}). Vui lòng thử lại, hoặc đăng nhập bằng email và mật khẩu.`,
    googleThieuIdToken: 'Google không trả về ID token. Kiểm tra lại Web client ID của ứng dụng.',
  },
  {
    khauHieu: 'Think less, do more',
    matKhau: 'Password',
    matKhauGoiY: 'At least 6 characters',
    emailMau: 'you@example.com',
    hoac: 'or',
    hienMatKhau: 'Show password',
    anMatKhau: 'Hide password',
    tiepTucVoiGoogle: 'Continue with Google',
    thieuEmail: 'Please enter your email',
    matKhauNgan: 'Password must be at least 6 characters',
    dangNhap: 'Sign in',
    dangNhapThatBai: 'Sign-in failed. Please try again.',
    dangNhapGoogleThatBai: 'Google sign-in failed. Please try again.',
    dangNhapAppleThatBai: 'Sign in with Apple failed. Please try again.',
    quenMatKhauLink: 'Forgot password?',
    chuaCoTaiKhoan: 'Don’t have an account? Sign up',
    taoTaiKhoan: 'Create account',
    hoTen: 'Full name',
    hoTenMau: 'Jane Smith',
    dangKy: 'Sign up',
    daCoTaiKhoan: 'Already have an account? Sign in',
    canDongYDieuKhoan: 'You need to confirm you are 18 or older and agree to the Terms of Use to create an account.',
    thieuHoTen: 'Full name is required',
    dangKyThanhCong: 'You’re all set',
    chaoMung: (ten: string) =>
      `Welcome, ${ten}! Your account is ready. Create your first project to get started.`,
    dangKyThatBai: 'Sign-up failed. Please try again.',
    quenMatKhau: 'Forgot password',
    huongDanNhapEmail: 'Enter the email you signed up with. WeDo will send you a 6-digit code.',
    guiMa: 'Send code',
    khongGuiDuocMa: 'Couldn’t send the code. Please try again.',
    daGuiMaDuPhong: 'If this email has an account, WeDo has sent a password reset code to your inbox.',
    maHieuLuc: 'The code is valid for 10 minutes. Check your spam folder too.',
    maSau: '6-digit code',
    maSauLoi: 'The code has 6 digits',
    matKhauMoi: 'New password',
    datLaiMatKhau: 'Reset password',
    datLaiThatBai: 'Couldn’t reset your password. Please try again.',
    daDoiMatKhau: 'Password changed',
    dangNhapBangMatKhauMoi: 'Sign in with your new password.',
    nhapLaiEmail: 'Wrong email? Enter it again',
    cauDongY: 'I am 18 or older and I agree to the Terms of Use and Privacy Policy',
    toiDu18: 'I am 18 or older and I agree to the',
    dieuKhoanSuDung: 'Terms of Use',
    va: 'and',
    chinhSachRiengTu: 'Privacy Policy',
    chuaLuuDuoc: 'Couldn’t save. Please try again.',
    truocKhiTiepTuc:
      'Before you keep using WeDo, please confirm you are 18 or older and agree to the Terms of Use.',
    khongKhoanNhuong:
      'WeDo has no tolerance for offensive content, harassment or abuse. You can report messages or block offenders right in the app, and WeDo reviews every report within 24 hours.',
    dongYVaTiepTuc: 'Agree and continue',
    dangXuat: 'Sign out',
    appleKhongTaoDuocMa: 'Your device couldn’t create a security code for Sign in with Apple. Please try again.',
    appleChiCoTrenIphone: 'Sign in with Apple is only available on iPhone.',
    appleKhongThanhCong: (ma: string) =>
      `Sign in with Apple didn’t work (${ma}). Please try again, or sign in with your email and password.`,
    appleThieuMa: 'Apple didn’t return a verification code. Please try again.',
    googleIphoneChuaHoTro: 'Google sign-in isn’t available on iPhone yet. Please use your email and password.',
    googleThieuPlayServices: 'This device doesn’t have Google Play Services, so Google sign-in isn’t available.',
    googleDeveloperError:
      'Google has not accepted this app (DEVELOPER_ERROR). Check the signing certificate SHA-1 and the Publish status in Google Cloud Console.',
    googleKhongThanhCong: (ma: string) =>
      `Google sign-in didn’t work (${ma}). Please try again, or sign in with your email and password.`,
    googleThieuIdToken: 'Google didn’t return an ID token. Check the app’s Web client ID.',
  },
);
