// Besøksstatistikk uten cookies (Plausible), satt opp og driftet av DOTDEV.
// Må lastes FØR /dd/js/s.js i <head>. Både skriptet og hendelsene går via
// djtiny.no (se _redirects), så sikkerhetsreglene i _headers kan stå uendret.
window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments); };
plausible.init = plausible.init || function (i) { plausible.o = i || {}; };
plausible.init({ endpoint: '/dd/api/e' });
