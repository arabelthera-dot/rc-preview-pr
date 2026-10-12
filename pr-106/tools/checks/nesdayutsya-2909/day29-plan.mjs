import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 1, 3, 0, 1],
  answerTexts: ["30 сентября 1942 года", "Биржу труда со списками для угона в Германию", "Геннадий Почепцов из группы Первомайки сам написал заявление в полицию", "У шурфа шахты № 5", "Четырнадцать"],
  explain0: "Краснодон заняли 20 июля 1942 года, а 30 сентября руководители молодёжных групп объединились в подпольную комсомольскую организацию «Молодая гвардия». 14 февраля 1943 года город освободили.",
  diploma: "Знаток подвига «Молодой гвардии»",
  kadry: 2,
  subject: async (p,check)=>{
    const names = p.locator('#imena .si-name');
    check('71 name cards',await names.count(),71);
    check('Alphabetical, first is Андросова',(await names.first().innerText()).startsWith('Андросова'),true);
    check('No card open on entry',await p.locator('#imena .si-card').isVisible(),false);
    await names.first().click();
    const card = p.locator('#imena .si-card');
    check('Card shows school, underground and fate',(await card.innerText()).includes('Школа № 22') && (await card.innerText()).includes('В подполье') && (await card.innerText()).includes('шурф шахты № 5'),true);
    check('Card links to the person essay',await card.locator('.si-src a').getAttribute('href'),'https://www.molodguard.ru/guardian9.htm');
    await names.first().click();
    check('Reopen does not recount',(await p.locator('#imena .si-n').innerText()).trim(),'1');
    await p.fill('#siQuery','Юркин');
    check('Search narrows to one',await p.locator('#imena li:not([hidden])').count(),1);
    const yu = p.locator('#imena li:not([hidden]) .si-name');
    await yu.focus(); await p.keyboard.press('Enter');
    check('Keyboard opens the youngest — survived',(await card.locator('.si-role').innerText()).trim(),'выжил');
    await p.fill('#siQuery','Первомайк');
    check('Search by settlement',await p.locator('#imena li:not([hidden])').count(),6);
    await p.fill('#siQuery','');
    check('Clearing search shows all',await p.locator('#imena li:not([hidden])').count(),71);
    check('Two cards opened',(await p.locator('#imena .si-n').innerText()).trim(),'2');
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
