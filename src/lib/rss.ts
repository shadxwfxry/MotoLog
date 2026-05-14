import Parser from "rss-parser";

const parser = new Parser();

export async function fetchMotoNews(region: string = "Global") {
  let feeds: string[] = [];

  switch (region) {
    case "Europe":
      feeds = [
        "https://news.google.com/rss/search?q=motorcycle+news&hl=en-GB&gl=GB&ceid=GB:en",
      ];
      break;
    case "North America":
      feeds = [
        "https://news.google.com/rss/search?q=motorcycle+news&hl=en-US&gl=US&ceid=US:en",
      ];
      break;
    case "Ukraine":
      feeds = [
        "https://news.google.com/rss/search?q=%D0%BC%D0%BE%D1%82%D0%BE%D1%86%D0%B8%D0%BA%D0%BB&hl=uk&gl=UA&ceid=UA:uk",
      ];
      break;
    case "Russia":
      feeds = [
        "https://news.google.com/rss/search?q=%D0%BC%D0%BE%D1%82%D0%BE%D1%86%D0%B8%D0%BA%D0%BB%D1%8B+%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8&hl=ru&gl=RU&ceid=RU:ru",
      ];
      break;
    case "Asia":
      feeds = [
        "https://news.google.com/rss/search?q=motorcycle+news&hl=en-IN&gl=IN&ceid=IN:en",
      ];
      break;
    default: // Global
      feeds = [
        "https://news.google.com/rss/search?q=motorcycle+news&hl=en-US&gl=US&ceid=US:en",
      ];
      break;
  }

  try {
    const results = await Promise.all(
      feeds.map(async (url) => {
        try {
          const feed = await parser.parseURL(url);
          return feed.items.map(item => ({
            title: item.title || "Untitled",
            link: item.link || "",
            pubDate: item.pubDate || new Date().toISOString(),
            contentSnippet: item.contentSnippet || "",
            source: feed.title || "News",
          }));
        } catch (e) {
          console.error(`Error fetching feed ${url}:`, e);
          return [];
        }
      })
    );

    return results.flat().sort((a, b) => 
      new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
    );
  } catch (error) {
    console.error("RSS Fetch error:", error);
    return [];
  }
}
