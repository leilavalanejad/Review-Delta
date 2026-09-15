import { writeFile } from "node:fs/promises";

const products = [
  { name: "Netflix", id: "363590051" },
  { name: "Disney+", id: "1446075923" },
];
const panelMarkets = ["gb", "ca", "au"];
const markets = ["us", "gb", "ca", "au", "nz", "ie", "sg"];
const marketNames = { us: "United States", gb: "United Kingdom", ca: "Canada", au: "Australia", nz: "New Zealand", ie: "Ireland", sg: "Singapore" };
const windows = {
  recent: { start: new Date("2026-08-03T00:00:00Z"), end: new Date("2026-09-14T00:00:00Z") },
  prior: { start: new Date("2026-06-22T00:00:00Z"), end: new Date("2026-08-03T00:00:00Z") },
};
const themes = [
  { id: "value", label: "Price & value", regex: /\b(price|pricing|expensive|cost|subscription|subscribe|pay|paid|money|worth|increase|charge|billing|cancel)\b/i },
  { id: "ads", label: "Advertising", regex: /\b(ad|ads|advert|commercial|adverts)\b/i },
  { id: "access", label: "Account & household access", regex: /\b(household|password|account|login|log in|sign in|verify|verification|location|home network|device|screen|extra member|sharing)\b/i },
  { id: "playback", label: "Playback & stability", regex: /\b(buffer|crash|freeze|frozen|lag|load|loading|error|black screen|playback|quality|audio|sound|subtitle|caption|glitch|bug|slow|stuck)\b/i },
  { id: "discovery", label: "Discovery & navigation", regex: /\b(search|find|browse|recommend|home page|homepage|interface|navigation|continue watching|my list|watchlist|menu|layout|feed)\b/i },
  { id: "content", label: "Content availability", regex: /\b(show|movie|series|content|removed|remove|leaving|cancelled|canceled|episode|season|library|selection|title|release)\b/i },
  { id: "downloads", label: "Downloads & travel", regex: /\b(download|offline|travel|vacation|flight|trip)\b/i },
  { id: "family", label: "Family & profiles", regex: /\b(kids|kid|child|children|family|parental|profile|age rating|mature|junior)\b/i },
  { id: "live", label: "Live & sports", regex: /\b(live|sports|football|soccer|game|event|broadcast|streaming live)\b/i },
  { id: "bundle", label: "Bundle experience", regex: /\b(hulu|espn|bundle|bundled|integration|integrated)\b/i },
];

async function fetchPage(product, market, page) {
  const url = `https://itunes.apple.com/${market}/rss/customerreviews/id=${product.id}/page=${page}/sortby=mostrecent/json`;
  const payload = await fetch(url).then((response) => response.json());
  return (payload.feed.entry || []).map((entry) => ({
    id: entry.id?.label,
    product: product.name,
    market,
    marketName: marketNames[market],
    date: entry.updated?.label,
    rating: Number(entry["im:rating"]?.label),
    title: entry.title?.label || "",
    text: entry.content?.label || "",
  }));
}

function getWindow(date) {
  const value = new Date(date);
  for (const [name, range] of Object.entries(windows)) if (value >= range.start && value < range.end) return name;
  return null;
}

const collected = [];
for (const product of products) {
  for (const market of markets) {
    for (let page = 1; page <= 10; page += 1) collected.push(...await fetchPage(product, market, page));
  }
}

const deduped = [...new Map(collected.filter((review) => review.id).map((review) => [review.id, review])).values()].map((review) => {
  const text = `${review.title} ${review.text}`;
  return { ...review, window: getWindow(review.date), themes: themes.filter((theme) => theme.regex.test(text)).map((theme) => theme.id) };
});

const panel = [];
for (const product of products) {
  for (const market of panelMarkets) {
    for (const window of ["recent", "prior"]) {
      const matches = deduped.filter((review) => review.product === product.name && review.market === market && review.window === window)
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
      if (matches.length < 30) throw new Error(`Insufficient ${product.name}/${market}/${window}: ${matches.length}`);
      panel.push(...matches);
    }
  }
}

const counts = {};
for (const product of products) {
  counts[product.name] = {};
  for (const window of ["recent", "prior"]) {
    const reviews = panel.filter((review) => review.product === product.name && review.window === window);
    counts[product.name][window] = {
      reviews: reviews.length,
      averageRating: Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2)),
      themes: Object.fromEntries(themes.map((theme) => {
        const count = reviews.filter((review) => review.themes.includes(theme.id)).length;
        return [theme.id, { label: theme.label, count, share: Number((count / reviews.length * 100).toFixed(1)) }];
      })),
    };
  }
}

const quoteCandidates = Object.fromEntries(themes.map((theme) => [theme.id,
  panel.filter((review) => review.window === "recent" && review.themes.includes(theme.id) && review.text.length >= 65)
    .sort((a, b) => a.text.length - b.text.length).slice(0, 15)
    .map(({ product, marketName, date, rating, title, text }) => ({ product, marketName, date, rating, title, text }))
]));

await writeFile(new URL("../data/streaming-stats.json", import.meta.url), JSON.stringify({ meta: { collected: deduped.length, analysisPanel: panel.length }, counts, quoteCandidates }, null, 2));
console.log(JSON.stringify({ collected: deduped.length, analysisPanel: panel.length, counts }, null, 2));
