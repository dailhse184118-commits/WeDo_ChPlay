import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Chữ của khu vực Trò chuyện: danh sách dự án và tin nhắn riêng, khung chat dự
 * án, khung chat riêng, ô soạn tin, phiếu đề xuất công việc từ AI, hộp thoại xin
 * đồng ý dùng AI, màn Bạn bè và hai bảng mã mời.
 *
 * Nội dung tin nhắn là dữ liệu của người dùng nên không bao giờ nằm ở đây.
 */
export const tuDienChat = khaiBaoTuDien(
  {
    // Danh sách trò chuyện
    tieuDe: 'Trò chuyện',
    chao: (ten: string) => `Chào ${ten}`,
    tabDuAn: 'Dự án',
    tinNhan: 'Tin nhắn',
    timDuAn: 'Tìm dự án',
    banBe: (soLoiMoi: number): string =>
      soLoiMoi > 0 ? `Bạn bè, ${soLoiMoi} lời mời đang chờ` : 'Bạn bè',
    nhanTinMoi: 'Nhắn tin mới',
    nhanTinChoAi: 'Nhắn tin cho ai',
    khongCoThanhVienKhac: 'Không gian này chưa có thành viên nào khác',
    nhapMaMoi: 'Nhập mã mời',
    khongTaiDuocDuAn: 'Không tải được danh sách dự án.',
    khongTaiDuocTinNhan: 'Không tải được danh sách tin nhắn.',
    khongMoDuocCuocTroChuyen: 'Không mở được cuộc trò chuyện',
    thuLaiSau: 'Thử lại sau.',
    trongTinNhanTieuDe: 'Chưa có cuộc trò chuyện nào',
    trongTinNhanThan:
      'Chạm "Nhắn tin mới" để chọn một người trong không gian làm việc, hoặc bấm biểu tượng người ở góc trên để kết bạn với người ngoài không gian.',
    khongTimThayDuAn: 'Không tìm thấy dự án nào',
    chuaCoDuAn: 'Chưa có dự án nào',
    thuTuKhoaKhac: 'Thử từ khoá khác, hoặc xoá ô tìm kiếm để xem tất cả.',
    khongGianChuaCoDuAn:
      'Không gian làm việc này chưa có dự án. Tạo dự án trên web WeDo, rồi quay lại đây để trò chuyện cùng nhóm.',

    // Dòng dự án, dòng cuộc trò chuyện
    soThanhVien: (n: number) => `${n} thành viên`,
    soViec: (n: number) => `${n} việc`,
    kenhDuAn: 'Kênh trò chuyện dự án',
    dangHoatDong: 'Đang hoạt động',

    // Khung chat
    chuaCoTinNhan: 'Chưa có tin nhắn nào',
    trongDuAnAI:
      'Gửi tin nhắn đầu tiên. Nhấn giữ một tin nhắn bất kỳ để nhờ AI biến nó thành công việc.',
    trongDuAn: 'Gửi tin nhắn đầu tiên cho cả nhóm.',
    trongRieng: 'Gửi lời chào để bắt đầu cuộc trò chuyện.',
    khongTaiDuocTin: 'Không tải được tin nhắn.',
    khongTaiDuocTinCu: 'Không tải được tin nhắn cũ hơn.',
    khongGuiDuocAnh: 'Không gửi được ảnh.',
    khongMoDuocAnh: 'Không mở được ảnh.',
    khongPhanTichDuoc: 'Không phân tích được tin nhắn.',
    chuaGuiDuocTin: 'Chưa gửi được tin nhắn',
    tinChuaToiNhom: (noiDung: string) =>
      `"${noiDung}" chưa tới nhóm. Mở lại dự án đó để gửi lại.`,
    chuaGuiDuocAnh: 'Chưa gửi được ảnh',
    anhChuaToiNhom: (cauLoi: string) =>
      `${cauLoi} Ảnh chưa tới nhóm trước — mở lại dự án đó để gửi lại.`,
    aiTaoViec: 'Tạo công việc bằng AI',
    daTaoViec: 'Đã tạo công việc',
    xemCongViec: 'Xem công việc',
    chuaGanDuoc:
      'Đã tạo công việc nhưng chưa gắn được vào tin nhắn. Bấm "Tạo công việc" để thử gắn lại — sẽ không tạo thêm công việc mới.',
    thaoTacVoi: (ten: string) => `Thao tác với ${ten}`,
    dangNhap1: (a: string) => `${a} đang nhập…`,
    dangNhap2: (a: string, b: string) => `${a} và ${b} đang nhập…`,
    dangNhapNhieu: (n: number) => `${n} người đang nhập…`,

    // Bong bóng và ô soạn tin
    daThuHoi: 'Tin nhắn đã được thu hồi',
    giuDeXem: 'Nhấn giữ để xem thao tác với tin nhắn này',
    anhCua: (ten: string) => `Ảnh ${ten}`,
    dangGui: 'Đang gửi…',
    guiLai: 'Gửi lại',
    dongAnh: 'Đóng ảnh',
    boAnh: (viTri: number) => `Bỏ ảnh ${viTri}`,
    chupAnh: 'Chụp ảnh',
    chonAnhTuMay: 'Chọn ảnh từ máy',
    soanTin: 'Soạn tin nhắn',
    nhapTin: 'Nhập tin nhắn…',
    gui: 'Gửi',

    // Gửi dở dang
    guiDoDang: (daGui: number, tongSo: number, loai: string, cau: string, conLai: number) =>
      `Đã gửi ${daGui}/${tongSo} ${loai}. ${cau} Bấm Gửi để gửi tiếp ${conLai} ${loai} còn lại.`,
    guiDoDangMotPhan: (daGui: number, tongSo: number, cau: string) =>
      `Đã gửi ${daGui}/${tongSo} tệp. ${cau}`,
    loaiAnh: 'ảnh',
    khongGuiDuocTep: 'Không gửi được tệp.',
    khongGuiDuoc: 'Không gửi được.',
    chonItNhatMotAnh: 'Hãy chọn ít nhất một ảnh để gửi.',

    // Phiếu đề xuất công việc
    goiY: {
      tinCay: { low: 'Tin cậy thấp', medium: 'Tin cậy trung bình', high: 'Tin cậy cao' },
      nhapTenViec: 'Vui lòng nhập tên công việc',
      aiDangDoc: 'AI đang đọc tin nhắn…',
      thuongMatVaiGiay: 'Thường mất vài giây. Bạn có thể đóng lại và làm việc khác.',
      deXuat: 'Đề xuất công việc',
      kiemTraLai: 'Bạn kiểm tra lại trước khi tạo nhé',
      khongCoViec: 'Tin nhắn này có vẻ không chứa công việc',
      tuNhap: 'Bạn vẫn có thể tự nhập nội dung bên dưới để tạo công việc.',
      tenViec: 'Tên công việc',
      viDuTen: 'Ví dụ: Khảo sát người dùng',
      moTa: 'Mô tả',
      khongBatBuoc: 'Không bắt buộc',
      nguoiPhuTrach: 'Người phụ trách',
      chuaGiao: 'Chưa giao',
      ban: 'Bạn',
      ngayHetHan: 'Ngày hết hạn',
      gio: 'Giờ',
      taoViec: 'Tạo công việc',
      loiNgay: 'Ngày hết hạn chưa đúng. Viết theo dạng ngày/tháng/năm, ví dụ 30/09/2026.',
      loiGio: 'Giờ chưa đúng. Viết theo dạng giờ:phút, ví dụ 08:00, 8:00 hoặc 20h.',
      loiKhongXacDinh: 'Đã xảy ra lỗi không xác định.',
    },

    // Hộp thoại xin đồng ý dùng AI.
    // Guideline 5.1.2(i) của Apple nêu đích danh AI bên thứ ba: phải nói rõ gửi GÌ,
    // cho AI nào, và xin phép TRƯỚC lần gửi đầu tiên. Bản tiếng Anh phải giữ đúng ba ý đó.
    dongYAI: {
      tieuDe: 'Dùng AI để gợi ý công việc?',
      noiDung:
        'Để gợi ý công việc, WeDo sẽ gửi tin nhắn bạn chọn cùng khoảng 12 tin nhắn gần nhất và tên các thành viên trong dự án cho một nhà cung cấp AI bên thứ ba (Google Gemini, Azure OpenAI hoặc OpenAI). WeDo không gửi email hay số điện thoại của ai. Bạn có thể tắt tính năng này bất cứ lúc nào trong Tài khoản.',
      khongCamOn: 'Không, cảm ơn',
      dongY: 'Đồng ý',
      chuaLuuDuoc: 'Chưa lưu được lựa chọn',
      coLoi: 'Có lỗi xảy ra. Vui lòng thử lại.',
    },

    // Bạn bè
    ban: {
      tieuDe: 'Bạn bè',
      timTheo: 'Tìm theo tên, email hoặc số điện thoại',
      oTim: 'Tên, email hoặc số điện thoại',
      goiYTuKhoa: (n: number) => `Gõ ít nhất ${n} ký tự để tìm.`,
      ketQuaTim: 'Kết quả tìm kiếm',
      khongThayAi: (tuKhoa: string) =>
        `Không tìm thấy ai khớp "${tuKhoa}". Thử email đầy đủ hoặc số điện thoại của bạn ấy.`,
      loiMoiChoBan: (n: number) => `Lời mời đang chờ bạn (${n})`,
      banBeDem: (n: number) => `Bạn bè (${n})`,
      daGuiDangCho: (n: number) => `Đã gửi, đang chờ (${n})`,
      chuaCoAi:
        'Chưa có ai. Gõ tên, email hoặc số điện thoại của bạn học vào ô tìm kiếm ở trên rồi bấm "Kết bạn".',
      nhanTin: 'Nhắn tin',
      ketBan: 'Kết bạn',
      daGuiLoiMoi: 'Đã gửi lời mời',
      duyet: 'Duyệt',
      tuChoi: 'Từ chối',
      thaoTacKhac: (ten: string) => `Thao tác khác với ${ten}`,
    },

    // Mã mời vào dự án
    moi: {
      moiVaoNhom: 'Mời vào nhóm',
      moTaChiaSe: 'Ai có link hoặc mã sẽ vào thẳng dự án với vai trò Thành viên.',
      chiTiet: (hanMoi: string, soNguoi: number) =>
        `Hết hạn ${hanMoi} · ${soNguoi} người đã tham gia`,
      chuaCoLink: 'Dự án chưa có link mời đang dùng.',
      chiaSeLink: 'Chia sẻ link mời',
      taoLinkMoi: 'Tạo link mới',
      taoLinkMoiHoi: 'Tạo link mới?',
      taoLinkMoiNoiDung: 'Link và mã cũ sẽ không dùng được nữa.',
      tatLink: 'Tắt link',
      tatLinkHoi: 'Tắt link mời?',
      tatLinkNoiDung: 'Không ai vào được bằng link hay mã này nữa.',
      moTaNhapMa: 'Mã gồm 8 ký tự Leader gửi kèm link mời, ví dụ 7K3M-9QXA.',
      maMoi: 'Mã mời',
      xemTruoc: (khongGian: string, leader: string, soThanhVien: number) =>
        `Không gian ${khongGian} · Leader ${leader} · ${soThanhVien} thành viên`,
      thamGia: 'Tham gia',
      xemLoiMoi: 'Xem lời mời',
      maSai: 'Mã mời không đúng hoặc không còn dùng được.',
      hetHan: 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
      daTat: 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.',
      duAnDong: 'Dự án này đã đóng, không nhận thêm thành viên.',
      quaNhieuLan: 'Bạn thử quá nhiều lần. Đợi một phút rồi thử lại.',
      coLoi: 'Có lỗi xảy ra. Thử lại sau ít phút.',
      chiaSeNoiDung: (tenDuAn: string, url: string, ma: string) =>
        `Tham gia dự án ${tenDuAn} trên WeDo: ${url}. Hoặc nhập mã ${ma} trong app.`,
    },
  },
  {
    // Danh sách trò chuyện
    tieuDe: 'Chat',
    chao: (ten: string) => `Hi ${ten}`,
    tabDuAn: 'Projects',
    tinNhan: 'Messages',
    timDuAn: 'Search projects',
    banBe: (soLoiMoi: number): string =>
      soLoiMoi > 0
        ? soNhieu('en', soLoiMoi, {
            mot: 'Friends, {so} pending request',
            nhieu: 'Friends, {so} pending requests',
          })
        : 'Friends',
    nhanTinMoi: 'New message',
    nhanTinChoAi: 'Message someone',
    khongCoThanhVienKhac: 'No other members in this workspace yet',
    nhapMaMoi: 'Enter invite code',
    khongTaiDuocDuAn: 'Couldn’t load your projects.',
    khongTaiDuocTinNhan: 'Couldn’t load your messages.',
    khongMoDuocCuocTroChuyen: 'Couldn’t open the conversation',
    thuLaiSau: 'Try again later.',
    trongTinNhanTieuDe: 'No conversations yet',
    trongTinNhanThan:
      'Tap “New message” to pick someone in your workspace, or tap the people icon at the top to add friends from outside it.',
    khongTimThayDuAn: 'No projects found',
    chuaCoDuAn: 'No projects yet',
    thuTuKhoaKhac: 'Try a different keyword, or clear the search to see everything.',
    khongGianChuaCoDuAn:
      'This workspace has no projects yet. Create a project on the WeDo web app, then come back here to chat with your team.',

    // Dòng dự án, dòng cuộc trò chuyện
    soThanhVien: (n: number) => soNhieu('en', n, { mot: '{so} member', nhieu: '{so} members' }),
    soViec: (n: number) => soNhieu('en', n, { mot: '{so} task', nhieu: '{so} tasks' }),
    kenhDuAn: 'Project chat',
    dangHoatDong: 'Active now',

    // Khung chat
    chuaCoTinNhan: 'No messages yet',
    trongDuAnAI:
      'Send the first message. Press and hold any message to ask AI to turn it into a task.',
    trongDuAn: 'Send the first message to the whole team.',
    trongRieng: 'Say hi to start the conversation.',
    khongTaiDuocTin: 'Couldn’t load messages.',
    khongTaiDuocTinCu: 'Couldn’t load older messages.',
    khongGuiDuocAnh: 'Couldn’t send the photo.',
    khongMoDuocAnh: 'Couldn’t open the photo.',
    khongPhanTichDuoc: 'Couldn’t analyze the message.',
    chuaGuiDuocTin: 'Message not sent',
    tinChuaToiNhom: (noiDung: string) =>
      `“${noiDung}” didn’t reach the team. Reopen that project to send it again.`,
    chuaGuiDuocAnh: 'Photo not sent',
    anhChuaToiNhom: (cauLoi: string) =>
      `${cauLoi} The photo didn’t reach the previous team — reopen that project to send it again.`,
    aiTaoViec: 'Create task with AI',
    daTaoViec: 'Task created',
    xemCongViec: 'View task',
    chuaGanDuoc:
      'The task was created but couldn’t be linked to the message. Tap “Create task” to try linking again — it won’t create another task.',
    thaoTacVoi: (ten: string) => `Actions for ${ten}`,
    dangNhap1: (a: string) => `${a} is typing…`,
    dangNhap2: (a: string, b: string) => `${a} and ${b} are typing…`,
    dangNhapNhieu: (n: number) => `${n} people are typing…`,

    // Bong bóng và ô soạn tin
    daThuHoi: 'This message was unsent',
    giuDeXem: 'Press and hold for message actions',
    anhCua: (ten: string) => `Photo ${ten}`,
    dangGui: 'Sending…',
    guiLai: 'Resend',
    dongAnh: 'Close photo',
    boAnh: (viTri: number) => `Remove photo ${viTri}`,
    chupAnh: 'Take photo',
    chonAnhTuMay: 'Choose photo from device',
    soanTin: 'Write a message',
    nhapTin: 'Type a message…',
    gui: 'Send',

    // Gửi dở dang
    guiDoDang: (daGui: number, tongSo: number, loai: string, cau: string, conLai: number) =>
      `Sent ${daGui} of ${tongSo} ${loai}. ${cau} Tap Send to send the remaining ${conLai}.`,
    guiDoDangMotPhan: (daGui: number, tongSo: number, cau: string) =>
      `Sent ${daGui} of ${tongSo} files. ${cau}`,
    loaiAnh: 'photos',
    khongGuiDuocTep: 'Couldn’t send the file.',
    khongGuiDuoc: 'Couldn’t send.',
    chonItNhatMotAnh: 'Choose at least one photo to send.',

    // Phiếu đề xuất công việc
    goiY: {
      tinCay: { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' },
      nhapTenViec: 'Please enter a task name',
      aiDangDoc: 'AI is reading the message…',
      thuongMatVaiGiay: 'This usually takes a few seconds. You can close this and do something else.',
      deXuat: 'Suggested task',
      kiemTraLai: 'Please review before creating',
      khongCoViec: 'This message doesn’t seem to contain a task',
      tuNhap: 'You can still fill in the details below to create a task yourself.',
      tenViec: 'Task name',
      viDuTen: 'For example: User survey',
      moTa: 'Description',
      khongBatBuoc: 'Optional',
      nguoiPhuTrach: 'Assignee',
      chuaGiao: 'Unassigned',
      ban: 'You',
      ngayHetHan: 'Due date',
      gio: 'Time',
      taoViec: 'Create task',
      loiNgay: 'The due date isn’t valid. Use day/month/year, for example 30/09/2026.',
      loiGio: 'The time isn’t valid. Use hours:minutes, for example 08:00, 8:00 or 20:00.',
      loiKhongXacDinh: 'Something went wrong.',
    },

    dongYAI: {
      tieuDe: 'Use AI to suggest tasks?',
      noiDung:
        'To suggest tasks, WeDo will send the message you choose, about 12 of the most recent messages, and the names of the project’s members to a third-party AI provider (Google Gemini, Azure OpenAI or OpenAI). WeDo does not send anyone’s email or phone number. You can turn this off at any time in Account.',
      khongCamOn: 'No, thanks',
      dongY: 'Agree',
      chuaLuuDuoc: 'Couldn’t save your choice',
      coLoi: 'Something went wrong. Please try again.',
    },

    // Bạn bè
    ban: {
      tieuDe: 'Friends',
      timTheo: 'Search by name, email or phone number',
      oTim: 'Name, email or phone number',
      goiYTuKhoa: (n: number) => `Type at least ${n} characters to search.`,
      ketQuaTim: 'Search results',
      khongThayAi: (tuKhoa: string) =>
        `No one matches “${tuKhoa}”. Try their full email or phone number.`,
      loiMoiChoBan: (n: number) => `Requests waiting for you (${n})`,
      banBeDem: (n: number) => `Friends (${n})`,
      daGuiDangCho: (n: number) => `Sent, pending (${n})`,
      chuaCoAi:
        'No friends yet. Type a classmate’s name, email or phone number in the search box above, then tap “Add friend”.',
      nhanTin: 'Message',
      ketBan: 'Add friend',
      daGuiLoiMoi: 'Request sent',
      duyet: 'Accept',
      tuChoi: 'Decline',
      thaoTacKhac: (ten: string) => `More actions for ${ten}`,
    },

    // Mã mời vào dự án
    moi: {
      moiVaoNhom: 'Invite to team',
      moTaChiaSe: 'Anyone with the link or code joins the project directly as a Member.',
      chiTiet: (hanMoi: string, soNguoi: number) =>
        soNhieu('en', soNguoi, {
          mot: `Expires ${hanMoi} · {so} person joined`,
          nhieu: `Expires ${hanMoi} · {so} people joined`,
        }),
      chuaCoLink: 'This project has no active invite link.',
      chiaSeLink: 'Share invite link',
      taoLinkMoi: 'Create new link',
      taoLinkMoiHoi: 'Create a new link?',
      taoLinkMoiNoiDung: 'The old link and code will stop working.',
      tatLink: 'Turn off link',
      tatLinkHoi: 'Turn off the invite link?',
      tatLinkNoiDung: 'No one will be able to join with this link or code anymore.',
      moTaNhapMa:
        'The code has 8 characters and comes with the invite link from your Leader, for example 7K3M-9QXA.',
      maMoi: 'Invite code',
      xemTruoc: (khongGian: string, leader: string, soThanhVien: number) =>
        `Workspace ${khongGian} · Leader ${leader} · ${soNhieu('en', soThanhVien, {
          mot: '{so} member',
          nhieu: '{so} members',
        })}`,
      thamGia: 'Join',
      xemLoiMoi: 'View invite',
      maSai: 'That invite code isn’t valid or can’t be used anymore.',
      hetHan: 'This invite link has expired. Ask your Leader for a new one.',
      daTat: 'This invite link has been turned off. Ask your Leader for a new one.',
      duAnDong: 'This project is closed and isn’t accepting new members.',
      quaNhieuLan: 'You’ve tried too many times. Wait a minute and try again.',
      coLoi: 'Something went wrong. Try again in a few minutes.',
      chiaSeNoiDung: (tenDuAn: string, url: string, ma: string) =>
        `Join the project ${tenDuAn} on WeDo: ${url}. Or enter the code ${ma} in the app.`,
    },
  },
);
