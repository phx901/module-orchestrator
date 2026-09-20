# Module Orchestrator

Angular-Demo für einen Orchestrator, der Berechnungsmodule mit Abhängigkeiten
parallel/nacheinander ausführt, Ergebnisse zwischen Modulen weitergibt und
Fehler isoliert. Details zum Konzept: siehe [PLAN.md](PLAN.md).

## Voraussetzungen

- Node.js (aktuelle LTS-Version)
- npm

## Start

```bash
npm install
npm start
```

Öffnet den Dev-Server (Standard: http://localhost:4200). Auf der Demo-Seite
auf **Start** klicken, um den Orchestrator mit den Beispiel-Modulen A–E
laufen zu lassen (simulierte Berechnung, kein echtes Backend nötig).

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Modul hinzufügen

1. Neue Datei unter `src/app/modules/`, z.B. `module-f.ts`, mit einer
   Funktion `createModuleF(compute: Compute): Module`:

   ```ts
   export function createModuleF(compute: Compute): Module {
     return {
       id: 'F',
       dependsOn: ['E'],
       execute: (inputs) =>
         compute.run({ durationMs: 1000, result: { status: 'ok', value: 'F-data' } }),
     };
   }
   ```

2. In `src/app/modules/example-modules.ts` importieren und der zurückgegebenen
   Liste hinzufügen.
3. `dependsOn` bestimmt sowohl die Ausführungsreihenfolge als auch, welche
   `Result`-Objekte der Vorgänger-Module im `inputs`-Parameter von `execute()`
   ankommen (siehe `Abhängigkeit vs. Datenfluss` in [PLAN.md](PLAN.md)).

## Backend-URL konfigurieren

Aktuell nutzt jedes Modul den simulierten `Compute`-Service
(`src/app/core/compute/compute.ts`), keinen echten HTTP-Call. Für ein
späteres .NET-Backend:

- Base-URL liegt in `src/environments/environment.ts`
  (`backendBaseUrl`, Dev) bzw. `environment.production.ts` (Prod-Build,
  über `fileReplacements` in `angular.json` aktiv).
- Ein neuer Service kann `HttpClient` mit dieser Base-URL nutzen und die
  `Compute`-Aufrufe in den Modulen ersetzen — das `Module`-Interface
  bleibt dabei unverändert (`execute()` gibt weiterhin ein `Observable<Result>`
  zurück).
