import { NextResponse } from "next/server";
import { updateOrderStatus, Order } from "@/lib/store";

// We need to match the dynamic segment name from the file path [id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params are promises in Next.js 15+ (and recent 14)
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.status) {
    return NextResponse.json({ error: "Status required" }, { status: 400 });
  }

  updateOrderStatus(id, body.status as Order["status"]);

  return NextResponse.json({ success: true });
}
