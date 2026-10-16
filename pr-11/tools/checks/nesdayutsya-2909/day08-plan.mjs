import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 3, 2],
  answerTexts: ["Таня", "Петрищево", "Из Саратова", "170", "16 февраля 1942 года"],
  explain0: "«Таня» — так назывался очерк Петра Лидова в «Правде» 27 января 1942 года. Настоящее имя установили в феврале.",
  diploma: "Знаток подвига Зои Космодемьянской",
  kadry: 3,
  subject: async (p,check)=>{check('Three records of last words',await p.locator('#slovo-geroya .sg-scratch').count(),3);await p.locator('#slovo-geroya .sg-scratch').first().click();check('Record opens with source',(await p.locator('#sgDetail').innerText()).includes('Кулик'),true);}
});
