import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 3, 0, 2, 1],
  answerTexts: ["Это кратчайший путь через Балканы на Стамбул", "Болгарское ополчение", "Стрелковый батальон подняли на казачьих лошадях", "Морозы и болезни", "Победой в Шипко-Шейновском сражении"],
  explain0: "Перевал через Балканский хребет — кратчайший путь на Стамбул; турки хотели прорваться через него на север, в тыл русской армии.",
  diploma: "Знаток обороны Шипки",
  kadry: 2,
  subject: async (p,check)=>{
    const eras = p.locator('#firstlook .fl-era');
    check('Two dates of one place',await eras.count(),2);
    check('Painting shown first',await p.locator('#firstlook .fl-layer.is-on').getAttribute('src'),'shipka-vereshchagin-transhei.jpg');
    check('Caption names the kind',(await p.locator('#firstlook .fl-caption').textContent()).includes('Картина'),true);
    await eras.nth(1).click();
    check('Toggle switches to 2006',await p.locator('#firstlook .fl-layer.is-on').getAttribute('src'),'shipka-pereval-2006.jpg');
    check('Monument absence explained',(await p.locator('#firstlook .fl-caption').innerText()).includes('авторским правом'),true);
    await eras.nth(1).focus(); await p.keyboard.press('ArrowLeft');
    check('Keyboard returns to the painting',await eras.nth(0).getAttribute('aria-pressed'),'true');
    check('Toggle gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
