import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 2, 0, 3, 1],
  answerTexts: ["Занять высоту у выхода из Аргунского ущелья и не дать боевикам прорваться", "«Командиры договорились»", "Группа майора Александра Доставалова", "Вызвали огонь своей артиллерии на себя", "Шестеро"],
  explain0: "Батальону приказали занять господствующие высоты у выхода из Аргунского ущелья. Шестая рота шла на высоту 776,0 у селения Улус-Керт.",
  diploma: "Знаток подвига 6-й роты",
  kadry: 1,
  subject: async (p,check)=>{
    const names = p.locator('#imena .si-name');
    check('84 name cards',await names.count(),84);
    check('Alphabetical, first is Александров',(await names.first().innerText()).startsWith('Александров'),true);
    check('No card open on entry',await p.locator('#imena .si-card').isVisible(),false);
    await names.first().click();
    check('Card shows birth and award',(await p.locator('#imena .si-card').innerText()).includes('Ивангороде') && (await p.locator('#imena .si-card').innerText()).includes('орден Мужества'),true);
    check('Card cites the book',(await p.locator('#imena .si-card .si-src').innerText()).includes('Шаг в бессмертие'),true);
    await names.first().click();
    check('Reopen does not recount',(await p.locator('#imena .si-n').innerText()).trim(),'1');
    await p.fill('#siQuery','Евтюхин');
    check('Search narrows to one',await p.locator('#imena li:not([hidden])').count(),1);
    const ev = p.locator('#imena li:not([hidden]) .si-name');
    await ev.focus(); await p.keyboard.press('Enter');
    check('Keyboard opens the commander card',(await p.locator('#imena .si-card').innerText()).includes('Герой России'),true);
    await p.fill('#siQuery','');
    check('Clearing search shows all',await p.locator('#imena li:not([hidden])').count(),84);
    check('Two cards opened',(await p.locator('#imena .si-n').innerText()).trim(),'2');
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
