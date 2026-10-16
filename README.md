# InfluencerCheck — *Worth the Follow*

**Audit who you follow against your own values. Everything stays on your device.**

Your feed is made of the people you chose to follow. Over time that list fills up with accounts that
flex money while the world burns, sell you something in every post, or just leave you more tired than
when you opened the app. InfluencerCheck helps you walk through that list on purpose, one account at a
time, and decide — using filters *you* pick — who still deserves your attention.

It does not unfollow anyone for you. That last step is yours, and that's the point.

## How it works

1. **Export your own data.** Instagram lets you download a `following.json` file (instructions in the
   app). No login, no password, no API token.
2. **Pick your lenses.** A *lens* is a values filter written as concrete things you can notice in
   someone's last ten posts — e.g. *Overconsumption / Flexing* or *Emotional Drain*. Turn on the ones
   you care about and set how much weight each carries.
3. **Review, card by card.** Tap *Open profile*, glance at their grid, come back and tick what you
   saw. Swipe right to keep, left to let go, or mark *Unsure* and come back later.
4. **Act, in the app.** You get a copyable let-go list and a CSV. Unfollowing happens in Instagram,
   by you, at your own pace.

The app is a small [PWA](https://web.dev/progressive-web-apps/): open it once, add it to your home
screen, and it works offline. Your review is saved in your browser's local storage on this device only;
you can export a session file to back it up or move devices.

## Why it's built this way

**Instagram's official API does not expose who you follow or what they post, and scraping or
automating the app violates Meta's terms and gets accounts banned.** So the only honest architecture
is the boring one:

- the data comes from the export Instagram already gives you;
- nothing leaves your device — there is no server, no analytics, no account;
- the tool never touches your Instagram account, so it can't put it at risk;
- a human does the looking. The app structures your judgement; it never substitutes for it.

That last point is a design value, not just a legal hedge. A lens describes **patterns of content**,
never **types of people**, and every lens ships with counter-signals and a reflection question. Two
people using the same lenses can reach different conclusions about the same account, and that's
working as intended.

## Lenses

Lenses live in [`lenses/`](lenses/) as plain YAML. The core pack ships with:

| Lens | Asks |
|---|---|
| Overconsumption / Flexing | After scrolling their last ~10 posts, what is this account mostly *about*? |
| Entitlement / Superiority Tone | Does this creator treat their audience like a community or a resource? |
| Performative Authenticity | Does their authenticity feel lived or performed? |
| Manipulative Sales Tactics | Do I feel pressured or informed after viewing their content? |
| Emotional Drain / Drama Cycles | How do I feel after scrolling their last 10 posts? |

**Writing a lens is the easiest way to contribute, and you don't need to know any code.** See
[CONTRIBUTING.md](CONTRIBUTING.md). Lenses in other languages and lenses rooted in other cultures'
values are especially welcome — the core pack reflects where the project started, not where it ends.

## Running it locally

```bash
npm install
npm run dev        # validates lenses, then serves the app at http://localhost:5173
npm run build      # production build → app/dist
npm run lenses     # just validate lenses and regenerate app/src/lenses.generated.json
```

Requires Node 20+. The GitHub Actions workflow validates lenses and builds on every PR, and deploys
`main` to GitHub Pages.

## Project layout

```
lenses/            values filters as YAML (core/ ships with the app, community/ is yours)
  schema.json      what a valid lens looks like; enforced in CI
importers/         parsers for platform data exports (instagram.js is the reference)
app/               the PWA — React + Vite, no backend
scripts/           lens validator / compiler
docs/              philosophy and design notes
```

## Roadmap

- [ ] More importers: TikTok, Threads, YouTube subscriptions, X (all offer data exports)
- [ ] Lens packs — curated bundles you can turn on with one tap
- [ ] Optional, opt-in assist: paste a few captions or a screenshot and get *suggested* ticks from a
      model running on-device. The human ticks stay the source of truth.
- [ ] Translations of the app and lenses

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
Bug reports and lens proposals both go through [issues](../../issues).

## License

[AGPL-3.0](LICENSE). You can run, study, modify and share this freely; if you host a modified version
for others, you share your changes too. The lenses themselves (the YAML files) are additionally
released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) so they can be reused
in other tools, articles and workshops.

---

*Started by [Zil Montecinos Bonnet](https://github.com/) under the Munayni Technologies umbrella.
Munay is love, Ayni is reciprocity — attention is a gift you give; this is a tool for giving it on
purpose.*
