// ——— KOMMENDE DATOER ————————————————————————————————
// Datoer som har passert fjernes automatisk fra #datoer. Skriv hver dato
// med år-måned-dag i data-dato, og slik den skal vises mellom taggene:
//   <span data-dato="2026-10-09">9. okt</span>
// Datoen vises ut selve dagen og forsvinner dagen etter. Et sted uten
// flere datoer skjules helt, og er alle borte vises #datotom i stedet.
// ————————————————————————————————————————————————————
(function(){
 var seksjon=document.getElementById('datoer');
 if(!seksjon) return;
 var n=new Date(), idag=n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate();
 // "2026-10-09" -> 20261009. Feilskrevne datoer blir NaN og står urørt.
 function tall(s){var p=(s||'').split('-');return p[0]*10000+p[1]*100+(+p[2]);}

 [].slice.call(seksjon.querySelectorAll('[data-dato]')).forEach(function(el){
  if(tall(el.dataset.dato)<idag) el.remove();
 });
 [].slice.call(seksjon.querySelectorAll('.sted')).forEach(function(sted){
  if(!sted.querySelector('.chips span')) sted.remove();
 });
 var tom=document.getElementById('datotom');
 if(tom) tom.hidden=!!seksjon.querySelector('.sted');
})();
