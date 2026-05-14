import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ results: [] });

  try {
    // Using a slightly different DDG endpoint and more "human-like" headers
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    if (!response.ok) throw new Error("Search engine error");

    const html = await response.text();
    const results: any[] = [];

    // More resilient parsing: look for result containers
    const resultMatches = html.matchAll(/<div class="[^"]*result[^"]*">([\s\S]*?)<\/div>/g);
    
    for (const match of resultMatches) {
      const block = match[1];
      
      // Extract title and link
      const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!titleMatch) continue;

      let link = titleMatch[1];
      let title = titleMatch[2].replace(/<[^>]+>/g, '').trim();

      // Extract snippet
      const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);
      let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : "";

      // Clean DuckDuckGo redirect link
      if (link && link.includes("uddg=")) {
        try {
          const urlObj = new URL(link, "https://duckduckgo.com");
          link = decodeURIComponent(urlObj.searchParams.get("uddg") || link);
        } catch(e) {}
      }

      // Filter out non-results (like ads or internal links)
      if (title && link && !link.includes("duckduckgo.com/")) {
        results.push({ title, link, snippet });
      }

      if (results.length >= 5) break;
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Web search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
