import {make} from './plans.mjs';
export const dependencies = ['./plans.mjs'];
export const scenarios = make({
  answers: [2, 0, 3, 1, 2],
  answerTexts: ["Призвать сослуживцев бросить службу в полиции", "«Работайте, братья!»", "Боевики вырезали этот эпизод из своего ролика", "Юристом в банке", "Марку из серии «Герои Российской Федерации»"],
  explain0: "Его связали, включили камеру телефона и потребовали обратиться к сослуживцам с призывом бросить работу в правоохранительных органах.",
  diploma: "Знаток подвига Магомеда Нурбагандова",
  kadry: 1,
  subject: async (p,check)=>{
    const recs = p.locator('#slovo-geroya .sg-scratch');
    check('Five records declared',await recs.count(),5);
    await recs.nth(0).click();
    check('First record: the two words and who filmed them',(await p.locator('#sgDetail').innerText()).includes('Записали сами убийцы'),true);
    await recs.nth(1).click();
    check('Cut from the video is attributed',(await p.locator('#sgDetail').innerText()).includes('Васильев'),true);
    await recs.nth(2).click();
    check('Misquote is flagged',(await p.locator('#sgDetail').innerText()).includes('неточно'),true);
    check('Records give no points',Number((await p.locator('#score').innerText()).trim()),0);
  }
});
