import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 2, 1],
  answerTexts: ["Продала вещи и несколько месяцев зарабатывала вышиванием", "50 тысяч рублей", "Механиком-водителем своего танка", "Она выбралась под огнём чинить разбитый ленивец танка", "«Боевая подруга»"],
  explain0: "Сестра продала на томских рынках вещи, привезённые в эвакуацию, а Мария вышивала салфетки, скатерти и платки на продажу.",
  diploma: "Знаток подвига Марии Октябрьской",
  kadry: 2,
  subject: async (p,check)=>{
    const st = p.locator('#sudba .so-st');
    check('Eight stations',await st.count(),8);
    check('First station shown on entry',(await p.locator('#sudba .so-card').first().innerText()).includes('похоронку'),true);
    const next = p.locator('#sudba .so-next');
    await next.click();
    check('Next opens station 2',(await p.locator('#sudba .so-card').first().innerText()).includes('50 тысяч'),true);
    await st.nth(0).click();
    check('Revisit does not recount',(await p.locator('#sudba .so-n').innerText()).trim(),'2');
    for (let i = 0; i < 7; i++) if (!(await next.isDisabled())) await next.click();
    check('All stations passed',(await p.locator('#sudba .so-n').innerText()).trim(),'8');
    check('Finale tells the tank fate',(await p.locator('#sudba .so-final').innerText()).includes('Т-34-85'),true);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
