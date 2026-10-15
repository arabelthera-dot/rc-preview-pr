import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [0, 1, 1, 1, 1],
  answerTexts: ["4 апреля 1942 года у Демянского плацдарма", "18 суток", "Ампутация обеих голеней из-за гангрены", "19 июля 1943 года", "10 самолётов — 3 до ранения и 7 после"],
  explain0: "4 апреля 1942 года в воздушном бою в районе Демянского плацдарма, Новгородская область.",
  diploma: "Знаток подвига Алексея Маресьева",
  kadry: 3,
  subject: async (p,check)=>{check('Five statements declared',await p.evaluate(()=>window.MUSEUM_FACT_OR_MYTH.items.length),5);await p.locator('#factOrMyth .fm-opt').first().click();check('Honest reveal shown',(await p.locator('#factOrMyth .fm-reveal').innerText()).includes('два дня'),true);check('Fact-or-myth gives no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
