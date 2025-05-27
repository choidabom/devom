import { useState } from "react";
import { ChatBubble } from "./ChatBubble";
import { useSlashCommand } from "./useSlashCommand";

export function ChatBubbleDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const { isVisible, closeChat } = useSlashCommand();

  const handleSubmit = (message: string) => {
    setMessages((prev) => [...prev, message]);
    console.log("메시지 전송:", message);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          피그마 스타일 채팅 버블 데모
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">사용법</h2>
          <ul className="space-y-2 text-gray-600">
            <li>
              • <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">/</kbd>{" "}
              키를 눌러 채팅 버블을 활성화하세요
            </li>
            <li>• 마우스를 움직이면 채팅 버블이 따라 움직입니다</li>
            <li>• 텍스트를 입력하면 버블 크기가 동적으로 조정됩니다</li>
            <li>
              •{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Enter</kbd>
              로 메시지를 전송하거나{" "}
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Esc</kbd>로
              닫을 수 있습니다
            </li>
            <li>
              • 5초 후 자동으로 사라집니다 (입력 중에는 타이머가 리셋됩니다)
            </li>
          </ul>
        </div>

        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">전송된 메시지</h2>
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                >
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                  <p className="text-gray-800">{message}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMessages([])}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
            >
              메시지 목록 지우기
            </button>
          </div>
        )}

        <ChatBubble
          isVisible={isVisible}
          onClose={closeChat}
          onSubmit={handleSubmit}
          placeholder="피그마처럼 메시지를 입력해보세요..."
          autoCloseDelay={5000}
        />
      </div>
    </div>
  );
}
