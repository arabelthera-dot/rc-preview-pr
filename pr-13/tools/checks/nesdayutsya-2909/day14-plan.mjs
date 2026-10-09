import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 2, 2, 1, 0],
  answerTexts: ["250 тысяч", "Станция Мга оказалась занята врагом", "Связывали коробки между собой", "Нетронутый мешочек с семенами", "Больше 320 тысяч"],
  explain0: "250 тысяч образцов — самая богатая коллекция семян на свете.",
  diploma: "Знаток подвига хранителей коллекции ВИР",
  kadry: 5,
  subject: async (p,check)=>{check('Six stops declared',await p.locator('#sudbaPath button').count(),6);await p.locator('#sudbaNext').click();check('First stop opens with source',(await p.locator('#sudbaCard').innerText()).includes('250 тысяч'),true);await p.locator('#sudbaPath button').nth(4).click();check('Stop 5 tells of the pocket bag',(await p.locator('#sudbaCard').innerText()).includes('Рубцов'),true);check('Stops give no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
