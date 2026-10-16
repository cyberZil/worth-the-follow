# Contributing to Worth the Follow

Thanks for being here. There are three ways to contribute, in rough order of how many people can do
them:

1. **Write a lens** — no code required.
2. **Add an importer** for another platform's data export.
3. **Improve the app.**

Whatever you do, the project's non-negotiables apply:

- **No scraping, no automation, no login.** We never read instagram.com (or any platform) on a
  user's behalf, never automate the app, never ask for credentials. PRs that add this will be closed
  with thanks — not because the idea is bad, but because it gets users banned and the project sued.
- **Nothing leaves the device.** No analytics, no telemetry, no "optional" cloud sync. If a feature
  needs a server, it needs a different project.
- **The human decides.** The app can order, suggest, and prompt. It never labels an account on its own.

## 1. Writing a lens

A lens is one YAML file in `lenses/community/<id>.yaml`. Copy an existing one from `lenses/core/` to
start. The schema in `lenses/schema.json` is enforced in CI; run `npm run lenses` locally to check.

```yaml
id: hustle-culture            # kebab-case, must match the file name
name: Hustle Culture Gospel   # 3–60 characters
version: 1
author: your-handle           # optional
description: >-               # 20–300 characters; describe CONTENT, not people
  Accounts whose core message is that rest is weakness and your worth is your output.
signals:                      # 2–8 things a reviewer can actually see in ~10 posts
  - Frames sleep, breaks, or leisure as laziness or lost opportunity
  - "Grindset" quotes or routines presented as the only path to a good life
  - Mocks people with ordinary jobs or lives
counter_signals:              # strongly encouraged; what points the other way
  - Talks about limits, rest, or failure without turning it into a lesson to sell
  - Credits luck, help, or circumstances alongside effort
reflection_prompt: "Do I feel energised or inadequate after their content?"
weight: user-set              # always this value; users set their own weights
tags: [work, wellbeing]       # optional
language: en                  # optional BCP-47 tag
```

### What makes a good lens

- **Signals are observable.** "Posts price tags" is a signal. "Is materialistic" is a verdict.
  If a reviewer can't tick it after looking at ten posts, rewrite it.
- **Describe content, never people.** The validator rejects descriptions that label people
  ("people who…", "narcissists"). A lens that reads as an insult will be declined even if it passes.
- **Include counter-signals.** They're what keeps a lens from becoming a witch hunt. A lens with
  no way for an account to come out well is an accusation, not a filter.
- **One reflection question**, phrased about the content or about the reviewer's own reaction
  ("How do I feel after…"). Not "Is this person bad?".
- **Keep it culturally honest.** Values differ. A lens about modesty, consumption, or self-promotion
  will read very differently in different communities. Say where you're coming from in the PR, and
  prefer specific signals over universal claims.
- **No protected characteristics.** Lenses must never key on race, ethnicity, religion, gender,
  sexuality, disability, age, body size, or nationality — not as signals, not as counter-signals,
  not as subtext. Lenses about *behaviour toward* those groups (e.g. punching down) are fine.

### YAML gotchas

- A line that *starts* with a double quote must be wrapped in single quotes:
  `- '"Raw" posts that are clearly staged'`
- Keep `reflection_prompt` in double quotes. You can use `*asterisks*` for emphasis; nothing else.

### Submitting

Open a PR titled `lens: <name>`. In the description, say in two or three sentences what pattern the
lens captures and why it's distinct from the existing ones. Maintainers may suggest merging it into an
existing lens or splitting it. Lenses are licensed CC BY-SA 4.0 — by contributing, you agree to that.

## 2. Adding an importer

Create `importers/<platform>.js` exporting the same interface as `importers/instagram.js`:

```js
export const id, name, fileHint, instructions;   // what the user sees
export function detect(json)                      // true if this file is yours
export function parse(json)                       // → [{ platform, handle, url, followedAt }]
export function openUrl(account)                  // link to the profile
```

Register it in `importers/index.js`. Importers must work on the platform's **official data export**
only, run entirely in the browser, and handle every shape of the file you can find — add a fixture
under `importers/fixtures/<platform>/` (with fake handles) for each.

## 3. Working on the app

```bash
npm install
npm run dev
```

The app is React + Vite, no TypeScript (for now), no UI framework, no state library. Keep it that way
unless there's a strong reason — the lower the barrier, the more people can help. Mobile first: every
tap target ≥ 44px, works one-handed, works offline.

Before opening a PR: `npm run build` passes, you've tried the flow with demo accounts on a phone-sized
viewport, and you've updated the README if you changed behaviour.

## Reporting issues

Use the issue templates. For lens *ideas* you don't want to write yourself, open a "Lens proposal"
issue — someone else might pick it up.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). We're building a tool for leaving
toxic spaces; let's not become one.
