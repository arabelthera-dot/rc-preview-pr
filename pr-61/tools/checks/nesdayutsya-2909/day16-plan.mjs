import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [0, 0, 1, 0, 0],
  answerTexts: ["Назвали Мересьевым", "18 суток", "Пожилой житель соседней деревни", "Командир эскадрильи Александр Числов", "Процентов на 99"],
  explain0: "В книге герой — Алексей Мересьев, фамилия отличается от настоящей (Маресьев) на одну букву.",
  diploma: "Знаток подвига",
  kadry: 3,
  subject: async (p,check)=>{
    check('Seven comparison items',await p.locator('#pochemu-ryadom .pr-item').count(),7);
    await p.locator('#pochemu-ryadom .pr-item').nth(0).click();
    check('First item reveals reality text',(await p.locator('#prDetail0').innerText()).includes('Маресьев'),true);
    check('First item tagged changed',await p.locator('#pochemu-ryadom .pr-item').nth(0).locator('.pr-tag.changed').count(),1);
    await p.locator('#pochemu-ryadom .pr-item').nth(4).click();
    check('Kept item tagged kept',await p.locator('#pochemu-ryadom .pr-item').nth(4).locator('.pr-tag.kept').count(),1);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
