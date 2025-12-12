import { NextResponse } from "next/server";
import { addOrder, getOrders, Order, OrderItem } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getOrders());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.customer || !body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Create Order Items with valid IDs
  const orderItems: OrderItem[] = body.items.map((item: any) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
    name: item.name,
    price: item.price,
    details: item.details || [], // Pass through details
  }));

  const newOrder: Order = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
    customer: body.customer,
    items: orderItems,
    status: "pending",
    createdAt: new Date(),
  };

  addOrder(newOrder);

  return NextResponse.json(newOrder, { status: 201 });
}
