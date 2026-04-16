import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? request.nextUrl.host

  if (host.toLowerCase().startsWith('www.')) {
    const apexUrl = new URL(request.nextUrl.toString())
    apexUrl.host = host.slice(4)
    apexUrl.protocol = 'https:'
    return NextResponse.redirect(apexUrl, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
}
