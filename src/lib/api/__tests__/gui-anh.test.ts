import { sendProjectFiles } from '../chat';
import { sendDirectFiles } from '../direct-chat';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const ANH = { uri: 'file:///tmp/a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' };

describe('gửi ảnh vào chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('chat dự án đi đúng đường /files', async () => {
    await sendProjectFiles('p1', [ANH], '');

    expect(mockedRequest.mock.calls[0][0]).toBe('/projects/p1/chat/files');
    expect(mockedRequest.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('tin nhắn riêng đi đúng đường /files', async () => {
    await sendDirectFiles('c1', [ANH], '');

    expect(mockedRequest.mock.calls[0][0]).toBe('/chat/direct/conversations/c1/files');
  });

  it('gói mọi ảnh vào cùng một phần "files"', async () => {
    await sendDirectFiles('c1', [ANH, { ...ANH, name: 'b.png' }], '');

    const form = mockedRequest.mock.calls[0][1]?.body as FormData;
    expect(form.getAll('files')).toHaveLength(2);
  });

  /*
    Chú thích đi CÙNG tin ảnh, không tách thành tin riêng. Tách ra thì người
    nhận thấy hai bong bóng và thứ tự có thể đảo.
  */
  it('gửi kèm chú thích khi người dùng có gõ', async () => {
    await sendDirectFiles('c1', [ANH], 'bài tập nhóm nè');

    const form = mockedRequest.mock.calls[0][1]?.body as FormData;
    expect(form.get('content')).toBe('bài tập nhóm nè');
  });

  it('không gửi phần chú thích khi để trống', async () => {
    await sendDirectFiles('c1', [ANH], '   ');

    const form = mockedRequest.mock.calls[0][1]?.body as FormData;
    expect(form.get('content')).toBeNull();
  });

  it('từ chối khi không có ảnh nào', async () => {
    await expect(sendDirectFiles('c1', [], 'chào')).rejects.toThrow();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('mã hoá id trước khi ghép vào đường dẫn', async () => {
    await sendDirectFiles('c 1', [ANH], '');

    expect(mockedRequest.mock.calls[0][0]).toBe('/chat/direct/conversations/c%201/files');
  });
});
