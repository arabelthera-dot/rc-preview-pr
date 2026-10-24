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

/* Игра «Уйди от „Анчара“» (24 января). Движок — аркада M-13 со страницы 30 января (Котельников):
   цикл кадров с ограниченным dt, защита координат от NaN. Р201/Р206: сцена видна сразу, правила — под ней;
   каждый шаг — одно нажатие на одну мигающую кнопку с рукой; после нажатия проигрывается его итог,
   потом сцена ждёт следующего нажатия («Анчар» держит расстояние и не догоняет сам). */
(function(){
  const root=document.querySelector('[data-anchar-igra]');if(!root)return;
  const cv=root.querySelector('canvas'),ctx=cv.getContext('2d');
  const $=s=>root.querySelector(s);
  const elTask=$('.an-task'),elSub=$('.an-sub'),elGap=$('.an-gap-num'),elTrend=$('.an-gap-trend');
  const elCv=$('.an-spd-cv'),elSv=$('.an-spd-sv'),elSu=$('.an-spd-su'),elMax=$('.an-max');
  const tg=$('.an-telegraf'),tgTrack=$('.an-tg-track'),tgKnob=$('.an-tg-knob'),tgFill=$('.an-tg-fill');
  const bPoln=$('.an-poln'),bUpor=$('.an-upor'),bKurs=$('.an-kurs'),bL=$('.an-left'),bR=$('.an-right');
  const fin=$('.an-finale'),again=$('.an-again'),elBest=$('.an-best');
  const knopki=[bPoln,bUpor,bKurs,bL,bR];

  /* Р206: на шаге одна активная пульсирующая кнопка + рука «тап-тап»; остальные приглушены (общий компонент igraRuka) */
  const ruka=igraRuka(root);let tekAktiv=null;
  function aktiv(btn){
    tekAktiv=btn||null;
    knopki.forEach(b=>b.setAttribute('aria-disabled',b===btn?'false':'true'));
    if(btn)ruka.na(btn);else ruka.ubrat();
  }
  function otklik() { try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) { /* нет вибро */ } }

  const K=6;                         // ускорение времени: игровая секунда = 6 настоящих
  const MS=kmh=>kmh/3.6*K;           // км/ч → игровые м/с
  const V_MIN=28,V_MAX=56,V_SUB=83;  // средний ход, «Саратога» на 30 узлах, «Анчар» на 44,7 узла
  const SIDE=130;                    // лодка держится сбоку, м
  const PASS_END=380;                // насколько лодка уходит вперёд к финалу, м

  // шаги: одна кнопка — одно нажатие; t — задание (3–5 слов), s — пояснение
  const SHAGI=[
    {b:bPoln,t:'Нажми «Полный ход»',s:'Ты — капитан американского авианосца. «Анчар» в 250 м позади. Уйди от него!'},
    {b:bUpor,t:'Нажми «До упора»',s:'«Анчар» отстаёт! Дай ещё ход — до упора.'},
    {b:bKurs,t:'Нажми «Прямо»',s:'Отрываешься! 56 км/ч — быстрее авианосец не может. Иди прямо.'},
    {b:bL,t:'Нажми руль влево ◀',s:'«Анчар» рядом с тобой! Резкий поворот его стряхнёт.'},
    {b:bR,t:'Нажми руль вправо ▶',s:'Он снова рядом! Сверни ещё раз.'},
    {b:bL,t:'Снова нажми руль влево ◀',s:'Опять рядом. Сверни ещё раз — уйдёшь?'}
  ];

  let W=0,H=0,S=1,dpr=1,shook=0;
  let passA=0,shakes=0,best=0,c,sub,thr,steerDir,steerT,lost,ph,phT,phD,shag,ryadom,off,trail,subTrail,gapPrev,trendSm,raf,last;

  function reset(){
    c={x:0,y:0,h:0,v:MS(V_MIN)};
    sub={x:0,y:250,h:0,v:MS(V_MIN)};
    off={x:0,y:250};
    steerDir=0;steerT=0;lost=0;ph='zhdi';phT=0;phD=0;shag=0;ryadom=false;
    trail=[];subTrail=[];gapPrev=null;trendSm=0;best=0;shakes=0;shook=0;fin.hidden=true;setThr(0);
    elSv.textContent='тайна';elSu.hidden=true;elTrend.textContent='';elTrend.className='an-gap-trend';
    zhdat();
  }
  // t — что сделать (после «Что сделать сейчас:»), s — пояснение: что произошло и почему
  function say(t,s){if(elTask.lastChild.textContent!==' '+t)elTask.innerHTML='<b>Что сделать сейчас:</b> '+t.replace(/[<&]/g,'');if(elSub.textContent!==s)elSub.textContent=s;}
  // сцена ждёт нажатия: лодка держит расстояние, на кнопке шага — рука
  function zhdat(){
    ph='zhdi';off={x:sub.x-c.x,y:sub.y-c.y};
    const k=SHAGI[shag];aktiv(k.b);say(k.t,k.s);
  }

  // --- холст под размер и плотность экрана ---
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth;H=cv.clientHeight;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    S=Math.min(W,H)/1100;            // пикселей на метр: в кадре ~1,1 км океана
  }

  // --- геометрия ---
  const fwd=h=>({x:Math.sin(h),y:-Math.cos(h)});
  const left=h=>({x:-Math.cos(h),y:-Math.sin(h)});
  const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  function turnTo(o,tx,ty,rate,dt){const d=wrap(Math.atan2(tx-o.x,-(ty-o.y))-o.h);o.h+=Math.max(-rate*dt,Math.min(rate*dt,d));}
  function along(){const f=fwd(c.h);return (sub.x-c.x)*f.x+(sub.y-c.y)*f.y;}
  function sideTarget(ahead){const f=fwd(c.h),l=left(c.h);return {x:c.x+l.x*SIDE+f.x*ahead,y:c.y+l.y*SIDE+f.y*ahead};}

  // --- шаг мира ---
  function chaseMove(dt){            // «Анчар» на 83 км/ч срезает углы и встаёт рядом
    const t=sideTarget(0),d=Math.hypot(t.x-sub.x,t.y-sub.y);
    const want=d>160?MS(V_SUB):c.v+(MS(V_SUB)-c.v)*d/160;
    sub.v+=(want-sub.v)*Math.min(1,dt*1.5);turnTo(sub,t.x,t.y,1.6,dt);
    const g=fwd(sub.h);sub.x+=g.x*sub.v*dt;sub.y+=g.y*sub.v*dt;
    return d;
  }
  function holdMove(dt){             // держится рядом, повторяет каждый поворот
    const t=sideTarget(0);sub.x+=(t.x-sub.x)*Math.min(1,dt*3);sub.y+=(t.y-sub.y)*Math.min(1,dt*3);
    sub.h+=wrap(c.h-sub.h)*Math.min(1,dt*4);sub.v=c.v;
  }
  function step(dt){
    if(steerT>0)steerT-=dt;
    const steer=steerT>0?steerDir:0;
    const kmh=V_MIN+(V_MAX-V_MIN)*thr;
    c.v+=(MS(kmh)-c.v)*Math.min(1,dt/1.6);
    c.h=wrap(c.h+steer*0.5*dt);
    const f=fwd(c.h);c.x+=f.x*c.v*dt;c.y+=f.y*c.v*dt;
    if(!isFinite(c.x)||!isFinite(c.y)){c.x=0;c.y=0;}
    if(ph==='zhdi'){                 // ждём нажатия: расстояние не меняется
      sub.x=c.x+off.x;sub.y=c.y+off.y;sub.h+=wrap(c.h-sub.h)*Math.min(1,dt*3);sub.v=c.v;
    }else{
      phT+=dt;
      if(ph==='razgon'){             // лодка будто отстаёт — посетитель видит «дальше»
        sub.v+=(MS(30)-sub.v)*Math.min(1,dt);turnTo(sub,c.x,c.y,1.2,dt);
        const g=fwd(sub.h);sub.x+=g.x*sub.v*dt;sub.y+=g.y*sub.v*dt;
        if(phT>phD)zhdat();
      }else if(ph==='dogon'){        // проснулась: 83 км/ч, догоняет до борта
        if(lost>0){lost-=dt;const g=fwd(sub.h);sub.x+=g.x*sub.v*dt;sub.y+=g.y*sub.v*dt;
          if(lost<=0)say('Смотри на строку «Анчар»','«Анчар» снова прибавил ход и догоняет!');}
        else if(ryadom)holdMove(dt);
        else if(chaseMove(dt)<45||phT>16)ryadom=true;
        if(ryadom&&steerT<=0)zhdat();
      }else if(ph==='povtor'){       // третий поворот: «Анчар» повторяет его и не отстаёт
        holdMove(dt);
        if(phT>2.2){ph='pass';phT=0;passA=0;ryadom=false;
          say('Смотри: «Анчар» обгоняет','«Анчар» обгоняет тебя под водой! Ты на 56 км/ч — быстрее авианосец не может.');}
      }else if(ph==='pass'){         // выходит вперёд на 83 км/ч
        sub.v+=(MS(V_SUB)-sub.v)*Math.min(1,dt*2);passA+=(sub.v-c.v)*dt;   // уходит вперёд ровно на разницу скоростей
        const t=sideTarget(passA);sub.x+=(t.x-sub.x)*Math.min(1,dt*4);sub.y+=(t.y-sub.y)*Math.min(1,dt*4);sub.h+=wrap(c.h-sub.h)*Math.min(1,dt*3);
        if(along()>=PASS_END||phT>12)finish();
      }
      if(!isFinite(sub.x)||!isFinite(sub.y)){sub.x=c.x;sub.y=c.y+250;}
    }
    {const f2=fwd(c.h),Lm=Math.max(320,92/S);trail.push({x:c.x-f2.x*Lm*0.45,y:c.y-f2.y*Lm*0.45,a:0});}subTrail.push({x:sub.x,y:sub.y,a:0,v:sub.v});
    trail.forEach(p=>p.a+=dt);subTrail.forEach(p=>p.a+=dt);
    while(trail.length&&trail[0].a>3.2)trail.shift();while(subTrail.length&&subTrail[0].a>1.6)subTrail.shift();
    if(shook>0)shook-=dt;
    hud(dt);
  }

  // --- счёт (вне картинки) ---
  function hud(dt){
    const g=along(),kc=Math.round(c.v/K*3.6),ks=Math.round(sub.v/K*3.6);
    if(ph!=='pass'&&ph!=='end'&&-g>best)best=-g;
    elCv.textContent=kc;
    elMax.hidden=!(thr>0.98&&kc>=55);
    if(ph==='pass'||ph==='end'){elSv.textContent=ks;elSu.hidden=false;}
    const r=Math.round(Math.abs(g)/10)*10;
    const txt=ryadom||(shag>=3&&Math.abs(g)<60)?'рядом с тобой':(g<0?'позади · ':'впереди · ')+r+' м';
    if(elGap.textContent!==txt)elGap.textContent=txt;
    if(gapPrev!==null&&dt>0){const rate=(Math.abs(g)-Math.abs(gapPrev))/dt*(g<0?1:-1);trendSm+=(rate-trendSm)*Math.min(1,dt*3);}
    gapPrev=g;
    let tr='',cl='';
    if(ryadom){tr='не отстаёт';cl='near';}
    else if(g>=60){tr='обгоняет ▲';cl='near';}
    else if(trendSm>4){tr='дальше ▲ отрываешься';cl='far';}
    else if(trendSm<-4){tr='ближе ▼ догоняет';cl='near';}
    if(elTrend.textContent!==tr){elTrend.textContent=tr;elTrend.className='an-gap-trend '+cl;}
  }

  // --- нажатие: мгновенный отклик, потом итог шага ---
  function nazhal(b){
    if(ph!=='zhdi'||SHAGI[shag].b!==b){if(tekAktiv)elSub.textContent='Жми мигающую кнопку';return;}
    otklik();aktiv(null);
    const n=shag;shag++;phT=0;
    if(n===0){setThr(0.5);ph='razgon';phD=3;say('Смотри: «Анчар» отстаёт','Ход растёт — «Анчар» отстаёт. Чем быстрее, тем больше отрыв.');}
    else if(n===1){setThr(1);ph='razgon';phD=3.5;say('Смотри: «Анчар» отстаёт','До упора — 56 км/ч, быстрее авианосец не может.');}
    else if(n===2){ph='dogon';lost=0;ryadom=false;say('Смотри на строку «Анчар»','«Анчар» прибавил ход и догоняет!');}
    else if(n===3||n===4){                // резкий поворот — лодка теряет тебя, ненадолго
      steerDir=n===3?-1:1;steerT=1.4;shakes++;ryadom=false;ph='dogon';lost=1.8;shook=1.8;
      sub.v=MS(35);sub.h=wrap(sub.h+(steerDir>0?-0.6:0.6));
      say('Смотри: «Анчар» потерял тебя','Стряхнул! ('+shakes+' из 2) Резкий поворот — «Анчар» потерял тебя… ненадолго.');}
    else{steerDir=-1;steerT=1.4;ph='povtor';say('Смотри на «Анчар»','«Анчар» повторяет каждый твой поворот — больше не стряхнуть.');}
  }
  function finish(){
    ph='end';aktiv(null);ryadom=false;
    elBest.textContent='Твой самый большой отрыв — '+Math.round(best/10)*10+' м'+(shakes?', стряхнул «Анчар» '+shakes+' раз'+(shakes>1?'а':''):'')+'.';
    say('Прокрути вниз и прочитай','Уйти не удалось — как и «Саратоге» в 1971-м: «Анчар» под водой быстрее.');
    elTrend.textContent='';
    fin.hidden=false;
    setTimeout(()=>fin.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}),600);
  }

  // --- рисование: вид сверху, камера на авианосце ---
  function hash(i,j){const n=Math.sin(i*127.1+j*311.7)*43758.5453;return n-Math.floor(n);}
  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cx=W/2,cy=H*0.55;
    const sx=x=>cx+(x-c.x)*S,sy=y=>cy+(y-c.y)*S;
    // океан
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0e4a72');g.addColorStop(1,'#0a3354');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // барашки, привязанные к миру, — по ним видна скорость
    const cell=110,x0=Math.floor((c.x-cx/S)/cell)-1,x1=Math.floor((c.x+cx/S)/cell)+1,y0=Math.floor((c.y-cy/S)/cell)-1,y1=Math.floor((c.y+(H-cy)/S)/cell)+1;
    ctx.strokeStyle='rgba(190,225,245,.22)';ctx.lineWidth=1.4;ctx.lineCap='round';
    for(let i=x0;i<=x1;i++)for(let j=y0;j<=y1;j++){const r=hash(i,j);if(r<0.35)continue;
      const wx=(i+hash(j,i))*cell,wy=(j+r)*cell,px=sx(wx),py=sy(wy),l=6+r*10;
      ctx.beginPath();ctx.moveTo(px-l,py);ctx.quadraticCurveTo(px,py-3,px+l,py);ctx.stroke();}
    // бурун лодки: светлая рябь над тенью, когда она идёт быстро
    subTrail.forEach(p=>{const a=1-p.a/1.6,sp=p.v/MS(V_SUB);if(sp<0.5)return;
      ctx.fillStyle='rgba(200,235,255,'+(0.10*a*sp)+')';ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),(3+p.a*9)*Math.max(.6,S*2.4),0,7);ctx.fill();});
    // тень лодки под водой
    drawSub(sx(sub.x),sy(sub.y),sub.h);

    // кильватерный след авианосца
    if(trail.length>1){ctx.lineCap='round';
      for(let k=1;k<trail.length;k++){const p=trail[k],q=trail[k-1],a=1-p.a/3.2;
        ctx.strokeStyle='rgba(235,248,255,'+(0.35*a)+')';ctx.lineWidth=Math.max(2,(14+p.a*30)*S);
        ctx.beginPath();ctx.moveTo(sx(q.x),sy(q.y));ctx.lineTo(sx(p.x),sy(p.y));ctx.stroke();}}
    drawCarrier(cx,cy,c.h);
    {const qx=sx(sub.x),qy=sy(sub.y);let dx=qx-cx,dy=qy-cy;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      ctx.save();ctx.font='800 15px Inter,system-ui,sans-serif';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=5;
      const ax=-dx,ay=-dy,cw=Math.max(320*S,92)*0.5;               // «ТЫ» — с другой стороны от лодки
      ctx.textAlign=ax>=0?'left':'right';ctx.fillStyle='#fff';ctx.fillText('ТЫ',cx+ax*36+(ax>=0?6:-6),cy+ay*Math.min(cw,60));
      ctx.textAlign=dx>=0?'left':'right';ctx.fillStyle='#ffb38a';ctx.fillText('«Анчар»',qx+dx*18+(dx>=0?10:-10),qy+dy*26);
      ctx.restore();}
    // лодка за краем кадра — стрелка у края
    const px=sx(sub.x),py=sy(sub.y);
    if(px<-10||px>W+10||py<-10||py>H+10){const a=Math.atan2(py-cy,px-cx),ex=Math.max(18,Math.min(W-18,px)),ey=Math.max(18,Math.min(H-18,py));
      ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle='rgba(255,160,120,.9)';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-9);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.restore();}
  }
  function drawCarrier(x,y,h){
    const L=Math.max(320*S,92),B=L*0.16;
    ctx.save();ctx.translate(x,y);ctx.rotate(h);
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(4,6,B*0.62,L*0.52,0,0,7);ctx.fill();
    // корпус и палуба
    ctx.fillStyle='#8f99a3';ctx.beginPath();
    ctx.moveTo(0,-L/2);ctx.lineTo(B*0.42,-L*0.36);ctx.lineTo(B*0.5,L*0.46);ctx.lineTo(B*0.3,L/2);ctx.lineTo(-B*0.38,L/2);ctx.lineTo(-B*0.5,L*0.2);
    ctx.lineTo(-B*0.86,-L*0.05);ctx.lineTo(-B*0.62,-L*0.2);ctx.lineTo(-B*0.42,-L*0.36);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6f7a85';ctx.save();ctx.translate(-B*0.12,L*0.12);ctx.rotate(-0.16);ctx.fillRect(-B*0.22,-L*0.36,B*0.44,L*0.62);ctx.restore(); // угловая палуба
    ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=Math.max(1,L/160);ctx.setLineDash([L/30,L/40]);
    ctx.beginPath();ctx.moveTo(0,-L*0.46);ctx.lineTo(0,L*0.44);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#3d4752';ctx.fillRect(B*0.22,-L*0.02,B*0.22,L*0.14);                         // надстройка-«остров»
    ctx.fillStyle='#c9d3dc';[-0.3,-0.12,0.28].forEach(k=>{ctx.fillRect(-B*0.15,L*k,B*0.3,L*0.03);}); // самолёты на палубе — светлые чёрточки
    ctx.restore();
  }
  function drawSub(x,y,h){
    const L=Math.max(107*S*2,56),B=L*0.13,t=performance.now()/1000;
    ctx.save();ctx.translate(x,y);ctx.rotate(h);
    ctx.globalAlpha=0.78+0.08*Math.sin(t*2.2);
    ctx.shadowColor='rgba(0,8,20,.9)';ctx.shadowBlur=10;
    ctx.fillStyle='#04121f';
    ctx.beginPath();ctx.ellipse(0,0,B/2,L/2,0,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,-L*0.12,B*0.32,L*0.11,0,0,7);ctx.fill();                     // рубка
    ctx.beginPath();ctx.moveTo(-B*0.9,L*0.44);ctx.lineTo(B*0.9,L*0.44);ctx.lineTo(0,L*0.36);ctx.closePath();ctx.fill(); // кормовые рули
    ctx.restore();
  }

  function loop(ts){
    if(!last)last=ts;const dt=Math.min((ts-last)/1000,0.05);last=ts;
    if(ph!=='end')step(dt);
    draw();
    raf=requestAnimationFrame(loop);
  }

  // --- указатель хода (только показывает, не тянется) ---
  function setThr(v){
    thr=Math.max(0,Math.min(1,v));
    const travel=tgTrack.clientHeight-tgKnob.offsetHeight-4;
    tgKnob.style.bottom=(2+thr*travel)+'px';tgFill.style.height=(thr*100)+'%';
    tg.setAttribute('aria-valuenow',Math.round(thr*100));
    tg.setAttribute('aria-valuetext',thr>0.98?'До упора':thr>0.3?'Полный ход':'Средний ход');
  }

  knopki.forEach(b=>b.addEventListener('click',()=>nazhal(b)));
  cv.addEventListener('click',()=>{if(tekAktiv)tekAktiv.click();});  // нажатие на картинку = мигающая кнопка
  again.addEventListener('click',()=>{otklik();reset();root.scrollIntoView({behavior:'smooth',block:'start'});});
  window.addEventListener('resize',()=>{resize();setThr(thr);});
  resize();reset();raf=requestAnimationFrame(loop);
  window.__anchar={get ph(){return ph;},get shag(){return shag;},get gap(){return along();}}; // для браузерной проверки
})();
