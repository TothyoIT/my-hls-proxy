const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
};

Deno.serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/") {
    return new Response("✅ Deno HLS Proxy is live.\nAdd ?url=https://example.com/video.m3u8", {
      headers: { "content-type": "text/plain", ...corsHeaders },
    });
  }

  const upstreamUrl = searchParams.get("url");
  if (!upstreamUrl) {
    return new Response("❌ No 'url' query provided.", {
      status: 400,
      headers: { "content-type": "text/plain", ...corsHeaders },
    });
  }

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": req.headers.get("user-agent") || "",
        "referer": upstreamUrl,
      },
    });

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const newHeaders = new Headers(response.headers);
    corsHeaders["content-type"] = contentType;
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response("❌ Proxy fetch failed: " + err.message, {
      status: 502,
      headers: corsHeaders,
    });
  }
});
