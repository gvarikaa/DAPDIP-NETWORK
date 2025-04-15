// src/components/messages/MessagesList.tsx
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { useSocket } from "@/providers/SocketProvider";
import Image from "@/components/Image"; // შევცვალეთ იმპორტი პროექტის სტილისთვის

interface MessagesListProps {
  conversationId: string;
}

type Message = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    img: string | null;
  };
};

export default function MessagesList({ conversationId }: MessagesListProps) {
  const { user } = useUser();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<Message[]>;
    },
    enabled: !!conversationId && !!user,
    refetchInterval: false,
  });

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data: any) => {
        if (data.conversationId === conversationId) {
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
        }
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [socket, conversationId, queryClient]);

  // ვასქროლოთ ბოლოსკენ ახალი მესიჯების მიღებისას
  useEffect(() => {
    const scrollToBottom = () => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    if (messages?.length) {
      scrollToBottom();
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-iconBlue rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <div className="h-full flex items-center justify-center text-textGray">
        <p className="text-center">ჯერ არ არის შეტყობინებები.<br />დაიწყეთ საუბარი!</p>
      </div>
    );
  }

  // დაჯგუფებული მესიჯების შექმნა თარიღის მიხედვით
  type MessageGroup = {
    date: string;
    messages: Message[];
  };

  const groupedMessages: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toLocaleDateString();
    
    if (!currentGroup || currentGroup.date !== messageDate) {
      currentGroup = {
        date: messageDate,
        messages: [],
      };
      groupedMessages.push(currentGroup);
    }
    
    currentGroup.messages.push(message);
  });

  return (
    <div className="space-y-6">
      {groupedMessages.map((group, groupIndex) => (
        <div key={group.date} className="space-y-4">
          <div className="flex justify-center">
            <div className="text-xs bg-inputGray text-textGray rounded-full px-3 py-1">
              {new Date(group.date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: new Date(group.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}
            </div>
          </div>
          
          <div className="space-y-3">
            {group.messages.map((message) => {
              const isMyMessage = message.sender.id === user?.id;
              return (
                <div 
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {!isMyMessage && (
                      <div className="flex-shrink-0 h-8 w-8 relative rounded-full overflow-hidden">
                        <Image
                          path={message.sender.img || "general/noAvatar.png"}
                          alt={message.sender.username}
                          w={32}
                          h={32}
                          tr={true}
                        />
                      </div>
                    )}
                    <div 
                      className={`rounded-2xl py-2 px-4 break-words ${
                        isMyMessage 
                          ? 'bg-iconBlue text-white rounded-br-none' 
                          : 'bg-inputGray text-white rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className={`text-xs ${isMyMessage ? 'text-blue-200' : 'text-textGray'} mt-1`}>
                        {format(new Date(message.createdAt), 'p')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messageEndRef} />
    </div>
  );
}