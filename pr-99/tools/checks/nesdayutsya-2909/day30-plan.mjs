import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 2, 1],
  answerTexts: ["Жалованная грамота 1619 года его зятю Богдану Собинину", "Что он завёл отряд в лес и болото", "«Жизнь за царя»", "Исупово", "Матвей Кузьмин"],
  explain0: "Первая — жалованная грамота царя Михаила Фёдоровича от 30 ноября 1619 года зятю Сусанина Богдану Собинину: «за тестя его, Ивана Сусанина, к нам службу и за кровь».",
  diploma: "Знаток подвига Ивана Сусанина",
  kadry: 2,
  subject: async (p,check)=>{check('Five statements declared',await p.evaluate(()=>window.MUSEUM_FACT_OR_MYTH.items.length),5);check('Mechanic label M-23',await p.evaluate(()=>window.MUSEUM_FACT_OR_MYTH.mechanic),'M-23');await p.locator('#factOrMyth .fm-opt').first().click();check('Honest reveal shown',(await p.locator('#factOrMyth .fm-reveal').innerText()).includes('Глинки'),true);check('Truth-or-myth gives no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
