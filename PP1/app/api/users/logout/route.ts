import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  try {
    // Create response headers with cookie clearing
    const headers = new Headers();
    headers.append('Set-Cookie', [
      'access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; Secure; SameSite=Strict',
      'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; Secure; SameSite=Strict'
    ].join(', '));

    return new NextResponse(
      JSON.stringify({ message: 'Logged out successfully' }),
      {
        status: 200,
        headers: headers,
        statusText: 'OK'
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );
  }
}