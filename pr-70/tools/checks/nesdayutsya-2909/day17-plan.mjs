import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [0, 1, 2, 1, 1],
  answerTexts: ["8 августа 1941 года у реки Днепр", "Дмитрия Карбышева", "«Мои убеждения не выпадают вместе с зубами от недостатка витаминов»", "Что он «безнадёжен» как специалист — и отправить на каторжные работы", "Канадский майор Седдон де Сент-Клер"],
  explain0: "8 августа 1941 года при попытке выйти из окружения у реки Днепр, близ деревни Добрейка в Могилёвской области.",
  diploma: "Знаток подвига генерала Карбышева",
  kadry: 3,
  subject: async (p,check)=>{
    check('Three undisclosed points',await p.locator('#tablichka details.more').count(),3);
    await p.locator('#tablichka details.more').nth(0).locator('summary').click();
    check('First point opens',await p.locator('#tablichka details.more').nth(0).evaluate(e=>e.open),true);
    check('First point reveals Vlasov detail',(await p.locator('#tablichka details.more').nth(0).innerText()).includes('Власова'),true);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
