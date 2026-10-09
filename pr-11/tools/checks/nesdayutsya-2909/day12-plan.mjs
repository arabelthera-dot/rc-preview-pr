import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 0, 2, 3, 1],
  answerTexts: ["Девятнадцать", "Бросил две гранаты", "Агитатор политотдела старший лейтенант Волков", "404", "Первым был навечно зачислен в списки части приказом наркома"],
  explain0: "Девятнадцать: в феврале 1943 года, за несколько недель до боя.",
  diploma: "Знаток подвига Александра Матросова",
  kadry: 7,
  subject: async (p,check)=>{check('Five records declared',await p.locator('#slovo-geroya .sg-scratch').count(),5);await p.locator('#slovo-geroya .sg-scratch').nth(2).click();check('Record opens with source',(await p.locator('#sgDetail').innerText()).includes('Волков'),true);check('Records give no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
