import type { NextRequest } from "next/server";
import { apiError } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return apiError("This demo API route is not implemented yet.", 501);
}
