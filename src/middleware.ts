import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "cerkar_session";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)?.value;

  // Login sayfasına giriş yapmış kullanıcı gelirse dashboard'a yönlendir
  if (session && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Giriş yapmamış kullanıcıyı login'e yönlendir
  if (!session && request.nextUrl.pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
