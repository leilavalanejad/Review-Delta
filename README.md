# Review Delta

**Turn thousands of public product reviews into a competitive brief a product team can use.**

[View the live prototype](https://review-delta.lvalanejad204461.chatgpt.site)

Review Delta shows what changed in the last six weeks, where two products differ, the recurring customer problems behind those differences, and the evidence supporting each conclusion.

The prototype includes two selectable comparisons:

- ChatGPT vs. Claude
- Netflix vs. Disney+

## The problem

Review analysis usually produces a list of broad themes: customers like the product, dislike the price, and report bugs. Those summaries are easy to generate and difficult to use.

A product team needs sharper answers:

- What is changing now rather than remaining steady?
- Which problems are category-wide, and which are specific to one product?
- What customer job or expectation sits underneath the complaint?
- What hypothesis or product opportunity should the team investigate next?
- Which customer quote makes the evidence tangible?

Review Delta is designed around those decisions, not around sentiment scores or word clouds.

## What the product does

For each comparison, the interface moves from signal to action:

1. **Change over time:** what is rising, cooling, emerging, or separating across the two products.
2. **Executive brief:** the three findings a product team should know.
3. **Product opportunities:** recurring problem statements, a product hypothesis, and an area of opportunity for each company.
4. **Theme map:** the share of recent reviews mentioning each theme and its movement against the prior six weeks.
5. **Evidence trail:** representative customer excerpts behind every major conclusion.

The comparison selector is intentional. It shows that the system can surface different problem structures across categories rather than repeating the same output with new product names.

## What changed after testing the first prototype

The first version was a command-line analysis of 60 invented reviews. It proved the basic logic but not the value of the product.

The first web version used only 20 real reviews. That made the prototype look like a polished summary rather than a system capable of finding repeated customer problems. The evidence was too thin to demonstrate synthesis.

The current version addresses that directly:

| Comparison | Reviews collected | Balanced analysis panel |
| --- | ---: | ---: |
| ChatGPT vs. Claude | 4,992 | 480 |
| Netflix vs. Disney+ | 6,273 | 360 |

The larger corpus makes it possible to show movement over time, recurring problem statements, and product-specific opportunity areas while keeping the analysis panel balanced across product and period. The prototype now retains those comparable snapshots instead of replacing one six-week read with the next.

## Product decisions and tradeoffs

### Balance before comparison

Available review history differs significantly by product and storefront. Comparing every collected review would let high-volume markets dominate the result.

Review Delta instead uses equal-sized samples from storefronts with enough coverage in both the recent and baseline windows. This gives up some volume in exchange for a more interpretable comparison.

### Separate observation from interpretation

Theme counts and changes are presented as observed signals. Product hypotheses and opportunity areas are a separate interpretation layer.

That distinction matters. A review can establish that login problems are recurring. It cannot prove why the problem exists or which solution will work.

### Evidence before eloquence

Every major conclusion opens to representative customer excerpts. A finding without a visible evidence trail is treated as an assertion, not an insight.

### Directional, not representative

Public reviewers are self-selecting, and Apple exposes different amounts of history across markets. Review Delta is useful for forming sharper research questions and identifying emerging patterns. It is not designed to produce a statistically representative product ranking.

## A product lesson from the original build

The original analyzer included both word-overlap clustering and model-generated themes. Word overlap grouped reviews that used similar vocabulary even when they expressed opposite experiences.

For example, praise for responsive support and frustration with slow support share most of the same words. The important information is the meaning, not the vocabulary.

That produced a useful product principle:

> Use deterministic rules when the needed information is present in the structure. Use language models when the work requires interpretation.

Review Delta keeps deterministic calculations for counts, shares, and changes. Interpretation is used for theme meaning, product hypotheses, and opportunity framing.

## How it works

1. Collect recent public reviews from Apple customer-review feeds across seven English-language storefronts.
2. Divide reviews into a recent six-week window and the preceding six-week baseline.
3. Build equal-sized product and period panels from storefronts with sufficient history.
4. Map review language to a repeatable theme taxonomy.
5. Calculate theme share, movement, rating change, and product skew.
6. Translate the strongest signals into problem statements, hypotheses, and opportunity areas.
7. Preserve representative excerpts for traceability.

No customer names are displayed, and the public demo stores only short evidence excerpts rather than the complete review corpus.

## Tracking change over time

Review Delta separates collection cadence from reporting cadence:

- **Collect weekly** so high-volume products do not exceed the limited history exposed by public review feeds.
- **Publish monthly** so product teams see meaningful shifts rather than weekly noise.
- **Retain comparable snapshots** of rating, theme share, and representative evidence so each brief can lead with what changed since the prior period.

The current prototype starts with two verified six-week periods. It does not fabricate older history. As monthly snapshots accumulate, the same data model can support 6–12 month trajectories, persistence signals, and release annotations.

## Source structure

```text
mine.py                          Original CLI analysis and baseline comparison
refresh.py                       Model-assisted theme refresh for supplied reviews
from_csv.py                      CSV validation and conversion
web/app/                         Application-specific React interface
web/data/                        Cached briefs plus appendable comparison history
web/scripts/                     Reproducible App Store collection and analysis
```

The hosted interface is built with React and TypeScript through ChatGPT Sites. The repository includes the application-specific interface, data, and analysis source. Standard Sites hosting scaffolding is managed separately.

## What I would test next

- Whether a monthly insight brief paired with weekly collection creates the right signal-to-noise ratio.
- Whether opportunity statements are more useful when organized by customer job, journey stage, or product surface.
- How much confidence improves when review findings are combined with support tickets, community posts, and release notes.
- Where model-assisted theme interpretation materially outperforms a transparent rules-based taxonomy at larger scale.

---

Built by [Leila Valanejad](https://github.com/leilavalanejad).
