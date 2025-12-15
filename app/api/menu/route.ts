import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  const items = await prisma.menuItem.findMany({
    where: all === "true" ? {} : { active: true },
    orderBy: { name: "asc" },
  });

  // Parse JSON fields
  const parsed = items.map((item) => ({
    ...item,
    sides: JSON.parse(item.sides),
    extras: JSON.parse(item.extras),
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.category || body.price === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newItem = await prisma.menuItem.create({
    data: {
      name: body.name,
      category: body.category,
      price: body.price,
      active: body.active !== false,
      sides: JSON.stringify(body.sides || []),
      extras: JSON.stringify(body.extras || []),
    },
  });

  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.sides !== undefined) updateData.sides = JSON.stringify(body.sides);
  if (body.extras !== undefined) updateData.extras = JSON.stringify(body.extras);

  await prisma.menuItem.update({
    where: { id: body.id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
