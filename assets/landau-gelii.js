/* Игра «Гелий, который убегает из стакана» (22 января, Ландау) — черновик на одиночных нажатиях (Р206, Р227, Р228).
   Движок (криостат, стакан, плёнка, «две жидкости») перенесён как есть со страницы 01-22; ползунки температуры и наклона
   и наклон пальцем по картинке заменены цепочкой нажатий: Наклонить → Охладить ×4 → Выпрямить → Глазами Ландау. */
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
(function(){
  var root=document.querySelector('[data-landau-igra]'); if (!root) return;
  var ruka=igraRuka(root);
  var $ = function(id){return document.getElementById(id);};
  /* ── КАПИЦА УВИДЕЛ, ЛАНДАУ ОБЪЯСНИЛ ── модель стакана с гелием в криостате.
     Выше 2,17 К — кипит, поверхность горизонтальна при любом наклоне, ничего не уходит.
     Ниже — кипение обрывается, плёнка ползёт по стенке через край, капли падают в ванну.
     Скорость утечки ∝ доле сверхтекучей части: ρs = 1 − (T/2,17)^5,6 (упрощённая модель). */
  var LAM=2.17, TMAX=4.2, TMIN=1.4, STEP=0.3;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv=$('cvHe'), c=cv.getContext('2d'), W=cv.width, H=cv.height;
  // криостат (дьюар), стакан, ванна, термометр
  var DX=26, DY=12, DW=500, DH=458, DR=34;             // наружная колба дьюара
  var IX=DX+30, IW=DW-60, IB=DY+DH-16;                  // внутренняя полость
  var PX=276, PY=176, BW=150, BH=178, WALL=5, RAD=16;   // стакан: центр, размеры
  var A=BW/2-WALL, B=BH/2-WALL;                         // полуразмеры полости стакана
  var BATH0=388, BATHRISE=30, V0=0.6, KFLOW=0.055;
  var TX=584, TT=52, TB=414;                            // термометр
  function rhoS(T){ return T>=LAM?0:1-Math.pow(T/LAM,5.6); }
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function mixCol(c1,c2,t){ return 'rgb('+Math.round(lerp(c1[0],c2[0],t))+','+Math.round(lerp(c1[1],c2[1],t))+','+Math.round(lerp(c1[2],c2[2],t))+')'; }
  var CYAN=[200,238,255], GOLD=[255,211,107], BLUE=[74,163,255];
  // детерминированный шум
  var seed=22; function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
  var frost=[]; for (var i=0;i<170;i++){ var side=rnd(); var fx, fy;
    if (side<0.45){ fx=DX+8+rnd()*(DW-16); fy=DY+4+Math.pow(rnd(),2)*46; }
    else if (side<0.72){ fx=DX+2+Math.pow(rnd(),2)*26; fy=DY+20+rnd()*(DH-60); }
    else { fx=DX+DW-2-Math.pow(rnd(),2)*26; fy=DY+20+rnd()*(DH-60); }
    frost.push({x:fx,y:fy,r:0.6+rnd()*1.9,a:0.25+rnd()*0.55}); }
  var parts=[]; for (i=0;i<110;i++) parts.push({u:rnd()*2-1, v:0.04+rnd()*0.92, th:rnd(), ph:rnd()*6.28, sp:0.6+rnd()*0.8});
  var bparts=[]; for (i=0;i<70;i++) bparts.push({u:rnd(), v:0.06+rnd()*0.88, th:rnd(), ph:rnd()*6.28, sp:0.6+rnd()*0.8});

  // состояние
  var T=TMAX, Tt=TMAX, tilt=0, tiltT=0, V=V0, film=0, filmA=0, mix=0, landau=false;
  var flash=0, wave=0, time=0, last=0, running=false, visible=true;
  var bubbles=[], bbub=[], drops=[], ripples=[];
  var crossed=false, landauDone=false, shagDone=false, tiltMsg=false, emptyMsg=false, finalShown=false;

  function boilK(){ return T>LAM ? clamp((T-LAM)/(TMAX-LAM)*1.2+0.35,0,1) : 0; }
  function tanT(){ return Math.tan(tilt*Math.PI/180); }
  // поверхность в координатах стакана: y = s − x·tg(наклона); жидкость ниже линии
  function ySurf(s,x){ return s - x*tanT(); }
  function areaFor(s){ var n=32, sum=0; for (var k=0;k<n;k++){ var x=-A+(k+0.5)*(2*A/n); sum+=B-clamp(ySurf(s,x),-B,B); } return sum*(2*A/n); }
  function solveS(vol){
    var target=vol*(2*A)*(2*B); if (target<=0.5) return B+A+60;
    var lo=-B-A-2, hi=B+A+2;
    for (var k=0;k<26;k++){ var m=(lo+hi)/2; if (areaFor(m)>target) lo=m; else hi=m; }
    return (lo+hi)/2;
  }
  function toWorld(x,y){ var a=tilt*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a); return {x:PX+x*ca-y*sa, y:PY+x*sa+y*ca}; }
  function bathY(){ return BATH0 - BATHRISE*(1-V/V0); }
  // точка, с которой капает: нижняя точка наружного донышка
  function dripLocalX(){ return Math.abs(tilt)<2.5 ? 0 : (tilt>0 ? 1 : -1)*(A+WALL-RAD*0.6); }
  // путь плёнки для одной стенки (sg=±1): вверх по внутренней стенке, через край, вниз по наружной, по донышку к точке капели
  function filmPath(sg,s){
    var xi=sg*(A-1.5), xo=sg*(A+WALL+1.8), top=-BH/2, ys=clamp(ySurf(s,xi),top+2,B);
    var dx=dripLocalX(), yb=BH/2+1.8, pts=[[xi,ys],[xi,top+1],[sg*(A+WALL/2),top-3.2],[xo,top+1],[xo,yb-RAD]];
    for (var k=1;k<=6;k++){ var an=k/6*Math.PI/2; pts.push([sg*(A+WALL+1.8-RAD+RAD*Math.cos(an)), yb-RAD+RAD*Math.sin(an)]); }
    pts.push([dx,yb]);
    return pts;
  }
  function pathLen(p){ var L=0; for (var k=1;k<p.length;k++) L+=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]); return L; }
  function strokePath(p){ c.beginPath(); c.moveTo(p[0][0],p[0][1]); for (var k=1;k<p.length;k++) c.lineTo(p[k][0],p[k][1]); c.stroke(); }
  function rrect(x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); }
  // стакан с открытым верхом
  function cupPath(x0,x1,top,bot,r){ c.beginPath(); c.moveTo(x0,top); c.lineTo(x0,bot-r); c.quadraticCurveTo(x0,bot,x0+r,bot); c.lineTo(x1-r,bot); c.quadraticCurveTo(x1,bot,x1,bot-r); c.lineTo(x1,top); }

  function drawDewar(){
    // фон
    var g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#050a14'); g.addColorStop(1,'#02050a');
    c.fillStyle=g; c.fillRect(0,0,W,H);
    // наружная колба: посеребрённое стекло со смотровой щелью
    rrect(DX,DY,DW,DH,DR); var sg=c.createLinearGradient(DX,0,DX+DW,0);
    sg.addColorStop(0,'#5d6a78'); sg.addColorStop(0.03,'#c9d3dd'); sg.addColorStop(0.06,'#7b8896'); sg.addColorStop(0.09,'#dfe7ee'); sg.addColorStop(0.12,'#6c7987');
    sg.addColorStop(0.15,'#0d1a2a'); sg.addColorStop(0.85,'#0d1a2a');
    sg.addColorStop(0.88,'#6c7987'); sg.addColorStop(0.91,'#dfe7ee'); sg.addColorStop(0.94,'#7b8896'); sg.addColorStop(0.97,'#c9d3dd'); sg.addColorStop(1,'#5d6a78');
    c.fillStyle=sg; c.fill();
    c.strokeStyle='rgba(220,235,250,.35)'; c.lineWidth=2; c.stroke();
    // внутренняя полость — тёмное стекло
    rrect(IX,DY+18,IW,DH-30,22); var ig=c.createLinearGradient(IX,0,IX+IW,0);
    ig.addColorStop(0,'rgba(20,40,66,.95)'); ig.addColorStop(0.5,'rgba(8,18,32,.95)'); ig.addColorStop(1,'rgba(20,40,66,.95)');
    c.fillStyle=ig; c.fill(); c.strokeStyle='rgba(160,200,235,.18)'; c.lineWidth=1.5; c.stroke();
    // блики стекла
    c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(IX+14,DY+30,10,DH-70); c.fillRect(IX+IW-30,DY+30,4,DH-70);
  }
  function drawFrost(){
    for (var k=0;k<frost.length;k++){ var f=frost[k]; c.fillStyle='rgba(235,245,255,'+f.a+')'; c.beginPath(); c.arc(f.x,f.y,f.r,0,6.283); c.fill(); }
    var fg=c.createLinearGradient(0,DY,0,DY+50); fg.addColorStop(0,'rgba(230,242,255,.35)'); fg.addColorStop(1,'rgba(230,242,255,0)');
    c.fillStyle=fg; rrect(DX+4,DY+2,DW-8,48,DR-4); c.fill();
  }
  function drawBath(dt){
    var by=bathY(), x0=IX+4, x1=IX+IW-4, bot=IB-6;
    c.save(); rrect(IX+2,DY+18,IW-4,DH-32,20); c.clip();
    var lg=c.createLinearGradient(0,by,0,bot); lg.addColorStop(0,'rgba(150,210,255,.42)'); lg.addColorStop(1,'rgba(60,120,200,.55)');
    c.globalAlpha=1-mix*0.7; c.fillStyle=lg; c.fillRect(x0,by,x1-x0,bot-by+10); c.globalAlpha=1;
    // частицы ванны в режиме «глазами Ландау»
    if (mix>0.01){
      var rs=rhoS(T);
      c.fillStyle='rgba(10,20,40,'+(0.5*mix)+')'; c.fillRect(x0,by,x1-x0,bot-by+10);
      for (var k=0;k<bparts.length;k++){ var p=bparts[k], gold=p.th<rs, px, py;
        if (gold){ p.u+=dt*0.05*p.sp; if (p.u>1) p.u-=1; px=x0+6+p.u*(x1-x0-12); py=by+6+(p.v+0.04*Math.sin(time*1.6+p.ph))*(bot-by-10); }
        else { px=x0+6+p.u*(x1-x0-12)+1.6*Math.sin(time*9+p.ph); py=by+6+p.v*(bot-by-10)+1.6*Math.sin(time*7.3+p.ph*1.7); }
        c.globalAlpha=mix; c.fillStyle=gold?'#ffd36b':'#4aa3ff'; c.beginPath(); c.arc(px,py,3.8,0,6.283); c.fill(); }
      c.globalAlpha=1;
    }
    // поверхность ванны
    var bk=boilK(); c.beginPath();
    for (var x=x0;x<=x1;x+=6){ var yy=by+(bk>0?Math.sin(x*0.09+time*9)*1.6*bk+Math.sin(x*0.23-time*13)*1.1*bk:0); if (x===x0) c.moveTo(x,yy); else c.lineTo(x,yy); }
    c.strokeStyle=T<LAM?'rgba(235,250,255,.95)':'rgba(190,225,255,.7)'; c.lineWidth=T<LAM?2.2:1.6; c.stroke();
    if (T<LAM){ var mg=c.createLinearGradient(0,by,0,by+16); mg.addColorStop(0,'rgba(220,245,255,.28)'); mg.addColorStop(1,'rgba(220,245,255,0)'); c.fillStyle=mg; c.fillRect(x0,by,x1-x0,16); }
    // пузыри ванны
    for (k=bbub.length-1;k>=0;k--){ var b=bbub[k]; b.y-=b.vy*dt; b.x+=Math.sin(time*6+b.ph)*0.3;
      if (b.y<by+2){ bbub.splice(k,1); continue; }
      c.strokeStyle='rgba(220,240,255,.7)'; c.lineWidth=1; c.beginPath(); c.arc(b.x,b.y,b.r,0,6.283); c.stroke(); }
    // круги от капель
    for (k=ripples.length-1;k>=0;k--){ var r=ripples[k]; r.t+=dt; if (r.t>0.9){ ripples.splice(k,1); continue; }
      c.strokeStyle='rgba('+r.col+','+(0.85*(1-r.t/0.9))+')'; c.lineWidth=1.5; c.beginPath(); c.ellipse(r.x,by,4+r.t*40,1.5+r.t*5,0,0,6.283); c.stroke(); }
    c.restore();
  }
  function drawWires(){
    var l=toWorld(-BW/2+4,-BH/2), r=toWorld(BW/2-4,-BH/2), hook={x:PX,y:DY+26};
    c.strokeStyle='rgba(200,215,230,.55)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(hook.x,hook.y); c.lineTo(l.x,l.y); c.moveTo(hook.x,hook.y); c.lineTo(r.x,r.y); c.stroke();
    c.fillStyle='#aab6c3'; c.beginPath(); c.arc(hook.x,hook.y,3,0,6.283); c.fill();
  }
  function drawCup(dt){
    var s=solveS(V), bk=boilK(), rs=rhoS(T);
    c.save(); c.translate(PX,PY); c.rotate(tilt*Math.PI/180);
    // полость
    c.save(); cupPath(-A,A,-BH/2,B,RAD-4); c.closePath(); c.clip();
    c.fillStyle='rgba(16,34,58,.55)'; c.fillRect(-A,-BH/2,2*A,BH);
    if (V>0.002){
      // жидкость
      c.beginPath(); var n=40;
      for (var k=0;k<=n;k++){ var x=-A-2+k*(2*A+4)/n, j=bk>0?(Math.sin(x*0.12+time*11)*2.2+Math.sin(x*0.31-time*17)*1.3)*bk:0; var y=Math.min(ySurf(s,x)+j,B+8); if (k===0) c.moveTo(x,y); else c.lineTo(x,y); }
      c.lineTo(A+2,B+8); c.lineTo(-A-2,B+8); c.closePath();
      var lg=c.createLinearGradient(0,-B,0,B); lg.addColorStop(0,'rgba(170,220,255,.45)'); lg.addColorStop(1,'rgba(70,140,220,.6)');
      c.save(); c.clip();
      c.globalAlpha=1-mix*0.75; c.fillStyle=lg; c.fillRect(-A-4,-BH,2*A+8,2*BH); c.globalAlpha=1;
      if (mix>0.01){ c.fillStyle='rgba(8,16,34,'+(0.55*mix)+')'; c.fillRect(-A-4,-BH,2*A+8,2*BH); }
      // пузыри кипения
      for (k=bubbles.length-1;k>=0;k--){ var b=bubbles[k]; b.y-=b.vy*dt; b.x+=Math.sin(time*7+b.ph)*0.35; b.r+=dt*1.2;
        if (b.y<ySurf(s,b.x)+1){ bubbles.splice(k,1); continue; }
        c.strokeStyle='rgba(230,245,255,'+(0.75*(1-mix*0.6))+')'; c.lineWidth=1.1; c.beginPath(); c.arc(b.x,b.y,b.r,0,6.283); c.stroke();
        c.fillStyle='rgba(255,255,255,.18)'; c.fill(); }
      // «глазами Ландау»: две жидкости
      if (mix>0.01){
        for (k=0;k<parts.length;k++){ var p=parts[k], gold=p.th<rs;
          if (gold){ var dir=p.u>=0?1:-1; p.u+=dir*dt*0.32*p.sp*(0.4+rs); if (Math.abs(p.u)>1){ p.u=(rnd()*0.3)*(rnd()<0.5?-1:1); p.v=0.05+rnd()*0.9; } }
          var px=p.u*(A-5), ys=clamp(ySurf(s,px),-B,B); if (ys>B-4) continue;
          var vv=gold?p.v+0.05*Math.sin(time*1.4+p.ph):p.v, py=ys+4+vv*(B-ys-8);
          if (!gold){ px+=1.8*Math.sin(time*9.1+p.ph); py+=1.8*Math.sin(time*7.7+p.ph*1.9); }
          if (gold && rs>0){ c.globalAlpha=mix*0.35; c.strokeStyle='#ffd36b'; c.lineWidth=2; c.beginPath(); c.moveTo(px,py); c.lineTo(px-(p.u>=0?1:-1)*8,py); c.stroke(); }
          c.globalAlpha=mix; c.fillStyle=gold?'#ffd36b':'#4aa3ff'; c.beginPath(); c.arc(px,py,gold?4.2:4.8,0,6.283); c.fill();
        }
        c.globalAlpha=1;
      }
      c.restore();
      // поверхность: дрожит при кипении, зеркальная ниже 2,17 К
      c.beginPath();
      for (k=0;k<=n;k++){ x=-A+k*(2*A)/n; j=bk>0?(Math.sin(x*0.12+time*11)*2.2+Math.sin(x*0.31-time*17)*1.3)*bk:0; y=ySurf(s,x)+j; if (y>B) y=B; if (k===0) c.moveTo(x,y); else c.lineTo(x,y); }
      if (T<LAM){ c.save(); c.shadowColor='#e6f7ff'; c.shadowBlur=12; c.strokeStyle='rgba(245,252,255,.98)'; c.lineWidth=2.6; c.stroke(); c.restore(); }
      else { c.strokeStyle='rgba(200,232,255,.85)'; c.lineWidth=1.6; c.stroke(); }
    }
    c.restore();
    // стекло стакана
    cupPath(-BW/2,BW/2,-BH/2,BH/2,RAD); c.strokeStyle='rgba(215,232,248,.75)'; c.lineWidth=2; c.stroke();
    cupPath(-A,A,-BH/2,B,RAD-4); c.strokeStyle='rgba(215,232,248,.35)'; c.lineWidth=1.2; c.stroke();
    c.fillStyle='rgba(215,232,248,.8)'; c.fillRect(-BW/2,-BH/2-1.5,WALL,3); c.fillRect(A,-BH/2-1.5,WALL,3);
    c.fillStyle='rgba(255,255,255,.10)'; c.fillRect(-A+8,-BH/2+10,5,BH-34);
    // плёнка
    if (filmA>0.01 && film>0){
      var col=mixCol(CYAN,GOLD,mix);
      [-1,1].forEach(function(sg){
        var p=filmPath(sg,s), L=pathLen(p), len=film*L;
        c.save(); c.setLineDash([len,L+100]); c.lineCap='round'; c.lineJoin='round';
        c.globalAlpha=filmA; c.shadowColor=col; c.shadowBlur=10; c.strokeStyle=col; c.lineWidth=2.6; strokePath(p);
        c.shadowBlur=0; c.globalAlpha=filmA*0.9; c.strokeStyle='#ffffff'; c.lineWidth=1.3;
        // бегущие блики — течение по плёнке, только на пройденной части пути
        if (!reduce){ c.setLineDash([5,13]); c.lineDashOffset=-time*46; strokePath(film<1?cutPath(p,len):p); }
        c.restore();
      });
    }
    c.restore();
  }
  function cutPath(p,len){ var out=[p[0]], acc=0; for (var k=1;k<p.length;k++){ var d=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]);
      if (acc+d>=len){ var t=(len-acc)/d; out.push([lerp(p[k-1][0],p[k][0],t),lerp(p[k-1][1],p[k][1],t)]); return out; } acc+=d; out.push(p[k]); } return out; }
  function drawDrops(dt){
    var col=mixCol(CYAN,GOLD,mix), by=bathY();
    for (var k=drops.length-1;k>=0;k--){ var d=drops[k];
      if (dt>0){ d.vy+=1100*dt; d.y+=d.vy*dt; }
      if (d.y>=by){ ripples.push({x:d.x,t:0,col:mix>0.5?'255,211,107':'220,240,255'}); drops.splice(k,1); continue; }
      c.save(); c.shadowColor=col; c.shadowBlur=8; c.fillStyle=col; c.beginPath();
      var st=Math.min(9,2+d.vy*0.012); c.ellipse(d.x,d.y,2.6,2.6+st*0.4,0,0,6.283); c.fill(); c.restore(); }
  }
  function drawThermo(){
    var yOf=function(t){ return TB-(t-1.2)/(4.4-1.2)*(TB-TT); };
    rrect(TX-11,TT-14,22,TB-TT+30,11); c.fillStyle='rgba(200,220,240,.08)'; c.fill(); c.strokeStyle='rgba(200,220,240,.55)'; c.lineWidth=1.6; c.stroke();
    c.beginPath(); c.arc(TX,TB+30,17,0,6.283); c.fillStyle='rgba(200,220,240,.08)'; c.fill(); c.stroke();
    var col=T<LAM?'#9fe6ff':'#7cc8ff', yt=yOf(T);
    c.save(); c.shadowColor=col; c.shadowBlur=8; c.fillStyle=col; c.fillRect(TX-4.5,yt,9,TB+20-yt); c.beginPath(); c.arc(TX,TB+30,12,0,6.283); c.fill(); c.restore();
    for (var t=1.5;t<=4.25;t+=0.5){ var yy=yOf(t); c.strokeStyle='rgba(200,220,240,.45)'; c.lineWidth=1; c.beginPath(); c.moveTo(TX+11,yy); c.lineTo(TX+17,yy); c.stroke(); }
    // золотая риска лямбда-точки
    var yl=yOf(LAM), pulse=T<LAM?1:0.55+0.25*Math.sin(time*3);
    c.save(); c.shadowColor='#ffd36b'; c.shadowBlur=10+flash*24; c.strokeStyle='rgba(255,211,107,'+pulse+')'; c.lineWidth=3; c.beginPath(); c.moveTo(TX-22,yl); c.lineTo(TX+24,yl); c.stroke(); c.restore();
    c.fillStyle='#ffd36b'; c.beginPath(); c.moveTo(TX-24,yl); c.lineTo(TX-32,yl-6); c.lineTo(TX-32,yl+6); c.closePath(); c.fill();
  }
  function drawFx(){
    if (wave>0 && wave<1){ var sp=toWorld(0,solveS(V)); var R=20+wave*420;
      c.save(); c.strokeStyle='rgba(255,236,170,'+(0.9*(1-wave))+')'; c.lineWidth=6*(1-wave)+1; c.shadowColor='#ffd36b'; c.shadowBlur=20;
      c.beginPath(); c.arc(sp.x,sp.y,R,0,6.283); c.stroke(); c.restore(); }
    if (flash>0){ c.fillStyle='rgba(235,248,255,'+(flash*0.55)+')'; c.fillRect(0,0,W,H); }
  }
  function draw(dt){
    drawDewar(); drawBath(dt); drawFrost(); drawWires(); drawCup(dt); drawDrops(dt); drawThermo(); drawFx();
  }

  // показания
  var shown={};
  function setTxt(id,t){ if (shown[id]!==t){ shown[id]=t; $(id).textContent=t; } }
  function fmtT(t){ return t.toFixed(2).replace('.',',')+' К'; }
  function readouts(){
    setTxt('rdT',fmtT(T)); setTxt('rdS',T<LAM?'сверхтекучий':'кипит');
    $('rdSbox').className=T<LAM?'super':'';
    setTxt('rdL',Math.round((1-V/V0)*100)+'%'); setTxt('rdF',Math.round(rhoS(T)*100)+'%');
  }
  // строка пояснения (бывшая he-msg)
  var subEl=root.querySelector('.ld-sub'), taskEl=root.querySelector('.ld-task-t'), subTxt=subEl.textContent, hintTimer=0;
  function msg(t,cls){ clearTimeout(hintTimer); subTxt=t; subEl.className='ld-sub igra-poyasnenie'+(cls?' '+cls:''); subEl.textContent=t; }
  function task(t){ taskEl.textContent=t; }
  var MSG_LAM='2,17 К! Кипение оборвалось — и гелий сам полез вверх по стенке и через край. Так это увидел Капица.';
  var MSG_LANDAU='Ландау, 1941: в гелии две жидкости сразу. Синяя — обычная, вязкая. Золотая — сверхтекучая, течёт без трения: она и уходит по стенке.';
  function onBelow(){ // переход через 2,17 К вниз
    bubbles.length=0; bbub.length=0;
    if (!reduce){ flash=1; wave=0.001; }
    if (!crossed){ crossed=true; }
    msg(MSG_LAM,'ok');
    if (reduce){ film=1; filmA=1; }
  }
  function onAbove(){ film=0; filmA=0; }

  var prevBelow=false;
  function step(dt){
    time+=dt;
    if (reduce) T=Tt; else { var d=Tt-T; T=Math.abs(d)<0.004?Tt:T+d*Math.min(1,dt*3.2); }
    if (reduce) tilt=tiltT; else { var dtl=tiltT-tilt; tilt=Math.abs(dtl)<0.05?tiltT:tilt+dtl*Math.min(1,dt*7); }
    var below=T<LAM;
    if (below && !prevBelow) onBelow(); else if (!below && prevBelow) onAbove();
    prevBelow=below;
    // кипение
    var bk=boilK();
    if (!reduce && bk>0){
      if (V>0.01 && rnd()<dt*34*bk) bubbles.push({x:(rnd()*2-1)*(A-8), y:B-3, vy:40+rnd()*60, r:1+rnd()*2.2, ph:rnd()*6});
      if (rnd()<dt*40*bk) bbub.push({x:IX+12+rnd()*(IW-24), y:IB-10, vy:30+rnd()*50, r:1+rnd()*2.4, ph:rnd()*6});
    }
    // плёнка и утечка
    var rs=rhoS(T);
    if (below && V>0.002){
      filmA=Math.min(1,filmA+dt*2.5);
      if (!reduce) film=Math.min(1,film+dt*(0.28+0.4*rs));
      if (film>=1 && !reduce){
        V=Math.max(0,V-dt*KFLOW*rs);
        if (rnd()<dt*(1.5+7*rs)){ var dl=dripLocalX(), w=toWorld(dl,BH/2+3); drops.push({x:w.x, y:w.y, vy:20}); }
      }
    } else if (below && V<=0.002){ filmA=Math.max(0,filmA-dt*0.8); }
    if (!below){ film=0; filmA=0; }
    // «глазами Ландау»
    var mt=landau?1:0; if (reduce) mix=mt; else mix+= (mt-mix)*Math.min(1,dt*3);
    if (Math.abs(mt-mix)<0.002) mix=mt;
    if (flash>0) flash=Math.max(0,flash-dt*1.8);
    if (wave>0){ wave+=dt*0.8; if (wave>=1) wave=0; }
    readouts();
  }
  function frame(ts){
    if (!running) return;
    var dt=last?Math.min(0.05,(ts-last)/1000):0.016; last=ts;
    step(dt); draw(dt);
    if (reduce || !visible){ running=false; last=0; return; }
    requestAnimationFrame(frame);
  }
  function kick(){ if (!running){ running=true; last=0; requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ visible=es[0].isIntersecting; if (visible) kick(); }).observe(cv);
  }
  // статичные капли для режима без движения
  function staticDrops(){ drops.length=0; if (!(reduce && T<LAM && V>0.002)) return;
    var w=toWorld(dripLocalX(),BH/2+3), by=bathY(); for (var k=0;k<3;k++) drops.push({x:w.x, y:w.y+12+k*(by-w.y-20)/3, vy:0}); }
  function render(){ if (reduce){ step(0); if (T<LAM && V>0.002 && V>=V0-1e-6) V=V0*0.5; staticDrops(); draw(0); readouts(); } else kick(); }

  /* ── УПРАВЛЕНИЕ: только одиночные нажатия (Р206). Ползунки температуры и наклона и наклон пальцем по картинке
     заменены цепочкой: «Наклонить» → «Охладить» ×4 (4,2 → 3,6 → 3,0 → 2,5 → 2,0 К; на последнем — переход через 2,17 К)
     → «Выпрямить» (гелий уходит и из ровного стакана) → «Глазами Ландау» → финал. */
  var bTilt=root.querySelector('.ld-tilt'), bTiltT=root.querySelector('.ld-tilt-t'),
      bCool=root.querySelector('.ld-cool'), bLandau=root.querySelector('.ld-landau'),
      steps=[].slice.call(root.querySelectorAll('.ld-steps li')), fin=root.querySelector('.ld-finale');
  var HOLOD=[3.6,3.0,2.5,2.0], nCool=0, faza='tilt', cel=null, wait=reduce?0.3:1;
  function shag(n){ steps.forEach(function(li,i){ li.classList.toggle('on',i===n-1); li.classList.toggle('done',i<n-1); }); }
  function aktiv(el){
    cel=el; ruka.na(el);
    var r=el.getBoundingClientRect();
    if (r.top<8 || r.bottom>window.innerHeight-8) el.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});
  }
  function zhdat(){ cel=null; ruka.ubrat(); }
  // нажатие мимо мигающей кнопки — игру не ломает, только подсказка
  root.addEventListener('click',function(e){
    if (faza==='final') return;
    var k=e.target.closest('.ld-btn, canvas');
    if (!k || (cel && cel.contains(e.target))) return;
    var vernut=subTxt;
    subEl.textContent=cel?'Жми мигающую кнопку — над ней рука.':'Подожди — смотри на стакан.';
    clearTimeout(hintTimer); hintTimer=setTimeout(function(){ subEl.textContent=vernut; },1800);
  }, true); // фаза захвата: проверка идёт до обработчика кнопки, пока cel ещё прежний
  // с клавиатуры: Пробел/Enter на картинке — нажать мигающую кнопку
  cv.addEventListener('keydown',function(e){ if ((e.key===' '||e.key==='Enter') && cel){ e.preventDefault(); cel.click(); } });

  bTilt.addEventListener('click',function(){
    if (cel!==bTilt) return;
    if (faza==='tilt'){
      zhdat(); tiltT=20; render();
      msg('Стакан наклонён, а гелий лежит ровно и не выливается: выше 2,17 К это обычная жидкость. Охлаждай.');
      task('Смотри на стакан');
      setTimeout(function(){ faza='cool'; shag(2); task('Нажми «Охладить»'); aktiv(bCool); }, 900*wait+300);
    } else if (faza==='straight'){
      zhdat(); tiltT=0; render(); shag(4);
      msg('Стакан стоит ровно — а гелий всё равно ползёт вверх по стенке, через край и каплями в ванну. Почему?','ok');
      task('Смотри на стакан');
      setTimeout(function(){ faza='landau'; task('Нажми «Глазами Ландау»'); aktiv(bLandau); }, 2600*wait+300);
    }
  });
  bCool.addEventListener('click',function(){
    if (cel!==bCool || faza!=='cool') return;
    Tt=HOLOD[nCool++]; render();
    if (Tt>LAM){
      msg(fmtT(Tt)+'. Гелий всё ещё кипит. Холоднее!');
      task(nCool===HOLOD.length-1?'Нажми «Охладить» ещё раз — последний':'Нажми «Охладить» ещё раз');
      ruka.na(bCool);
    } else {
      zhdat(); task('Смотри на стенку стакана');
      msg(fmtT(Tt)+'. Сейчас столбик пройдёт золотую риску 2,17 К…');
      if (reduce) step(0);
      setTimeout(function(){
        faza='straight'; shag(3); bTiltT.textContent='Выпрямить';
        task('Нажми «Выпрямить»');
        msg('Гелий сам уходит через край. А если поставить стакан ровно?','ok');
        aktiv(bTilt);
      }, 4200*wait+300);
    }
  });
  bLandau.addEventListener('click',function(){
    if (cel!==bLandau || faza!=='landau') return;
    zhdat(); faza='final'; landau=true; landauDone=true;
    bLandau.setAttribute('aria-pressed','true');
    root.querySelector('.ld-legend').hidden=false;
    msg(MSG_LANDAU,'two'); task('Смотри: две жидкости');
    render();
    setTimeout(finale, 3200*wait+300);
  });
  function finale(){
    finalShown=true; shag(5); task('Готово — читай ниже');
    fin.hidden=false;
    fin.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }
  root.querySelector('.ld-again').addEventListener('click',function(){ location.reload(); });

  render(); if (reduce) draw(0);
  aktiv(bTilt);
})();
