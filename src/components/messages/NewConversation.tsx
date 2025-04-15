// src/components/messages/NewConversation.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserSearch } from "lucide-react";
import Image from "next/image";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
};

interface NewConversationProps {
  preselectedUserId?: string;
}

export default function NewConversation({ preselectedUserId }: NewConversationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useUser();
  const router = useRouter();

  // ვეძებთ მომხმარებლებს
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.filter((u: User) => u.id !== user?.id));
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user?.id]);

  // თუ არის preselectedUserId, ჩავტვირთოთ მომხამრებლის მონაცემები
  useEffect(() => {
    if (preselectedUserId) {
      const fetchUser = async () => {
        try {
          const res = await fetch(`/api/users/${preselectedUserId}`);
          if (res.ok) {
            const user = await res.json();
            setSelectedUser(user);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      };

      fetchUser();
    }
  }, [preselectedUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !message.trim()) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          message,
        }),
      });

      if (res.ok) {
        const { conversationId } = await res.json();
        router.push(`/messages?id=${conversationId}`);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4">
      {!selectedUser ? (
        <div>
          <div className="mb-6">
            <label htmlFor="user-search" className="block text-sm font-medium mb-2">
              Search for a user to message
            </label>
            <div className="relative">
              <input
                id="user-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or name"
                className="w-full bg-gray-800 text-white border border-neutral-700 rounded-lg p-3 pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="py-3 hover:bg-zinc-900/60 cursor-pointer rounded-lg p-2"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 relative rounded-full overflow-hidden">
                        <Image
                          fill
                          src={user.img || '/placeholder-user.png'}
                          alt={user.username}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.displayName || user.username}</h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchTerm.length > 1 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedUser(null)}
              className="text-blue-500 hover:text-blue-400"
            >
              ← Back to search
            </button>
            <h2 className="font-medium">New message to {selectedUser.displayName || selectedUser.username}</h2>
          </div>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Your message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-gray-800 text-white border border-neutral-700 rounded-lg p-3 min-h-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  );
}