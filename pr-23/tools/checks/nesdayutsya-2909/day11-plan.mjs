import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 0, 3, 1, 2],
  answerTexts: ["В Сталинграде", "Разведгруппа сержанта Якова Павлова — четыре бойца", "58", "Мирные жители в подвале — больше пятидесяти человек", "Звание Героя Советского Союза в 1945 году"],
  explain0: "В Сталинграде, у площади 9 Января (ныне площадь Ленина в Волгограде).",
  diploma: "Знаток обороны дома Павлова",
  kadry: 4,
  subject: async (p,check)=>{check('Five statements declared',await p.evaluate(()=>window.MUSEUM_FACT_OR_MYTH.items.length),5);await p.locator('#factOrMyth .fm-opt').first().click();check('Honest reveal shown',(await p.locator('#factOrMyth .fm-reveal').innerText()).includes('27 сентября'),true);check('Fact-or-myth gives no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
