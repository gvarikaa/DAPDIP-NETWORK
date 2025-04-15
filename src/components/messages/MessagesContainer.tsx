// src/components/messages/MessagesContainer.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConversationList from "./ConversationList";
import MessagesList from "./MessagesList";
import MessageInput from "./MessageInput";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";

type Conversation = {
  id: string;
  participants: {
    id: string;
    username: string;
    displayName: string | null;
    profileImg: string | null;
  }[];
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  updatedAt: string;
};

export default function MessagesContainer() {
  const { user } = useUser();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // სოკეტებთან დაკავშირება
    if (socket) {
      socket.on("new_message", (data: any) => {
        if (data.conversationId) {
          // განვაახლოთ საუბრების სია
          fetchConversations();
          
          // თუ ამჟამად შერჩეული საუბარი ემთხვევა ახალ მესიჯის საუბარს,
          // განვაახლოთ მესიჯების სიაც
          if (selectedConversation?.id === data.conversationId) {
            queryClient.invalidateQueries({
              queryKey: ["messages", data.conversationId],
            });
          }
        }
      });

      return () => {
        socket.off("new_message");
      };
    }
  }, [socket, selectedConversation, user, queryClient, router]);

  // მომხმარებლის საუბრების ჩატვირთვა
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        
        // თუ ჯერ არ არის შერჩეული საუბარი, ავირჩიოთ პირველი
        if (!selectedConversation && data.length > 0) {
          setSelectedConversation(data[0]);
        } else if (selectedConversation) {
          // განვაახლოთ არჩეული საუბარი, თუ ის არსებობს სიაში
          const updated = data.find((c: Conversation) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ახალი მესიჯის გაგზავნა
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        // განვაახლოთ მესიჯები
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedConversation.id],
        });
        
        // განვაახლოთ საუბრების სია
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleNewConversation = (userId: string) => {
    // გადავიყვანოთ მომხმარებელი ახალი საუბრის დაწყების ფორმაზე
    router.push(`/messages/new?userId=${userId}`);
  };

  return (
    <div className="grid md:grid-cols-3 h-[calc(100vh-65px)]">
      <div className="md:col-span-1 border-r border-neutral-800 overflow-y-auto">
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={setSelectedConversation}
          onNewConversation={handleNewConversation}
        />
      </div>
      <div className="md:col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <MessagesList conversationId={selectedConversation.id} />
            </div>
            <div className="border-t border-neutral-800 p-3">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">დაიწყეთ ახალი საუბარი</p>
              <p className="text-sm">აირჩიეთ მომხმარებელი სიისგან ან დაიწყეთ ახალი საუბარი</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}