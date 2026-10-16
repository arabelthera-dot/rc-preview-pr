import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [0, 2, 3, 0, 3],
  answerTexts: ["У разъезда Дубосеково под Волоколамском", "Гранатами, бутылками с горючей смесью и противотанковыми ружьями", "Василий Клочков", "В Алма-Ате и Фрунзе", "Она стала 8-й гвардейской и получила имя Панфилова"],
  explain0: "У разъезда Дубосеково, юго-восточнее Волоколамска, на рубеже 1075-го стрелкового полка.",
  diploma: "Знаток боя у Дубосекова",
  kadry: 5,
  subject: async (p,check)=>{check('Fact-or-myth has statements',await p.locator('#factOrMyth .fm-text').count(),1);await p.locator('#factOrMyth .fm-opt').first().click();check('Honest reveal shown',(await p.locator('#factOrMyth .fm-reveal').innerText()).length>40,true);}
});
