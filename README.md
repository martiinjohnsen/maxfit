# Maxfit

Første, lokal klientprototype for en enkel online coach-app. Den har responsiv forside, treningslogg, matlogg, daglig innsjekk, oppgaver, chat og valg for hva klienten vil dele med coachen. Handlingene lagres i nettleserens localStorage på denne enheten.

## Start

```bash
npm install
npm run dev
```

Åpne http://localhost:3002. Kjør `npm run typecheck` og `npm run build` for kontroll.

## Arbeidsstatus 20. november 2026

Første versjon er opprettet i `/Users/martinjohnsen/AI Prosjekter/Maxfit`, og Finder er åpnet i mappen. `npm run typecheck` og `npm run build` besto. Lokal forhåndsvisning kunne ikke startes fra agentens begrensede Terminal (`listen EPERM`), så visuell gjennomgang på mobil og PC gjenstår. Lokal Git-branch er `main`, koblet til det tomme GitHub-repositoriet `martiinjohnsen/maxfit`. Første commit er laget lokalt; push feilet fordi Terminal ikke kunne slå opp `github.com`. Koden er derfor ennå ikke på GitHub.

## Status og neste steg

- Dette er en **prototype** med eksempelcoach og eksempeloppgaver. Det finnes ennå ingen konto, Google-innlogging, ekte chat, coachkonto, serverdatabase eller kobling mellom personer. Ingen data blir sendt til en coach.
- «Del med coachen» er en lokal forhåndsvisning av personvernvalg. Den må håndheves på serveren før ekte data lagres.
- Apple Health kan ikke leses direkte fra et vanlig nettsted. En senere iOS-app må be om tillatelse per datatype og synkronisere godkjente data sikkert. Android Health Connect krever tilsvarende egen integrasjon.
- Mat registreres manuelt nå. Produktsøk og strekkodeoppslag kan legges til når datakilde og personvernoppsett er valgt.
- Neste tekniske etappe: Supabase-prosjekt med Google OAuth, klient- og coachroller, invitasjon/kobling, tilgangsregler per datatype, aktivitets- og chat-tabeller, og sanntidsmeldinger. Test tilgangsreglene isolert før produksjonsdata brukes.

## Inspirasjon

Klientflyten er inspirert av Hubfits samling av oppgaver, trening, ernæring, innsjekk og meldinger, mens farger og oppsett er Maxfits eget. Glassknapper bygger videre på teknikken i Luke: gjennomskinnelig hvit flate, lys kant, diskret refleks og bakgrunnsuskarphet. Ingen kode eller bilder er kopiert fra eksterne apper.

Kilder: [Hubfit klientapp](https://hubfit.com/help/articles/app/client-app), [Trainerize klientflyt](https://help.trainerize.com/hc/en-us/articles/213572566-How-Does-a-Client-Use-the-ABC-Trainerize-Mobile-App), [Apple HealthKit](https://developer.apple.com/documentation/Xcode/configuring-healthkit-access).
