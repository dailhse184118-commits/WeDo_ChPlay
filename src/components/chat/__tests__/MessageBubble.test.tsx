import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../../../lib/types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    content: 'Mai nộp báo cáo nhé',
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u1',
    createdAt: '2026-08-04T03:15:00.000Z',
    updatedAt: '2026-08-04T03:15:00.000Z',
    author: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('hiện nội dung tin nhắn', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Mai nộp báo cáo nhé')).toBeTruthy();
  });

  it('hiện tên người gửi khi không phải tin của mình', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Lê Hữu Đại')).toBeTruthy();
  });

  it('ẩn tên người gửi với tin của mình', async () => {
    const { queryByText } = await render(
      <MessageBubble message={makeMessage()} isMine onLongPress={() => {}} />,
    );
    expect(queryByText('Lê Hữu Đại')).toBeNull();
  });

  it('gọi onLongPress khi nhấn giữ', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={onLongPress} />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('hiện chữ thu hồi thay cho nội dung cũ', async () => {
    const { getByText, queryByText } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );

    expect(getByText('Tin nhắn đã được thu hồi')).toBeTruthy();
    expect(queryByText('Mai nộp báo cáo nhé')).toBeNull();
  });

  it('không cho nhấn giữ tin đã thu hồi', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={onLongPress}
      />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).not.toHaveBeenCalled();
  });

  // Thiết kế tách nhãn và tiêu đề thành hai dòng trong một dải nền sáng,
  // thay vì một chuỗi gộp — dải này đọc được trên cả bong bóng xanh lẫn trắng.
  it('hiện dải công việc khi tin đã gắn công việc', async () => {
    const { getByText } = await render(
      <MessageBubble
        message={makeMessage({
          taskId: 't1',
          task: {
            id: 't1',
            title: 'Nộp báo cáo',
            status: 'TODO',
            projectId: 'p1',
            workspaceId: 'w1',
          },
        })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );
    expect(getByText('Đã tạo công việc')).toBeTruthy();
    expect(getByText('Nộp báo cáo')).toBeTruthy();
  });

  it('hiện nút thử lại khi gửi hỏng', async () => {
    const onRetry = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage()}
        isMine
        isFailed
        onRetry={onRetry}
        onLongPress={() => {}}
      />,
    );

    await fireEvent.press(getByTestId('retry-m1'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  /*
    Tin nhắn riêng không có `projectId` lẫn `workspaceId`. Bong bóng chưa bao
    giờ đọc tới hai trường ấy, nên bắt buộc phải có chúng chỉ là ràng buộc thừa.
  */
  it('dựng được tin nhắn riêng, thứ không có projectId lẫn workspaceId', async () => {
    const tinRieng = {
      id: 'd1',
      content: 'chào bạn',
      createdAt: '2026-09-18T12:00:00.000Z',
      author: { id: 'u2', email: 'u2@wedo.vn', fullName: 'Tuấn' },
    };

    const { getByText } = await render(
      <MessageBubble message={tinRieng} isMine={false} onLongPress={() => {}} />,
    );

    expect(getByText('chào bạn')).toBeTruthy();
    expect(getByText('Tuấn')).toBeTruthy();
  });

  describe('avatar', () => {
    it('hiện avatar người gửi bên cạnh bong bóng', async () => {
      const { getByTestId } = await render(
        <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
      );

      expect(getByTestId('message-avatar-m1')).toBeTruthy();
    });

    it('không hiện avatar cho tin của mình', async () => {
      const { queryByTestId } = await render(
        <MessageBubble message={makeMessage()} isMine onLongPress={() => {}} />,
      );

      expect(queryByTestId('message-avatar-m1')).toBeNull();
    });

    /*
      Giữa một chuỗi tin liên tiếp thì bỏ avatar, nhưng PHẢI chừa đúng chỗ
      trống — không thì các bong bóng trong cùng một chuỗi lệch nhau theo bậc
      thang.
    */
    it('giữa chuỗi thì chừa chỗ chứ không bỏ hẳn', async () => {
      const { queryByTestId, getByTestId } = await render(
        <MessageBubble
          message={makeMessage()}
          isMine={false}
          hienAvatar={false}
          onLongPress={() => {}}
        />,
      );

      expect(queryByTestId('message-avatar-m1')).toBeNull();
      expect(getByTestId('message-avatar-cho-trong-m1')).toBeTruthy();
    });

    it('ẩn tên khi không phải tin đầu chuỗi', async () => {
      const { queryByText } = await render(
        <MessageBubble
          message={makeMessage()}
          isMine={false}
          hienTen={false}
          onLongPress={() => {}}
        />,
      );

      expect(queryByText('Lê Hữu Đại')).toBeNull();
    });
  });

  describe('ảnh và tệp đính kèm', () => {
    const ANH = {
      id: 'a1',
      originalName: 'anh.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      url: '/chat/attachments/a1',
    };

    it('dựng ảnh đính kèm trong bong bóng', async () => {
      const { getByTestId } = await render(
        <MessageBubble
          message={makeMessage({ content: '', attachments: [ANH] })}
          isMine={false}
          goc="https://api.wedo.vn"
          onLongPress={() => {}}
        />,
      );

      expect(getByTestId('dinh-kem-anh-a1')).toBeTruthy();
    });

    it('chạm vào ảnh thì báo ra ngoài để mở toàn màn hình', async () => {
      const onXemAnh = jest.fn();
      const { getByTestId } = await render(
        <MessageBubble
          message={makeMessage({ content: '', attachments: [ANH] })}
          isMine={false}
          goc="https://api.wedo.vn"
          onXemAnh={onXemAnh}
          onLongPress={() => {}}
        />,
      );

      await fireEvent.press(getByTestId('dinh-kem-anh-a1'));

      expect(onXemAnh).toHaveBeenCalledWith('https://api.wedo.vn/chat/attachments/a1');
    });

    /*
      Tin chỉ có ảnh thì `content` rỗng. Dựng một `<Text>` rỗng cho ra một dòng
      trắng chen giữa ảnh và giờ.
    */
    it('vẫn dựng dòng chữ khi tin có nội dung', async () => {
      const { getByTestId } = await render(
        <MessageBubble
          message={makeMessage({ attachments: [ANH] })}
          isMine={false}
          goc="https://api.wedo.vn"
          onLongPress={() => {}}
        />,
      );

      expect(getByTestId('message-content-m1')).toBeTruthy();
    });

    it('không chừa dòng chữ trống khi tin chỉ có ảnh', async () => {
      const { queryByTestId } = await render(
        <MessageBubble
          message={makeMessage({ content: '', attachments: [ANH] })}
          isMine={false}
          goc="https://api.wedo.vn"
          onLongPress={() => {}}
        />,
      );

      expect(queryByTestId('message-content-m1')).toBeNull();
    });

    it('tệp không phải ảnh hiện thành thẻ có tên tệp', async () => {
      const { getByText, queryByTestId } = await render(
        <MessageBubble
          message={makeMessage({
            content: '',
            attachments: [
              { ...ANH, id: 'a2', originalName: 'bao-cao.pdf', mimeType: 'application/pdf' },
            ],
          })}
          isMine={false}
          goc="https://api.wedo.vn"
          onLongPress={() => {}}
        />,
      );

      expect(getByText('bao-cao.pdf')).toBeTruthy();
      expect(queryByTestId('dinh-kem-anh-a2')).toBeNull();
    });

    it('tin đã thu hồi thì không dựng đính kèm nữa', async () => {
      const { queryByTestId } = await render(
        <MessageBubble
          message={makeMessage({
            attachments: [ANH],
            deletedAt: '2026-08-04T04:00:00.000Z',
          })}
          isMine={false}
          goc="https://api.wedo.vn"
          onLongPress={() => {}}
        />,
      );

      expect(queryByTestId('dinh-kem-anh-a1')).toBeNull();
    });
  });
});
