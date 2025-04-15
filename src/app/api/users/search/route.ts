// src/app/api/users/search/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
        id: { not: userId }, // არ დავაბრუნოთ არსებული მომხმარებელი
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        img: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}