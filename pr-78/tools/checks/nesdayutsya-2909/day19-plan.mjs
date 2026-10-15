import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 2, 1],
  answerTexts: ["Обер-лейтенант Пауль Зиберт", "Расположение ставки Гитлера «Вервольф» под Винницей", "О подготовке покушения на лидеров «Большой тройки» в Тегеране", "Патруль искал «террориста» в форме обер-лейтенанта — на чин ниже его нового звания гауптмана", "9 марта 1944 года в селе Боратин, Львовская область"],
  explain0: "С октября 1942 года Кузнецов жил и работал в Ровно под именем обер-лейтенанта (позже гауптмана) Пауля Вильгельма Зиберта, с документами сотрудника тайной полевой полиции.",
  diploma: "Знаток подвига разведчика Кузнецова",
  kadry: 2,
  subject: async (p,check)=>{check('Two decision steps declared',await p.evaluate(()=>window.MUSEUM_CHOICE_TALE.steps.length),2);for(let i=0;i<2;i++){await p.locator('#choiceTaleBox .ct-choice').nth(1).click();}check('Reality anchor shown',(await p.locator('#choiceTaleBox .ct-reality').innerText()).includes('Кузнецов'),true);check('Choice game gives no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
