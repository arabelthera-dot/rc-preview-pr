(function(){
  'use strict';
  const base='media/dubrovicy/';
  const states={
    built:{img:'siluet-kak-postroeno.webp',alt:'Силуэт храма Знамения в Дубровицах: золочёная корона и крест над столпом',
      caption:'Силуэт по фотографии храма. Источник: Викисклад; автор Goussew, CC BY-SA 4.0; кадрирование и порог — производная работа музея.',
      status:'Показан силуэт храма с короной и крестом.'},
    removed:{img:'siluet-uslovno-bez-zaversheniya.webp',alt:'Тот же силуэт, но завершение условно снято по основанию короны; пунктиром показана обычная луковичная глава',
      caption:'Условная образовательная схема: завершение снято по основанию короны, пунктиром намечена обычная луковичная глава. Не реконструкция и не проект.',
      status:'Завершение снято условно: видно, что осталось бы от силуэта без короны.'}
  };
  const img=document.querySelector('#silhouette-image');const cap=document.querySelector('#silhouette-caption');
  const status=document.querySelector('#silhouette-status');const result=document.querySelector('#silhouette-result');
  const finish=document.querySelector('#silhouette-finish');const buttons=[...document.querySelectorAll('[data-silhouette]')];
  let answered=false;let looked=new Set();
  function show(key){const s=states[key];if(!s||!img)return;img.src=base+s.img;img.alt=s.alt;cap.textContent=s.caption;status.textContent=s.status;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.silhouette===key)));looked.add(key);
    if(looked.size===2&&!answered)result.innerHTML='<strong>Оба состояния открыты.</strong> Теперь ответь на вопрос ниже.';}
  buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.silhouette)));show('built');
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    const right=button.dataset.answer==='crown';
    result.innerHTML=right?'<strong>Верно.</strong> Столп венчает золочёная корона из восьми дуг, над ней — крест. Короны над куполом нет ни у одного другого русского храма этого времени.'
      :'<strong>Посмотри ещё раз.</strong> Над куполом надета корона из восьми золочёных дуг: луковичной главы и каменного шатра здесь нет.';
    if(right&&!answered){answered=true;finish.hidden=false;document.dispatchEvent(new CustomEvent('museum:route-success'));window.rcGoal?.('rc_interactive_complete',{interactive:'dubrovicy_silhouette'});}
  }));
  document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelector(button.dataset.route==='short'?'#observe':'#four-scales')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
  const expected=['body','tower','crown','cross'];let gameStep=0;const seq=document.querySelector('#layer-sequence');const feedback=document.querySelector('#layer-feedback');
  const labels={body:'белокаменный объём',tower:'столп в три яруса',crown:'золочёная корона',cross:'крест'};
  const hints={cross:'Крест ставят последним: он венчает корону.',crown:'Корона опирается на купол, а купол — на столп.',tower:'Столп поднимается над белокаменным объёмом храма.',body:'Начни с того, что стоит на земле.'};
  document.querySelectorAll('[data-layer]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.layer;
    if(key===expected[gameStep]){seq.insertAdjacentHTML('beforeend',`<span>${labels[key]}</span>`);button.disabled=true;gameStep++;
      feedback.innerHTML=gameStep===4?'<strong>Последовательность собрана.</strong> Нижний объём несёт столп, столп — купол с короной, а корону венчает крест.'
        :`<strong>Верно.</strong> Теперь выбери ярус № ${gameStep+1}.`;
      if(gameStep===4)window.rcGoal?.('rc_game_complete',{game:'dubrovicy_crown_order'});}
    else{feedback.innerHTML=`<strong>Пока нет.</strong> ${hints[key]}`;}}));
  document.querySelector('#layer-reset')?.addEventListener('click',()=>{gameStep=0;seq.innerHTML='';feedback.textContent='Выбери нижний ярус.';document.querySelectorAll('[data-layer]').forEach(b=>b.disabled=false);});
  document.querySelectorAll('[data-quiz]').forEach(button=>button.addEventListener('click',()=>{
    const right=button.dataset.quiz==='crown';
    document.querySelector('#quiz-feedback').innerHTML=right?'<strong>Верно.</strong> Столп венчает золочёная корона из восьми дуг; это документированная форма, а объяснения символики остаются версиями.'
      :'<strong>Посмотри ещё раз.</strong> Луковичной главы и шатра здесь нет: над куполом надета золочёная корона.';}));
})();
