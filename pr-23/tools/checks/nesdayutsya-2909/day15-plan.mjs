import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 1, 2, 0, 1],
  answerTexts: ["104", "«Не сдаёмся!»", "Десять женщин и двух девочек", "Сажал людей в парашютные ящики под крыльями", "Всех"],
  explain0: "104 человека, среди них десять женщин и двое маленьких детей.",
  diploma: "Знаток подвига челюскинцев",
  kadry: 5,
  subject: async (p,check)=>{check('Six stops declared',await p.locator('#kartaPath button').count(),6);await p.locator('#kartaNext').click();check('First stop opens with source',(await p.locator('#kartaCard').innerText()).includes('Берингова пролива'),true);await p.locator('#kartaSvg .rm-node').nth(4).click();check('Map node 5 tells of Molokov',(await p.locator('#kartaCard').innerText()).includes('Молоков'),true);check('Route to Vankarem lit',await p.locator('#ktVank.on').count(),1);check('Stops give no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
