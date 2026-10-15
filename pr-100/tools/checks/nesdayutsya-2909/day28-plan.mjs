import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 0, 3, 1, 3],
  answerTexts: ["Рыболовным траулером", "Три", "Носовая пушка не доставала, кормовую разбило", "Спущенный на ночь флаг подняли под огнём", "37 из 52"],
  explain0: "«Туман» построили в 1930 году как рыболовный траулер РТ-10 «Лебёдка»; в 1939 году его мобилизовали, в 1940-м он стал сторожевым кораблём.",
  diploma: "Знаток боя «Тумана»",
  kadry: 3,
  subject: async (p,check)=>{
    const panels = p.locator('#masshtab .rc-scale');
    check('Three comparisons rendered',await panels.count(),3);
    check('Silhouettes drawn to scale',await p.locator('#masshtab svg.tm-siluety g').count(),5);
    const tons = panels.nth(0), tabs = tons.locator('[role=tab]');
    check('Tonnage starts at one destroyer',await tabs.nth(0).getAttribute('aria-selected'),'true');
    const legend = tons.locator('[role=tabpanel] p').first();
    check('Legend names Tuman tonnage',(await legend.innerText()).replace(/\s/g,'').includes('«Туман»—полноеводоизмещение—1150т'),true);
    await tabs.nth(1).click();
    check('Three destroyers selected',await tabs.nth(1).getAttribute('aria-selected'),'true');
    check('Three destroyers — 9511 t',(await legend.innerText()).replace(/\s/g,'').includes('Триэсминцавместе—9511т'),true);
    await tabs.nth(1).focus(); await p.keyboard.press('ArrowRight');
    check('Arrow keys cycle the tabs',await tabs.nth(0).getAttribute('aria-selected'),'true');
    const speed = panels.nth(1).locator('[role=tab]');
    await speed.nth(1).click();
    check('Speed panel compares 38,2 knots',(await panels.nth(1).locator('[role=tabpanel] p').first().innerText()).includes('38,2'),true);
    await panels.nth(1).locator('button[data-rc-reset]').click();
    check('Reset returns to nearest reference',await speed.nth(0).getAttribute('aria-selected'),'true');
    check('Crew panel — 52 people',(await panels.nth(2).innerText()).includes('52'),true);
    check('Comparison gives no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
