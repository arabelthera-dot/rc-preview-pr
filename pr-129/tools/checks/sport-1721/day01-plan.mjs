// B6-сценарии страницы 1 января Музея спорта (ледяные горы), карточка #1721.
// Награды: шторка M-47 — 20, викторина — 5 × 16; знаменатель 100. Прогресс не хранится:
// перезагрузка — чистый старт, это и есть «начать заново» без очистки браузера.
const score = async p => Number(await p.locator('#score').innerText());
const RIGHT = [0, 1, 2, 0, 1];
async function shutter(p) {
  const r = p.locator('#firstlook input[type=range]');
  await r.scrollIntoViewIfNeeded();
  await r.fill('100'); await r.fill('0');
}
async function quiz(p, picks = RIGHT) {
  for (const i of picks) {
    await p.locator('#quiz .mq-opt').nth(i).click();
    await p.locator('#quiz .mq-next').click();
  }
}
export const scenarios = {
  entry: async ({page, step, check}) => {
    check('Fresh score', await score(page), 0);
    check('Fresh rank', (await page.locator('#dayTxt').innerText()).includes('Гость музея'), true);
    await step('Answer first question right', () => page.locator('#quiz .mq-opt').nth(0).click());
    check('Earned for answered', await score(page), 16);
    await step('Reload', () => page.reload());
    check('No phantom progress after reload', await score(page), 0);
  },
  wrong: async ({page, step, check}) => {
    await step('Pick wrong answer «Две»', () => page.locator('#quiz .mq-opt').nth(1).click());
    check('Wrong earns nothing', await score(page), 0);
    check('Explanation shown', (await page.locator('#quiz .mq-exp.is-on').innerText()).includes('Двадцать'), true);
    check('Correct option marked right', await page.locator('#quiz .mq-opt').nth(0).evaluate(e => e.classList.contains('is-right')), true);
    check('Correct option not marked wrong', await page.locator('#quiz .mq-opt.is-wrong').count(), 1);
    await step('Click correct after wrong', () => page.locator('#quiz .mq-opt').nth(0).click({force: true}));
    check('Repeat earns nothing', await score(page), 0);
  },
  reset: async ({page, step, check}) => {
    await step('Full pass', async () => { await shutter(page); await quiz(page); });
    check('Full score', await score(page), 100);
    await step('Start over by reload', () => page.reload());
    check('Reset to zero', await score(page), 0);
    await step('Repeat full pass', async () => { await shutter(page); await quiz(page); });
    check('No accumulated reward', await score(page), 100);
  },
  mobile: async ({page, step, check, width}) => {
    await step('Shutter and quiz', async () => { await shutter(page); await quiz(page); });
    check('Same maximum at ' + width, await score(page), 100);
    check('No horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },
  nojs: async ({page, step, check}) => {
    await step('Read static alternatives', () => page.locator('#shtorka .nojs').scrollIntoViewIfNeeded());
    check('Shutter text alternative', await page.locator('#shtorka .nojs').isVisible(), true);
    check('Quiz answers as text', (await page.locator('#quiz-wrap .nojs').innerText()).includes('Двадцать'), true);
    check('Moments readable', await page.locator('#story h2').isVisible(), true);
  },
  score: async ({page, step, check}) => {
    check('Visible denominator 100', (await page.locator('#scoreBox').innerText()).includes('/ 100'), true);
    await step('Earn every reward', async () => { await shutter(page); await quiz(page); });
    check('Maximum', await score(page), 100);
    check('Top rank', (await page.locator('#dayTxt').innerText()).includes('Мастер ледяной горы'), true);
    await step('Drag shutter again', () => shutter(page));
    check('No overflow', await score(page), 100);
  },
  main: async ({page, step, check}) => {
    await step('Drag shutter to right edge only', () => page.locator('#firstlook input[type=range]').fill('100'));
    check('Half-seen gives nothing', await score(page), 0);
    await step('Drag to left edge', () => page.locator('#firstlook input[type=range]').fill('0'));
    check('Main action rewarded', await score(page), 20);
    await step('Drag both edges again', () => shutter(page));
    check('Reward not duplicated', await score(page), 20);
  },
  empty: async ({page, step, check}) => {
    check('Shutter has two real images', await page.locator('#firstlook img').count() >= 2, true);
    await step('Scroll to shutter', () => page.locator('#firstlook').scrollIntoViewIfNeeded());
    await page.waitForFunction(() => [...document.querySelectorAll('#firstlook img')].every(i => i.complete && i.naturalWidth > 0)).catch(() => {});
    check('Shutter images loaded', await page.locator('#firstlook img').evaluateAll(a => a.every(i => i.complete && i.naturalWidth > 0)), true);
    check('Five questions', (await page.locator('#quiz .mq-step').innerText()).trim(), '1 / 5');
    check('Three choices', await page.locator('#quiz .mq-opt').count(), 3);
    check('Hero loaded', await page.locator('#hero img').evaluate(i => i.complete && i.naturalWidth > 0), true);
    check('Calendar rendered', await page.locator('#calbox *').count() > 0, true);
    check('At least 15 images', await page.locator('main img').count() >= 15, true);
  }
};
