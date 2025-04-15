// src/app/(board)/messages/new/page.tsx
import NewConversation from '@/components/messages/NewConversation';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'New Message',
  description: 'Start a new conversation',
};

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // გადავცემთ URL-დან მიღებულ userId-ს, თუ ის არსებობს
  return (
    <main className="w-full border-x border-neutral-800 min-h-screen">
      <div className="sticky top-0 z-10 flex items-center p-4 backdrop-blur-md bg-black/70 border-b border-neutral-800">
        <h1 className="text-xl font-semibold">New Message</h1>
      </div>
      
      <NewConversation preselectedUserId={searchParams.userId} />
    </main>
  );
}