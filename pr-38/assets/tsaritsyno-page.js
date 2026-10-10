/* День 09.01 — Царицыно. Главное действие: M-49 «Timeline одного места» — три закреплённые даты. */
(function(){
  'use strict';
  const base='media/tsaritsyno/';
  const states={
    bazhenov:{
      img:'plan-1776.webp',
      alt:'Генеральный план села Царицыно, выполненный архитектором В. И. Баженовым: три отдельных дворца на одном плане',
      caption:'Генеральный план Царицына, 1776 год. Источник: Викисклад; автор В. И. Баженов, общественное достояние, срок охраны истёк; уменьшено и переведено в WebP.',
      status:'Состояние 1776–1785: три отдельных дворца Баженова на одном плане.',
      change:'Что изменилось: на этом плане три дворца стоят порознь — для императрицы, для наследника с семьёй и для внуков. Строили с 1776 по 1785 год; надёжного изображения этих дворцов при их жизни нет, есть только собственные чертежи и акварели зодчего.'
    },
    kazakov:{
      img:'ist-1800.webp',
      alt:'Вид Царицына около 1800 года: один большой дворец Казакова на месте разобранных дворцов Баженова',
      caption:'«Дворец Царицыно около Москвы», около 1800 года. Источник: Викисклад; автор Ф. Я. Алексеев, общественное достояние, срок охраны истёк; уменьшено и переведено в WebP.',
      status:'Состояние 1786–1796: один большой дворец Казакова вместо трёх баженовских.',
      change:'Что изменилось: указом от 6 февраля 1786 года главный корпус велено разобрать до основания и строить по новому, казаковскому плану; закладка — 15 июля 1786 года. К 1796 году дворец был почти готов, но с временной кровлей, без отделки; после смерти Екатерины работы остановились, а Павел I запретил стройку.'
    },
    museum:{
      img:'hero.webp',
      alt:'Большой Царицынский дворец после реставрации: современный вид музея-заповедника «Царицыно»',
      caption:'Большой Царицынский дворец, современный вид. Источник: Викисклад; фото: Mike1979 Russia, CC BY-SA 3.0; уменьшено и переведено в WebP.',
      status:'Состояние сегодня: Большой дворец музея-заповедника «Царицыно» после реставрации.',
      change:'Что изменилось: дворец простоял руиной почти двести лет. Реставрация Большого дворца завершена в августе 2007 года, комплекс открыт 2 сентября 2007 года. Башни и кровли при этом взяты из позднего варианта неосуществлённого проекта Казакова — это реконструкция, а не подлинник; подлинные стены и белокаменный декор сохранены.'
    }
  };
  const img=document.querySelector('#timeline-image');
  const cap=document.querySelector('#timeline-caption');
  const status=document.querySelector('#timeline-status');
  const change=document.querySelector('#timeline-change');
  const result=document.querySelector('#timeline-result');
  const finish=document.querySelector('#timeline-finish');
  const buttons=[...document.querySelectorAll('[data-era]')];
  let answered=false;
  const looked=new Set();
  function show(key){
    const s=states[key];if(!s||!img)return;
    img.src=base+s.img;img.alt=s.alt;cap.textContent=s.caption;
    status.textContent=s.status;change.textContent=s.change;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.era===key)));
    looked.add(key);
    if(looked.size===3){
      window.MUSEUM_AWARDS&&window.MUSEUM_AWARDS('states');
      if(!answered)result.innerHTML='<strong>Все три состояния открыты.</strong> Теперь ответь на вопрос ниже.';
    }
  }
  buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.era)));
  show('bazhenov');

  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    const right=button.dataset.answer==='ukaz';
    result.innerHTML=right
      ? '<strong>Верно.</strong> Документирован именно указ: 6 февраля 1786 года главный корпус велено разобрать до основания и строить по плану Казакова. Почему это решено — в источниках не сказано.'
      : '<strong>Посмотри ещё раз.</strong> Документ здесь один: указ о разборке главного корпуса. Слова о тесных залах и низких потолках — пересказ версии, а не приказ.';
    if(right)window.MUSEUM_AWARDS&&window.MUSEUM_AWARDS('answer');
    if(right&&!answered){answered=true;finish.hidden=false;document.dispatchEvent(new CustomEvent('museum:route-success'));window.rcGoal?.('rc_interactive_complete',{interactive:'tsaritsyno_timeline'});}
  }));

  document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelector(button.dataset.route==='short'?'#observe':'#four-scales')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));

  /* Игра: расставить три состояния одного места по времени */
  const expected=['bazhenov','kazakov','museum'];
  let gameStep=0;
  const seq=document.querySelector('#era-sequence');
  const feedback=document.querySelector('#era-feedback');
  const labels={bazhenov:'1776–1785 · дворцы Баженова',kazakov:'1786–1796 · дворец Казакова',museum:'2007 · музей-заповедник'};
  const hints={
    museum:'Музей открыт после реставрации позже всех: это последнее состояние места.',
    kazakov:'Дворец Казакова заложили в 1786 году — после того, как разобрали баженовский.',
    bazhenov:'Начни с того, что построили первым: с дворцов Баженова.'
  };
  document.querySelectorAll('[data-era-order]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.eraOrder;
    if(key===expected[gameStep]){
      seq.insertAdjacentHTML('beforeend',`<span>${labels[key]}</span>`);
      button.disabled=true;gameStep++;
      feedback.innerHTML=gameStep===3
        ? '<strong>Порядок собран.</strong> Сначала три дворца Баженова, потом один дворец Казакова на их месте, потом музей-заповедник.'
        : `<strong>Верно.</strong> Теперь выбери состояние № ${gameStep+1}.`;
      if(gameStep===3){window.MUSEUM_AWARDS&&window.MUSEUM_AWARDS('order');window.rcGoal?.('rc_game_complete',{game:'tsaritsyno_era_order'});}
    }else{
      feedback.innerHTML=`<strong>Пока нет.</strong> ${hints[key]}`;
    }
  }));
  document.querySelector('#era-reset')?.addEventListener('click',()=>{
    gameStep=0;seq.innerHTML='';feedback.textContent='Выбери первое состояние места.';
    document.querySelectorAll('[data-era-order]').forEach(b=>b.disabled=false);
  });

  document.querySelectorAll('[data-quiz]').forEach(button=>button.addEventListener('click',()=>{
    const right=button.dataset.quiz==='ukaz';
    if(right)window.MUSEUM_AWARDS&&window.MUSEUM_AWARDS('quiz');
    document.querySelector('#quiz-feedback').innerHTML=right
      ? '<strong>Верно.</strong> Разборку главного корпуса документирует указ от 6 февраля 1786 года; причина в источниках прямо не названа и остаётся версией.'
      : '<strong>Посмотри ещё раз.</strong> Приказ Павла I касался запрета строить дальше, а письма о залах — версия о недовольстве, а не указ.';
  }));
})();
