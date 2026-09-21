# Security — DJ Tiny nettside

## Arkitektur (viktig kontekst for resten av dokumentet)

Dette er en **statisk nettside uten backend**: én HTML-fil, én JS-fil, CSS inline i HTML-en, samt bilder/video/lyd som statiske filer. Det finnes:

- Ingen `package.json`, ingen npm-avhengigheter, ingen build-steg.
- Ingen Netlify Functions / serverless-endepunkter.
- Ingen database, ingen egen autentisering, ingen admin-side.
- Ingen `.env`-fil og ingen server-side kode som kan holde hemmeligheter.

Booking-skjemaet sendes direkte fra nettleseren til **Formspree** (tredjeparts skjema-til-e-post-tjeneste), beskyttet av **Google reCAPTCHA v2**. Formspree er reelt sett den eneste "serveren" i denne løsningen, og er derfor også det reelle sikkerhetsgrensesnittet for booking-innsendinger.

## Implementerte sikkerhetstiltak

- **Content-Security-Policy + øvrige security headers** i [`_headers`](\_headers) (leses automatisk av Netlify, også ved drag-and-drop-deploy). Restriktiv CSP bygget etter hvilke eksterne tjenester siden faktisk bruker (Google Fonts, reCAPTCHA, Formspree, SoundCloud/YouTube/Vimeo-embeds) — ikke en åpen `*`-policy.
- **Ingen inline `<script>`** — all JS ligger i [`app.js`](app.js) og lastes via `<script src="app.js">`. Dette gjør at CSP kan sette `script-src` uten `unsafe-inline`, som er den viktigste enkeltbeskyttelsen mot at en eventuell fremtidig injeksjon faktisk får kjøre.
- **Trygg DOM-bygging**: all dynamisk HTML (videominiatyrer, feilmeldinger i lightbox) bygges nå med `createElement`/`textContent`/`setAttribute` i stedet for strengsammensatt `innerHTML`.
- **reCAPTCHA v2** på bookingskjemaet, verifisert server-side av Formspree via secret key (satt i Formspree-dashbordet, ikke i kode).
- **Honeypot-felt + minimumstid før innsending** i [app.js](app.js): et usynlig felt (`name="firma"`) som ekte brukere aldri ser eller fyller ut (tabindex -1, aria-hidden, off-screen), samt en sjekk på at skjemaet ikke sendes raskere enn 2,5 sekunder etter sidelast. Begge deler avviser stille — boten får en "suksess"-respons uten at noe faktisk sendes.
- **maxlength på alle tekstfelter** (navn 100, e-post 254, sted 200, melding 3000) — reduserer useriøse/ekstreme innsendinger. Dette er en UX-grense, ikke en reell sikkerhetsgrense (se "Kjente begrensninger").
- **Ingen brukerstyrt mottakeradresse**: `booking@djtiny.no` er hardkodet i koden, både i mailto-reserveløsningen og hos Formspree. Ingen skjemafelt kan overstyre To/CC/BCC.
- **mailto-fallback er CRLF-trygg**: alle verdier går gjennom `encodeURIComponent()` før de bygges inn i `mailto:`-lenken, som nøytraliserer linjeskift og hindrer header-injeksjon.
- **Ingen hemmeligheter i kildekoden** — bekreftet ved gjennomgang av hele prosjektet (se "Testing utført"). reCAPTCHA site key og Formspree-skjema-ID er offentlige av natur (ment å stå i klientkoden). reCAPTCHA **secret key** er aldri lagt i filene, kun i Formspree sitt dashbord.
- **Ingen logging av persondata**: koden logger aldri navn, e-post, telefonnummer eller meldingstekst til konsoll, og siden har ingen egen lagring (ingen database, ingen localStorage av skjemadata).

## Environment variables

Ingen. Det finnes ingen server som kan lese miljøvariabler i dette prosjektet. De eneste "nøklene" som finnes er:

| Nøkkel | Hvor den ligger | Offentlig eller hemmelig? |
|---|---|---|
| reCAPTCHA site key | `index.html`, `<div class="g-recaptcha" data-sitekey="...">` | Offentlig — skal stå i klientkoden |
| Formspree skjema-ID | `index.html`, `<form action="https://formspree.io/f/...">` | Offentlig — skal stå i klientkoden |
| reCAPTCHA secret key | Kun i Formspree-dashbordet (skjeminnstillinger) | **Hemmelig — skal aldri i kode, repo eller chat-historikk du deler videre** |

Hvis dere noen gang bytter til en løsning med egen backend (se "Kjente begrensninger"), er dette stedet å legge til en `Environment variables`-tabell for den løsningen.

## Hvordan hemmeligheter skal håndteres

- Aldri commit `.env`, secret keys eller passord til noe repo.
- reCAPTCHA secret key hører hjemme **kun** i Formspree sitt dashbord.
- Hvis en hemmelighet ved et uhell havner i en chat-logg, en commit-historikk eller et delt dokument: roter den (lag en ny) hos utstederen (Google reCAPTCHA-admin), selv om den ikke er brukt til noe skadelig ennå.

## Hvordan booking-endepunktet er beskyttet

Rekkefølge på beskyttelse for hver innsending:

1. **HTML5-validering** i nettleseren (`required`, `type="email"`, `maxlength`) — kun UX, ikke en sikkerhetsgrense.
2. **Honeypot + minimumstid** i `app.js` — stopper enkle bots som ikke kjører ekte JS-interaksjon.
3. **reCAPTCHA v2** — ekte, server-side verifisert sjekk hos Google/Formspree. Dette er den faktiske boten-sperren.
4. **Formspree** mottar POST-en, kjører egen spamfiltrering, håndhever sitt eget request-format og sender e-post til den faste, forhåndskonfigurerte adressen `booking@djtiny.no`.
5. Hvis fetch til Formspree feiler (nettverksfeil e.l.), faller siden tilbake til å åpne brukerens egen e-postklient med ferdigutfylt e-post (`mailto:`).

## Kjente begrensninger (vær ærlig om disse før lansering)

- **Ingen egen server-side feltvalidering eller rate limiting.** Siden har ingen backend vi kontrollerer, så reell håndheving av feltlengder, datatyper og forespørselsrate skjer ikke av oss — det er delegert til Formspree sin infrastruktur (som gjør egen spamfiltrering, men vi styrer ikke logikken). Skal dette lukkes helt, må det bygges en egen Netlify Function foran Formspree — det er en reell arkitekturendring som ikke er gjort her, siden dagens deploy (statisk mappe / Netlify Drop) bevisst ikke bruker Functions.
- **CSP bruker `'unsafe-inline'` for `style-src`.** Siden har ni `style="..."`-attributter og én stor `<style>`-blokk i HTML-en. Å fjerne disse helt (konvertere alt til CSS-klasser) ble vurdert som unødvendig risiko for visuelle regresjoner i denne runden, siden ingen av verdiene noensinne kommer fra brukerinput. `script-src` er derimot strengt satt uten `unsafe-inline`.
- **Honeypot/timing kan i teorien omgås** av en bot som kjører en fullverdig nettleser og venter noen sekunder. reCAPTCHA er det reelle forsvaret mot dette.
- **HSTS er satt uten `preload` og `includeSubDomains`** (`max-age=15552000`, ca. 6 måneder) — bevisst konservativt til dere har bekreftet at hele det endelige oppsettet (evt. undersdomener) kjører HTTPS stabilt. Kan strammes inn senere.
- **Open Graph-bilder/URL antar domenet `djtiny.no`.** Hvis endelig domene blir noe annet, må `og:url` og `og:image`/`twitter:image` i `index.html` oppdateres.
- **Formspree gratisnivå har et tak på 50 innsendinger/måned** og egne retensjonsregler for lagrede skjemadata — vi lagrer ikke data selv, så deres personvernvilkår gjelder for det som går gjennom dem.

## Hvordan kjøre en sikkerhets-/avhengighetsrevisjon senere

Det finnes ingen `package.json`, så `npm audit` er ikke relevant for dette prosjektet — det er null npm-avhengigheter. De eneste eksterne kjøretids-tjenestene er lastet via URL i `index.html`:

- `fonts.googleapis.com` / `fonts.gstatic.com` (Google Fonts)
- `www.google.com/recaptcha/` + `www.gstatic.com/recaptcha/` (reCAPTCHA)
- `formspree.io` (booking-innsending)
- `w.soundcloud.com`, `www.youtube-nocookie.com`, `player.vimeo.com` (media-embeds)

Sjekk med jevne mellomrom at disse fortsatt er tjenester dere stoler på, og at CSP-en i `_headers` fortsatt stemmer med det siden faktisk bruker hvis dere legger til nye eksterne ressurser.

## Testing utført i denne runden

- Grep gjennom hele prosjektmappen etter `api key|secret|password|token|private key|credential` m.fl. — ingen treff.
- Grep etter `innerHTML`, `outerHTML`, `document.write`, `eval(`, `new Function`, inline `on*=`-attributter — alle funnet forekomster gjennomgått og enten fjernet eller erstattet med trygge DOM-metoder.
- Manuell gjennomgang av alle steder booking-data brukes (fetch til Formspree via `FormData`, samt `mailto:`-fallback via `encodeURIComponent`) — ingen sted settes brukerinput direkte inn i HTML.
- Balansesjekk av klammer/parenteser i `app.js` (74/74 `{}`, 272/272 `()`).
- Live curl-test mot det faktiske Formspree-endepunktet bekreftet at reCAPTCHA-håndheving er aktiv server-side (avviser innsendinger uten gyldig reCAPTCHA-respons).
- **Ikke testet automatisk** (krever ekte nettleserinteraksjon som ikke er tilgjengelig i dette verktøyet): at reCAPTCHA-widgeten faktisk rendres og fungerer visuelt, at honeypot/timing ikke sjenerer ekte brukere, og at ingen CSP-brudd vises i nettleserkonsollen etter deploy. Dette bør sjekkes manuelt i nettleseren (F12 → Console) rett etter publisering.
