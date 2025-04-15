// import "./globals.css";

import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { ClerkProvider } from "@clerk/nextjs";

// import type { Metadata } from "next";
// import { ClerkProvider } from "@clerk/nextjs";
// import QueryProvider from "@/providers/QueryProvider";

// export const metadata: Metadata = {
//   title: "Lama Dev X Clone",
//   description: "Next.js social media application project",
// };

// export default function AppLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <ClerkProvider>
//       <QueryProvider>
//         <html lang="en">
//           <body>{children}</body>
//         </html>
//       </QueryProvider>
//     </ClerkProvider>
//   );
// }


// src/app/layout.tsx - განახლება
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <SocketProvider>
          <html lang="en">
            <body>{children}</body>
          </html>
        </SocketProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}