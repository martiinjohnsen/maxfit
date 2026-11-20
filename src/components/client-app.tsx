"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_GLASS, glassLevel, glassStyle } from "@/lib/glass";
import { installGlassFeedback } from "@/lib/glass-motion";

type Tab = "oversikt" | "trening" | "mat" | "gjoremal" | "chat" | "profil";
type Modal = "folder" | "routine" | "exercise" | "food" | "customFood" | "task" | "checkin" | "goals" | null;
type SetRow = { id: string; reps: number; weight: number };
type Exercise = { id: string; name: string; category: string; note: string; sets: SetRow[] };
type Routine = { id: string; folderId: string; name: string; exercises: Exercise[] };
type WorkoutLog = { id: string; date: string; routineName: string; exercises: Exercise[] };
type Food = { id: string; name: string; kcal: number; protein: number; carbs: number; fat: number };
type FoodEntry = Food & { entryId: string; date: string; meal: string; grams: number };
type Task = { id: string; title: string; detail: string };
type Message = { id: string; kind: "mine" | "activity"; text: string; time: string };
type Data = {
  folders: { id: string; name: string }[]; routines: Routine[]; workouts: WorkoutLog[];
  foods: Food[]; entries: FoodEntry[]; goals: { kcal: number; protein: number; carbs: number; fat: number };
  tasks: Task[]; done: Record<string, string[]>; messages: Message[];
  sharing: { workouts: boolean; meals: boolean; checkins: boolean; health: boolean };
  glass: number;
};
const key = "maxfit-client-v2";
const oldKey = "maxfit-client-demo-v1";
const newId = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
const today = () => new Date().toLocaleDateString("sv-SE");
const clock = () => new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
const fmt = (n: number) => Math.round(n).toLocaleString("nb-NO");
const categories = ["Bryst", "Øvre rygg", "Nedre rygg", "Skuldre", "Biceps", "Triceps", "Forside lår", "Bakside lår", "Sete", "Legger", "Mage", "Kondisjon", "Mobilitet"];
const exerciseCatalog: { name: string; category: string }[] = [
  { name: "Benkpress", category: "Bryst" }, { name: "Skrå hantelpress", category: "Bryst" },
  { name: "Pullups", category: "Øvre rygg" }, { name: "Sittende roing", category: "Øvre rygg" },
  { name: "Markløft", category: "Nedre rygg" }, { name: "Skulderpress", category: "Skuldre" },
  { name: "Sidehev", category: "Skuldre" }, { name: "Bicepscurl", category: "Biceps" },
  { name: "Triceps pushdown", category: "Triceps" }, { name: "Knebøy", category: "Forside lår" },
  { name: "Beinpress", category: "Forside lår" }, { name: "Rumensk markløft", category: "Bakside lår" },
  { name: "Hip thrust", category: "Sete" }, { name: "Tåhev", category: "Legger" },
  { name: "Planke", category: "Mage" }, { name: "Crunch", category: "Mage" },
  { name: "Løping", category: "Kondisjon" }, { name: "Sykling", category: "Kondisjon" },
  { name: "Dynamisk tøying", category: "Mobilitet" },
];
const foodCatalog: Food[] = [
  { id: "oats", name: "Havregryn", kcal: 370, protein: 13, carbs: 60, fat: 7 },
  { id: "egg", name: "Egg", kcal: 143, protein: 13, carbs: 1, fat: 10 },
  { id: "banana", name: "Banan", kcal: 89, protein: 1, carbs: 23, fat: 0 },
  { id: "chicken", name: "Kyllingfilet", kcal: 110, protein: 23, carbs: 0, fat: 2 },
  { id: "rice", name: "Ris, kokt", kcal: 130, protein: 3, carbs: 28, fat: 0 },
  { id: "salmon", name: "Laks", kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "potato", name: "Potet, kokt", kcal: 87, protein: 2, carbs: 20, fat: 0 },
  { id: "skyr", name: "Skyr naturell", kcal: 62, protein: 11, carbs: 4, fat: 0 },
  { id: "bread", name: "Grovbrød", kcal: 235, protein: 9, carbs: 40, fat: 4 },
  { id: "avocado", name: "Avokado", kcal: 160, protein: 2, carbs: 9, fat: 15 },
  { id: "blueberry", name: "Blåbær", kcal: 57, protein: 1, carbs: 14, fat: 0 },
  { id: "milk", name: "Lettmelk", kcal: 42, protein: 3.5, carbs: 5, fat: 1 },
];
const seed: Data = {
  folders: [{ id: "strength", name: "Styrke" }],
  routines: [{ id: "fullbody", folderId: "strength", name: "Helkropp A", exercises: [
    { id: "squat", name: "Knebøy", category: "Forside lår", note: "", sets: [{ id: "sq1", reps: 8, weight: 0 }, { id: "sq2", reps: 8, weight: 0 }] },
    { id: "bench", name: "Benkpress", category: "Bryst", note: "", sets: [{ id: "be1", reps: 8, weight: 0 }, { id: "be2", reps: 8, weight: 0 }] },
    { id: "row", name: "Sittende roing", category: "Øvre rygg", note: "", sets: [{ id: "ro1", reps: 10, weight: 0 }, { id: "ro2", reps: 10, weight: 0 }] },
  ] }],
  workouts: [], foods: [], entries: [], goals: { kcal: 2200, protein: 140, carbs: 250, fat: 70 },
  tasks: [
    { id: "water", title: "Drikk nok vann", detail: "Ta et glass innimellom" },
    { id: "walk", title: "Gå en tur", detail: "20 minutter i ditt tempo" },
    { id: "pause", title: "Ta en skjermpause", detail: "Noen minutter er nok" },
  ],
  done: {}, messages: [], sharing: { workouts: true, meals: true, checkins: true, health: false }, glass: DEFAULT_GLASS,
};
const nav: { id: Tab; label: string; icon: string }[] = [
  { id: "oversikt", label: "Oversikt", icon: "home" }, { id: "trening", label: "Trening", icon: "dumbbell" },
  { id: "mat", label: "Mat", icon: "food" }, { id: "gjoremal", label: "Gjøremål", icon: "check" },
  { id: "chat", label: "Chat", icon: "chat" }, { id: "profil", label: "Profil", icon: "user" },
];
const meals = ["Frokost", "Lunsj", "Middag", "Mellommåltid"];
function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
    dumbbell: <><path d="m6 5 13 13M4 3l3 3M2 6l4-4M17 18l4 4M18 21l4-4M3 9l6-6M15 21l6-6" /></>,
    food: <><path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18M18 21V3c-4 2-5 6-5 11h5" /></>,
    check: <path d="m4 12 5 5L20 6" />, chat: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <path d="M12 5v14M5 12h14" />, folder: <path d="M3 5h7l2 3h9v11H3z" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />, back: <path d="m15 5-7 7 7 7" />,
    close: <path d="M5 5 19 19M19 5 5 19" />, spark: <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
function mark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>; }
function MacroRing({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const progress = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return <div className="macro-item"><div className="macro-ring" style={{ background: `conic-gradient(${color} ${progress}%, #f2f0ea ${progress}%)` }}><div><strong>{fmt(value)}</strong><small>/ {fmt(goal)} g</small></div></div><span>{label}</span></div>;
}

export function ClientApp() {
  const [tab, setTab] = useState<Tab>("oversikt");
  const [modal, setModal] = useState<Modal>(null);
  const [data, setData] = useState<Data>(seed);
  const [ready, setReady] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState("Frokost");
  const [category, setCategory] = useState(categories[0]);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodId, setFoodId] = useState(foodCatalog[0].id);
  const [grams, setGrams] = useState(100);
  const [draft, setDraft] = useState("");
  const [compactNav, setCompactNav] = useState(false);
  const levelRef = useRef(data.glass); levelRef.current = data.glass;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Data>;
        setData({ ...seed, ...parsed, goals: { ...seed.goals, ...parsed.goals }, sharing: { ...seed.sharing, ...parsed.sharing } });
      } else {
        const legacy = localStorage.getItem(oldKey);
        if (legacy) {
          const old = JSON.parse(legacy) as { workouts?: { id: string; date: string; name: string; exercise?: string; sets?: number; reps?: number; weight?: number; minutes?: number; note?: string }[]; meals?: { id: string; date: string; name: string; category: string; kcal: number; protein: number }[]; checkins?: { id: string; date: string; mood: string; energy: number; sleep: number; note?: string }[]; messages?: (Omit<Message, "kind"> & { kind: "mine" | "activity" | "coach" })[]; doneTasks?: string[]; sharing?: Data["sharing"] };
          setData({ ...seed,
            workouts: (old.workouts ?? []).map(x => ({ id: x.id, date: x.date, routineName: x.name, exercises: x.exercise ? [{ id: newId(), name: x.exercise, category: "Annet", note: [x.note, x.minutes ? `${x.minutes} min` : ""].filter(Boolean).join(" · "), sets: Array.from({ length: x.sets ?? 1 }, () => ({ id: newId(), reps: x.reps ?? 0, weight: x.weight ?? 0 })) }] : [] })),
            entries: (old.meals ?? []).map(x => ({ entryId: x.id, id: newId(), date: x.date, meal: x.category, name: x.name, grams: 100, kcal: x.kcal, protein: x.protein, carbs: 0, fat: 0 })),
            messages: [...(old.messages ?? []).filter(x => x.kind !== "coach").map(x => ({ ...x, kind: (x.kind === "activity" ? "activity" : "mine") as Message["kind"] })), ...(old.checkins ?? []).map(x => ({ id: x.id, kind: "activity" as const, text: `Daglig innsjekk · ${x.mood} · energi ${x.energy}/5 · søvn ${x.sleep} t${x.note ? ` · ${x.note}` : ""}`, time: x.date }))],
            done: { [today()]: old.doneTasks ?? [] }, sharing: { ...seed.sharing, ...old.sharing },
          });
        }
      }
    } catch { /* A bad stored record must not stop the app from opening. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(data)); }, [data, ready]);
  useEffect(() => { for (const [name, value] of Object.entries(glassStyle(data.glass))) document.documentElement.style.setProperty(name, value); }, [data.glass]);
  useEffect(() => installGlassFeedback(() => levelRef.current), []);
  useEffect(() => {
    let previous = window.scrollY;
    const onScroll = () => { const current = window.scrollY; if (Math.abs(current - previous) > 5) { setCompactNav(current > previous && current > 110); previous = current; } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const date = today();
  const dayEntries = useMemo(() => data.entries.filter(x => x.date === date), [data.entries, date]);
  const dayWorkouts = useMemo(() => data.workouts.filter(x => x.date === date), [data.workouts, date]);
  const totals = dayEntries.reduce((a, x) => ({ kcal: a.kcal + x.kcal*x.grams/100, protein: a.protein + x.protein*x.grams/100, carbs: a.carbs + x.carbs*x.grams/100, fat: a.fat + x.fat*x.grams/100 }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const done = data.done[date] ?? [];
  const routine = data.routines.find(x => x.id === selectedRoutine);
  const chosenFood = [...foodCatalog, ...data.foods].find(x => x.id === foodId) ?? foodCatalog[0];
  const activity = (text: string): Message => ({ id: newId(), kind: "activity", text, time: clock() });
  const navigate = (next: Tab) => { setTab(next); setSelectedRoutine(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const updateRoutine = (fn: (routine: Routine) => Routine) => setData(old => ({ ...old, routines: old.routines.map(x => x.id === selectedRoutine ? fn(x) : x) }));
  function createFolder(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const name = String(new FormData(event.currentTarget).get("name") ?? "").trim(); if (!name) return; const folderId = newId(); setData(old => ({ ...old, folders: [...old.folders, { id: folderId, name }] })); setSelectedFolder(folderId); setModal(null); }
  function createRoutine(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const name = String(new FormData(event.currentTarget).get("name") ?? "").trim(); if (!name) return; const routineId = newId(); const folderId = selectedFolder ?? data.folders[0]?.id ?? "strength"; setData(old => ({ ...old, routines: [...old.routines, { id: routineId, folderId, name, exercises: [] }] })); setSelectedRoutine(routineId); setModal(null); }
  function addExercise(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("exercise") ?? "").trim(); if (!name) return; updateRoutine(x => ({ ...x, exercises: [...x.exercises, { id: newId(), name, category, note: "", sets: [{ id: newId(), reps: 10, weight: 0 }] }] })); setModal(null); }
  function updateExercise(exerciseId: string, fn: (x: Exercise) => Exercise) { updateRoutine(r => ({ ...r, exercises: r.exercises.map(x => x.id === exerciseId ? fn(x) : x) })); }
  function finishWorkout() { if (!routine || !routine.exercises.length) return; const snapshot = structuredClone(routine.exercises); setData(old => ({ ...old, workouts: [{ id: newId(), date, routineName: routine.name, exercises: snapshot }, ...old.workouts], messages: [...old.messages, activity(`Treningsøkt fullført: ${routine.name} · ${routine.exercises.length} øvelser · ${routine.exercises.reduce((n,x) => n+x.sets.length,0)} sett`)] })); setSelectedRoutine(null); navigate("trening"); }
  function addFood(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!Number.isFinite(grams) || grams <= 0 || grams > 3000) return; setData(old => ({ ...old, entries: [...old.entries, { ...chosenFood, entryId: newId(), date, meal: selectedMeal, grams }], messages: [...old.messages, activity(`Måltid logget: ${selectedMeal.toLowerCase()} · ${chosenFood.name}, ${grams} g · ${fmt(chosenFood.kcal*grams/100)} kcal`)] })); setModal(null); setFoodSearch(""); }
  function createFood(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = new FormData(event.currentTarget); const name = String(f.get("name") ?? "").trim(); const values = ["kcal","protein","carbs","fat"].map(k => Number(f.get(k))); if (!name || values.some(n => !Number.isFinite(n) || n < 0)) return; const food = { id: newId(), name, kcal: values[0], protein: values[1], carbs: values[2], fat: values[3] }; setData(old => ({ ...old, foods: [...old.foods, food] })); setFoodId(food.id); setModal("food"); }
  function createTask(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = new FormData(event.currentTarget); const title = String(f.get("title") ?? "").trim(); const detail = String(f.get("detail") ?? "").trim(); if (!title) return; setData(old => ({ ...old, tasks: [...old.tasks, { id: newId(), title, detail }] })); setModal(null); }
  function saveGoals(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = new FormData(event.currentTarget); const goals = { kcal: Number(f.get("kcal")), protein: Number(f.get("protein")), carbs: Number(f.get("carbs")), fat: Number(f.get("fat")) }; if (Object.values(goals).some(n => !Number.isFinite(n) || n <= 0)) return; setData(old => ({ ...old, goals })); setModal(null); }
  function sendMessage(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const text = draft.trim(); if (!text) return; setData(old => ({ ...old, messages: [...old.messages, { id: newId(), kind: "mine", text, time: clock() }] })); setDraft(""); }
  function sendCheckin(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = new FormData(event.currentTarget); const mood = String(f.get("mood")); const energy = String(f.get("energy")); const sleep = String(f.get("sleep")); const note = String(f.get("note") ?? "").trim(); const summary = `Daglig innsjekk · ${mood} · energi ${energy}/5 · søvn ${sleep} t${note ? ` · ${note}` : ""}`; setData(old => ({ ...old, messages: [...old.messages, activity(summary)] })); setModal(null); navigate("chat"); }
  const openFood = (meal: string) => { setSelectedMeal(meal); setFoodId(foodCatalog[0].id); setGrams(100); setModal("food"); };
  const headings: Record<Tab, [string, string]> = { oversikt: ["Din dag, din fremgang", "Alt du trenger i dag, samlet på ett sted."], trening: ["Trening", "Dine rutiner, øvelser og økter."], mat: ["Mat og energi", "Følg med på måltider og næringsinnhold."], gjoremal: ["Gjøremål", "Små steg du kan ta i dag."], chat: ["Samtalen", "Innsjekk og oppdateringer på ett sted."], profil: ["Din profil", "Tilpass Maxfit slik du liker det."] };
  return <div className="app-shell">
    <aside className="sidebar"><button className="brand" onClick={() => navigate("oversikt")}>{mark()}<span>maxfit<span className="brand-dot">.</span></span></button><span className="side-caption">MIN PLASS</span><nav aria-label="Hovedmeny" className="side-nav">{nav.map(x => <button key={x.id} className={`nav-item glass-choice ${tab===x.id?"active":""}`} onClick={() => navigate(x.id)} aria-current={tab===x.id?"page":undefined}><Icon name={x.icon}/>{x.label}</button>)}</nav><div className="sidebar-bottom glass-card"><span className="coach-avatar">C</span><div><strong>Din coach</strong><small>Samtale og oppfølging</small></div></div></aside>
    <main className="main-content"><header className="topbar"><button className="mobile-brand brand" onClick={() => navigate("oversikt")}>{mark()}<span>maxfit<span className="brand-dot">.</span></span></button><span className="date-label">{new Intl.DateTimeFormat("nb-NO",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</span><button className="profile-chip glass-choice" onClick={() => navigate("profil")} aria-label="Åpne profil"><span className="profile-avatar">M</span><span>Min profil</span></button></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">{tab==="oversikt"?"VELKOMMEN TILBAKE":`MAXFIT / ${tab.toUpperCase()}`}</span><h1>{headings[tab][0]}</h1><p>{headings[tab][1]}</p></div></div>
      {tab==="oversikt" && <><section className="hero-card"><div className="hero-copy"><span className="hero-kicker"><Icon name="spark" size={17}/> ET STEG AV GANGEN</span><h2>Gjør noe bra<br/>for deg selv i dag.</h2><p>Små valg blir til store endringer. Her holder du oversikten, helt i ditt tempo.</p><button className="glass-action" onClick={() => navigate("trening")}>Gå til trening <Icon name="arrow" size={18}/></button></div><div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-disc"><span>DIN FREMDRIFT</span><strong>{done.length+dayWorkouts.length}<small> / {data.tasks.length+1}</small></strong><span>dagens steg</span></div><div className="hero-spark">✦</div></div></section>
        <div className="stats-grid"><button className="stat-card glass-card" onClick={() => navigate("trening")}><span className="stat-icon"><Icon name="dumbbell"/></span><small>Treningsøkter i dag</small><strong>{dayWorkouts.length}</strong><span>Se rutiner og økter</span></button><button className="stat-card glass-card" onClick={() => navigate("mat")}><span className="stat-icon"><Icon name="food"/></span><small>Energi i dag</small><strong>{fmt(totals.kcal)}</strong><span>av {fmt(data.goals.kcal)} kcal</span></button><button className="stat-card glass-card" onClick={() => navigate("gjoremal")}><span className="stat-icon"><Icon name="check"/></span><small>Gjøremål</small><strong>{done.length}/{data.tasks.length}</strong><span>dagens oppgaver</span></button></div>
        <div className="lower-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">DIN PLAN</span><h2>Dagens gjøremål</h2></div><button className="glass-choice compact" onClick={() => navigate("gjoremal")}>Se alle</button></div>{data.tasks.slice(0,3).map(t => <TaskRow key={t.id} task={t} done={done.includes(t.id)} onClick={() => setData(old => ({ ...old, done: { ...old.done, [date]: done.includes(t.id)?done.filter(x=>x!==t.id):[...done,t.id] } }))}/>)}</section><section className="panel coach-panel"><span className="eyebrow">HOLD KONTAKTEN</span><h2>Coach og deg</h2><p>Økter og måltider får korte oppsummeringer i samtalen. Sjekk inn der når du vil dele hvordan dagen går.</p><button className="glass-action" onClick={() => navigate("chat")}>Åpne chatten <Icon name="arrow" size={18}/></button></section></div></>}
      {tab==="gjoremal" && <><div className="feature-banner"><div><span className="eyebrow">DAGENS PLAN</span><h2>Ta ett steg om gangen.</h2><p>{done.length} av {data.tasks.length} gjøremål fullført i dag.</p></div><button className="glass-action" onClick={() => setModal("task")}><Icon name="plus" size={18}/> Nytt gjøremål</button></div><section className="panel task-panel">{data.tasks.map(t => <TaskRow key={t.id} task={t} done={done.includes(t.id)} onClick={() => setData(old => ({ ...old, done: { ...old.done, [date]: done.includes(t.id)?done.filter(x=>x!==t.id):[...done,t.id] } }))}/>)}</section></>}
      {tab==="trening" && (routine ? <><div className="subhead"><button className="glass-choice icon-choice" onClick={() => setSelectedRoutine(null)} aria-label="Tilbake til rutiner"><Icon name="back"/></button><div><span className="eyebrow">REDIGER RUTINE</span><h2>{routine.name}</h2></div><button className="glass-action" onClick={finishWorkout} disabled={!routine.exercises.length}>Fullfør økt</button></div><div className="routine-editor">{routine.exercises.map(ex => <section className="panel exercise-card" key={ex.id}><div className="exercise-top"><span className="exercise-badge"><Icon name="dumbbell"/></span><div><strong>{ex.name}</strong><small>{ex.category}</small></div><button className="glass-choice icon-choice" aria-label={`Fjern ${ex.name}`} onClick={() => updateRoutine(r => ({ ...r, exercises: r.exercises.filter(x => x.id !== ex.id) }))}><Icon name="trash" size={18}/></button></div><label className="note-label">Notat til øvelsen<textarea value={ex.note} onChange={e => updateExercise(ex.id,x=>({...x,note:e.target.value}))} placeholder="Teknikk, dagsform eller noe coachen bør vite" maxLength={240}/></label><div className="set-head"><span>SETT</span><span>VEKT (KG)</span><span>REPS</span></div>{ex.sets.map((set,i) => <div className="set-row" key={set.id}><span className="set-number">{i+1}</span><input type="number" min="0" max="1000" step="0.5" aria-label={`${ex.name}, sett ${i+1}, vekt`} value={set.weight} onChange={e => updateExercise(ex.id,x=>({...x,sets:x.sets.map(s=>s.id===set.id?{...s,weight:Number(e.target.value)}:s)}))}/><input type="number" min="0" max="1000" aria-label={`${ex.name}, sett ${i+1}, repetisjoner`} value={set.reps} onChange={e => updateExercise(ex.id,x=>({...x,sets:x.sets.map(s=>s.id===set.id?{...s,reps:Number(e.target.value)}:s)}))}/><button className="remove-set" aria-label={`Fjern sett ${i+1}`} onClick={() => updateExercise(ex.id,x=>({...x,sets:x.sets.filter(s=>s.id!==set.id)}))}>×</button></div>)}<button className="glass-choice full" onClick={() => updateExercise(ex.id,x=>({...x,sets:[...x.sets,{id:newId(),reps:x.sets.at(-1)?.reps??10,weight:x.sets.at(-1)?.weight??0}]}))}><Icon name="plus" size={18}/> Legg til sett</button></section>)}<button className="glass-choice add-exercise" onClick={() => setModal("exercise")}><Icon name="plus"/> Legg til øvelse</button></div></> : <><div className="feature-banner"><div><span className="eyebrow">TRENING</span><h2>Finn rytmen din.</h2><p>Lag mapper og rutiner som passer deg.</p></div><button className="glass-action" onClick={() => {setSelectedFolder(data.folders[0]?.id??null);setModal("routine");}}><Icon name="plus" size={18}/> Ny rutine</button></div><div className="section-title routine-title"><h2>Mine rutiner</h2><button className="glass-choice" onClick={() => setModal("folder")}><Icon name="folder" size={18}/> Ny mappe</button></div>{data.folders.map(folder => <section className="folder-section" key={folder.id}><div className="folder-heading"><Icon name="folder" size={19}/><h3>{folder.name}</h3><span>({data.routines.filter(r=>r.folderId===folder.id).length})</span><button className="glass-choice icon-choice" onClick={() => {setSelectedFolder(folder.id);setModal("routine");}} aria-label={`Ny rutine i ${folder.name}`}><Icon name="plus" size={18}/></button></div><div className="routine-grid">{data.routines.filter(r=>r.folderId===folder.id).map(r => <article className="routine-card glass-card" key={r.id}><span className="eyebrow">{r.exercises.length} ØVELSER</span><h3>{r.name}</h3><p>{r.exercises.map(x=>x.name).join(" · ") || "Legg til øvelser"}</p><button className="glass-action" onClick={() => setSelectedRoutine(r.id)}>Åpne rutine <Icon name="arrow" size={17}/></button></article>)}</div></section>)}<section className="panel history-panel"><div className="section-title"><h2>Fullførte økter</h2><span className="count-pill">{data.workouts.length}</span></div>{data.workouts.length?data.workouts.slice(0,8).map(x=><div className="history-row" key={x.id}><span className="list-icon"><Icon name="check"/></span><div><strong>{x.routineName}</strong><small>{x.date} · {x.exercises.length} øvelser</small></div></div>):<p className="muted">Fullfør en rutine, så vises den her.</p>}</section></>)}
      {tab==="mat" && <><div className="nutrition-head"><div><span className="eyebrow">DAGENS MAT</span><h2>{fmt(totals.kcal)} <small>/ {fmt(data.goals.kcal)} kcal</small></h2><p>{fmt(Math.max(0,data.goals.kcal-totals.kcal))} kcal igjen mot dagens mål</p></div><button className="glass-choice" onClick={() => setModal("goals")}><Icon name="settings" size={18}/> Juster mål</button></div><section className="panel macros-panel"><div className="section-title"><h2>Makronæringsstoffer</h2><span className="count-pill">I dag</span></div><div className="macro-grid"><MacroRing label="Protein" value={totals.protein} goal={data.goals.protein} color="#ef9c36"/><MacroRing label="Karbohydrater" value={totals.carbs} goal={data.goals.carbs} color="#a8cce2"/><MacroRing label="Fett" value={totals.fat} goal={data.goals.fat} color="#d7ad89"/></div></section><div className="meal-list">{meals.map(meal => {const entries=dayEntries.filter(x=>x.meal===meal);return <section className="panel meal-card" key={meal}><div className="section-title"><div><span className="eyebrow">MÅLTID</span><h2>{meal}</h2><small>{fmt(entries.reduce((n,x)=>n+x.kcal*x.grams/100,0))} kcal</small></div><button className="glass-action icon-choice" aria-label={`Legg til mat i ${meal}`} onClick={()=>openFood(meal)}><Icon name="plus"/></button></div>{entries.map(x=><div className="food-row" key={x.entryId}><div><strong>{x.name}</strong><small>{x.grams} g · {fmt(x.protein*x.grams/100)} g protein · {fmt(x.carbs*x.grams/100)} g karbohydrater · {fmt(x.fat*x.grams/100)} g fett</small></div><span>{fmt(x.kcal*x.grams/100)} kcal</span><button className="remove-set" aria-label={`Fjern ${x.name}`} onClick={()=>setData(old=>({...old,entries:old.entries.filter(y=>y.entryId!==x.entryId)}))}>×</button></div>)}<button className="glass-choice full meal-add" onClick={()=>openFood(meal)}><Icon name="plus" size={18}/> Legg til matvare</button></section>})}</div></>}
      {tab==="chat" && <section className="chat-card panel"><div className="chat-header"><span className="coach-avatar">C</span><div><strong>Samtale med coach</strong><small>Innsjekk og aktivitet</small></div><button className="glass-choice" onClick={()=>setModal("checkin")}>Daglig innsjekk</button></div><div className="messages" aria-live="polite">{data.messages.length?data.messages.map(m=><div key={m.id} className={`message ${m.kind}`}>{m.kind==="activity"&&<span className="message-label"><Icon name="spark" size={15}/> AKTIVITET</span>}<p>{m.text}</p><small>{m.time}</small></div>):<div className="chat-empty"><Icon name="chat" size={30}/><h2>Start samtalen</h2><p>Her samles meldinger, innsjekk og oppsummeringer fra økter og måltider.</p></div>}</div><form className="composer" onSubmit={sendMessage}><label className="sr-only" htmlFor="chat-message">Skriv melding</label><input id="chat-message" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Skriv en melding..."/><button className="glass-action icon-choice" type="submit" disabled={!draft.trim()} aria-label="Send melding"><Icon name="arrow" size={20}/></button></form></section>}
      {tab==="profil" && <div className="profile-grid"><section className="panel"><div className="profile-intro"><span className="large-avatar">M</span><div><span className="eyebrow">DIN PLASS</span><h2>Min profil</h2><p>Trening og mat på dine premisser.</p></div></div><div className="section-title privacy-title"><div><span className="eyebrow">PERSONVERN</span><h2>Del med coachen</h2></div><Icon name="heart"/></div>{([ ["workouts","Treningsøkter","Økter, sett og notater"], ["meals","Matlogg","Måltider og næringsinnhold"], ["checkins","Innsjekk","Dagsform og søvn"], ["health","Helsedata","Vekt, søvn og skritt"] ] as const).map(([field,label,description])=><label className="toggle-row" key={field}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={data.sharing[field]} onChange={()=>setData(old=>({...old,sharing:{...old.sharing,[field]:!old.sharing[field]}}))}/><span className="switch"/></label>)}</section><section className="panel glass-settings"><span className="eyebrow">UTSEENDE</span><h2>Glassfølelse</h2><p>Velg hvor gjennomsiktige knappene og menyen skal være.</p><div className="glass-preview"><button className="glass-action">Handlingsknapp</button><button className="glass-choice">Valgknapp</button></div><label htmlFor="glass-range">Gjennomsiktighet</label><input id="glass-range" type="range" min="0" max="100" value={data.glass} style={{ "--range-value": `${data.glass}%` } as React.CSSProperties} onChange={e=>setData(old=>({...old,glass:glassLevel(Number(e.target.value))}))}/><div className="range-ends"><span>Mer gjennomsiktig</span><span>Mer dekkende</span></div></section></div>}
      </div></main>
    <nav className={`mobile-nav ${compactNav?"is-compact":""}`} aria-label="Mobilmeny">{nav.slice(0,5).map(x=><button key={x.id} className={`glass-choice ${tab===x.id?"active":""}`} onClick={()=>navigate(x.id)} aria-label={x.label} aria-current={tab===x.id?"page":undefined}><Icon name={x.icon} size={21}/><span>{x.label}</span></button>)}</nav>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null);}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">MAXFIT</span><h2 id="modal-title">{{folder:"Ny mappe",routine:"Ny rutine",exercise:"Legg til øvelse",food:`Legg til i ${selectedMeal.toLowerCase()}`,customFood:"Ny matvare",task:"Nytt gjøremål",checkin:"Daglig innsjekk",goals:"Dagens mål"}[modal]}</h2></div><button className="glass-choice icon-choice" onClick={()=>setModal(null)} aria-label="Lukk"><Icon name="close"/></button></div>
      {modal==="folder"&&<form className="entry-form" onSubmit={createFolder}><label>Mappenavn<input name="name" required maxLength={50} placeholder="For eksempel Push / Pull" autoFocus/></label><button className="glass-action full">Opprett mappe</button></form>}
      {modal==="routine"&&<form className="entry-form" onSubmit={createRoutine}><label>Navn på rutine<input name="name" required maxLength={60} placeholder="For eksempel Overkropp A" autoFocus/></label><label>Mappe<select value={selectedFolder??data.folders[0]?.id} onChange={e=>setSelectedFolder(e.target.value)}>{data.folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><button className="glass-action full">Opprett rutine</button></form>}
      {modal==="exercise"&&<form className="entry-form" onSubmit={addExercise}><label>Muskelgruppe<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Øvelse<select name="exercise" key={category}>{exerciseCatalog.filter(x=>x.category===category).map(x=><option key={x.name}>{x.name}</option>)}</select></label><button className="glass-action full">Legg til øvelse</button></form>}
      {modal==="food"&&<form className="entry-form" onSubmit={addFood}><label>Søk etter matvare<input value={foodSearch} onChange={e=>setFoodSearch(e.target.value)} placeholder="Søk i matvarer" autoFocus/></label><div className="food-picker">{[...foodCatalog,...data.foods].filter(x=>x.name.toLowerCase().includes(foodSearch.toLowerCase())).map(x=><button type="button" key={x.id} className={`food-choice ${foodId===x.id?"selected":""}`} onClick={()=>setFoodId(x.id)}><strong>{x.name}</strong><small>{x.kcal} kcal · {x.protein} g protein / 100 g</small></button>)}</div><button type="button" className="text-action" onClick={()=>setModal("customFood")}>Finner du ikke varen? Legg til egen</button><div className="food-preview"><strong>{chosenFood.name}</strong><small>Per 100 g: {chosenFood.kcal} kcal · {chosenFood.protein} g protein · {chosenFood.carbs} g karbohydrater · {chosenFood.fat} g fett</small></div><label>Mengde i gram<input type="number" min="1" max="3000" value={grams} onChange={e=>setGrams(Number(e.target.value))} required/></label><button className="glass-action full">Legg til {fmt(chosenFood.kcal*grams/100)} kcal</button></form>}
      {modal==="customFood"&&<form className="entry-form" onSubmit={createFood}><p className="muted">Fyll inn næringsinnhold per 100 g.</p><label>Navn<input name="name" required maxLength={80} placeholder="Matvarens navn" autoFocus/></label><div className="form-two"><label>Kcal<input name="kcal" type="number" min="0" step="0.1" required/></label><label>Protein (g)<input name="protein" type="number" min="0" step="0.1" required/></label><label>Karbohydrater (g)<input name="carbs" type="number" min="0" step="0.1" required/></label><label>Fett (g)<input name="fat" type="number" min="0" step="0.1" required/></label></div><button className="glass-action full">Lagre matvare</button></form>}
      {modal==="task"&&<form className="entry-form" onSubmit={createTask}><label>Gjøremål<input name="title" required maxLength={80} placeholder="For eksempel gå en tur" autoFocus/></label><label>Beskrivelse<input name="detail" maxLength={120} placeholder="Valgfritt"/></label><button className="glass-action full">Legg til gjøremål</button></form>}
      {modal==="checkin"&&<form className="entry-form" onSubmit={sendCheckin}><label>Hvordan har du det?<select name="mood"><option>Bra</option><option>Helt greit</option><option>Sliten</option><option>Motivert</option><option>Trenger støtte</option></select></label><div className="form-two"><label>Energi (1–5)<input name="energy" type="number" min="1" max="5" defaultValue="3" required/></label><label>Søvn (timer)<input name="sleep" type="number" min="0" max="24" step="0.5" defaultValue="8" required/></label></div><label>Noe mer?<textarea name="note" maxLength={240} placeholder="Skriv en kort oppdatering"/></label><button className="glass-action full">Send innsjekk i chatten</button></form>}
      {modal==="goals"&&<form className="entry-form" onSubmit={saveGoals}><p className="muted">Sett et foreløpig dagsmål. Coach og klient kan senere avtale dette sammen.</p><div className="form-two"><label>Kalorier<input name="kcal" type="number" min="1" defaultValue={data.goals.kcal} required/></label><label>Protein (g)<input name="protein" type="number" min="1" defaultValue={data.goals.protein} required/></label><label>Karbohydrater (g)<input name="carbs" type="number" min="1" defaultValue={data.goals.carbs} required/></label><label>Fett (g)<input name="fat" type="number" min="1" defaultValue={data.goals.fat} required/></label></div><button className="glass-action full">Lagre mål</button></form>}
    </div></div>}
  </div>;
}
function TaskRow({task,done,onClick}:{task:Task;done:boolean;onClick:()=>void}) { return <button className="task-row glass-choice" onClick={onClick} aria-pressed={done}><span className={`task-check ${done?"checked":""}`}>{done&&<Icon name="check" size={16}/>}</span><span><strong>{task.title}</strong><small>{task.detail}</small></span></button>; }
