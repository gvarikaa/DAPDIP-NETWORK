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
import Image from "@/components/Image"; // შევცვალეთ იმპორტი პროექტის სტილისთვის

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
  const { socket, isConnected } = useSocket();
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
      const handleNewMessage = (data: any) => {
        if (data.conversationId) {
          console.log("New message received:", data);
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
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
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

        // გავაგზავნოთ შეტყობინება სოკეტით
        if (socket && selectedConversation.participants[0]) {
          socket.emit("sendMessage", {
            conversationId: selectedConversation.id,
            content,
            recipientUsername: selectedConversation.participants[0].username
          });
        }
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
      {/* საუბრების სია */}
      <div className="md:col-span-1 border-r border-borderGray overflow-y-auto">
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={setSelectedConversation}
          onNewConversation={handleNewConversation}
        />
      </div>
      {/* შეტყობინებების არე */}
      <div className="md:col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <MessagesList conversationId={selectedConversation.id} />
            </div>
            <div className="border-t border-borderGray p-3">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-textGray">
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