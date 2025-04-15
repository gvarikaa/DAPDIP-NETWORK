// src/components/messages/MessageInput.tsx
import { useState, FormEvent, KeyboardEvent } from "react";
import { SendHorizonal } from "lucide-react";
import Image from "@/components/Image"; // შევცვალეთ იმპორტი პროექტის სტილისთვის

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="დაწერეთ შეტყობინება..."
        className="flex-1 bg-inputGray border border-borderGray rounded-lg p-3 min-h-24 max-h-40 resize-none focus:outline-none text-textGrayLight"
      />
      <button
        type="submit"
        className="bg-iconBlue text-white rounded-full p-3 hover:bg-opacity-80 transition"
        disabled={!message.trim()}
      >
        <SendHorizonal size={20} />
      </button>
    </form>
  );
}