// B6 acceptance plan for day 13 — «Мыши кота погребают» (Музей карикатуры).
// Self-contained: shared assertions cover only the shared quiz/score contracts.
export const dependencies = [];
const QUIZ = '#gcQuiz';
const ANSWERS = [1, 1, 2];
const MAIN_SCORE = 65; // first three statements (3×5) + three dossiers (3×10) + six laid out (20)
// Six statements, two per shelf: what the sheet shows, what documents confirm, what was added later.
const SHELVES = [
  { s: 'sheet', cards: ['s1', 's2'] },
  { s: 'doc',   cards: ['d1', 'd2'] },
  { s: 'later', cards: ['l1', 'l2'] },
];
const ALIEN_CARD = 'd1'; // belongs to «Есть в документе», not to the shelf open at the start
const score = async (p) => Number(await p.locator('#headScore').innerText());
const ready = async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); };
async function quiz(p, answers) {
  for (const [i, a] of answers.entries()) {
    await p.locator(QUIZ + ' .q').nth(i).locator('.quizopt').nth(a).click();
  }
}
async function main(p, c) {
  // A statement of another shelf must be refused while a different shelf is open.
  await p.locator('.vp-card[data-c="' + ALIEN_CARD + '"]').first().click();
  if (c) {
    c('Statement of another shelf earns nothing', await score(p), 0);
    c('Wrong shelf is explained', await p.locator('.vp-notes .vp-note.miss').count(), 1);
  }
  for (const { s, cards } of SHELVES) {
    await p.locator('.vp-shelf[data-s="' + s + '"]').first().click();
    for (const card of cards) {
      await p.locator('.vp-card[data-c="' + card + '"]').first().click();
    }
  }
  if (c) {
    c('Six statements placed', await p.locator('.vp-card.on').count(), 6);
    c('Three boards complete', await p.locator('.vp-board.on').count(), 3);
    c('Reading reports all six', (await p.locator('#vpRead').innerText()).includes('Все шесть утверждений разложены'), true);
    c('Completion badge shown', await p.locator('#vpDone').isVisible(), true);
  }
  const d = p.locator('#gcDossier button');
  for (let i = 0; i < 3; i++) await d.nth(i).click();
  if (c) {
    c('Three dossiers opened', await p.locator('#gcDossier .gc-doc').count(), 3);
    c('Verdict counts the statements', await p.locator('#gcVerdictText').innerText().then((s) => s.includes('Шесть утверждений разложены')), true);
  }
}
async function share(p, c) {
  await p.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }));
  await p.locator('#gcShare').click();
  c('Cancelled share earns nothing', await score(p), MAIN_SCORE + 30);
  await p.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} }));
  await p.locator('#gcShare').click();
  await p.waitForTimeout(50);
  await p.locator('#gcShare').click();
}
const earn = async (p, c) => { await main(p, c); await quiz(p, ANSWERS); await share(p, c); };
const repeatQuiz = (p) => p.locator(QUIZ + ' .q').first().locator('.quizopt').nth(ANSWERS[0]).click();

export const scenarios = {
  entry: async ({ page: p, step, check: c }) => {
    await ready(p);
    c('Fresh score', await score(p), 0);
    await step('Choose correct first answer', () => p.locator(QUIZ + ' .q').first().locator('.quizopt').nth(ANSWERS[0]).click());
    await p.waitForTimeout(100);
    await p.reload();
    c('Session-only answer cleared on reload', await score(p), 0);
  },
  wrong: async ({ page: p, step, check: c }) => {
    await ready(p);
    const q = p.locator(QUIZ + ' .q').first();
    await step('Choose wrong answer', () => q.locator('.quizopt').nth(0).click());
    c('Wrong answer earns nothing', await score(p), 0);
    c('Explanation available', (await q.innerText()).includes('Не совсем'), true);
    await p.waitForTimeout(50);
    const b = q.locator('.quizopt').nth(ANSWERS[0]);
    await b.scrollIntoViewIfNeeded();
    const r = await b.boundingBox();
    await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    c('Repeated answer earns nothing', await score(p), 0);
  },
  reset: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Complete main action', () => main(p, c));
    c('Main action reward', await score(p), MAIN_SCORE);
    await step('Reset using browser new visit', () => p.reload());
    await main(p, c);
    c('Repeating after reset earns once', await score(p), MAIN_SCORE);
  },
  mobile: async ({ page: p, step, check: c, width }) => {
    await ready(p);
    await step('Complete page-specific action and quiz', () => earn(p, c));
    c('Maximum at ' + width, await score(p), 100);
    c('No horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },
  nojs: async ({ page: p, step, check: c }) => {
    await step('Read no-JavaScript explanation', () => p.locator('noscript p').first().scrollIntoViewIfNeeded());
    c('Static explanation visible', await p.locator('noscript p').first().isVisible(), true);
    c('Originals available without JavaScript', await p.locator('figure img').count() > 0, true);
  },
  score: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Earn all stated rewards', () => earn(p, c));
    c('Reachable maximum', await score(p), 100);
    await repeatQuiz(p);
    c('Repeat does not exceed maximum', await score(p), 100);
  },
  main: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Run subject-specific main action', () => main(p, c));
    c('Main action reward', await score(p), MAIN_SCORE);
    c('Used statements are disabled', await p.locator('.vp-card:disabled').count(), 6);
    c('Used dossier controls are disabled', await p.locator('#gcDossier button:disabled').count(), 3);
    c('No duplicate main reward', await score(p), MAIN_SCORE);
  },
  empty: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Inspect concrete activity contents', async () => {
      c('Three shelves offered', await p.locator('.vp-shelf').count(), 3);
      c('One shelf open', await p.locator('.vp-shelf.on').count(), 1);
      c('Six statements offered', await p.locator('.vp-card').count(), 6);
      c('No shelf filled yet', await p.locator('.vp-slot.on').count(), 0);
      c('Shelves announced as empty', (await p.locator('#vpRead').innerText()).includes('Три полки пусты'), true);
      c('Completion badge hidden', await p.locator('#vpDone').isVisible(), false);
      c('Three dossiers offered', await p.locator('#gcDossier button').count(), 3);
      c('Verdict hidden before the sorting', await p.locator('#gcVerdict').isVisible(), false);
    });
    c('Promised quiz count', await p.locator(QUIZ + ' .q').count(), ANSWERS.length);
  },
};
