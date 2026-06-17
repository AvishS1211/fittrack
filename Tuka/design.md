# Depth — Brand & Design System (`design.md`)

> **Source:** Reverse-engineered from `https://depth.fit/`
> **Product:** *Depth — "The intelligence layer for your body."* A personal health app that reads bloodwork + wearables + CGM continuously and tells you what matters.

---

## ⚠️ Confidence legend

Not every value lives in the readable HTML — some only exist in the compiled CSS, which wasn't directly extractable. Each token below is tagged:

- **✓ Confirmed** — taken directly from the site source (meta tags, markup, asset URLs, copy).
- **≈ Reconstructed** — inferred from the visible aesthetic to match the site; verify against live CSS before using as a hard spec.

> To make the `≈` items pixel-exact, open the live site → DevTools → Computed styles (or share the compiled `.css`), and these can be locked to real values.

---

## 1. Brand Foundation

| Element | Value | |
|---|---|---|
| **Name** | Depth | ✓ |
| **Wordmark casing** | lowercase — `depth` | ✓ (Apple web-app title = "depth") |
| **Tagline (primary)** | The intelligence layer for your body. | ✓ |
| **Sub-tagline** | Intelligence for your body. | ✓ (OG image alt) |
| **One-liner** | Reads your bloodwork, your wearables, your whole body, continuously, and tells you what actually matters. | ✓ |
| **Handle** | @depthscore (X / Instagram / LinkedIn) | ✓ |
| **Edition motif** | "Founders Edition · First 1,000" / numbered membership (`#0000`) | ✓ |

### Logo system ✓
Hosted under `/brand/`. Two marks × two themes:

| Asset | File | Use |
|---|---|---|
| Wordmark (for dark bg) | `logo-wordmark-dark.svg` | Primary, on dark surfaces |
| Wordmark (for light bg) | `logo-wordmark.svg` | On light surfaces |
| Logomark (for dark bg) | `logo-mark.svg` | App icon, avatar, compact |
| Logomark (for light bg) | `logo-mark-dark.svg` | Compact on light |

The **logomark** doubles as the in-app assistant avatar (appears as the "Depth" speaker bubble in the chat UI).

---

## 2. Color

**Scheme:** `color-scheme: light dark` — the site is **dark-first** with a light counterpart (confirmed by paired light/dark logo assets). ✓

### Core tokens

| Token | Value | Role | |
|---|---|---|---|
| `--bg` | `#0C0C0C` | Primary near-black background / theme-color | ✓ (meta `theme-color`) |
| `--surface` | `#141414` | Raised cards, app frame, chat surface | ≈ |
| `--surface-2` | `#1C1C1E` | Inset rows, metric tiles, input bar | ≈ |
| `--border` | `rgba(255,255,255,0.08–0.12)` | Hairline dividers, card edges | ≈ |
| `--text` | `#F5F5F5` | Primary text on dark | ≈ |
| `--text-muted` | `#A1A1A1` | Secondary copy, captions, units | ≈ |
| `--text-faint` | `#6B6B6B` | Timestamps, meta labels | ≈ |

### Accent / signal colors

The brand uses color sparingly — mostly mono with **one signal accent** plus semantic data states (charts label "OPTIMAL", quartiles, ↓/↑ deltas).

| Token | Value | Role | |
|---|---|---|---|
| `--accent` | *single restrained accent* | CTAs, active states, brand highlight | ≈ — confirm hex from live CSS |
| `--positive` | green (`≈ #3FCF8E`) | "Optimal" range, improving markers (e.g. ApoB ↓34%) | ≈ |
| `--warning` | amber (`≈ #E0A33E`) | Drift / "flagged" states | ≈ |
| `--data-line` | `--text` / `--accent` | Chart strokes, sparklines | ≈ |

> **Note on the accent:** I could not read the exact accent hex from source. The palette is overwhelmingly black + off-white + muted grey, with green reserved for "good/optimal" data states. Treat `--accent` as the one value most worth verifying.

### Light mode ≈
Invert the neutrals: `--bg #FFFFFF` / `--surface #F6F6F6` / `--text #0C0C0C` / muted greys mirrored. Accent + semantic colors stay constant.

---

## 3. Typography

**Confirmed conventions** (from markup) ✓:

- **Italic for emphasis.** Single key words are italicized inside headlines — e.g. *only*, *Nobody*, *Only we*. This is the signature type gesture. Use a typeface with a genuine, well-drawn italic.
- **Metric + unit pairing.** Numbers are bold/prominent; **units are set smaller and italic/de-emphasized**: `98 *mg/dL*`, `62 *ms*`, `7h 41m`, `86*%*`, `Q4 *new*`. Deltas use arrows: `↓ 34%`, `78 → 41`.
- **Punchy fragment rhythm.** Headlines and lists are short declaratives: "Steps. Sleep. Heart rate." — period-separated single words used as a visual cadence.

**Type families ≈** (verify against live CSS):

| Role | Reconstructed family | |
|---|---|---|
| Display / Headlines | A clean modern **grotesque sans** with a strong italic (e.g. Söhne / Neue Haas Grotesk / similar) | ≈ |
| Body | Same sans family, regular weight | ≈ |
| Data / metrics | Sans with **tabular figures**, or a mono for raw reads (CGM stream, timestamps `02:14 AM`) | ≈ |

### Type scale ≈

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 3.5–4.5rem / 1.05 | 500–600 | Hero ("The intelligence layer for your body.") |
| `h2` | 2–2.75rem / 1.1 | 500–600 | Section heads ("Surface isn't enough.") |
| `h3` | 1.25–1.5rem / 1.2 | 500 | Card titles ("Ask anything.") |
| `body` | 1–1.125rem / 1.5 | 400 | Paragraphs |
| `label` | 0.8125rem / 1.3 | 500, tracked +, often UPPERCASE | Eyebrows ("Included", "Real-time", "Live") |
| `meta` | 0.75rem | 400 | Timestamps, units, captions |

**Eyebrow labels** ✓: small kicker labels sit above section heads — e.g. `The shift`, `The depth`, `A question`, `An insight`, `An action`, `Included`, `Real-time`, `Always on`, `Live`. Treat as a distinct uppercase/tracked label style.

---

## 4. Components

### Buttons ✓ / ≈
- **Primary CTA** ✓: label **"Get early access"** → `/waitlist`. Recurring across nav, hero, and footer. Often paired with the supporting line **"Free during early access"** / "a numbered spot, yours for life".
- Arrow variant ✓: "Get early access →" (trailing arrow in closing CTA).
- **Style ≈:** pill/rounded solid button on a dark frame; high-contrast (light fill on dark, or accent fill). Confirm radius + fill from CSS.

### Navigation ✓
- Left: wordmark logo (links home).
- Center/links: **Approach · Demos · Hardware · Journal** (anchor links `#approach`, `#demos`, `#hardware`, `/blog/`).
- Right: **Get early access** CTA.

### App / chat UI (product mockups) ✓
A core visual motif is the iOS app shown in a phone frame:
- Status bar shows **9:41**.
- Assistant identity: **logomark avatar + "Depth"** with status line "Reading your signals".
- **Chat bubbles**: user question → Depth reply. Replies bold the key figures (`78 → 41`, `32 minutes`, `14 points`).
- **Action chips** ✓: replies can include an `Action` block (e.g. "Swap two weekly red-meat meals for fish") and quick replies ("Book my next draw.").
- **Input bar** ✓: placeholder **"Message Depth…"**.
- **Notification style** ✓: "1 unread · Depth".

### Metric tiles / "Health HQ" ✓
"All of you. In one place." dashboard grid:
- Tiles: **CGM 98 mg/dL · HRV 62 ms · Sleep 7h 41m · Training 86% · Bloodwork Q4 (new)**.
- Big number + italic small unit; tile shows a source/device tag.
- Summary strip: "**2,880** CGM reads today · **100+** markers tracked".

### Device cards ✓
Each device gets a card with image + label + spec line:
- **Watch** — `closer-watch.jpg` — 58 bpm — "Steps · Sleep · Heart rate"
- **Band (WHOOP)** — `closer-band.jpg` — 62 ms HRV — "HRV · Temp · Recovery"
- **CGM** — `closer-cgm.png` — 98 mg/dL — "Glucose, continuous · Every 30 sec"
- **Bloodwork** — vial sequence `media/vial-seq/v_040.webp` — ApoB 71 — "ApoB · hsCRP · HbA1c · +35 more"

### Activity feed ("Depth doesn't sleep") ✓
Timestamped log rows, mono-ish times, newest first:
`02:14 AM — ApoB drift flagged …` / `02:13 AM — Recovery up 12% …`

### Spec strip ✓
Inline key/value pairs (phlebotomy section): **Lead time / 24 hours · Coverage / Pan India · Panel / 100+ markers · Turnaround / Recap in <24 hours**.

### "Founders Edition" membership card ✓
A collectible credential card:
- Header: `DEPTH — FOUNDERS EDITION`
- Fields: **Holder** (Your name here) · **Issued** · **First 1,000** · serial **# 0000**
- Caption: "This could be yours". Premium, numbered, lifetime-spot framing.

### Charts ✓ / ≈
- Quartile range chart with **OPTIMAL** band, axis values (110/80/60), Q1–Q4.
- Marker callouts: `APOB 71 mg/dL ↓ 34% since Q1`.
- Style ≈: thin strokes, minimal axes, optimal band tinted with `--positive`.

---

## 5. Layout & Motion

| Aspect | Spec | |
|---|---|---|
| Surface | Dark-first, full-bleed sections separated by generous vertical space | ✓ |
| Containers | Centered, card-based modules on `--bg`; rounded raised surfaces | ≈ |
| Scroll cue | "**Go deeper.**" intro + "**Scroll**" indicator — vertical-journey narrative | ✓ |
| Reveal pattern | Sequential "one half / the other half / the whole picture" build — content reveals on scroll | ✓ (copy structure) |
| Imagery | Real device photography (watch/band/cgm on skin) + a frame-by-frame **vial sequence** (`v_040.webp`) implying scroll-scrubbed video | ✓ |
| Radius | `≈ 16–24px` on cards, pill on buttons | ≈ |
| Spacing scale | `≈ 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px` | ≈ |

---

## 6. Voice & Tone ✓

The copy is the strongest, most confirmable part of the brand. Principles:

- **Confident, declarative, a little provocative.** "Surface isn't enough." / "Nobody has ever known your body this well." / "Depth doesn't sleep."
- **Contrast structure.** Sets up the limited view ("Your watch *only* sees one half") then the resolution ("*Only we* see the whole picture").
- **Fragment cadence.** Period-separated single words as rhythm: "Steps. Sleep. Heart rate. Real signals. Just one half."
- **Specific over vague.** Always real markers and numbers: ApoB, hsCRP, HbA1c, ferritin 78→41, Lp(a).
- **Second person, present tense.** Talks directly to "your body", "your data".
- **Why over what.** Recurring thesis: surface metrics tell you *what* happened; Depth tells you *why* and *what to change*.
- **Italicized emphasis word** carries the punch in headlines.

### Messaging pillars ✓
1. **Whole picture** — every signal read together, continuously.
2. **Why, not just what** — causal insight, not dashboards.
3. **Action** — "Tell Depth to act" (schedules, reminders, bookings in one sentence).
4. **Concierge** — phlebo comes to you; CGM ships with next tier.
5. **Exclusivity** — Founders Edition, first 1,000, free during early access, numbered for life.

---

## 7. Quick-reference token block (≈ — verify accent + fonts)

```css
:root {
  /* Color — confirmed bg, rest reconstructed */
  --bg: #0C0C0C;          /* ✓ */
  --surface: #141414;
  --surface-2: #1C1C1E;
  --border: rgba(255,255,255,0.10);
  --text: #F5F5F5;
  --text-muted: #A1A1A1;
  --text-faint: #6B6B6B;
  --positive: #3FCF8E;    /* optimal / improving */
  --warning: #E0A33E;     /* drift / flagged */
  --accent: #F5F5F5;      /* ← VERIFY: single brand accent */

  /* Type — families reconstructed, conventions confirmed */
  --font-sans: "Söhne", "Neue Haas Grotesk", -apple-system, system-ui, sans-serif;
  --font-mono: "Söhne Mono", ui-monospace, "SF Mono", monospace;

  /* Radius / spacing — reconstructed */
  --radius-card: 20px;
  --radius-pill: 999px;
  --space: 8px; /* base unit */
}

/* Signature gestures (confirmed) */
.headline em { font-style: italic; }           /* emphasis word */
.metric .unit { font-size: 0.6em; font-style: italic; color: var(--text-muted); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8125rem; color: var(--text-muted); }
```

---

*Confirmed items are safe to use as-is. Reconstructed (`≈`) items — chiefly the accent hex, exact font families, button radius, and spacing scale — should be checked against the live compiled CSS to be truly pixel-exact.*
