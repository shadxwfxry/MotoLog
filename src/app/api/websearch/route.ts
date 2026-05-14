import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ results: [] });

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    const html = await response.text();
    const results: any[] = [];

    // Simple RegEx parser to extract DuckDuckGo results without relying on Cheerio/Undici which breaks Webpack
    const resultBlocks = html.split('class="result ').slice(1, 6); // Get top 5 results

    for (const block of resultBlocks) {
      // Extract title
      const titleMatch = block.match(/<h2 class="result__title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "";

      // Extract link
      const linkMatch = block.match(/<a class="result__url" href="([^"]+)"/);
      let link = linkMatch ? linkMatch[1] : "";

      // Extract snippet
      const snippetMatch = block.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/);
      let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : "";

      // Clean DuckDuckGo redirect link
      if (link && link.includes("uddg=")) {
        try {
          const urlObj = new URL(link, "https://duckduckgo.com");
          link = decodeURIComponent(urlObj.searchParams.get("uddg") || link);
        } catch(e) {}
      }

      if (title && link) {
        results.push({ title, link, snippet });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Web search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
