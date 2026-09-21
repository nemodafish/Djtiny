var s=document.getElementById('spot');
addEventListener('pointermove',function(e){s.style.background='radial-gradient(340px at '+e.clientX+'px '+e.clientY+'px,rgba(255,46,154,.16),transparent 70%)';},{passive:true});

// Delegert feilhåndtering for bilder (erstatter inline onerror-attributter,
// som ellers ville krevd 'unsafe-inline' i CSP script-src).
document.addEventListener('error', function(e){
 var t = e.target;
 if(t.tagName === 'IMG'){
  var host = t.closest('figure') || t.closest('.thumb');
  if(host){ host.classList.add('tom'); t.remove(); }
 }
}, true);

// ——— VIDEOER ———————————————————————————————————————
// Lim inn lenkene her. Full YouTube-, Shorts- eller Vimeo-lenke funker,
// en ren video-ID funker, og det gjør en lokal fil også
// (f.eks. "video/dj-tiny-1.mp4" — legg gjerne ved plakat: "bilder/…jpg").
var videoer = [
  { lenke: "video/dj-tiny-1.mp4", plakat: "bilder/video-1.jpg", tittel: "Fullt gulv", sted: "[Sted / år]" },
  { lenke: "video/dj-tiny-2.mp4", plakat: "bilder/video-2.jpg", tittel: "Klubbkveld", sted: "[Sted / år]", staaende: true },
  { lenke: "video/dj-tiny-3.mp4", plakat: "bilder/video-3.jpg", tittel: "Utover kvelden", sted: "[Sted / år]", staaende: true }
];
// ————————————————————————————————————————————————————

function tolk(l,plakat,staaende){
 l=(l||'').trim();
 if(!l) return null;
 var m;
 if(/\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(l)) return {type:'fil',src:l,plakat:plakat||'',st:!!staaende};
 if((m=l.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)))
  return {type:'yt',id:m[1]};
 if((m=l.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return {type:'vimeo',id:m[1]};
 if(/^[\w-]{11}$/.test(l)) return {type:'yt',id:l};
 if(/^\d{6,}$/.test(l)) return {type:'vimeo',id:l};
 return null;
}
function bilde(v){
 if(v.type==='fil') return v.plakat;
 return v.type==='yt'?'https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg':'';
}
function embed(v){return v.type==='yt'
 ? 'https://www.youtube-nocookie.com/embed/'+v.id+'?autoplay=1&rel=0'
 : 'https://player.vimeo.com/video/'+v.id+'?autoplay=1';}

var vids=document.getElementById('vids'),vidtom=document.getElementById('vidtom'),
 lb=document.getElementById('lb'),lbf=document.getElementById('lbf'),lbx=document.getElementById('lbx'),sisteKnapp=null;

(function tegn(){
 var n=0;
 videoer.forEach(function(item){
  var v=tolk(item.lenke,item.plakat,item.staaende);
  var el=document.createElement(v?'button':'div');
  el.className='vid';
  if(v){el.type='button';el.setAttribute('aria-label','Spill av '+item.tittel);n++;}
  var thumb=document.createElement('span');
  thumb.className='thumb'+(v&&bilde(v)?'':' tom');
  if(v&&bilde(v)){
   var img=document.createElement('img');
   img.src=bilde(v); img.alt=''; img.loading='lazy';
   thumb.appendChild(img);
  }
  var play=document.createElement('i');
  play.className='play'; play.textContent='▶';
  thumb.appendChild(play);
  el.appendChild(thumb);
  if(v) el.addEventListener('click',function(){apne(v,el);});
  vids.appendChild(el);
 });
 vidtom.hidden = n>0;
})();

function apne(v,knapp){
 sisteKnapp=knapp;
 lbf.classList.toggle('st', !!v.st);
 lbf.textContent='';
 if(v.type==='fil'){
  var video=document.createElement('video');
  video.src=v.src; if(v.plakat) video.poster=v.plakat;
  video.controls=true; video.autoplay=true; video.playsInline=true; video.preload='metadata';
  video.addEventListener('error',function(){
   lbf.textContent='';
   var p=document.createElement('p'); p.className='lberr';
   p.appendChild(document.createTextNode('Fant ikke videofila '));
   var b1=document.createElement('b'); b1.textContent=v.src; p.appendChild(b1);
   p.appendChild(document.createElement('br'));
   p.appendChild(document.createTextNode('Sjekk at mappa '));
   var b2=document.createElement('b'); b2.textContent='video/'; p.appendChild(b2);
   p.appendChild(document.createTextNode(' ligger i samme mappe som HTML-fila.'));
   lbf.appendChild(p);
  });
  lbf.appendChild(video);
 } else {
  var iframe=document.createElement('iframe');
  iframe.src=embed(v);
  iframe.allow='autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen=true;
  iframe.title='DJ Tiny video';
  lbf.appendChild(iframe);
 }
 lb.hidden=false;document.body.style.overflow='hidden';lbx.focus();
}
function lukk(){
 lb.hidden=true;lbf.textContent='';document.body.style.overflow='';
 if(sisteKnapp)sisteKnapp.focus();
}
lbx.addEventListener('click',lukk);
lb.addEventListener('click',function(e){if(e.target===lb)lukk();});
addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)lukk();});

var lbok=document.getElementById('lbok'), lbokx=document.getElementById('lbokx');
function visOk(){lbok.hidden=false;document.body.style.overflow='hidden';lbokx.focus();}
function lukkOk(){lbok.hidden=true;document.body.style.overflow='';}
lbokx.addEventListener('click',lukkOk);
lbok.addEventListener('click',function(e){if(e.target===lbok)lukkOk();});
addEventListener('keydown',function(e){if(e.key==='Escape'&&!lbok.hidden)lukkOk();});

// Mobilmeny
(function(){
 var menub=document.getElementById('menub'), navEl=document.querySelector('.nav');
 if(!menub) return;
 function lukkMeny(){navEl.classList.remove('open');menub.setAttribute('aria-expanded','false');menub.textContent='☰';}
 function apneMeny(){navEl.classList.add('open');menub.setAttribute('aria-expanded','true');menub.textContent='✕';}
 menub.addEventListener('click',function(){navEl.classList.contains('open')?lukkMeny():apneMeny();});
 document.querySelectorAll('.navlinks a').forEach(function(a){a.addEventListener('click',lukkMeny);});
 addEventListener('keydown',function(e){if(e.key==='Escape')lukkMeny();});
})();

// Mash-up-spiller: én av gangen, klikkbar tidslinje
(function(){
 var spor=[].slice.call(document.querySelectorAll('.spor'));
 function mmss(s){ if(!isFinite(s)) return '–:–';
  var m=Math.floor(s/60), r=Math.floor(s%60); return m+':'+('0'+r).slice(-2); }
 spor.forEach(function(el){
  var lyd=el.querySelector('audio'), knapp=el.querySelector('.pb'),
      bar=el.querySelector('.bar'), fyll=el.querySelector('.bar i'), tid=el.querySelector('.tid');
  lyd.addEventListener('loadedmetadata',function(){tid.textContent=mmss(lyd.duration);});
  lyd.addEventListener('timeupdate',function(){
   fyll.style.width=(lyd.currentTime/lyd.duration*100||0)+'%';
   tid.textContent=mmss(lyd.duration-lyd.currentTime);
  });
  lyd.addEventListener('ended',function(){stopp();fyll.style.width='0';});
  lyd.addEventListener('error',function(){feil();});

  function stopp(){knapp.textContent='▶';knapp.classList.remove('spiller');}
  function feil(){stopp();el.classList.add('feil');tid.textContent='Fant ikke lydfila';}

  knapp.addEventListener('click',function(){
   if(lyd.paused){
    spor.forEach(function(a){var x=a.querySelector('audio');
     if(x!==lyd&&!x.paused){x.pause();a.querySelector('.pb').textContent='▶';a.querySelector('.pb').classList.remove('spiller');}});
    var p=lyd.play();
    knapp.textContent='❚❚';knapp.classList.add('spiller');
    if(p&&p.catch) p.catch(function(){feil();});
   } else {lyd.pause();stopp();}
  });
  bar.addEventListener('click',function(e){
   var r=bar.getBoundingClientRect();
   if(isFinite(lyd.duration)) lyd.currentTime=(e.clientX-r.left)/r.width*lyd.duration;
  });
 });
})();

// Media-faner
var tabs=[].slice.call(document.querySelectorAll('.tab'));
tabs.forEach(function(t){t.addEventListener('click',function(){
 tabs.forEach(function(o){o.classList.remove('on');o.setAttribute('aria-selected','false');
  document.getElementById(o.dataset.p).classList.remove('on');});
 t.classList.add('on');t.setAttribute('aria-selected','true');
 document.getElementById(t.dataset.p).classList.add('on');
});});

// Booking-skjema: honeypot + minimum utfyllingstid + innsending
(function(){
 var f=document.getElementById('f'), skjemaVist=Date.now();
 f.addEventListener('submit',function(e){
  e.preventDefault();
  var btn=f.querySelector('button[type="submit"]'), st=document.getElementById('fstatus'),
      capDiv=f.querySelector('.g-recaptcha'),
      capKlar = capDiv && capDiv.dataset.sitekey && capDiv.dataset.sitekey.indexOf('DIN_')!==0,
      honeypot=f.querySelector('input[name="firma"]');

  function melding(txt){st.textContent=txt;st.hidden=false;}
  function mailtoFallback(){
   var b='Navn: '+f.navn.value+'\nE-post: '+f.epost.value+'\nDato: '+f.dato.value+'\nType: '+f.type.value+'\nSted: '+f.sted.value+'\n\n'+f.melding.value;
   location.href='mailto:booking@djtiny.no?subject='+encodeURIComponent('Booking '+f.dato.value)+'&body='+encodeURIComponent(b);
  }

  // Stille avvisning av sannsynlige roboter: usynlig honeypot-felt utfylt,
  // eller skjemaet sendt urealistisk raskt etter sidelast. Ekte besøkende
  // ser aldri dette — de får bare bekreftelsen som normalt.
  if((honeypot && honeypot.value) || (Date.now()-skjemaVist) < 2500){
   f.reset(); visOk();
   return;
  }

  if(capKlar && typeof grecaptcha!=='undefined' && grecaptcha.getResponse().length===0){
   melding('Vennligst bekreft at du ikke er en robot.');
   return;
  }
  if(!f.action || f.action.indexOf('DITT_SKJEMA_ID')>-1){ mailtoFallback(); return; }
  btn.disabled=true; melding('Sender…');
  fetch(f.action,{method:'POST',body:new FormData(f),headers:{'Accept':'application/json'}})
   .then(function(r){
    if(r.ok){ st.hidden=true; f.reset(); if(typeof grecaptcha!=='undefined') grecaptcha.reset(); visOk(); }
    else { throw new Error('send feilet'); }
   })
   .catch(function(){
    melding('Kunne ikke sende automatisk — åpner e-postappen din i stedet.');
    mailtoFallback();
   })
   .finally(function(){ btn.disabled=false; });
 });
})();
