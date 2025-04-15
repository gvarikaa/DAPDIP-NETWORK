// src/app/api/conversations/[conversationId]/messages/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = auth();
    const { conversationId } = params;
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ვამოწმებთ არის თუ არა მომხმარებელი ამ საუბრის მონაწილე
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      return new Response("Unauthorized", { status: 403 });
    }

    // ვაბრუნებთ საუბრის მესიჯებს
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            img: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // ძველიდან ახლისკენ დალაგება
      },
    });

    // ვანახლებთ წაკითხვის სტატუსს
    await prisma.conversationParticipant.update({
      where: {
        id: isParticipant.id,
      },
      data: {
        readUntil: new Date(),
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}

// ახალი მესიჯის დამატება არსებულ საუბარში
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = auth();
    const { conversationId } = params;
    
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { content } = await req.json();

    if (!content || !content.trim()) {
      return new Response("Message content is required", { status: 400 });
    }

    // ვამოწმებთ არის თუ არა მომხმარებელი ამ საუბრის მონაწილე
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      return new Response("Unauthorized", { status: 403 });
    }

    // ვამატებთ ახალ მესიჯს
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: userId,
      },
    });

    // ვანახლებთ საუბრის განახლების დროს
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // ვანახლებთ ამ მომხმარებლისთვის "წაკითხვის დრო"
    await prisma.conversationParticipant.update({
      where: {
        id: isParticipant.id,
      },
      data: {
        readUntil: new Date(),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}