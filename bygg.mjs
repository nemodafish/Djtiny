// Netlify kjører denne før publisering (se netlify.toml). Den kopierer bare nettsidefiler
// til dist/, og bare dist/ blir lagt ut på djtiny.no. Notater, dokumenter, .md-filer o.l.
// som havner i repoet ved et uhell, kommer dermed ikke ut på djtiny.no.
// NB: GitHub-repoet er offentlig, så alt som lastes opp dit, kan leses der uansett.
//
// Filene blir liggende i roten av repoet som før. Dette kommer med automatisk:
// • filtypene i TILLATT (sider, skript, bilder, skrifter, lyd, video), i roten og i mapper
//   med små bokstaver uten mellomrom (bilder/, video/, lyd/, fonter/ …)
// • alle filer som en publisert side lenker til, uansett filtype eller mappe
// Dette holdes igjen og står i byggeloggen hos Netlify («Ikke publisert»):
// • andre filtyper (.md, .pdf, .docx, .zip, .json …) som ingen side lenker til
// • mapper med store bokstaver eller mellomrom (f.eks. en hel kopi av nettsiden som
//   «Dj tiny nettside/» lastet opp ved et uhell), punktmapper og snarveier (symlenker)
// Alt med en tillatt endelse blir offentlig, uansett filnavn. Last aldri opp tilbud,
// kontrakter eller usladdet video, og fjern posisjon fra bilder tatt rett fra mobilen.
//
// Test lokalt: node bygg.mjs   (lager dist/, som ikke skal i git)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = path.dirname(fileURLToPath(import.meta.url));
const UT = path.join(ROT, 'dist');

const TILLATT = new Set([
    'html', 'css', 'js', 'webmanifest',
    'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico',
    'woff2', 'woff',
    'mp3', 'm4a', 'ogg', 'wav',
    'mp4', 'm4v', 'mov', 'webm', 'ogv', 'vtt',
]);
// Netlify-regler (sikkerhetshoder og videresendinger) må ligge i roten av dist/
const NETLIFY_FILER = new Set(['_headers', '_redirects']);
const HOPP_OVER_MAPPER = new Set(['.git', 'dist', 'node_modules']);
const MAPPENAVN = /^[a-z0-9][a-z0-9_-]*$/;

const erSymlenke = (rel) => fs.lstatSync(path.join(ROT, rel)).isSymbolicLink();
const iPunktmappe = (rel) => rel.split('/').slice(0, -1).some((d) => d.startsWith('.'));

const skalUt = (rel) => {
    if (erSymlenke(rel)) return false;
    const deler = rel.split('/');
    const navn = deler[deler.length - 1];
    if (rel === '.well-known/security.txt') return true;
    if (deler.length === 1 && NETLIFY_FILER.has(navn)) return true;
    if (deler.some((d) => d.startsWith('.'))) return false;
    if (deler.slice(0, -1).some((d) => !MAPPENAVN.test(d))) return false;
    if (rel === 'robots.txt' || rel === 'sitemap.xml') return true;
    const ext = navn.includes('.') ? navn.split('.').pop().toLowerCase() : '';
    return TILLATT.has(ext);
};

const filer = [];
const gaa = (mappe) => {
    for (const d of fs.readdirSync(path.join(ROT, mappe), { withFileTypes: true })) {
        const rel = mappe ? `${mappe}/${d.name}` : d.name;
        if (d.isDirectory()) { if (!(mappe === '' && HOPP_OVER_MAPPER.has(d.name))) gaa(rel); }
        else if (d.isFile() || d.isSymbolicLink()) filer.push(rel);
    }
};
gaa('');
filer.sort();

const ut = new Set(filer.filter(skalUt));

// Filer som en publisert side lenker til, skal ut selv om filtypen ikke står i TILLATT
// (f.eks. en prisliste.pdf). Gjentas til ingen nye dukker opp, i tilfelle en slik fil er en side.
const lenketTil = new Set();
for (let nye = [...ut]; nye.length;) {
    const funnet = [];
    for (const side of nye.filter((f) => /\.(html|css|js)$/i.test(f))) {
        const tekst = fs.readFileSync(path.join(ROT, side), 'utf8');
        for (const [, ref] of tekst.matchAll(/["'(]([^"'()\s<>]+?\.[a-z0-9]{2,11})(?:[?#][^"'()\s<>]*)?["')]/gi)) {
            if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(ref)) continue;
            let maal;
            try { maal = decodeURIComponent(ref); } catch { continue; }
            maal = maal.startsWith('/') ? path.posix.normalize(maal.slice(1)) : path.posix.normalize(path.posix.join(path.posix.dirname(side), maal));
            if (maal.startsWith('..') || ut.has(maal) || !filer.includes(maal)) continue;
            if (iPunktmappe(maal) || maal.startsWith('.') || erSymlenke(maal)) continue;
            ut.add(maal); lenketTil.add(maal); funnet.push(maal);
        }
    }
    nye = funnet;
}

// Stopp heller enn å publisere en side uten forside eller uten sikkerhetshodene
for (const maa of ['index.html', '_headers', '_redirects']) {
    if (!ut.has(maa)) { console.error(`Byggefeil: ${maa} mangler. Ingenting er publisert.`); process.exit(1); }
}

fs.rmSync(UT, { recursive: true, force: true });
for (const rel of ut) {
    fs.mkdirSync(path.dirname(path.join(UT, rel)), { recursive: true });
    fs.copyFileSync(path.join(ROT, rel), path.join(UT, rel));
}
const igjen = filer.filter((f) => !ut.has(f));
console.log(`Publiseres: ${ut.size} filer i dist/`);
if (lenketTil.size) console.log(`Publisert fordi en side lenker til dem (${lenketTil.size}): ${[...lenketTil].join(', ')}`);
console.log(`Ikke publisert (${igjen.length}): ${igjen.join(', ') || '–'}`);
