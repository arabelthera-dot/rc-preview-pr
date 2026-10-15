import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 1, 3, 0, 2],
  answerTexts: ["Потёк первый контур охлаждения реактора", "Пресной водой из питьевых запасов", "Восемь", "Сами выжившие моряки — надписью на пластыре в госпитале", "На Нобелевскую премию мира"],
  explain0: "В 4:15 приборы показали падение давления и уровня в первом контуре кормового реактора: течь дала импульсная трубка между напорной линией и датчиками давления.",
  diploma: "Знаток подвига экипажа К-19",
  kadry: 2,
  subject: async (p,check)=>{
    const dots = p.locator('#interer .zi-dot');
    check('Eight interior items',await dots.count(),8);
    await dots.nth(0).click();
    check('First item reveals text',(await p.locator('#interer .zi-card').first().innerText()).includes('импульсная трубка'),true);
    check('Counter after one item',(await p.locator('#interer .zi-n').innerText()).trim(),'1');
    await dots.nth(0).click();
    check('Repeat click does not recount',(await p.locator('#interer .zi-n').innerText()).trim(),'1');
    for (let i = 1; i < 8; i++) await dots.nth(i).click();
    check('Counter after all items',(await p.locator('#interer .zi-n').innerText()).trim(),'8');
    check('Finale names the eight',(await p.locator('#interer .zi-final').innerText()).includes('Валерий Харитонов'),true);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
