"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronRight, ExternalLink, Info, Minus, Quote, TrendingDown, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import aiBrief from "@/data/brief.json";
import streamingBrief from "@/data/streaming-brief.json";
import historyData from "@/data/history.json";

type Brief = typeof aiBrief;
type ProductBrief = Brief["productBriefs"][number];
type Insight = Brief["executiveInsights"][number];
type ComparisonKey = "ai" | "streaming";
type HistoryComparison = typeof historyData.comparisons.ai;

const comparisons: Record<ComparisonKey, Brief> = {
  ai: aiBrief,
  streaming: streamingBrief as Brief,
};

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="delta delta--flat"><Minus /> 0 pp</span>;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return <span className={`delta ${value > 0 ? "delta--up" : "delta--down"}`}><Icon />{value > 0 ? "+" : ""}{value.toFixed(1)} pp</span>;
}

function EvidenceSheet({ ids, title, evidenceItems, secondaryProduct, onClose }: { ids: string[]; title: string; evidenceItems: Brief["evidence"]; secondaryProduct: string; onClose: () => void }) {
  const evidence = evidenceItems.filter((item) => ids.includes(item.id));
  return (
    <Sheet open={ids.length > 0} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="evidence-sheet w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="evidence-head">
          <span className="eyebrow">Evidence trail</span>
          <SheetTitle className="evidence-title">{title}</SheetTitle>
          <SheetDescription className="evidence-description">Representative excerpts from the recent review window. Names are omitted.</SheetDescription>
        </SheetHeader>
        <div className="evidence-list">
          {evidence.map((item) => (
            <article className="quote-card" key={item.id}>
              <div className="quote-meta"><span className={`product-label product-label--${item.product === secondaryProduct ? "clay" : "ink"}`}>{item.product}</span><span>{item.country} · {item.date}</span></div>
              <Quote aria-hidden="true" />
              <blockquote>“{item.quote}”</blockquote>
              <div className="stars" aria-label={`${item.rating} out of 5 stars`}>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
            </article>
          ))}
          <p className="evidence-footnote">Excerpts are lightly shortened for readability without changing their meaning.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InsightRow({ insight, open }: { insight: Insight; open: (ids: string[], title: string) => void }) {
  return (
    <button className="insight-row" onClick={() => open(insight.evidenceIds, insight.title)}>
      <span className="insight-number">{insight.number}</span>
      <div className="insight-copy">
        <span className="eyebrow">{insight.label}</span>
        <h3>{insight.title}</h3>
        <p>{insight.summary}</p>
      </div>
      <div className="insight-metric"><strong>{insight.metric}</strong><span>{insight.delta}</span></div>
      <ChevronRight className="insight-arrow" aria-hidden="true" />
    </button>
  );
}

function ProductPanel({ item, open }: { item: ProductBrief; open: (ids: string[], title: string) => void }) {
  return (
    <article className={`product-panel product-panel--${item.tone}`}>
      <header className="product-panel-head">
        <div><span className={`product-rule product-rule--${item.tone}`} /><span><strong>{item.product}</strong><small>{item.position}</small></span></div>
        <div className="rating-block"><strong>{item.rating}</strong><span>{item.ratingDelta} vs. prior</span></div>
      </header>
      <div className="problem-list">
        {item.problems.map((problem, index) => (
          <div className="problem" key={problem.title}>
            <span className="problem-index">0{index + 1}</span>
            <div><h3>{problem.title}</h3><p>{problem.description}</p><div><span>{problem.signal}</span><span>{problem.change}</span></div></div>
          </div>
        ))}
      </div>
      <div className="thinking-block"><span>Product hypothesis</span><p>{item.hypothesis}</p></div>
      <div className="opportunity-block"><span>Area of opportunity</span><p>{item.opportunity}</p></div>
      <button className="text-link" onClick={() => open(item.evidenceIds, `${item.product} evidence`)}>Inspect supporting reviews <ArrowUpRight /></button>
    </article>
  );
}

function ChangeCard({ item }: { item: HistoryComparison["changes"][number] }) {
  const tone = item.status === "Cooling" ? "cooling" : item.status === "Widening" ? "widening" : "rising";
  return (
    <article className={`change-card change-card--${tone}`}>
      <div><span className="change-status">{item.status}</span><strong>{item.signal}</strong></div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
    </article>
  );
}

function TrendLine({ before, after, tone }: { before: number; after: number; tone: "ink" | "clay" }) {
  const ceiling = Math.max(before, after, 1) * 1.15;
  const y1 = 34 - (before / ceiling) * 26;
  const y2 = 34 - (after / ceiling) * 26;
  return (
    <svg className={`trend-line trend-line--${tone}`} viewBox="0 0 112 40" role="img" aria-label={`${before.toFixed(1)} percent to ${after.toFixed(1)} percent`}>
      <path d="M8 34H104" className="trend-baseline" />
      <path d={`M10 ${y1} L102 ${y2}`} className="trend-path" />
      <circle cx="10" cy={y1} r="3" /><circle cx="102" cy={y2} r="3" />
    </svg>
  );
}

export default function Home() {
  const [comparison, setComparison] = useState<ComparisonKey>("ai");
  const [sheet, setSheet] = useState<{ ids: string[]; title: string }>({ ids: [], title: "" });
  const [activeProduct, setActiveProduct] = useState("Both");
  const brief = comparisons[comparison];
  const history = historyData.comparisons[comparison] as HistoryComparison;
  const priorSnapshot = history.snapshots[0];
  const currentSnapshot = history.snapshots[history.snapshots.length - 1];
  const maxThemeValue = Math.ceil(Math.max(...brief.themes.flatMap((theme) => [theme.chatgpt, theme.claude])) / 10) * 10;
  const visibleProducts = useMemo(() => brief.productBriefs.filter((item) => activeProduct === "Both" || item.product === activeProduct), [activeProduct, brief]);
  const openEvidence = (ids: string[], title: string) => setSheet({ ids, title });
  const changeComparison = (value: ComparisonKey) => {
    setComparison(value);
    setActiveProduct("Both");
    setSheet({ ids: [], title: "" });
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Review Delta home"><span>∆</span>Review Delta</a>
        <div className="comparison-picker">
          <span>Comparison</span>
          <Select value={comparison} onValueChange={(value) => changeComparison(value as ComparisonKey)}>
            <SelectTrigger aria-label="Choose a product comparison"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">ChatGPT vs. Claude</SelectItem>
              <SelectItem value="streaming">Netflix vs. Disney+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <nav aria-label="Project links">
          <span className="status"><i />Updated Sep 13</span>
          <a href="https://github.com/leilavalanejad/review-signal" target="_blank" rel="noreferrer">Repository <ExternalLink /></a>
        </nav>
      </header>

      <section className="overview" id="top">
        <div className="overview-copy">
          <span className="eyebrow">Competitive review intelligence</span>
          <h1>What customers are telling <em>{brief.products[0].name}</em> and <em>{brief.products[1].name}</em>.</h1>
          <p>Recurring problem statements, product hypotheses, and opportunities from a balanced six-week review analysis.</p>
        </div>
        <div className="corpus-card">
          <span className="eyebrow">Analysis scope</span>
          <strong>{brief.meta.analysisPanel}</strong>
          <p>reviews analyzed</p>
          <div><span>{brief.meta.collected.toLocaleString()} collected</span><span>7 markets</span><span>2 periods</span></div>
        </div>
      </section>

      <section className="product-strip" aria-label="Product comparison summary">
        {brief.products.map((product) => (
          <a href={product.url} target="_blank" rel="noreferrer" className={`product-summary product-summary--${product.tone}`} key={product.name}>
            <div><span className={`product-rule product-rule--${product.tone}`} /><span><strong>{product.name}</strong><small>{product.panelReviews} reviews in panel</small></span></div>
            <div><span>Recent rating</span><strong>{product.recentRating.toFixed(2)}</strong><small>{product.recentRating > product.priorRating ? "+" : ""}{(product.recentRating - product.priorRating).toFixed(2)} vs. prior</small></div>
          </a>
        ))}
        <div className="window-summary"><span>Recent</span><strong>{brief.meta.recentWindow}</strong><span>Baseline</span><strong>{brief.meta.baselineWindow}</strong></div>
      </section>

      <Tabs defaultValue="changes" className="workspace">
        <div className="workspace-nav">
          <TabsList variant="line" className="workspace-tabs">
            <TabsTrigger value="changes">Change over time</TabsTrigger>
            <TabsTrigger value="brief">Executive brief</TabsTrigger>
            <TabsTrigger value="products">Product opportunities</TabsTrigger>
            <TabsTrigger value="themes">Theme map</TabsTrigger>
            <TabsTrigger value="method">Method</TabsTrigger>
          </TabsList>
          <span className="select-hint">Select any insight to trace the evidence</span>
        </div>

        <TabsContent value="changes" className="tab-content">
          <div className="section-head change-heading"><div><span className="eyebrow">Since the prior period</span><h2>What changed in the customer narrative?</h2></div><p>Theme share is compared across balanced panels, so movement reflects the mix of customer commentary rather than raw review volume.</p></div>
          <div className="cadence-strip">
            <div><CalendarDays /><span>Review collection</span><strong>{historyData.collectionCadence}</strong></div>
            <div><span>Insight brief</span><strong>{historyData.briefCadence}</strong></div>
            <div><span>History retained since</span><strong>{historyData.trackingStarted}</strong></div>
            <div><span>Comparable periods</span><strong>{history.snapshots.length}</strong></div>
          </div>
          <div className="change-grid">{history.changes.map((item) => <ChangeCard item={item} key={item.title} />)}</div>
          <div className="trajectory-block">
            <div className="trajectory-head"><div><span className="eyebrow">Theme trajectories</span><h3>From baseline to current</h3></div><div className="period-key"><span>{priorSnapshot.window}</span><ChevronRight /><span>{currentSnapshot.window}</span></div></div>
            <div className="trajectory-table">
              <div className="trajectory-header"><span>Theme</span><span>{brief.products[0].name}</span><span>{brief.products[1].name}</span></div>
              {brief.themes.map((theme) => {
                const before = priorSnapshot.themes[theme.name as keyof typeof priorSnapshot.themes];
                const after = currentSnapshot.themes[theme.name as keyof typeof currentSnapshot.themes];
                return (
                  <div className="trajectory-row" key={theme.name}>
                    <strong>{theme.name}</strong>
                    <div><TrendLine before={before[brief.products[0].name as keyof typeof before]} after={after[brief.products[0].name as keyof typeof after]} tone="ink" /><Delta value={theme.chatgptDelta} /></div>
                    <div><TrendLine before={before[brief.products[1].name as keyof typeof before]} after={after[brief.products[1].name as keyof typeof after]} tone="clay" /><Delta value={theme.claudeDelta} /></div>
                  </div>
                );
              })}
            </div>
            <p className="chart-note">Two verified periods are available today. Future monthly briefs will extend these trajectories without rewriting prior snapshots.</p>
          </div>
        </TabsContent>

        <TabsContent value="brief" className="tab-content">
          <div className="section-head"><div><span className="eyebrow">Signal over noise</span><h2>Three things a product team should know</h2></div><p>Ordered by the strength of the pattern and its usefulness for product decisions.</p></div>
          <div className="insight-list">{brief.executiveInsights.map((insight) => <InsightRow insight={insight} open={openEvidence} key={insight.id} />)}</div>
        </TabsContent>

        <TabsContent value="products" className="tab-content">
          <div className="section-head section-head--filters"><div><span className="eyebrow">From feedback to action</span><h2>Problem statements and opportunities</h2></div><div className="filter-group" aria-label="Filter products">{["Both", ...brief.products.map((product) => product.name)].map((name) => <button key={name} className={activeProduct === name ? "active" : ""} onClick={() => setActiveProduct(name)}>{name}</button>)}</div></div>
          <div className={`product-grid ${activeProduct !== "Both" ? "product-grid--single" : ""}`}>{visibleProducts.map((item) => <ProductPanel item={item} open={openEvidence} key={item.product} />)}</div>
        </TabsContent>

        <TabsContent value="themes" className="tab-content">
          <div className="section-head"><div><span className="eyebrow">Share of recent reviews</span><h2>Where customer attention concentrates</h2></div><div className="legend"><span><i className="ink" />{brief.products[0].name}</span><span><i className="clay" />{brief.products[1].name}</span></div></div>
          <div className="theme-table">
            <div className="theme-header"><span>Theme</span><span>{brief.products[0].name}</span><span>{brief.products[1].name}</span><span>Six-week movement</span></div>
            {brief.themes.map((theme) => (
              <div className="theme-row" key={theme.name}>
                <strong>{theme.name}</strong>
                <div className="bar-cell"><span className="bar bar--ink" style={{ width: `${theme.chatgpt / maxThemeValue * 100}%` }} /><b>{theme.chatgpt.toFixed(1)}%</b></div>
                <div className="bar-cell"><span className="bar bar--clay" style={{ width: `${theme.claude / maxThemeValue * 100}%` }} /><b>{theme.claude.toFixed(1)}%</b></div>
                <div className="delta-pair"><Delta value={theme.chatgptDelta} /><Delta value={theme.claudeDelta} /></div>
              </div>
            ))}
          </div>
          <p className="chart-note">A review can map to more than one theme. Movement compares the recent six weeks with the prior six weeks.</p>
        </TabsContent>

        <TabsContent value="method" className="tab-content">
          <div className="method-layout">
            <div className="method-intro"><span className="eyebrow">Transparent by design</span><h2>A larger corpus, with the caveats left in.</h2><p>{brief.meta.note}</p></div>
            <div className="method-steps">
              <article><span>01</span><div><h3>Collect</h3><p>{brief.meta.collected.toLocaleString()} public reviews from Apple feeds across the United States, United Kingdom, Canada, Australia, New Zealand, Ireland, and Singapore.</p></div></article>
              <article><span>02</span><div><h3>Balance</h3><p>Use {brief.meta.analysisPanel / 12} reviews from three storefronts with enough history for each product and period. Each product contributes {brief.meta.analysisPanel / 4} recent and {brief.meta.analysisPanel / 4} baseline reviews.</p></div></article>
              <article><span>03</span><div><h3>Label</h3><p>Map review language to repeatable themes with deterministic rules. Remove product names before comparing theme shares.</p></div></article>
              <article><span>04</span><div><h3>Interpret</h3><p>Separate the observed signal from the product hypothesis. Every conclusion opens to representative customer evidence.</p></div></article>
            </div>
          </div>
          <div className="method-callout"><Info /><p><strong>Directional, not representative.</strong> Storefront availability differs by product, public reviewers are self-selecting, and keyword labeling misses nuance. Use these findings to form research questions, not to rank the products.</p></div>
        </TabsContent>
      </Tabs>

      <footer><span>Review Delta · Built by Leila Valanejad</span><span>Evidence first. Interpretation second.</span></footer>
      <EvidenceSheet ids={sheet.ids} title={sheet.title} evidenceItems={brief.evidence} secondaryProduct={brief.products[1].name} onClose={() => setSheet({ ids: [], title: "" })} />
    </main>
  );
}
