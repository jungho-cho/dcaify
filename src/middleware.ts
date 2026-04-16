import { NextRequest, NextResponse } from 'next/server'

const WWW_HOST = 'www.dcaify.com'
const APEX_HOST = 'dcaify.com'

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? request.nextUrl.host).toLowerCase()

  if (host === WWW_HOST) {
    const apexUrl = new URL(request.nextUrl.toString())
    apexUrl.host = APEX_HOST
    apexUrl.protocol = 'https:'
    return NextResponse.redirect(apexUrl, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
}
