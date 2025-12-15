import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  if (!body.status) {
    return NextResponse.json({ error: "Status required" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
