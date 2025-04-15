// src/components/messages/ConversationList.tsx
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { MessagesSquare, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Participant = {
  id: string;
  username: string;
  displayName: string | null;
  profileImg: string | null;
};

type Conversation = {
  id: string;
  participants: Participant[];
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  updatedAt: string;
};

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedConversationId: string | undefined;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: (userId: string) => void;
}

export default function ConversationList({
  conversations,
  loading,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const { user } = useUser();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-3 border-b border-neutral-800 flex justify-between items-center">
        <h2 className="font-medium">Your Conversations</h2>
        <Link href="/messages/new">
          <button className="text-primary hover:text-primary/80">
            <PlusCircle size={20} />
          </button>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
          <MessagesSquare className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">No conversations yet</p>
          <button
            onClick={() => onNewConversation('')}
            className="mt-3 text-sm text-blue-500 hover:underline"
          >
            Start a new conversation
          </button>
        </div>
      ) : (
        <div className="divide-y divide-neutral-800">
          {conversations.map((conversation) => {
            const otherParticipant = conversation.participants[0];
            const lastMessageTime = conversation.lastMessage
              ? new Date(conversation.lastMessage.createdAt)
              : new Date(conversation.updatedAt);
            
            const timeFormatted = format(
              new Date(lastMessageTime),
              new Date().toDateString() === new Date(lastMessageTime).toDateString()
                ? 'p' // Today: show time
                : 'MMM d' // Other days: show date
            );
            
            return (
              <div
                key={conversation.id}
                className={`p-4 hover:bg-zinc-900/60 cursor-pointer ${
                  selectedConversationId === conversation.id ? 'bg-zinc-900/70' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        fill
                        src={otherParticipant.profileImg || '/placeholder-user.png'}
                        alt={otherParticipant.username}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">
                        {otherParticipant.displayName || otherParticipant.username}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {timeFormatted}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage ? (
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.lastMessage.isFromMe && "You: "}
                        {conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}