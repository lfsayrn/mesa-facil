import { NextResponse } from "next/server";
import { getMenu, getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, MenuItem } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  if (all === "true") {
    return NextResponse.json(getAllMenuItems());
  }
  return NextResponse.json(getMenu());
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.category || body.price === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newItem: MenuItem = {
    id: crypto.randomUUID(),
    name: body.name,
    category: body.category,
    price: body.price,
    active: body.active !== false,
  };

  addMenuItem(newItem);
  return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  updateMenuItem(body.id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  deleteMenuItem(id);
  return NextResponse.json({ success: true });
}
