// src/app/api/conversations/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                img: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // გარდავქმნათ მონაცემები უფრო მოსახერხებელ ფორმატში
    const formattedConversations = conversations.map((conversation) => {
      const otherParticipants = conversation.participants.filter(
        (participant) => participant.userId !== userId
      );

      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        participants: otherParticipants.map((participant) => ({
          id: participant.user.id,
          username: participant.user.username,
          displayName: participant.user.displayName,
          profileImg: participant.user.img,
        })),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === userId,
            }
          : null,
        updatedAt: conversation.updatedAt,
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}

// ახალი საუბრის შექმნა
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { recipientId, message } = await req.json();

    if (!recipientId) {
      return new Response("Recipient ID is required", { status: 400 });
    }

    if (!message || !message.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    // შევამოწმოთ არსებობს თუ არა უკვე საუბარი ამ ორ მომხმარებელს შორის
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: recipientId,
              },
            },
          },
        ],
      },
    });

    // თუ უკვე არსებობს საუბარი, დავაბრუნოთ ის
    if (existingConversation) {
      // დავამატოთ ახალი შეტყობინება არსებულ საუბარში
      const newMessage = await prisma.message.create({
        data: {
          content: message,
          senderId: userId,
          conversationId: existingConversation.id,
        },
      });

      // განვაახლოთ საუბრის ბოლო აქტივობის დრო
      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        conversationId: existingConversation.id,
        messageId: newMessage.id,
      });
    }

    // თუ საუბარი არ არსებობს, შევქმნათ ახალი
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: recipientId },
          ],
        },
        messages: {
          create: {
            content: message,
            senderId: userId,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({
      conversationId: newConversation.id,
      messageId: newConversation.messages[0].id,
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Error", { status: 500 });
  }
}