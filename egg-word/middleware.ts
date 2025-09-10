// Supabase middleware一時的に無効化（デバッグ用）
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 単純にリクエストを通すのみ
  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes のみを対象にして影響を最小化
    "/api/:path*",
  ],
};
