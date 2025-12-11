import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxy(request, path);
}

async function proxy(request: NextRequest, path: string[]) {
    const targetUrl = `http://127.0.0.1:8000/api/${path.join("/")}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const finalUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;

    console.log(`Proxying ${request.method} request to: ${finalUrl}`);

    const headers = new Headers(request.headers);
    headers.delete("host"); // Remove host header to avoid conflicts

    try {
        const body = request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : null;

        const response = await fetch(finalUrl, {
            method: request.method,
            headers: headers,
            body: body,
            cache: "no-store",
        });

        console.log(`Backend response status: ${response.status}`);

        const responseBody = await response.blob();
        const responseHeaders = new Headers(response.headers);

        return new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
    }
}
