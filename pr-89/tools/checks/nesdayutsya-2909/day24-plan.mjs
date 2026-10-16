import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 2, 1],
  answerTexts: ["В пограничных войсках на границе Ингушетии и Чечни", "Подъехали на машине «скорой помощи» и выскочили из неё", "Днём его девятнадцатилетия", "Это известно со слов матери, и церковная комиссия подтверждений не нашла", "В алтаре храма святителя Николая в Пыжах"],
  explain0: "Евгений служил гранатомётчиком в пограничных войсках; в январе 1996 года его отправили в Назранский пограничный отряд на границе Ингушетии и Чечни.",
  diploma: "Знаток подвига Евгения Родионова",
  kadry: 1,
  subject: async (p,check)=>{
    const chips = p.locator('#zum .zp-chip');
    check('Five points to look at',await chips.count(),5);
    check('Note explains the small photo',(await p.locator('#zum .zp-note').innerText()).includes('Снимок небольшой'),true);
    check('Whole cross shown on entry',await p.locator('#zum .zp-stage').getAttribute('data-zoom'),'1');
    const next = p.locator('#zum .zp-next');
    await next.click();
    check('Next zooms to the plaque',await p.locator('#zum .zp-stage').getAttribute('data-zoom'),'3');
    check('Plaque text is read out',(await p.locator('#zum .zp-card').first().innerText()).includes('Здесь лежит русский солдат Евгений Родионов'),true);
    await p.locator('#zum .zp-whole').click();
    check('Whole view returns',await p.locator('#zum .zp-stage').getAttribute('data-zoom'),'1');
    await p.locator('#zum .zp-pin').nth(0).click();
    check('Revisit does not recount',(await p.locator('#zum .zp-n').innerText()).trim(),'2');
    await chips.nth(2).focus();
    await p.keyboard.press('Enter');
    check('Keyboard opens a point',(await p.locator('#zum .zp-card').first().innerText()).includes('не отрекшийся от Христа'),true);
    check('Doubt is stated honestly',(await p.locator('#zum .zp-card').first().innerText()).includes('подтверждений не нашла'),true);
    for (let i = 0; i < 5; i++) if (!(await next.isDisabled())) await next.click();
    check('All points seen',(await p.locator('#zum .zp-n').innerText()).trim(),'5');
    check('Finale tells where the cross is',(await p.locator('#zum .zp-final').innerText()).includes('Пыжах'),true);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
