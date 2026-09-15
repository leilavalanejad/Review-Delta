import { writeFile } from "node:fs/promises";

const products = [
  { name: "ChatGPT", id: "6448311069", panelMarkets: ["nz", "ie", "sg"] },
  { name: "Claude", id: "6473753684", panelMarkets: ["gb", "ca", "au"] },
];

const markets = ["us", "gb", "ca", "au", "nz", "ie", "sg"];
const marketNames = { us: "United States", gb: "United Kingdom", ca: "Canada", au: "Australia", nz: "New Zealand", ie: "Ireland", sg: "Singapore" };
const windows = {
  recent: { start: new Date("2026-08-03T00:00:00Z"), end: new Date("2026-09-14T00:00:00Z") },
  prior: { start: new Date("2026-06-22T00:00:00Z"), end: new Date("2026-08-03T00:00:00Z") },
};

const themes = [
  { id: "reliability", label: "Accuracy & reliability", regex: /\b(wrong|incorrect|inaccurate|accuracy|accurate|false|hallucinat|lie|lies|lying|mistake|unreliable|reliable|trust|truth|fact.?check)\b/i },
  { id: "limits", label: "Limits & subscription value", regex: /\b(limit|usage|subscription|subscribe|upgrade|plus|pro plan|paid|paywall|price|pricing|expensive|cost|quota|message cap|free version|free tier)\b/i },
  { id: "memory", label: "Memory & context", regex: /\b(memory|remember|forget|forgot|context|conversation history|previous chat|past chat|long conversation|chat history)\b/i },
  { id: "voice", label: "Voice experience", regex: /\b(voice|talk mode|speaking|speak|accent|audio|microphone|listen|listening|interrupt)\b/i },
  { id: "performance", label: "Performance & stability", regex: /\b(crash|bug|glitch|slow|lag|freeze|frozen|loading|load|down|outage|unavailable|error|broken|stuck|performance)\b/i },
  { id: "behavior", label: "Model behavior changes", regex: /\b(update|updated|new model|old model|version|changed|change back|worse|regression|downgrade|personality|tone|robotic|cold|restrict|refusal|refuse|censor)\b/i },
  { id: "personal", label: "Personal support", regex: /\b(therapy|therapist|mental health|anxiety|depression|lonely|friend|companion|journal|feelings|emotional|relationship|advice|life)\b/i },
  { id: "work", label: "Work & productivity", regex: /\b(work|productiv|email|document|summar|research|business|job|resume|presentation|meeting|plan|organize|task)\b/i },
  { id: "learning", label: "Learning & explanation", regex: /\b(learn|learning|study|studying|school|student|homework|teacher|teach|explain|tutor|education|lesson)\b/i },
  { id: "creative", label: "Writing & creativity", regex: /\b(write|writing|writer|story|creative|creativity|brainstorm|idea|ideas|poem|novel|script)\b/i },
  { id: "coding", label: "Coding & building", regex: /\b(code|coding|program|programming|developer|website|app|software|debug|github|terminal)\b/i },
  { id: "multimodal", label: "Images & files", regex: /\b(image|photo|picture|camera|upload|file|pdf|document upload|attachment|video|visual)\b/i },
];

async function fetchPage(product, market, page) {
  const url = `https://itunes.apple.com/${market}/rss/customerreviews/id=${product.id}/page=${page}/sortby=mostrecent/json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const payload = await response.json();
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

function windowFor(date) {
  const value = new Date(date);
  for (const [name, range] of Object.entries(windows)) {
    if (value >= range.start && value < range.end) return name;
  }
  return null;
}

function score(review) {
  const text = `${review.title} ${review.text}`;
  return themes.filter((theme) => theme.regex.test(text)).map((theme) => theme.id);
}

const all = [];
for (const product of products) {
  for (const market of markets) {
    for (let page = 1; page <= 10; page += 1) {
      all.push(...await fetchPage(product, market, page));
    }
  }
}

const deduped = [...new Map(all.filter((review) => review.id).map((review) => [review.id, review])).values()]
  .map((review) => ({ ...review, window: windowFor(review.date), themes: score(review) }));

const panel = [];
for (const product of products) {
  for (const market of product.panelMarkets) {
    for (const window of ["recent", "prior"]) {
      const matches = deduped
        .filter((review) => review.product === product.name && review.market === market && review.window === window)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 40);
      if (matches.length < 40) throw new Error(`Insufficient ${product.name}/${market}/${window}: ${matches.length}`);
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
  panel.filter((review) => review.themes.includes(theme.id) && review.window === "recent" && review.text.length >= 70)
    .sort((a, b) => (a.text.length - b.text.length))
    .slice(0, 12)
    .map(({ product, marketName, date, rating, title, text }) => ({ product, marketName, date, rating, title, text }))
]));

await writeFile(new URL("../data/corpus-stats.json", import.meta.url), JSON.stringify({
  meta: {
    collected: deduped.length,
    analysisPanel: panel.length,
    markets: markets.map((market) => marketNames[market]),
    period: "August 3–September 13, 2026",
    baseline: "June 22–August 2, 2026",
    method: "A 40-review sample from three storefronts with coverage in both windows for each product and period.",
  },
  counts,
  quoteCandidates,
}, null, 2));

console.log(JSON.stringify({ collected: deduped.length, panel: panel.length, counts }, null, 2));
