import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 0, 3, 1, 0],
  answerTexts: ["5,35 метра", "В пустоте скафандр раздулся и не проходил в люк", "Сам сбросил давление в скафандре до аварийного", "Головой вперёд — вопреки инструкции", "12 минут 09 секунд"],
  explain0: "Фал длиной 5,35 метра — стальной трос и провода для медицинских данных, измерений и телефонной связи с командиром.",
  diploma: "Знаток первого выхода в космос",
  kadry: 2,
  subject: async (p,check)=>{
    const steps = p.locator('#scena .oz-step');
    check('Six beats of the scene',await steps.count(),6);
    check('Scene starts at depressurisation',(await p.locator('#scena .oz-time').innerText()).trim(),'11:28:13');
    check('Finale hidden before all beats',await p.locator('#scena .oz-final').isVisible(),false);
    await p.locator('#scena .oz-next').click();
    check('Next beat — exit time',(await p.locator('#scena .oz-time').innerText()).trim(),'11:34:51');
    await p.locator('#scena .oz-stage').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    check('Keyboard reaches the alarm beat',(await p.locator('#scena .oz-count').innerText()).trim(),'Такт 4 из 6');
    check('Alarm beat marked',await p.locator('#scena .oz-stage').evaluate(e=>e.classList.contains('alarm')),true);
    check('Current beat announced to readers',await steps.nth(3).getAttribute('aria-current'),'step');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    check('Last beat — back in the airlock',(await p.locator('#scena .oz-time').innerText()).trim(),'11:47');
    check('Finale after all beats',await p.locator('#scena .oz-final').isVisible(),true);
    check('Voice button follows the audioguide',await p.locator('#scena .oz-voice').count(),1);
    check('Scene gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
