// src/app/(board)/messages/page.tsx
import MessagesContainer from '@/components/messages/MessagesContainer';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Messages',
  description: 'View and manage your messages',
};

export default async function MessagesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="w-full border-x border-neutral-800 min-h-screen">
      <div className="sticky top-0 z-10 flex items a-center p-4 backdrop-blur-md bg-black/70 border-b border-neutral-800">
        <h1 className="text-xl font-semibold">Messages</h1>
      </div>
      
      <MessagesContainer />
    </main>
  );
}