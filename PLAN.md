# Angular Module Orchestrator — Implementierungsplan

## Kontext
- Neues Angular-Projekt (Workspace aktuell leer, nur README + git).
- Berechnungsmodule laufen async. **Vorerst kein echtes Backend:** jedes Modul
  nutzt einen simulierten Service, der eine Berechnung über eine Wartezeit
  nachbildet (z.B. via RxJS `timer`/`delay`). Die simulierte Dauer ist **pro Modul
  unterschiedlich** konfigurierbar. Ein echtes .NET-HTTP-Backend kommt später und
  ersetzt nur diese Service-Schicht (Interface bleibt gleich).
- Ergebnisse fließen zentral über den Orchestrator: `Map<ModuleId, Result>`.
  Nachfolger-Module bekommen die Outputs ihrer Abhängigkeiten als Input.
- Fehlerverhalten: fehlerhaftes Modul → Fehlerstatus, muss manuell re-triggert werden.
  Alle anderen lauffähigen Module laufen weiter.
- Zusatzfeatures: Zyklus-Erkennung im Abhängigkeitsgraph, Fortschritts-/Status-UI.

## Angular-Version & moderne Patterns
Es wird die **neueste Angular-Version (v22)** verwendet, durchgängig mit den
aktuellen APIs und Best Practices:
- **Standalone Components** (keine NgModules), `bootstrapApplication` in `main.ts`.
- **Signals** für State: `signal()`, `computed()`, `linkedSignal()`, `effect()`;
  wo sinnvoll `toSignal()`/`toObservable()` zur RxJS-Interop.
- **Signal-basierte Inputs/Outputs:** `input()`, `output()`, `model()` statt
  `@Input()`/`@Output()`.
- **`inject()`** statt Constructor-Injection.
- **Neue Control-Flow-Syntax** im Template: `@if`, `@for`, `@switch` (nicht
  `*ngIf`/`*ngFor`).
- **`ChangeDetectionStrategy.OnPush`** als Standard; `class`/`style`-Bindings
  statt `ngClass`/`ngStyle`.
- **`protected`** für nur-im-Template genutzte Member, **`readonly`** für von
  Angular initialisierte Properties (Inputs/Outputs/Queries).
- Neueste TypeScript-Version (strict mode).
- **Styling: plain CSS** (kein SCSS/Tailwind). Statusfarben über CSS-Variablen
  + eine Statusklasse pro Knoten.

## Beispielgraph
```
A ──► B ─────┐
 │           ├──► E
 └─► C ──► D ┘
```
- A ist Start.
- B und C hängen von A ab (laufen parallel).
- D hängt von C ab.
- E hängt von B und D ab.

## Abhängigkeit vs. Datenfluss
Der Orchestrator unterscheidet zwei getrennte Konzepte, kennt aber beide zentral:
- **Abhängigkeit (Reihenfolge):** "Modul D darf erst laufen, wenn C fertig ist."
- **Datenfluss (Payload):** "Modul D braucht das Ergebnis von C als Input."

Nicht jede Abhängigkeit bedeutet Datenfluss — manchmal muss ein Modul nur *warten*,
ohne die Daten des Vorgängers zu nutzen. Regel: **Datenfluss folgt immer der
Abhängigkeit** — ein Modul kann nur Daten von Modulen bekommen, von denen es auch
abhängt (sonst gäbe es keine Garantie, dass das Ergebnis schon existiert).

Beim Start eines Moduls sammelt der Orchestrator die Ergebnisse **aller** seiner
`dependsOn`-Module aus dem zentralen Result-Store und übergibt sie als `inputs`.
Das Modul nutzt davon nur, was es braucht — oder ignoriert sie, wenn es nur auf
die Reihenfolge angewiesen war.

## Kern-Datenmodell
- `ModuleId`: string/enum-Identifier.
- `ModuleStatus`: `Pending → Ready → Running → Completed | Failed`, plus `Blocked`
  (Vorgänger fehlgeschlagen).
- `Module`: `{ id, dependsOn: ModuleId[], execute(inputs) => Observable<Result> }`.
  - `execute(inputs: Partial<Record<ModuleId, Result>>)` — die `inputs` enthalten
    die Ergebnisse der `dependsOn`-Module; `Partial<Record<...>>` macht die Nutzung
    typsicher, aber optional.
- `ModuleState`: `{ status, result?, startedAt?, finishedAt? }`.
  - `result?`: `Result` (`status: 'ok' | 'warning' | 'error'`, `message?`, `value?`)
    — sowohl für den Knoten-Kopfbereich (Status/Nachricht) als auch für den
    Infobereich (`value`) und für technische wie fachliche Fehler.
- Zentraler Result-Store: `Map<ModuleId, Result>` — einzige Quelle für Modul-Outputs.

## Ausführungslogik
- **Start:** `run()` setzt alle Module auf `Pending` und triggert die Wurzel-Module
  (ohne `dependsOn`, z.B. A) sofort.
- Nach jedem Completion prüft der Orchestrator, welche `Pending`-Module alle
  `dependsOn` auf `Completed` haben → diese werden `Ready` und werden getriggert.
- **Idempotentes Triggern (wichtig):** Der Übergang `Pending → Running` erfolgt für
  jedes Modul genau einmal. Wenn z.B. E von B und D abhängt und beide fast
  gleichzeitig fertig werden, darf die Ready-Prüfung E nicht doppelt starten. Der
  State-Wechsel dient als Guard: nur Module im Status `Pending` (nicht `Running`/
  `Completed`) werden gestartet.
- Mehrere `Ready`-Module laufen parallel (RxJS `mergeMap`). Für den Anfang
  **unbegrenzte Parallelität**; ein konfigurierbares Limit ist später über die
  `mergeMap`-Concurrency trivial nachrüstbar.
- Fehler-Isolation: Nachfolger eines fehlgeschlagenen Moduls (transitiv) werden
  `Blocked`, unabhängige Zweige laufen weiter.
- `retry(moduleId)` startet ein fehlgeschlagenes Modul manuell neu. Bei Erfolg
  werden die zuvor `Blocked`-Nachfolger wieder auf `Pending` gesetzt und die
  normale Ready-Prüfung setzt die Kette fort.

## Stufen
1. **Scaffold** — `ng new` (standalone components, strict mode).
   Ordnerstruktur: `core/orchestrator`, `modules`, `ui`.
2. **Domain-Modelle** — Typen für `ModuleId`, `ModuleStatus`,
   `Module`, `ModuleState`, `Result`, Graph-Struktur.
3. **Graph-Utilities** — Zyklus-Erkennung (DFS), Validierung,
   `getReadyModules(states)`. Reine, testbare Funktionen.
4. **Orchestrator** — State-Verwaltung via Angular Signals,
   `run()`, Completion-Handling, Result-Store, Fehler-Isolation, `retry(id)`.
5. **Beispiel-Module A–E** — je mit simuliertem Service (unterschiedliche
   Wartezeit pro Modul), verdrahtet gemäß Beispielgraph.
6. **Status-UI (Graph-Visualisierung)** — Module als Knoten, Abhängigkeiten als
   Pfeile. Jeder Knoten zeigt: Modulname, aktuellen Status (Wartet / Läuft /
   Erfolgreich / Fehler), bei Fehler die Fehlermeldung, plus modulspezifische
   Zusatzinformationen. Manueller Retry-Button an fehlgeschlagenen Modulen.
7. **Demo-Seite** — Einstiegs-Komponente mit "Start"-Button, die den Orchestrator
   startet und die Status-UI einbindet.
8. **Tests** — Unit-Tests für Graph-Utils und Orchestrator mit Fake-Modulen
   (Timing, Parallelität, Fehlerfälle). Fake-Timer für deterministische
   Async-Tests (Karma/Jasmine als Angular-Default).

## Relevante Struktur (nach Scaffold)
Benennung nach aktuellem Angular Style Guide (v20+): **kein** `.service`/`.component`
Suffix, Bindestriche, Dateiname = Klassenname, Organisation nach Feature/Thema.
- `src/app/core/orchestrator/orchestrator.ts` — zentrale Steuerung (Klasse `Orchestrator`)
- `src/app/core/orchestrator/graph.ts` — Zyklus-Erkennung, Ready-Ermittlung (reine Funktionen)
- `src/app/core/orchestrator/module.ts` — `ModuleId`, `ModuleStatus`, `ModuleState`, `Module`
- `src/app/core/orchestrator/result.ts` — `Result`, `ResultStatus`
- `src/app/core/compute/compute.ts` — simulierter Berechnungs-Service (Wartezeit pro Modul; später .NET-HTTP)
- `src/app/modules/*` — konkrete Berechnungsmodule (nutzen den simulierten Service)
- `src/app/ui/orchestrator-status/orchestrator-status.{ts,html,css}` — Status-UI (Graph)
- `src/app/ui/orchestrator-status/module-node/module-node.{ts,html,css}` — einzelner Knoten
- Tests liegen daneben als `*.spec.ts` (z.B. `graph.spec.ts`, `orchestrator.spec.ts`).

## Verifikation
1. `ng build` läuft fehlerfrei.
2. Unit-Test: Graph mit künstlichem Zyklus wird abgelehnt.
3. Unit-Test: Beispielgraph — Parallelität von B/C korrekt, E startet erst
   nach B und D.
4. Unit-Test: Fehler in C → D & E `Blocked`, B läuft; nach `retry(C)`
   laufen D, dann E.

## State-Management: Angular Signals
Der Orchestrator-State wird über Angular Signals verwaltet (stabil seit v16+):
- Modul-States als `signal<Map<ModuleId, ModuleState>>` — die Status-UI liest
  reaktiv, ohne manuelles Subscribe.
- Abgeleitete Werte via `computed()`: z.B. `readyModules`, `overallProgress`,
  `hasFailures` — automatisch neu berechnet bei jedem State-Wechsel.
- Result-Store ebenfalls als Signal, damit abhängige Berechnungen reaktiv bleiben.
- **RxJS bleibt für die async Backend-Calls:** `execute()` gibt ein `Observable`
  zurück (HttpClient). Beim Completion wird das Ergebnis in die Signals geschrieben
  (`.set()` / `.update()`). Also: Signals für State, RxJS für async Streams.

## Status-UI (Graph-Visualisierung)
Die UI stellt den Abhängigkeitsgraphen visuell dar:
- **Knoten = Module, Pfeile = Abhängigkeiten** (Pfeil von Vorgänger zu Nachfolger).
- Jeder Knoten ist in zwei visuell abgetrennte Bereiche gegliedert (getrennt durch
  eine Trennlinie/eigenen Abschnitt):
  - **Kopfbereich (Status):** Modulname/ID, aktueller Status, Status-/Fehlernachricht.
  - **Infobereich (abgetrennt):** modulspezifische Zusatzinformationen.
- Kopfbereich zeigt reaktiv (über die Signals):
  - Modulname/ID.
  - Aktuellen Status mit Farbcodierung: `Wartet` (Pending/Blocked), `Läuft`
    (Running), `Erfolgreich` (Completed), `Fehler` (Failed).
  - Bei `Fehler`: die Fehlermeldung direkt am Knoten.
  - Bei `Erfolgreich`: optionale Erfolgs-/Statusnachricht direkt am Knoten.
- Infobereich (visuell abgetrennt innerhalb desselben Knotens):
  - Modulspezifische Zusatzinformationen (pro Modul individuell definierbar,
    z.B. Zwischenwerte, Kennzahlen, Timing).
- Manueller **Retry-Button** an fehlgeschlagenen Knoten (triggert `retry(id)`).

**Knoten-Skizze:**
```
┌──────────────────────────┐
│ Modul C          ● Läuft │   ← Kopfbereich (Status + Nachricht)
│ "Berechne Faktoren..."   │
├──────────────────────────┤   ← Trennlinie
│ Iterationen: 42          │   ← Infobereich (modulspezifisch)
│ Dauer: 1.2s              │
└──────────────────────────┘
```

**Umsetzung:** Start mit eigenem SVG/CSS-Layout (leichtgewichtig, volle Kontrolle,
passend für überschaubare Graphen wie A–E). Optional später eine Graph-Lib
(`@swimlane/ngx-graph`, Cytoscape) für automatisches Layout bei großen/dynamischen
Graphen.

## Schritt-für-Schritt-Umsetzung
Kleine, nacheinander abarbeitbare Schritte. Jeder Schritt ist für sich
abgeschlossen und (wo möglich) verifizierbar.

### Schritt 1 — Scaffold
- [x] `ng new` im Workspace (standalone, strict, routing optional, plain CSS).
- [x] Ordner anlegen: `core/orchestrator`, `core/backend`, `modules`, `ui`.
- [x] Verifikation: `ng serve` startet, Default-App lädt.

### Schritt 2 — Domain-Modelle
- [x] `module.ts`: `ModuleId`, `ModuleStatus` (Pending/Ready/Running/
      Completed/Failed/Blocked), `ModuleState`, `Module`.
- [x] `result.ts`: `Result`, `ResultStatus` (`ok`/`warning`/`error`).
- [x] `execute(inputs: Partial<Record<ModuleId, Result>>): Observable<Result>`.
- [x] Verifikation: kompiliert ohne Fehler.

### Schritt 3 — Graph-Utilities (rein, testbar)
- [x] `graph.ts`: `detectCycle(defs)`, `validateGraph(defs)` (fehlende deps).
- [x] `getReadyModules(defs, states)`: liefert `Pending`-Module mit allen deps
      auf `Completed`.
- [x] `getDependents(id, defs)` (transitiv) für Blocking/Unblocking.
- [x] Verifikation: Unit-Tests (`graph.spec.ts`) — Zyklus erkannt, Ready korrekt.

### Schritt 4 — Simulierter Berechnungs-Service
- [x] `compute.ts` (Klasse `Compute`): simuliert eine Berechnung über eine
      Wartezeit (RxJS `timer`/`delay`), gibt ein `Observable<Result>` zurück.
- [x] Dauer **pro Modul** konfigurierbar (Parameter/Config je Modul).
- [x] Optional Fehler simulierbar (für Fehler-/Retry-Tests).
- [x] Interface so, dass später ein echtes .NET-HTTP-Backend die Klasse ersetzt.
- [x] Verifikation: unterschiedliche Modul-Dauern messbar/testbar (Fake-Timer).

### Schritt 5 — Orchestrator (Kern)
- [x] `orchestrator.ts` (Klasse `Orchestrator`), Injection via `inject()`.
- [x] Signals: `states = signal<Map<ModuleId, ModuleState>>`, `results`.
- [x] `computed()`: `overallProgress`, `hasFailures`, `runningCount`.
- [x] `register(defs)` + Graph-Validierung (nutzt Schritt 3).
- [x] `run()`: reset → Wurzel-Module starten.
- [x] `mergeMap`-Pipeline: Modul starten (`Running`), `inputs` aus Result-Store
      sammeln, `execute()` abonnieren.
- [x] Completion-Handler: Result speichern, `Completed`, Ready-Prüfung (idempotent).
- [x] Error-Handler: `Failed`, Nachfolger transitiv `Blocked`.
- [x] `retry(id)`: Modul neu starten, bei Erfolg Nachfolger auf `Pending` + weiter.
- [x] Verifikation: Unit-Tests `orchestrator.spec.ts` (Beispielgraph-Reihenfolge,
      Parallelität B/C, Fehler-Isolation, Retry-Kette, kein Doppel-Trigger von E).

### Schritt 6 — Beispiel-Module A–E
- [x] Je eine `Module` mit `dependsOn` gemäß Beispielgraph.
- [x] `execute()` ruft `Compute` mit modulspezifischer Wartezeit, mappt auf
      `Result` (`value` = modulspezifische Zusatzinfo).
- [x] Zentrale Registrierung (Liste aller Definitionen).
- [x] Verifikation: Orchestrator läuft mit den simulierten Zeiten durch.

### Schritt 7 — Status-UI (Graph)
- [x] `orchestrator-status`-Komponente: liest Signals reaktiv, rendert Knoten +
      SVG-Pfeile nach `dependsOn`.
- [x] `module-node`-Komponente: Kopfbereich (Name, Status-Farbe, Nachricht) +
      abgetrennter Infobereich (`result.value`) + Retry-Button bei `Failed`.
- [ ] Verifikation: Statuswechsel/Nachrichten erscheinen live im Browser
      (folgt mit Schritt 8, da noch keine Seite die Komponente einbindet).

### Schritt 8 — Demo-Seite
- [x] Einstiegs-Komponente mit "Start"-Button → `orchestrator.run()`.
- [x] Status-UI einbinden; Fortschritt sichtbar.
- [x] Verifikation: Ende-zu-Ende-Durchlauf im Browser (mit Mock-Backend).

### Schritt 9 — Abschluss
- [x] `ng build` sauber, alle Unit-Tests grün.
- [x] Kurz-README: Start, Modul hinzufügen, Backend-URL konfigurieren.
