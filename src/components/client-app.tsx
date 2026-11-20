"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "oversikt" | "trening" | "mat" | "innsjekk" | "chat" | "profil";
type Modal = "workout" | "meal" | "checkin" | null;
type Message = { id: string; kind: "mine" | "coach" | "activity"; text: string; time: string };
type Workout = { id: string; name: string; minutes: number; exercise?: string; sets?: number; reps?: number; weight?: number; note: string; date: string };
type Meal = { id: string; name: string; category: string; kcal: number; protein: number; date: string };
type Checkin = { id: string; energy: number; sleep: number; mood: string; note: string; date: string };
type AppData = {
  workouts: Workout[];
  meals: Meal[];
  checkins: Checkin[];
  messages: Message[];
  doneTasks: string[];
  sharing: { workouts: boolean; meals: boolean; checkins: boolean; health: boolean };
};

const key = "maxfit-client-demo-v1";
const initial: AppData = {
  workouts: [], meals: [], checkins: [], doneTasks: [],
  messages: [{ id: "welcome", kind: "coach", text: "Hei! Dette er en eksempelmelding fra coachen din. Her samles også korte oppsummeringer når du logger aktivitet.", time: "Demo" }],
  sharing: { workouts: true, meals: true, checkins: true, health: false },
};
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "oversikt", label: "Oversikt", icon: "home" },
  { id: "trening", label: "Trening", icon: "dumbbell" },
  { id: "mat", label: "Mat", icon: "food" },
  { id: "innsjekk", label: "Innsjekk", icon: "heart" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "profil", label: "Profil", icon: "user" },
];
const tasks = [
  { id: "water", title: "Drikk nok vann", detail: "En liten vane som gjør godt" },
  { id: "walk", title: "Gå en tur", detail: "20 minutter i ditt tempo" },
  { id: "pause", title: "Ta en skjermpause", detail: "Noen minutter er nok" },
];

function Icon({ name, size = 21 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
    dumbbell: <><path d="m6 5 13 13M4 3l3 3M2 6l4-4M17 18l4 4M18 21l4-4M3 9l6-6M15 21l6-6" /></>,
    food: <><path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18M18 21V3c-4 2-5 6-5 11h5" /></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></>,
    chat: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <><path d="m4 12 5 5L20 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></>,
    arrow: <><path d="m5 12 14 0m-6-6 6 6-6 6" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    chart: <><path d="M3 20h18M5 16l4-5 4 3 6-8" /></>,
    close: <><path d="M5 5 19 19M19 5 5 19" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const today = () => new Date().toLocaleDateString("sv-SE");
const currentTime = () => new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
const id = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

export function ClientApp() {
  const [tab, setTab] = useState<Tab>("oversikt");
  const [modal, setModal] = useState<Modal>(null);
  const [data, setData] = useState<AppData>(initial);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppData>;
        setData({
          workouts: parsed.workouts ?? [], meals: parsed.meals ?? [], checkins: parsed.checkins ?? [],
          messages: parsed.messages ?? initial.messages, doneTasks: parsed.doneTasks ?? [],
          sharing: { ...initial.sharing, ...parsed.sharing },
        });
      }
    } catch { /* Keep the demo usable if browser storage was cleared or invalid. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(data)); }, [data, ready]);

  const todayWorkouts = useMemo(() => data.workouts.filter(x => x.date === today()), [data.workouts]);
  const todayMeals = useMemo(() => data.meals.filter(x => x.date === today()), [data.meals]);
  const todayCheckin = useMemo(() => data.checkins.find(x => x.date === today()), [data.checkins]);
  const kcal = todayMeals.reduce((sum, x) => sum + x.kcal, 0);
  const protein = todayMeals.reduce((sum, x) => sum + x.protein, 0);
  const completed = data.doneTasks.length + Number(!!todayCheckin) + Number(todayWorkouts.length > 0);
  const dateText = new Intl.DateTimeFormat("nb-NO", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const activity = (text: string): Message => ({ id: id(), kind: "activity", text, time: currentTime() });

  function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const minutes = Number(form.get("minutes"));
    const exercise = String(form.get("exercise") || "").trim();
    const sets = Number(form.get("sets") || 0);
    const reps = Number(form.get("reps") || 0);
    const weight = Number(form.get("weight") || 0);
    const note = String(form.get("note") || "").trim();
    if (!name || !Number.isFinite(minutes) || minutes < 1 || sets < 0 || reps < 0 || weight < 0) return;
    setData(old => ({
      ...old,
      workouts: [{ id: id(), name, minutes, exercise, sets, reps, weight, note, date: today() }, ...old.workouts],
      messages: [...old.messages, activity(`Treningsøkt fullført: ${name} · ${minutes} min${exercise ? ` · ${exercise}: ${sets} × ${reps}${weight ? ` på ${weight} kg` : ""}` : ""}`)],
    }));
    setModal(null);
    setTab("trening");
  }
  function saveMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const category = String(form.get("category") || "Måltid");
    const kcalValue = Number(form.get("kcal"));
    const proteinValue = Number(form.get("protein"));
    if (!name || kcalValue < 0 || proteinValue < 0 || !Number.isFinite(kcalValue) || !Number.isFinite(proteinValue)) return;
    setData(old => ({
      ...old,
      meals: [{ id: id(), name, category, kcal: kcalValue, protein: proteinValue, date: today() }, ...old.meals],
      messages: [...old.messages, activity(`Måltid logget: ${name} · ${kcalValue} kcal · ${proteinValue} g protein`)],
    }));
    setModal(null);
    setTab("mat");
  }
  function saveCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const energy = Number(form.get("energy"));
    const sleep = Number(form.get("sleep"));
    const mood = String(form.get("mood") || "Bra");
    const note = String(form.get("note") || "").trim();
    if (energy < 1 || energy > 5 || sleep < 0 || sleep > 24) return;
    setData(old => ({
      ...old,
      checkins: [{ id: id(), energy, sleep, mood, note, date: today() }, ...old.checkins.filter(x => x.date !== today())],
      messages: [...old.messages, activity(`Daglig innsjekk: ${mood.toLowerCase()} · energi ${energy}/5 · søvn ${sleep} t`)],
    }));
    setModal(null);
    setTab("innsjekk");
  }
  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setData(old => ({ ...old, messages: [...old.messages, { id: id(), kind: "mine", text, time: currentTime() }] }));
    setDraft("");
  }
  function toggleTask(taskId: string) {
    setData(old => ({ ...old, doneTasks: old.doneTasks.includes(taskId) ? old.doneTasks.filter(x => x !== taskId) : [...old.doneTasks, taskId] }));
  }
  function toggleSharing(which: keyof AppData["sharing"]) {
    setData(old => ({ ...old, sharing: { ...old.sharing, [which]: !old.sharing[which] } }));
  }

  const heading = {
    oversikt: ["Din dag, din fremgang", "Alt du trenger i dag, samlet på ett sted."],
    trening: ["Trening", "Se det du har gjort, og bygg videre derfra."],
    mat: ["Mat og energi", "En enkel oversikt over det du spiser."],
    innsjekk: ["Hvordan går det?", "Noen sekunder til å kjenne etter."],
    chat: ["Samtalen", "Oppdateringer og spørsmål på ett sted."],
    profil: ["Din profil", "Du bestemmer hva du vil dele."],
  }[tab];

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setTab("oversikt")} aria-label="Maxfit, gå til oversikt"><span className="brand-mark">M<span>✳</span></span><span>maxfit<span className="brand-dot">.</span></span></button>
      <div className="side-caption">MIN PLASS</div>
      <nav aria-label="Hovedmeny" className="side-nav">{tabs.map(item => <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span>{item.id === "chat" && data.messages.length > 1 && <i />}</button>)}</nav>
      <div className="sidebar-bottom glass-card"><div className="coach-avatar">MH</div><div><strong>Din coach</strong><small>Eksempelprofil</small></div><span className="online-dot" /></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">M<span>✳</span></span><strong>maxfit<span className="brand-dot">.</span></strong></div><span className="date-label">{dateText}</span><button className="profile-chip glass-button" onClick={() => setTab("profil")}><span className="profile-avatar">M</span><span>Min profil</span></button></header>
      <div className="page-content">
        <div className="page-heading"><div><span className="eyebrow">{tab === "oversikt" ? "VELKOMMEN TILBAKE" : "MAXFIT / " + tab.toUpperCase()}</span><h1>{heading[0]}</h1><p>{heading[1]}</p></div>{tab !== "profil" && tab !== "chat" && <span className="demo-badge">Klientdemo</span>}</div>

        {tab === "oversikt" && <>
          <section className="hero-card"><div className="hero-copy"><span className="hero-kicker"><Icon name="spark" size={17} /> ET STEG AV GANGEN</span><h2>Gjør noe bra<br />for deg selv i dag.</h2><p>Små valg blir til store endringer. Her holder du oversikten, helt i ditt tempo.</p><button className="dark-button" onClick={() => setModal("workout")}>Logg en treningsøkt <Icon name="plus" size={18} /></button></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-disc"><span>DIN FREMDRIFT</span><strong>{completed}<small>/5</small></strong><span>dagens steg</span></div><div className="hero-spark">✦</div></div></section>
          <div className="stats-grid"><div className="stat-card glass-card"><span className="stat-icon orange"><Icon name="dumbbell" /></span><small>Treningsøkter i dag</small><strong>{todayWorkouts.length}</strong><span>Ta det i ditt tempo</span></div><div className="stat-card glass-card"><span className="stat-icon yellow"><Icon name="food" /></span><small>Mat logget</small><strong>{todayMeals.length}</strong><span>{kcal} kcal registrert</span></div><div className="stat-card glass-card"><span className="stat-icon peach"><Icon name="heart" /></span><small>Dagens innsjekk</small><strong>{todayCheckin ? "Gjort" : "Ikke ennå"}</strong><span>{todayCheckin ? "Bra jobba!" : "Hvordan har du det?"}</span></div></div>
          <div className="lower-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">DIN PLAN</span><h2>Små gjøremål</h2></div><span className="count-pill">{data.doneTasks.length}/{tasks.length} gjort</span></div><div className="task-list">{tasks.map(task => <button className="task-row" key={task.id} onClick={() => toggleTask(task.id)} aria-pressed={data.doneTasks.includes(task.id)}><span className={data.doneTasks.includes(task.id) ? "task-check checked" : "task-check"}>{data.doneTasks.includes(task.id) && <Icon name="check" size={15} />}</span><span><strong>{task.title}</strong><small>{task.detail}</small></span></button>)}</div></section><section className="panel coach-panel"><div className="section-title"><div><span className="eyebrow">HOLD KONTAKTEN</span><h2>Coach og deg</h2></div><span className="coach-avatar">MH</span></div><p>Spør om det du lurer på. Når du logger en økt, et måltid eller en innsjekk, vises en kort oppsummering i samtalen.</p><button className="text-action" onClick={() => setTab("chat")}>Åpne samtalen <Icon name="arrow" size={18} /></button></section></div>
        </>}

        {tab === "trening" && <><div className="feature-banner workout-banner"><div><span className="eyebrow">BEVEGELSE</span><h2>All bevegelse teller.</h2><p>Registrer økten din og se historikken vokse.</p></div><button className="dark-button" onClick={() => setModal("workout")}><Icon name="plus" size={18} /> Logg økt</button></div><section className="panel list-panel"><div className="section-title"><h2>Øktene dine</h2><span className="count-pill">{data.workouts.length} totalt</span></div>{data.workouts.length ? data.workouts.map(x => <div className="history-row" key={x.id}><span className="list-icon"><Icon name="dumbbell" /></span><div><strong>{x.name}</strong><small>{x.date}{x.exercise ? ` · ${x.exercise} ${x.sets} × ${x.reps}${x.weight ? ` · ${x.weight} kg` : ""}` : ""}{x.note ? ` · ${x.note}` : ""}</small></div><span className="row-value">{x.minutes} min</span></div>) : <Empty icon="dumbbell" title="Ingen økter ennå" text="Start med din første økt. Du kan registrere navn, varighet og en kort kommentar." action="Logg en økt" onClick={() => setModal("workout")} />}</section></>}

        {tab === "mat" && <><div className="feature-banner meal-banner"><div><span className="eyebrow">MATLOGG</span><h2>Enkelt å holde oversikt.</h2><p>Logg måltider manuelt. Mer detaljert matsøk kommer senere.</p></div><button className="dark-button" onClick={() => setModal("meal")}><Icon name="plus" size={18} /> Legg til måltid</button></div><div className="mini-stats"><div className="glass-card"><small>Energi i dag</small><strong>{kcal} <span>kcal</span></strong></div><div className="glass-card"><small>Protein i dag</small><strong>{protein} <span>g</span></strong></div></div><section className="panel list-panel"><div className="section-title"><h2>Dagens måltider</h2><span className="count-pill">{todayMeals.length} logget</span></div>{todayMeals.length ? todayMeals.map(x => <div className="history-row" key={x.id}><span className="list-icon"><Icon name="food" /></span><div><strong>{x.name}</strong><small>{x.category} · {x.protein} g protein</small></div><span className="row-value">{x.kcal} kcal</span></div>) : <Empty icon="food" title="Ingen måltider i dag" text="Et enkelt navn og næringsinnhold er nok for å komme i gang." action="Legg til måltid" onClick={() => setModal("meal")} />}</section></>}

        {tab === "innsjekk" && <><div className="feature-banner checkin-banner"><div><span className="eyebrow">DAGLIG INNSJEKK</span><h2>Hvordan kjennes dagen?</h2><p>Følg med på energi og søvn, uten at det blir komplisert.</p></div><button className="dark-button" onClick={() => setModal("checkin")}><Icon name="plus" size={18} /> {todayCheckin ? "Oppdater innsjekk" : "Sjekk inn"}</button></div><section className="panel list-panel"><div className="section-title"><h2>Innsjekkene dine</h2><span className="count-pill">{data.checkins.length} totalt</span></div>{data.checkins.length ? data.checkins.map(x => <div className="history-row" key={x.id}><span className="list-icon"><Icon name="heart" /></span><div><strong>{x.mood}</strong><small>{x.date}{x.note ? ` · ${x.note}` : ""}</small></div><span className="row-value">Energi {x.energy}/5 · {x.sleep} t søvn</span></div>) : <Empty icon="heart" title="Start med en innsjekk" text="Det tar bare et øyeblikk å fortelle hvordan du har det." action="Sjekk inn" onClick={() => setModal("checkin")} />}</section></>}

        {tab === "chat" && <div className="chat-layout"><section className="chat-card panel"><div className="chat-header"><div className="coach-avatar">MH</div><div><strong>Samtale med coach</strong><small>Eksempelprofil · bare lokalt på denne enheten</small></div></div><div className="messages" aria-live="polite">{data.messages.map(message => <div key={message.id} className={`message ${message.kind}`}>{message.kind === "activity" && <span className="message-label"><Icon name="spark" size={15} /> AKTIVITET</span>}<p>{message.text}</p><small>{message.time}</small></div>)}</div><form className="composer" onSubmit={sendMessage}><label className="sr-only" htmlFor="chat-message">Skriv en melding</label><input id="chat-message" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Skriv en melding..." /><button type="submit" disabled={!draft.trim()} aria-label="Send melding"><Icon name="arrow" size={20} /></button></form></section><aside className="chat-note glass-card"><Icon name="shield" /><strong>Dette er en lokal demo</strong><p>Meldinger og aktivitetskort lagres bare i denne nettleseren. En coach kan ikke lese eller svare her før kontoer og sikker database er koblet til.</p></aside></div>}

        {tab === "profil" && <div className="profile-grid"><section className="panel"><div className="profile-intro"><span className="large-avatar">M</span><div><span className="eyebrow">KLIENTPROFIL</span><h2>Din plass i Maxfit</h2><p>En rolig start. Konto og Google-innlogging kommer i neste etappe.</p></div></div><div className="section-title privacy-title"><div><span className="eyebrow">PERSONVERN</span><h2>Del med coachen</h2></div><Icon name="shield" /></div><p className="muted">Velg hvilke typer data en coach skal kunne se når ekte kontoer kobles til. Valgene lagres foreløpig bare lokalt.</p>{([["workouts", "Treningsøkter", "Økter og kommentarer"], ["meals", "Matlogg", "Måltider og næringsinnhold"], ["checkins", "Innsjekk", "Energi, søvn og notater"], ["health", "Helsedata", "Krever egen integrasjon og samtykke"]] as const).map(([field, label, description]) => <label className="toggle-row" key={field}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={data.sharing[field]} onChange={() => toggleSharing(field)} /><span className="switch" /></label>)}</section><section className="panel roadmap-card"><span className="eyebrow">KOMMER SENERE</span><h2>Helse på dine premisser</h2><p>En fremtidig mobilapp kan hente skritt, søvn og vekt fra Apple Health eller Health Connect når du gir tilgang til hver datatype. Du skal også kunne bestemme hva coachen får se.</p><div className="roadmap-points"><span><Icon name="check" size={17} /> Samtykke per datatype</span><span><Icon name="check" size={17} /> Mulighet til å trekke tilgang tilbake</span><span><Icon name="check" size={17} /> Klare valg før deling</span></div></section></div>}
      </div>
    </main>
    <nav className="mobile-nav" aria-label="Mobilmeny">{tabs.slice(0, 5).map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)} aria-label={item.label} aria-current={tab === item.id ? "page" : undefined}><Icon name={item.icon} size={21} /><span>{item.label}</span></button>)}</nav>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">LEGG TIL</span><h2 id="modal-title">{modal === "workout" ? "Logg treningsøkt" : modal === "meal" ? "Logg måltid" : "Daglig innsjekk"}</h2></div><button className="close-button" onClick={() => setModal(null)} aria-label="Lukk"><Icon name="close" /></button></div>{modal === "workout" && <form onSubmit={saveWorkout} className="entry-form"><label>Hva trente du?<input name="name" placeholder="For eksempel styrke overkropp" required maxLength={80} autoFocus /></label><label>Varighet i minutter<input name="minutes" type="number" min="1" max="600" placeholder="45" required /></label><label>Øvelse <span>(valgfritt)</span><input name="exercise" placeholder="For eksempel knebøy" maxLength={80} /></label><div className="form-three"><label>Sett<input name="sets" type="number" min="0" max="50" placeholder="3" /></label><label>Reps<input name="reps" type="number" min="0" max="1000" placeholder="10" /></label><label>Vekt (kg)<input name="weight" type="number" min="0" max="1000" step="0.5" placeholder="40" /></label></div><label>Kort kommentar <span>(valgfritt)</span><textarea name="note" placeholder="Hvordan gikk det?" maxLength={180} /></label><button className="submit-button">Lagre økt</button></form>}{modal === "meal" && <form onSubmit={saveMeal} className="entry-form"><label>Navn på måltid<input name="name" placeholder="For eksempel havregrøt med bær" required maxLength={80} autoFocus /></label><label>Måltidstype<select name="category"><option>Frokost</option><option>Lunsj</option><option>Middag</option><option>Mellommåltid</option></select></label><div className="form-two"><label>Energi (kcal)<input name="kcal" type="number" min="0" max="10000" placeholder="350" required /></label><label>Protein (g)<input name="protein" type="number" min="0" max="1000" placeholder="20" required /></label></div><button className="submit-button">Lagre måltid</button></form>}{modal === "checkin" && <form onSubmit={saveCheckin} className="entry-form"><label>Hvordan har du det?<select name="mood" autoFocus><option>Bra</option><option>Helt greit</option><option>Sliten</option><option>Motivert</option><option>Trenger støtte</option></select></label><div className="form-two"><label>Energi (1–5)<input name="energy" type="number" min="1" max="5" defaultValue="3" required /></label><label>Søvn (timer)<input name="sleep" type="number" min="0" max="24" step="0.5" defaultValue="8" required /></label></div><label>Noe du vil notere? <span>(valgfritt)</span><textarea name="note" placeholder="Noen ord om dagen din" maxLength={240} /></label><button className="submit-button">Lagre innsjekk</button></form>}</div></div>}
  </div>;
}

function Empty({ icon, title, text, action, onClick }: { icon: string; title: string; text: string; action: string; onClick: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={27} /></span><h3>{title}</h3><p>{text}</p><button className="outline-button" onClick={onClick}><Icon name="plus" size={17} /> {action}</button></div>;
}
