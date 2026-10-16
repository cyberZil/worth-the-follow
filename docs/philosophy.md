# Why a lens, not a score

Most "clean up your following" tools do one of two things: they rank accounts by engagement stats, or
they automate unfollowing. InfluencerCheck does neither, on purpose.

## The constraint that shaped everything

Instagram's data export tells you *who* you follow and *when*. It tells you nothing about *what they
post*. The only ways to get that content automatically — scraping, browser extensions that read the
page, logging in through a tool — all violate Meta's terms and, in practice, get accounts banned.

For a tool meant to be open source and safe for strangers to run, that leaves exactly one honest
design: **the person looks at the content, and the tool helps them look well.**

## What a lens is

A lens turns a vague feeling ("I'm tired of people flexing") into something you can check. It has:

- **signals** — concrete, visible things in a profile's recent posts;
- **counter-signals** — concrete things that point the other way;
- **a reflection prompt** — one question you answer for yourself;
- **a weight** that *you* set, never the project.

The tick-boxes are not a test the account passes or fails. They're a way of slowing down and noticing
what you're actually reacting to. Two people can tick the same boxes and reach opposite decisions, and
both are right, because the decision is about *their* attention, not about the account's worth.

## What a lens is not

- Not a judgement about a person's character. Lenses describe content patterns. "Posts hauls every
  week" is a pattern; "is shallow" is a verdict, and it isn't allowed.
- Not universal. The core pack reflects the values of the people who started this project. A lens
  about modesty, money, or self-promotion will mean different things in different communities. That's
  why lenses are files anyone can write, fork, translate, or ignore.
- Not a proxy for protected characteristics. Ever.

## Why the friction meter is deliberately weak

The app computes a "friction" number from your ticks and your weights, and uses it only to sort the
results list so the accounts you had the strongest reaction to show up first. It's never shown as a
grade, never triggers a decision, and never persists past your session unless you export it. If it
ever starts feeling like a score, that's a bug in the design.

## Why no automated unfollow

Partly terms of service. But mostly: the moment of unfollowing is the moment of decision. Outsourcing
it to a button that fires fifty times turns a reflective practice into a purge, and purges are how
people end up following the same accounts again three months later. Doing it yourself, a few at a
time, in the app, is the practice.

## On the optional assist (roadmap)

A future version may let you paste a few captions or a screenshot and get *suggested* ticks from a
small model running on your device. If that ships, three rules hold: it is opt-in; it never fetches
anything itself; and its suggestions are shown as suggestions, with the human ticks remaining the
only thing the results are built from.
