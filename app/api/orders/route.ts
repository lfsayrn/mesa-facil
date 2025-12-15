import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  // Parse JSON fields
  const parsed = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      details: JSON.parse(item.details),
    })),
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.customer || !body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const newOrder = await prisma.order.create({
    data: {
      customer: body.customer,
      status: "pending",
      items: {
        create: body.items.map(
          (item: {
            name: string;
            price: number;
            details?: string[];
            observation?: string;
            isMarmitex?: boolean;
            quantity?: number;
          }) => ({
            name: item.name,
            price: item.price,
            details: JSON.stringify(item.details || []),
            observation: item.observation,
            isMarmitex: item.isMarmitex || false,
            quantity: item.quantity || 1,
          })
        ),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(newOrder, { status: 201 });
}
