import { serve } from "https://deno.land/std@0.200.0/http/server.ts";

const UPSTREAM = "https://d1e7rcqq4o2ma.cloudfront.net/bpk-tv/1709/output/1709.m3u8";

serve(async req => {
  const url = new URL(req.url);

  // ১) প্লেলিস্ট হিট
  if (url.pathname.endsWith("/playlist.m3u8")) {
    const upstreamRes = await fetch(UPSTREAM);
    if (!upstreamRes.ok) {
      return new Response("Upstream playlist error", { status: 502 });
    }
    let playlist = await upstreamRes.text();

    // সব রিলেটিভ সেগমেন্ট URL Deno Deploy হোস্টেডে রিডিরেক্ট
    playlist = playlist.replace(
      /^(chunk_[0-9]+\.ts)$/gm,
      `https://${url.host}${url.pathname.replace("/playlist.m3u8","")}/$1`
    );

    return new Response(playlist, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache",
      },
    });
  }

  // ২) সেগমেন্ট ফাইল হিট
  if (/chunk_[0-9]+\.ts$/.test(url.pathname)) {
    const segName = url.pathname.split("/").pop();
    const segUrl = UPSTREAM.replace("playlist.m3u8", segName!);
    const segRes = await fetch(segUrl);
    if (!segRes.ok) {
      return new Response("Upstream segment error", { status: 502 });
    }
    return new Response(segRes.body, {
      headers: {
        "Content-Type": "video/MP2T",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // অন্য URL এ 404
  return new Response("Not found", { status: 404 });
});

