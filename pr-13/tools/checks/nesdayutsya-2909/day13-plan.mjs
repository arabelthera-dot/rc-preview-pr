import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 0, 2, 3, 1],
  answerTexts: ["На станции Новолазаревская в Антарктиде", "1 час 45 минут", "Инженер-механик Зиновий Теплинский", "Тёмное пятно — ещё день, и его было бы не спасти", "Гагарина"],
  explain0: "На станции Новолазаревская в оазисе Ширмахера, в ночь на 1 мая 1961 года.",
  diploma: "Знаток подвига Леонида Рогозова",
  kadry: 5,
  subject: async (p,check)=>{check('Eight room objects declared',await p.locator('#intScene .int-spot').count(),8);await p.locator('#intScene .int-spot').nth(3).click();check('Object opens with source',(await p.locator('#intDetail').innerText()).includes('Теплинский'),true);check('Counter moves',(await p.locator('#intCount').innerText()).includes('1 из 8'),true);check('Objects give no points',Number((await p.locator('#score').innerText()).trim()),0);}
});
