import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [1, 2, 0, 3, 1],
  answerTexts: ["В Старокарантинских", "Он был маленького роста и пролезал в узкие лазы", "Немцы собираются затопить каменоломни", "Помогая сапёрам разминировать подходы к каменоломням", "Орденом Красного Знамени"],
  explain0: "Отряд ушёл в Старокарантинские каменоломни на востоке Керчи. В соседних Аджимушкайских стоял другой партизанский отряд — их часто путают.",
  diploma: "Знаток подвига Володи Дубинина",
  kadry: 1,
  subject: async (p,check)=>{
    const pts = p.locator('#karta .rm-node');
    check('Nine points on the map',await pts.count(),9);
    check('Map says the scheme is conditional',(await p.locator('#karta .kp-note').innerText()).includes('Условная схема'),true);
    check('First point shown on entry',(await p.locator('#karta .kp-card').first().innerText()).includes('Старокарантинские'),true);
    const next = p.locator('#karta .kp-next');
    await next.click();
    check('Next opens point 2',(await p.locator('#karta .kp-card').first().innerText()).includes('цементом'),true);
    await pts.nth(0).click();
    check('Revisit does not recount',(await p.locator('#karta .kp-n').innerText()).trim(),'2');
    await pts.nth(4).focus();
    await p.keyboard.press('Enter');
    check('Keyboard opens a point',(await p.locator('#karta .kp-card').first().innerText()).includes('посты'),true);
    for (let i = 0; i < 9; i++) if (!(await next.isDisabled())) await next.click();
    await pts.nth(2).click(); await pts.nth(3).click();
    check('All points passed',(await p.locator('#karta .kp-n').innerText()).trim(),'9');
    check('Finale tells the memory',(await p.locator('#karta .kp-final').innerText()).includes('Улица младшего сына'),true);
    check('Subject interactive gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
