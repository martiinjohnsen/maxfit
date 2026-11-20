# Maxfit

Klientdelen av en enkel online coach-app. Den har responsiv forside, gjøremål, treningsmapper og rutiner med sett/repetisjoner/vekt/notater, matdagbok med ingredienser og makromål, innsjekk i chatten og valg for hva klienten vil dele med coachen. Handlingene lagres foreløpig i nettleserens localStorage på denne enheten.

## Start

```bash
npm install
npm run dev
```

Åpne http://localhost:3002. Kjør `npm run typecheck` og `npm run build` for kontroll.

## Arbeidsstatus 20. november 2026

Første versjon er opprettet i `/Users/martinjohnsen/AI Prosjekter/Maxfit`. `npm run typecheck` og `npm run build` besto. Koden ble lastet opp til `martiinjohnsen/maxfit` via VS Code som commit `174e717`. Vercel-prosjektet var først satt til rammeverk «Other» og feilet fordi det lette etter `public` som ferdig bygg. Rammeverket ble endret til Next.js, og produksjonsdeploy `5wuXzD8RcC3BPmvHF42s9QT5voi2` ble kontrollert til «Ready» 20. november 2026. Forsiden ble åpnet og vist på [maxfit-omega.vercel.app](https://maxfit-omega.vercel.app). Mobilvisningen og alle interaksjoner er ikke visuelt gjennomgått.

## Status og neste steg

- 20. november: «Innsjekk» ble flyttet inn i chatten, mens «Gjøremål» fikk egen fane. Treningsdelen fikk mapper, rutiner og øvelsesvalg fordelt på muskelgrupper. Matdelen fikk frokost, lunsj, middag, mellommåltid, matvarekatalog, egne matvarer og justerbare kalorimål/makromål. Katalogene starter med 19 øvelser og 12 matvarer. Gammelt lokalt testinnhold migreres ved første åpning. Mobilmeny, logo, knapper, bevegelse og profilens glassjustering er bygget om med Luke som referanse. Ingen filer i Luke er endret.
- Dette er fortsatt en **prototype** med lokale data. Det finnes ennå ingen konto, Google-innlogging, ekte chat, coachkonto, serverdatabase eller kobling mellom personer. Ingen data blir sendt til en coach. Grensesnittet viser ikke lenger demoetiketter; denne begrensningen må ikke forveksles med en aktiv coachkobling.
- «Del med coachen» er en lokal forhåndsvisning av personvernvalg. Den må håndheves på serveren før ekte data lagres.
- Apple Health kan ikke leses direkte fra et vanlig nettsted. En senere iOS-app må be om tillatelse per datatype og synkronisere godkjente data sikkert. Android Health Connect krever tilsvarende egen integrasjon.
- Mat registreres fra en liten lokal katalog eller med eget næringsinnhold. Eksternt produktsøk og strekkodeoppslag kan legges til når datakilde og personvernoppsett er valgt.
- Neste tekniske etappe: Supabase-prosjekt med Google OAuth, klient- og coachroller, invitasjon/kobling, tilgangsregler per datatype, aktivitets- og chat-tabeller, og sanntidsmeldinger. Test tilgangsreglene isolert før produksjonsdata brukes.

## Inspirasjon

Klientflyten er inspirert av Hubfits samling av oppgaver, trening, ernæring, innsjekk og meldinger, mens farger og oppsett er Maxfits eget. Glassmateriale, knappetyper og bevegelse i `src/lib/glass.ts` og `src/lib/glass-motion.ts` er tilpasset fra Luke-koden etter Martins uttrykkelige ønske. Ingen bilder er kopiert fra andre apper.

Kilder: [Hubfit klientapp](https://hubfit.com/help/articles/app/client-app), [Trainerize klientflyt](https://help.trainerize.com/hc/en-us/articles/213572566-How-Does-a-Client-Use-the-ABC-Trainerize-Mobile-App), [Apple HealthKit](https://developer.apple.com/documentation/Xcode/configuring-healthkit-access).
