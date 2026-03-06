# Nokturne — Website

Private platform site for the Nokturne Rocket League bot framework.  
Deployed on **Vercel** · Backend via **Supabase**.

---

## Live deploy

Push to `main` → Vercel auto-deploys. No build step required (pure static HTML/CSS/JS).

To set up from scratch:

1. Import the repo in [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Other**
3. Root directory: `/` (leave default)
4. Hit **Deploy** — done

---

## Project structure

```
nokturne/
├── index.html                        ← Public landing page (entry point)
├── README.md
├── SUPABASE_SETUP.sql                ← Full schema bootstrap (run once)
│
├── pages/
│   ├── admin.html                    ← Admin panel (role-gated)
│   ├── changelog.html                ← Plugin & module version history
│   ├── coins.html                    ← NTC wallet, transfers, history
│   ├── contact.html                  ← Contact form
│   ├── discord.html                  ← Discord invite / community hub
│   ├── features.html                 ← Feature overview
│   ├── forum.html                    ← Community forum
│   ├── help.html                     ← Help & FAQ
│   ├── login.html                    ← Auth (Supabase magic link / OAuth)
│   ├── market.html                   ← Plugin marketplace (buy/sell)
│   ├── modules.html                  ← Bot module directory
│   ├── plugins.html                  ← Seller plugin management
│   ├── pricing.html                  ← Membership tiers
│   ├── profile.html                  ← Member profile + card generator
│   └── seller.html                   ← Seller dashboard & analytics
│
├── assets/
│   ├── css/
│   │   ├── main.css                  ← CSS import map (entry)
│   │   ├── base/
│   │   │   ├── variables.css         ← Design tokens & CSS custom properties
│   │   │   ├── reset.css             ← Normalize & base styles
│   │   │   └── typography.css        ← Type scale & text utilities
│   │   ├── layout/
│   │   │   └── utilities.css         ← Grid, flex, clip-paths, buttons, animations
│   │   └── components/
│   │       ├── navbar.css            ← Navigation bar + mobile menu
│   │       ├── hero.css              ← Hero section + ticker bars
│   │       ├── homepage.css          ← Homepage-specific sections
│   │       ├── sections.css          ← Features, modules, pricing, FAQ, footer
│   │       └── subpages.css          ← Inner page shared styles
│   │
│   ├── images/
│   │   └── nokturne-banner.png       ← Nav logo
│   │
│   └── js/
│       ├── main.js                   ← ES module entry — bootstraps all modules
│       └── modules/
│           ├── layout.js             ← Shared navbar + footer renderer
│           ├── navbar.js             ← Scroll state, active links, mobile toggle
│           ├── canvas.js             ← Animated grid + particle network (hero)
│           ├── faq.js                ← Accordion behaviour
│           ├── reveal.js             ← IntersectionObserver scroll reveal + perf bars
│           └── ticker.js             ← Clipboard copy + ticker duplication
│
├── sql/
│   ├── changelog.sql                 ← Changelogs table & policies
│   ├── phase3_reviews.sql            ← Plugin review system
│   ├── phase4.sql                    ← Forum, notifications, user profiles
│   └── phase5.sql                    ← Referrals, access tiers, versioning
│
└── supabase/
    └── functions/
        └── check-access-expiry/
            └── index.ts              ← Edge function: auto-downgrade expired roles
```

---

## Supabase setup

### First-time setup

Run `SUPABASE_SETUP.sql` in your Supabase SQL editor for the base schema, then run each phase SQL file **in order**:

```
sql/changelog.sql
sql/phase3_reviews.sql
sql/phase4.sql
sql/phase5.sql
```

### Edge function (access expiry)

Deploy `supabase/functions/check-access-expiry/index.ts` and schedule it daily via `pg_cron`:

```sql
SELECT cron.schedule(
  'check-access-expiry',
  '0 2 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<your-project>.supabase.co/functions/v1/check-access-expiry',
      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
    );
  $$
);
```

### Credentials

The Supabase URL and anon key are set at the top of `assets/js/modules/layout.js`:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Update these before deploying to a new Supabase project.

---

## Database tables

| Table | Purpose |
|---|---|
| `profiles` | User display names, avatars, referral codes |
| `user_roles` | Role assignment + access expiry |
| `wallets` | NTC balance per user |
| `transactions` | NTC transfer history |
| `notifications` | In-app notification feed |
| `plugins` | Marketplace listings |
| `plugin_purchases` | Purchase records |
| `plugin_reviews` | Ratings & reviews |
| `changelogs` | Plugin & module version history |
| `forum_posts` | Forum threads |
| `forum_replies` | Forum replies |
| `referrals` | Referral tracking + NTC payouts |

---

## Tech stack

- **Vanilla HTML5 / CSS3 / ES2020** — zero build tools, zero runtime dependencies
- **CSS custom properties** for theming (`assets/css/base/variables.css`)
- **ES modules** — `type="module"` throughout, no bundler needed
- **Supabase JS v2** — loaded from CDN (`cdn.jsdelivr.net`)
- **IntersectionObserver** — scroll reveal & performance bar animations
- **Canvas 2D API** — hero particle-grid + profile card generator
- **Google Fonts** — Bebas Neue, Barlow, Fira Code

---

## Local development

No install required. Serve with any static server (ES module imports require HTTP):

```bash
# Python
python -m http.server 8080

# Node
npx serve .

# VS Code — use the "Live Server" extension
```

Then visit `http://localhost:8080`.

---

## Customisation reference

| What to change | File |
|---|---|
| Colors, spacing, fonts | `assets/css/base/variables.css` |
| Type scale | `assets/css/base/typography.css` |
| Nav links | `assets/js/modules/layout.js` → `pages` array |
| Hero text | `index.html` → `<section id="home">` |
| Module cards | `index.html` → `<section id="modules">` |
| Discord handle | `assets/js/modules/ticker.js` → `copyPairs` array |
| Particle density | `assets/js/modules/canvas.js` → `COUNT` constant |
| Supabase credentials | `assets/js/modules/layout.js` → top of file |
