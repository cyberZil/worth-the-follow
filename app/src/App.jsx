import { useEffect, useMemo, useRef, useState } from "react";
import LENSES from "./lenses.generated.json";
import { importers, detectImporter } from "@importers/index.js";
import { loadSession, saveSession, clearSession, downloadText } from "./storage.js";
import { friction, topLenses, DEFAULT_WEIGHT } from "./scoring.js";
import { demoAccounts } from "./demo.js";

const DECISION = { KEEP: "keep", LETGO: "letgo", UNSURE: "unsure" };

function newSession(accounts, source) {
  return {
    v: 1,
    createdAt: new Date().toISOString(),
    source,
    accounts: accounts.map((a) => ({ ...a, decision: null, marks: {}, note: "" })),
    enabled: Object.fromEntries(LENSES.map((l) => [l.id, true])),
    weights: Object.fromEntries(LENSES.map((l) => [l.id, DEFAULT_WEIGHT])),
    cursor: 0,
    screen: "lenses",
  };
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [screen, setScreen] = useState(session?.screen || "welcome");

  useEffect(() => {
    if (session) saveSession({ ...session, screen });
  }, [session, screen]);

  const update = (patch) => setSession((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  const enabledLenses = useMemo(
    () => LENSES.filter((l) => session?.enabled?.[l.id]),
    [session?.enabled]
  );

  function start(accounts, source) {
    setSession(newSession(accounts, source));
    setScreen("lenses");
  }

  function reset() {
    if (!confirm("Clear this review from this device? Export it first if you want to keep it.")) return;
    clearSession();
    setSession(null);
    setScreen("welcome");
  }

  return (
    <div className="app">
      <Header screen={screen} session={session} onNav={setScreen} onReset={reset} />
      <main>
        {screen === "welcome" && <Welcome onStart={start} onResume={session ? () => setScreen(session.screen === "welcome" ? "lenses" : session.screen) : null} />}
        {screen === "lenses" && session && (
          <LensPicker session={session} update={update} onNext={() => setScreen("review")} />
        )}
        {screen === "review" && session && (
          <Review session={session} lenses={enabledLenses} update={update} onDone={() => setScreen("results")} />
        )}
        {screen === "results" && session && (
          <Results session={session} lenses={enabledLenses} update={update} onReview={() => setScreen("review")} />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Header ───────────────────────── */

function Header({ screen, session, onNav, onReset }) {
  const steps = [
    ["lenses", "Lenses"],
    ["review", "Review"],
    ["results", "Results"],
  ];
  return (
    <header className="header">
      <button className="brand" onClick={() => onNav("welcome")} aria-label="Home">
        <span className="brand-mark" aria-hidden>◆</span>
        <span className="brand-text">Worth the Follow</span>
      </button>
      {session && screen !== "welcome" && (
        <nav className="steps" aria-label="Steps">
          {steps.map(([id, label]) => (
            <button key={id} className={screen === id ? "step active" : "step"} onClick={() => onNav(id)}>
              {label}
            </button>
          ))}
          <button className="step danger" onClick={onReset} title="Clear review from this device">Clear</button>
        </nav>
      )}
    </header>
  );
}

/* ───────────────────────── Welcome / Import ───────────────────────── */

function Welcome({ onStart, onResume }) {
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const fileRef = useRef();

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json?.v === 1 && Array.isArray(json.accounts)) {
        // A previously exported session.
        saveSession(json);
        location.reload();
        return;
      }
      const imp = detectImporter(json);
      if (!imp) throw new Error("This doesn't look like a following export we recognise. Did you pick following.json?");
      const accounts = imp.parse(json);
      if (!accounts.length) throw new Error("The file parsed, but no accounts were found in it.");
      onStart(accounts, { importer: imp.id, file: file.name });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      e.target.value = "";
    }
  }

  const ig = importers[0];

  return (
    <section className="screen welcome">
      <h1>Who still deserves your attention?</h1>
      <p className="lede">
        Load your own Instagram data export and walk through everyone you follow, one card at a time,
        against values you choose. Nothing is uploaded, nothing is unfollowed for you. The last step
        is yours.
      </p>

      <div className="cta-row">
        <button className="btn primary" onClick={() => fileRef.current.click()}>Load following.json</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button className="btn" onClick={() => onStart(demoAccounts(), { importer: "demo" })}>Try with demo accounts</button>
        {onResume && <button className="btn ghost" onClick={onResume}>Resume saved review</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      <details className="howto" open={open} onToggle={(e) => setOpen(e.target.open)}>
        <summary>How do I get my {ig.fileHint}?</summary>
        <ol>
          {ig.instructions.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <p className="muted">
          You can also load a session file you exported earlier from the Results screen.
        </p>
      </details>

      <div className="privacy">
        <h2>How this stays safe</h2>
        <ul>
          <li><strong>On-device only.</strong> The file is read in your browser; there is no server.</li>
          <li><strong>No login.</strong> We never ask for your Instagram password or token.</li>
          <li><strong>No automation.</strong> Unfollowing is done by you, in the app, so your account is never at risk.</li>
          <li><strong>Your values, not ours.</strong> Lenses are prompts for your own judgement, not verdicts on anyone.</li>
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────── Lens picker ───────────────────────── */

const WEIGHT_LABEL = ["Off", "Light", "Normal", "Strong"];

function LensPicker({ session, update, onNext }) {
  const enabledCount = LENSES.filter((l) => session.enabled[l.id]).length;
  return (
    <section className="screen">
      <h1>Pick your lenses</h1>
      <p className="lede">
        A lens is a values filter written as things you can actually notice in someone's last ten posts.
        Turn on the ones that matter to you and set how much weight each one carries.
      </p>
      <ul className="lens-list">
        {LENSES.map((lens) => {
          const on = !!session.enabled[lens.id];
          const w = session.weights[lens.id] ?? DEFAULT_WEIGHT;
          return (
            <li key={lens.id} className={on ? "lens-card on" : "lens-card"}>
              <label className="lens-head">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => update((s) => ({ enabled: { ...s.enabled, [lens.id]: e.target.checked } }))}
                />
                <span>
                  <strong>{lens.name}</strong>
                  <small>{lens.description}</small>
                </span>
              </label>
              {on && (
                <div className="lens-body">
                  <div className="weight">
                    <span>Weight: {WEIGHT_LABEL[w]}</span>
                    <input
                      type="range" min="1" max="3" step="1" value={w}
                      aria-label={`Weight for ${lens.name}`}
                      onChange={(e) => update((s) => ({ weights: { ...s.weights, [lens.id]: Number(e.target.value) } }))}
                    />
                  </div>
                  <details>
                    <summary>What I'll be looking for</summary>
                    <p className="sig-h">Signals</p>
                    <ul>{lens.signals.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    {lens.counter_signals?.length > 0 && (
                      <>
                        <p className="sig-h">Counter-signals</p>
                        <ul>{lens.counter_signals.map((x, i) => <li key={i}>{x}</li>)}</ul>
                      </>
                    )}
                  </details>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="muted">
        Want a lens that isn't here? Lenses are plain YAML files anyone can contribute — see the project README.
      </p>
      <div className="cta-row sticky">
        <button className="btn primary" disabled={!enabledCount} onClick={onNext}>
          Start reviewing {session.accounts.length} accounts
        </button>
      </div>
    </section>
  );
}

/* ───────────────────────── Review ───────────────────────── */

function Review({ session, lenses, update, onDone }) {
  const { accounts } = session;
  const pending = accounts.map((a, i) => [a, i]).filter(([a]) => !a.decision);
  const [idx, setIdx] = useState(() => {
    const i = pending.findIndex(([, i]) => i >= (session.cursor || 0));
    return i === -1 ? 0 : i;
  });
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(0);
  const startX = useRef(null);

  if (!pending.length) {
    return (
      <section className="screen center">
        <h1>All reviewed.</h1>
        <button className="btn primary" onClick={onDone}>See results</button>
      </section>
    );
  }

  const [account, accountIndex] = pending[Math.min(idx, pending.length - 1)];
  const done = accounts.length - pending.length;
  const importer = importers.find((i) => i.id === account.platform) || importers[0];

  function setMark(lensId, kind, i, on) {
    update((s) => {
      const accs = s.accounts.slice();
      const a = { ...accs[accountIndex] };
      const m = { ...(a.marks?.[lensId] || { signals: [], counter: [] }) };
      const arr = new Set(m[kind] || []);
      on ? arr.add(i) : arr.delete(i);
      m[kind] = [...arr].sort();
      a.marks = { ...a.marks, [lensId]: m };
      accs[accountIndex] = a;
      return { accounts: accs };
    });
  }

  function decide(decision) {
    update((s) => {
      const accs = s.accounts.slice();
      accs[accountIndex] = { ...accs[accountIndex], decision, decidedAt: new Date().toISOString() };
      return { accounts: accs, cursor: accountIndex + 1 };
    });
    setHistory((h) => [...h, accountIndex]);
    setDrag(0);
    // pending re-derives on render; keep idx in range
    setIdx((i) => Math.min(i, pending.length - 2 < 0 ? 0 : pending.length - 2));
  }

  function undo() {
    const last = history[history.length - 1];
    if (last == null) return;
    update((s) => {
      const accs = s.accounts.slice();
      accs[last] = { ...accs[last], decision: null, decidedAt: undefined };
      return { accounts: accs, cursor: last };
    });
    setHistory((h) => h.slice(0, -1));
    setIdx(0);
  }

  // swipe
  function onPointerDown(e) { startX.current = e.clientX; }
  function onPointerMove(e) { if (startX.current != null) setDrag(e.clientX - startX.current); }
  function onPointerUp() {
    if (startX.current == null) return;
    const d = drag;
    startX.current = null;
    if (d > 110) decide(DECISION.KEEP);
    else if (d < -110) decide(DECISION.LETGO);
    else setDrag(0);
  }

  const f = friction(account, lenses, session.weights);
  const anyMarks = Object.values(account.marks || {}).some((m) => m.signals?.length || m.counter?.length);

  return (
    <section className="screen review">
      <div className="progress" aria-label={`${done} of ${accounts.length} reviewed`}>
        <div style={{ width: `${(done / accounts.length) * 100}%` }} />
      </div>
      <p className="muted small">{done} of {accounts.length} reviewed · {pending.length} to go</p>

      <article
        className="card"
        style={{ transform: `translateX(${drag}px) rotate(${drag / 30}deg)` }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        <div className={"swipe-hint " + (drag > 40 ? "keep" : drag < -40 ? "letgo" : "")}>
          {drag > 40 ? "Keep" : drag < -40 ? "Let go" : ""}
        </div>
        <h2 className="handle">@{account.handle}</h2>
        {account.followedAt && (
          <p className="muted small">Following since {new Date(account.followedAt).toLocaleDateString()}</p>
        )}
        <a className="btn open" href={importer.openUrl(account)} target="_blank" rel="noopener noreferrer">
          Open profile ↗
        </a>
        <p className="muted small">Scroll their last ~10 posts, then come back and tick what you noticed.</p>

        {lenses.map((lens) => {
          const m = account.marks?.[lens.id] || { signals: [], counter: [] };
          return (
            <details key={lens.id} className="lens-check" open={lenses.length <= 2}>
              <summary>
                <strong>{lens.name}</strong>
                {(m.signals.length || m.counter.length) ? (
                  <span className="pill">{m.signals.length}↑ {m.counter.length}↓</span>
                ) : null}
              </summary>
              <p className="prompt"><Emph text={lens.reflection_prompt} /></p>
              <ul className="checks">
                {lens.signals.map((sig, i) => (
                  <li key={"s" + i}>
                    <label>
                      <input type="checkbox" checked={m.signals.includes(i)} onChange={(e) => setMark(lens.id, "signals", i, e.target.checked)} />
                      <span>{sig}</span>
                    </label>
                  </li>
                ))}
                {lens.counter_signals?.map((sig, i) => (
                  <li key={"c" + i} className="counter">
                    <label>
                      <input type="checkbox" checked={m.counter.includes(i)} onChange={(e) => setMark(lens.id, "counter", i, e.target.checked)} />
                      <span>{sig}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}

        {anyMarks && (
          <div className="friction">
            <span>Friction with your lenses</span>
            <div className="meter"><div style={{ width: `${Math.round(f * 100)}%` }} /></div>
          </div>
        )}
      </article>

      <div className="decide">
        <button className="btn letgo" onClick={() => decide(DECISION.LETGO)}>← Let go</button>
        <button className="btn ghost" onClick={() => decide(DECISION.UNSURE)}>Unsure</button>
        <button className="btn keep" onClick={() => decide(DECISION.KEEP)}>Keep →</button>
      </div>
      <div className="cta-row">
        <button className="btn ghost small" onClick={undo} disabled={!history.length}>Undo</button>
        <button className="btn ghost small" onClick={() => setIdx((i) => (i + 1) % pending.length)}>Skip for now</button>
        <button className="btn ghost small" onClick={onDone}>Results so far</button>
      </div>
    </section>
  );
}

/* ───────────────────────── Results ───────────────────────── */

function Results({ session, lenses, update, onReview }) {
  const [tab, setTab] = useState(DECISION.LETGO);
  const [copied, setCopied] = useState(false);
  const groups = useMemo(() => {
    const g = { keep: [], letgo: [], unsure: [], pending: [] };
    session.accounts.forEach((a, i) => g[a.decision || "pending"].push({ ...a, i }));
    const byFriction = (a, b) => friction(b, lenses, session.weights) - friction(a, lenses, session.weights);
    g.letgo.sort(byFriction); g.unsure.sort(byFriction);
    return g;
  }, [session, lenses]);

  const list = groups[tab] || [];
  const letgoText = groups.letgo.map((a) => "@" + a.handle).join("\n");

  function changeDecision(i, decision) {
    update((s) => {
      const accs = s.accounts.slice();
      accs[i] = { ...accs[i], decision };
      return { accounts: accs };
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(letgoText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      downloadText("let-go.txt", letgoText);
    }
  }

  function exportCsv() {
    const rows = [["handle", "decision", "friction", "top_lenses", "url"]];
    for (const a of session.accounts) {
      rows.push([
        a.handle, a.decision || "", friction(a, lenses, session.weights).toFixed(2),
        topLenses(a, lenses, session.weights).map((l) => l.id).join("|"), a.url || "",
      ]);
    }
    downloadText("worth-the-follow.csv", rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"), "text/csv");
  }

  return (
    <section className="screen">
      <h1>Your results</h1>
      <div className="stats">
        <Stat n={groups.keep.length} label="Keep" />
        <Stat n={groups.letgo.length} label="Let go" />
        <Stat n={groups.unsure.length} label="Unsure" />
        <Stat n={groups.pending.length} label="Not yet" />
      </div>

      <div className="cta-row">
        <button className="btn primary" onClick={copy} disabled={!groups.letgo.length}>{copied ? "Copied" : "Copy let-go list"}</button>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
        <button className="btn" onClick={() => downloadText("worth-the-follow-session.json", JSON.stringify(session, null, 2), "application/json")}>Save session file</button>
        {groups.pending.length > 0 && <button className="btn ghost" onClick={onReview}>Continue reviewing</button>}
      </div>
      <p className="muted small">
        Unfollowing happens in Instagram, by you. Work down the let-go list at your own pace; nothing here touches your account.
      </p>

      <div className="tabs" role="tablist">
        {[["letgo", "Let go"], ["unsure", "Unsure"], ["keep", "Keep"], ["pending", "Not yet"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>
            {label} ({groups[id].length})
          </button>
        ))}
      </div>

      <ul className="result-list">
        {list.map((a) => {
          const tl = topLenses(a, lenses, session.weights);
          const imp = importers.find((i) => i.id === a.platform) || importers[0];
          return (
            <li key={a.handle}>
              <div>
                <a href={imp.openUrl(a)} target="_blank" rel="noopener noreferrer">@{a.handle}</a>
                {tl.length > 0 && <small className="muted"> · {tl.map((l) => l.name).join(", ")}</small>}
              </div>
              <div className="mini">
                {a.decision !== "keep" && <button onClick={() => changeDecision(a.i, "keep")}>Keep</button>}
                {a.decision !== "letgo" && <button onClick={() => changeDecision(a.i, "letgo")}>Let go</button>}
                {a.decision !== "unsure" && <button onClick={() => changeDecision(a.i, "unsure")}>Unsure</button>}
              </div>
            </li>
          );
        })}
        {!list.length && <li className="muted">Nothing here yet.</li>}
      </ul>
    </section>
  );
}

/** Renders *emphasis* from lens text as <em>; no other markdown is supported on purpose. */
function Emph({ text }) {
  const parts = String(text).split(/(\*[^*]+\*)/g);
  return parts.map((p, i) => (p.startsWith("*") && p.endsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : p));
}

function Stat({ n, label }) {
  return (
    <div className="stat"><strong>{n}</strong><span>{label}</span></div>
  );
}
