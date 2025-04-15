// src/app/api/users/[userId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    
    if (!currentUserId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        img: true,
      },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}