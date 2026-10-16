import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 2, 3, 0, 1],
  answerTexts: ["У корейского порта Чемульпо", "Покинуть рейд до полудня — иначе атака в порту", "Всеволод Руднев", "Затопили, открыв кингстоны", "Все офицеры — орденом Святого Георгия, все нижние чины — знаком отличия Военного ордена"],
  explain0: "У Чемульпо — нейтрального порта в Корее, где «Варяг» и «Кореец» охраняли русскую миссию в Сеуле.",
  diploma: "Знаток боя у Чемульпо",
  kadry: 5,
  subject: async (p,check)=>{check('Three decision steps declared',await p.evaluate(()=>window.MUSEUM_CHOICE_TALE.steps.length),3);for(let i=0;i<3;i++){await p.locator('#choiceTaleBox .ct-choice').nth(2).click();}check('Reality anchor shown',(await p.locator('#choiceTaleBox .ct-reality').innerText()).includes('Руднев'),true);check('Choice game gives no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
