/* igra-ruka — вид как у образца 29 янв. (ko-hand, rc-site e4f86d74). Подсказка «куда жать» (Р206, 23.10.2026): на шаге одна активная кнопка
   пульсирует, над ней рука «тап-тап», остальные кнопки игры приглушены.
   Вставить В НАЧАЛО скрипта игры как есть. Использование:
     var ruka = igraRuka(root);   // root — секция игры
     ruka.na(knopka);             // показать руку над кнопкой, кнопка пульсирует
     ruka.ubrat();                // убрать (пока идёт анимация / финал)
   Отклик на касание (≤100 мс): класс .igra-zhmyak на pointerdown + navigator.vibrate(20). */
function igraRuka(root) {
  var el = document.createElement('span');
  el.className = 'igra-ruka'; el.setAttribute('aria-hidden', 'true'); el.hidden = true;
  el.innerHTML = '<i class="igra-ruka-krug"></i><svg viewBox="0 0 40 48" width="40" height="48"><path d="M15 4c2.2 0 4 1.8 4 4v13l1.2-.5c1.9-.7 4 .2 4.8 2l.3.7.8-.3c1.9-.6 4 .3 4.7 2.2l.2.5c1.9-.4 3.8.7 4.4 2.5.2.6.3 1.2.3 1.8V36c0 5.5-4.5 10-10 10h-4.6c-3 0-5.8-1.4-7.7-3.7L5.2 33.5c-1.3-1.6-1.1-4 .5-5.3 1.5-1.2 3.7-1.1 5.1.3l.2.2V8c0-2.2 1.8-4 4-4z" fill="#fff" stroke="#1a1206" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.appendChild(el);
  var cel = null;
  function mesto() {
    if (!cel || el.hidden) return;
    var r = cel.getBoundingClientRect(), b = root.getBoundingClientRect();
    el.style.left = Math.round(r.left - b.left + r.width * 0.86) + 'px';
    el.style.top = Math.round(r.top - b.top + r.height * 0.5) + 'px';
  }
  function ubrat() {
    if (cel) cel.classList.remove('igra-aktiv');
    cel = null; el.hidden = true; root.classList.remove('igra-ved');
  }
  function na(knopka) {
    ubrat();
    if (!knopka) return;
    cel = knopka; cel.classList.add('igra-aktiv'); root.classList.add('igra-ved');
    el.hidden = false; mesto();
    requestAnimationFrame(mesto);
  }
  window.addEventListener('resize', mesto);
  if (window.ResizeObserver) new ResizeObserver(mesto).observe(root);
  root.addEventListener('pointerdown', function (e) {
    var k = e.target.closest('button, [role="button"]');
    if (!k || !root.contains(k)) return;
    k.classList.add('igra-zhmyak');
    setTimeout(function () { k.classList.remove('igra-zhmyak'); }, 160);
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (_) {} }
  });
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  return { na: na, ubrat: ubrat, mesto: mesto };
}
/* Игра 20 января «Спаси мышь — и не сможешь» (Лунин, 1880) — черновик на нажатиях (Р227, Р228, стандарт Р201/Р206).
   Сюжет, сроки и тексты — как на странице дня (r169, Р176). Перетаскивание баночек заменено цепочкой нажатий:
   мигает одна баночка → нажатие → она сама летит в свою миску. Порядок: молоко → белок → жир → сахар → вода →
   «Пустить дни» → сода → «Пустить дни ещё раз» → все соли → «Пустить дни ещё раз» → финал сам. 10 нажатий.
   Сроки гибели — «Витамины и антивитамины», гл. «О чём рассказали опыты на мышах» (bibliotekar.ru/2-7-93-vitaminy/6.htm):
   смесь 11–21 день, с содой (совет Бунге) 16–30, со всеми солями молока 20–30; на молоке 10 недель здоровы.
   День гибели — случайный внутри срока источника, но каждая следующая попытка не раньше предыдущей. */
(function(){
  var root = document.querySelector('[data-lunin-igra]');
  if (!root) return;
  var $ = function(id){ return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ruka = igraRuka(root);
  function msg(t, cls){ var m=$('opytMsg'); m.className='lab-msg'+(cls?' '+cls:''); m.textContent=t; }
  function seychas(t, p){ $('seychas').innerHTML='<b>Что сделать сейчас:</b> '+t; if (p!==undefined) $('poyasn').textContent=p; }
  function shag(n){ root.querySelectorAll('.lm-shagi li').forEach(function(li,i){ li.classList.toggle('on', i===n-1); li.classList.toggle('bylo', i<n-1); }); }

  var SROK = {smes:[11,21], soda:[16,30], soli:[20,30]};
  var NAZV = {smes:'Смесь', soda:'Смесь + сода', soli:'Смесь + все соли'};
  var DNEY = 70, NS = 'http://www.w3.org/2000/svg';
  var KOLOR = {belok:'#f4efe2', zhir:'#f1cf63', sahar:'#ffffff', voda:'#8cc4ea', soda:'#d9e4ea', soli:'#c9b8a6'};
  /* порядок нажатий и подписи к ним (3–5 слов с глаголом) */
  var PORYADOK = ['moloko','belok','zhir','sahar','voda'];
  var IMYA = {moloko:'«Молоко»', belok:'«Белок»', zhir:'«Жир»', sahar:'«Молочный сахар»', voda:'«Вода»', soda:'«Сода»', soli:'«Все соли»'};
  var CHTO = {moloko:'Бутылка сама опрокинется в правую миску.', belok:'Баночка сама ляжет в левую миску.',
    zhir:'Баночка сама ляжет в левую миску.', sahar:'Баночка сама ляжет в левую миску.', voda:'Последняя часть корма — в левую миску.',
    soda:'Сода сама ляжет в левую миску. Мыши — новая пара.', soli:'Соли сами лягут в левую миску. Мыши — новая пара.'};
  var st, t0 = performance.now(), lastT = t0, polozh = {x:70, dir:1, kolesoA:0, shag:0};
  var myshL = $('myshL'), myshR = $('myshR'), cel = null, letit = false, pervyi = false;
  function novoe(){ return {L:{belok:0,zhir:0,sahar:0,voda:0}, R:false, dop:null, etap:'smes', run:null, last:0, done:{}}; }
  st = novoe();

  function smesGotova(){ var L=st.L; return L.belok&&L.zhir&&L.sahar&&L.voda; }
  function skolkoL(){ var n=0; for (var k in st.L) if (st.L[k]) n++; return n; }
  function gotovo(){ return smesGotova() && st.R && (st.etap==='smes' || st.dop===st.etap); }
  function idyot(){ return st.run && !st.run.done; }
  function podpisi(){
    var r = st.run, d = r ? Math.floor(r.day) : 0;
    if (r && r.dead) $('txtL').textContent = 'Не выжила: '+r.death+'-й день.';
    else if (r) $('txtL').textContent = 'День '+d+': '+(zdorovie(r.day)>.75 ? 'ест и бегает.' : zdorovie(r.day)>.35 ? 'слабеет.' : 'почти не встаёт.');
    else { var n=skolkoL(); $('txtL').textContent = n ? (n<4 ? 'В миске '+n+' из 4.' : 'Корм готов'+(st.dop==='soda'?' + сода.':st.dop==='soli'?' + все соли.':'.')) : 'Миска пуста.'; }
    $('txtR').textContent = r ? 'День '+d+': здорова, бегает в колесе.' : (st.R ? 'Молоко налито.' : 'Миска пуста.');
  }
  /* здоровье левой: ровно до ~половины срока, потом плавно гаснет к дню гибели */
  function zdorovie(d){ var r=st.run; if (!r) return 1; var a=r.death*.5; return d<=a ? 1 : Math.max(0, 1-(d-a)/(r.death-a)); }

  function napolnit(k){ /* уровень корма в миске растёт с каждой баночкой */
    if (k==='R'){ var m=$('kormR'); m.setAttribute('rx', st.R?29:0); m.setAttribute('ry', st.R?6:0); return; }
    var n=skolkoL(), e=$('kormL'), krup=$('krupL');
    e.setAttribute('rx', n?12+n*5.5:0); e.setAttribute('ry', n?3+n*.9:0);
    var cols=[]; ['belok','zhir','sahar','voda'].forEach(function(x){ if (st.L[x]) cols.push(KOLOR[x]); }); if (st.dop) cols.push(KOLOR[st.dop]);
    e.setAttribute('fill', cols.length ? cols[0] : 'none');
    while (krup.firstChild) krup.removeChild(krup.firstChild);
    cols.slice(1).forEach(function(c,i){ for (var j=0;j<4;j++){ var s=document.createElementNS(NS,'circle');
      s.setAttribute('cx', 172-22+((i*13+j*11)%44)); s.setAttribute('cy', 185+((i*3+j*2)%5)); s.setAttribute('r', 2.2); s.setAttribute('fill', c); krup.appendChild(s); } });
  }
  function vsplesk(id){ var g=$(id); g.classList.remove('plesk'); void g.getBBox(); g.classList.add('plesk'); }

  /* ── активная кнопка шага: пульсирует, над ней рука; если ушла за край экрана — подкрутить ── */
  function aktiv(el){
    cel = el; ruka.na(el);
    if (!pervyi) { pervyi = true; return; }   /* при загрузке страницу не крутим */
    var r = el.getBoundingClientRect();
    if (r.top < 8 || r.bottom > window.innerHeight - 8) el.scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'});
  }
  function zhdat(){ cel = null; ruka.ubrat(); }
  function banka(x){ return root.querySelector('.banka[data-b="'+x+'"]'); }

  /* что мигает сейчас */
  function dalshe(){
    if (st.etap==='konec') return;
    if (idyot() || letit) { zhdat(); return; }
    var x = null;
    if (st.etap==='smes'){ for (var i=0;i<PORYADOK.length;i++){ var p=PORYADOK[i]; if (p==='moloko' ? !st.R : !st.L[p]) { x=p; break; } } }
    else if (st.dop!==st.etap) x = st.etap;
    if (x){ seychas('Нажми '+IMYA[x], CHTO[x]); aktiv(banka(x)); return; }
    $('pusk').setAttribute('aria-disabled','false');
    seychas('Нажми «'+$('pusk').textContent+'»', 'Побегут сутки — до 70-го дня. Смотри на обе клетки.');
    aktiv($('pusk'));
  }

  /* нажатие на баночку: сразу видимый отклик (баночка взята, текст), затем она сама летит в свою миску */
  function polozhit(b){
    var k=b.dataset.k, x=b.dataset.b;
    b.classList.add('vzyato'); b.setAttribute('aria-disabled','true');
    zhdat(); letit = true;
    seychas('Смотри: '+(k==='R'?'молоко льётся в правую миску':'баночка летит в левую миску'));
    if (x==='soda' || x==='soli') novyeMyshi();
    poletet(b, k, function(){
      letit = false;
      if (x==='moloko'){ st.R=true; napolnit('R'); vsplesk('miskaR'); }
      else if (x==='soda' || x==='soli'){ st.dop=x; napolnit('L'); vsplesk('miskaL'); }
      else { st.L[x]=1; napolnit('L'); vsplesk('miskaL'); }
      podpisi(); podskazka(); dalshe();
    });
  }
  function poletet(b, k, gotov){
    if (reduce) { setTimeout(gotov, 60); return; }
    var r=b.getBoundingClientRect(), svg=$(k==='R'?'kletkaR':'kletkaL').querySelector('svg').getBoundingClientRect();
    var cx = svg.left + svg.width*((k==='R'?186:172)/240), cy = svg.top + svg.height*(170/230);
    var g=b.cloneNode(true); g.removeAttribute('id'); g.classList.remove('vzyato','igra-aktiv','poyavis','igra-zhmyak'); g.classList.add('letit');
    g.setAttribute('aria-hidden','true'); g.tabIndex=-1;
    g.style.width=r.width+'px'; g.style.height=r.height+'px'; g.style.left=r.left+'px'; g.style.top=r.top+'px';
    document.body.appendChild(g);
    var dx = cx-(r.left+r.width/2), dy = cy-(r.top+r.height/2);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      g.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(k==='R'?-70:-25)+'deg) scale(.45)'; g.style.opacity='.2'; }); });
    setTimeout(function(){ g.remove(); gotov(); }, 520);
  }
  function podskazka(){
    $('pusk').setAttribute('aria-disabled', gotovo() && !idyot() ? 'false' : 'true');
    if (st.run) return;
    if (!st.R && !skolkoL()) msg('Налей правой мыши молока, а левой собери корм: белок, жир, молочный сахар, вода.');
    else if (!smesGotova()) msg('В левой миске '+skolkoL()+' из 4. Нажимай баночки дальше.');
    else if (!st.R) msg('Корм готов — теперь налей молока правой мыши.');
    else msg('Всё, что знала наука 1880 года, — в миске. Жми «Пустить дни».', 'ok');
  }

  /* ── время ── */
  function pusk(){
    if (!gotovo() || idyot()) return;
    var s=SROK[st.etap], hi=s[1]-(st.etap==='smes'?3:st.etap==='soda'?3:0), lo=Math.min(hi, Math.max(s[0], st.last+2));
    st.run={v:st.etap, day:0, death:lo+Math.floor(Math.random()*(hi-lo+1)), dead:false, done:false, tDead:0};
    $('pusk').setAttribute('aria-disabled','true'); $('opyt').classList.add('idyot');
    zhdat();
    seychas('Смотри на обе клетки', 'Дни идут сами — нажимать ничего не нужно.');
    msg(st.etap==='smes' ? 'Дни пошли. Смотри на обе клетки.' : st.etap==='soda' ? 'Сода в корме. Дни пошли…' : 'Все соли молока в корме. Дни пошли…');
    var kl=$('kletkaL').getBoundingClientRect();
    if (kl.top < 0 || kl.bottom > window.innerHeight) $('kletkaL').scrollIntoView({block:'start', behavior: reduce ? 'auto' : 'smooth'});
  }
  function tik(now){
    var dt=Math.min(.05,(now-lastT)/1000), t=(now-t0)/1000; lastT=now;
    var r=st.run, h=1;
    if (r && !r.done){
      var v = r.dead ? 14 : 4.2;                                     /* суток в секунду: до гибели медленно, потом быстрее */
      r.day=Math.min(DNEY, r.day+v*dt);
      if (!r.dead && r.day>=r.death){ r.dead=true; r.day=r.death; r.tDead=t; gibel(); }
      if (r.day>=DNEY){ r.done=true; konecOpyta(); }
      $('den').textContent='день '+Math.floor(r.day); $('denBar').style.width=(r.day/DNEY*100)+'%';
      var noch=(1-Math.cos(r.day*Math.PI*2))/2*.28; $('nochL').setAttribute('opacity',noch); $('nochR').setAttribute('opacity',noch);
      podpisi();
    }
    if (r) h=zdorovie(r.day);
    /* левая мышь: бегает, к сроку замедляется, ложится, гаснет */
    var sp = r && r.dead ? 0 : (.25+.75*h)*(r && !r.done ? 1 : .55);
    polozh.x += polozh.dir*sp*38*dt; if (polozh.x>112){ polozh.x=112; polozh.dir=-1; } if (polozh.x<56){ polozh.x=56; polozh.dir=1; }
    polozh.shag += sp*dt*14;
    var lezh = r && r.dead ? Math.min(1,(t-r.tDead)/1.6) : 0;
    var hud = 1-.16*(1-h), bob = Math.sin(polozh.shag)*1.6*sp;
    myshL.setAttribute('transform','translate('+polozh.x.toFixed(1)+' '+(186+lezh*4)+') scale('+(polozh.dir<0?-hud:hud).toFixed(3)+' '+(hud*(1-.28*lezh)).toFixed(3)+') rotate('+(-6*lezh)+') translate(0 '+bob.toFixed(2)+')');
    myshL.setAttribute('opacity', (1-.5*lezh).toFixed(2));
    myshL.style.filter = 'saturate('+(h*.8+.2-.2*lezh).toFixed(2)+')';
    $('glazL').setAttribute('opacity', lezh>.5 ? 0 : 1); $('glazZL').setAttribute('opacity', lezh>.5 ? 1 : 0);
    var l1=Math.sin(polozh.shag)*2*sp; $('lapaL1').setAttribute('d','M-12 -2 l'+l1.toFixed(1)+' 4'); $('lapaL2').setAttribute('d','M14 -2 l'+(-l1).toFixed(1)+' 4');
    /* правая: на молоке бодра; пока идут дни — в колесе, колесо крутится */
    var vKolese = r && !r.done;
    if (vKolese){ polozh.kolesoA = (polozh.kolesoA + dt*260)%360; var b2=Math.sin(t*18)*1.5;
      myshR.setAttribute('transform','translate(66 '+(166+b2).toFixed(1)+') scale(.82)');
      var l2=Math.sin(t*18)*3; $('lapaR1').setAttribute('d','M-12 -2 l'+l2.toFixed(1)+' 4'); $('lapaR2').setAttribute('d','M14 -2 l'+(-l2).toFixed(1)+' 4'); }
    else { var nib=st.R ? Math.max(0,Math.sin(t*2.4))*2 : 0; myshR.setAttribute('transform','translate(118 '+(186+nib).toFixed(1)+')'); }
    $('spicyR').setAttribute('transform','rotate('+polozh.kolesoA.toFixed(1)+' 74 112)');
    requestAnimationFrame(tik);
  }
  function gibel(){
    msg('Левая мышь не выжила — '+st.run.death+'-й день. А правая на молоке бегает в колесе. Дни идут дальше…','bad');
  }
  function stroka(v, den){
    var row=document.createElement('div'); row.className='srok';
    row.innerHTML='<span class="srok-n"></span><span class="srok-p"><i class="gibel"></i></span><span class="srok-d"></span>';
    row.firstChild.textContent=NAZV[v]; row.lastChild.textContent='не выжила — '+den+'-й день';
    $('sroki').appendChild(row); var i=row.querySelector('i'); requestAnimationFrame(function(){ requestAnimationFrame(function(){ i.style.width=(den/DNEY*100)+'%'; }); });
  }
  function konecOpyta(){
    var r=st.run; st.last=r.death; st.done[r.v]=r.death; $('opyt').classList.remove('idyot');
    $('sroki').hidden=false; stroka(r.v, r.death);
    if (r.v==='smes'){ st.etap='soda'; pokazat('soda'); shag(2);
      msg('Так и было у Лунина: на «идеальной» смеси мыши жили 11–21 день, на молоке — все 10 недель. Профессор Бунге уверен: виновата кислота. Нажми «Сода» — она ляжет в левую миску.'); }
    else if (r.v==='soda'){ st.etap='soli'; pokazat('soli'); shag(3);
      msg('Сода не спасла — гибель лишь сдвинулась (в опытах Лунина — между 16-м и 30-м днём). Тема Лунина — соли. Нажми «Все соли» — все соли молока, до грамма.'); }
    else { st.etap='konec'; final(); return; }
    dalshe();
  }
  function pokazat(x){
    var b=banka(x); b.hidden=false; b.setAttribute('aria-disabled','false'); b.classList.remove('vzyato'); b.classList.add('poyavis');
    $('pusk').setAttribute('aria-disabled','true'); $('pusk').textContent='Пустить дни ещё раз';
  }
  function novyeMyshi(){ /* новая пара мышей, тот же корм, новая добавка */
    st.run=null; polozh.x=70; polozh.dir=1;
    $('den').textContent='день 0'; $('denBar').style.width='0'; $('nochL').setAttribute('opacity',0); $('nochR').setAttribute('opacity',0);
    if (st.dop){ var old=banka(st.dop); if (old) old.hidden=true; }
    st.dop=null;
  }
  function final(){
    zhdat();
    msg('Даже все соли молока, до грамма, не спасли. Белок есть, жир, сахар, вода, соли — а мышь гибнет. Значит, в молоке есть что-то ещё.','ok');
    seychas('Читай, чего не хватает', 'Над молоком горит вопрос. Ниже — пять фактов о Лунине.');
    $('vopros').classList.add('gorit'); $('vopros').setAttribute('opacity',1);
    $('kletkaR').classList.add('final'); $('vyvod').hidden=false;
    $('pusk').setAttribute('aria-disabled','true'); $('pusk').textContent='Опыт Лунина пройден';
    $('finale').hidden=false;
    root.querySelectorAll('.lm-shagi li').forEach(function(li){ li.classList.remove('on'); li.classList.add('bylo'); });
    setTimeout(function(){ $('vyvod').classList.add('vidno'); $('vyvod').scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'}); },50);
  }
  function sbros(){
    if (idyot() || letit) return;
    st=novoe(); polozh.x=70; polozh.dir=1;
    root.querySelectorAll('.banka').forEach(function(b){ b.setAttribute('aria-disabled','false'); b.classList.remove('vzyato','poyavis'); if (b.classList.contains('dop')) b.hidden=true; });
    $('kormL').setAttribute('rx',0); $('kormL').setAttribute('ry',0); napolnit('L'); napolnit('R');
    $('sroki').querySelectorAll('.srok:not(#srokM)').forEach(function(x){ x.remove(); }); $('sroki').hidden=true;
    $('vyvod').hidden=true; $('vyvod').classList.remove('vidno'); $('vopros').classList.remove('gorit'); $('vopros').setAttribute('opacity',0); $('kletkaR').classList.remove('final');
    $('den').textContent='день 0'; $('denBar').style.width='0'; $('pusk').textContent='Пустить дни';
    $('finale').hidden=true; shag(1);
    podpisi(); podskazka();
    $('opyt').scrollIntoView({block:'start', behavior: reduce ? 'auto' : 'smooth'});
    dalshe();
  }

  /* ── нажатия: обработчик click; мимо мигающей кнопки — только подсказка, игра не ломается ── */
  root.querySelectorAll('.banka').forEach(function(b){
    b.addEventListener('click', function(){ if (cel===b) polozhit(b); });
  });
  $('pusk').addEventListener('click', function(){ if (cel===$('pusk')) pusk(); });
  $('again').addEventListener('click', sbros);
  root.addEventListener('click', function(e){
    if (!e.target.closest('#opyt')) return;
    if (cel && cel.contains(e.target)) return;
    if (st.etap==='konec') return;
    $('poyasn').textContent = cel ? 'Жми мигающую кнопку — над ней рука.' : 'Подожди: дни идут сами, потом замигает следующая кнопка.';
  }, true);   /* фаза захвата: до обработчика самой кнопки */

  podpisi(); podskazka(); shag(1); requestAnimationFrame(tik);
  dalshe();
})();
