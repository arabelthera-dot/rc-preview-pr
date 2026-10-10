// B6 acceptance plan for day 12 — «Одна картинка — три противоположные подписи» (Музей карикатуры).
// Self-contained: shared assertions cover only the shared quiz/score contracts.
export const dependencies = [];
const QUIZ = '#gcQuiz';
const ANSWERS = [1, 2, 0];
const MAIN_SCORE = 65; // first three captions (3×5) + three dossiers (3×10) + three assembled versions (20)
// Each version is assembled from its own two captions: headline on top, replica below.
const VERSIONS = [
  { v: 'praise', keys: ['hp', 'rp'] },
  { v: 'joke',   keys: ['hj', 'rj'] },
  { v: 'accuse', keys: ['ha', 'ra'] },
];
const ALIEN_KEY = 'hj'; // belongs to «Бытовая шутка», not to the version open at the start
const score = async (p) => Number(await p.locator('#headScore').innerText());
const ready = async (p) => { await p.emulateMedia({ reducedMotion: 'reduce' }); };
async function quiz(p, answers) {
  for (const [i, a] of answers.entries()) {
    await p.locator(QUIZ + ' .q').nth(i).locator('.quizopt').nth(a).click();
  }
}
async function main(p, c) {
  // A caption of another version must be refused while a different version is open.
  await p.locator('.key-btn[data-k="' + ALIEN_KEY + '"]').first().click();
  if (c) {
    c('Caption of another version earns nothing', await score(p), 0);
    c('Wrong version is explained', await p.locator('.key-notes .key-note.miss').count(), 1);
  }
  for (const { v, keys } of VERSIONS) {
    await p.locator('.vd-tab[data-v="' + v + '"]').first().click();
    for (const k of keys) {
      await p.locator('.key-btn[data-k="' + k + '"]').first().click();
    }
  }
  if (c) {
    c('Six captions placed', await p.locator('.key-btn.on').count(), 6);
    c('Reading reports all three versions', (await p.locator('#vdRead').innerText()).includes('Все три версии собраны'), true);
    c('Completion badge shown', await p.locator('#vdDone').isVisible(), true);
  }
  const d = p.locator('#gcDossier button');
  for (let i = 0; i < 3; i++) await d.nth(i).click();
  if (c) {
    c('Three dossiers opened', await p.locator('#gcDossier .gc-doc').count(), 3);
    c('Verdict says the drawing never changed', await p.locator('#gcVerdictText').innerText().then((s) => s.includes('Все три версии собраны')), true);
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
    c('Used captions are disabled', await p.locator('.key-btn:disabled').count(), 6);
    c('Used dossier controls are disabled', await p.locator('#gcDossier button:disabled').count(), 3);
    c('No duplicate main reward', await score(p), MAIN_SCORE);
  },
  empty: async ({ page: p, step, check: c }) => {
    await ready(p);
    await step('Inspect concrete activity contents', async () => {
      c('Three versions offered', await p.locator('.vd-tab').count(), 3);
      c('One version open', await p.locator('.vd-tab.on').count(), 1);
      c('Six caption cards offered', await p.locator('.key-btn').count(), 6);
      c('Sheets start empty', (await p.locator('#vdTop').innerText()).includes('Пока не выбран'), true);
      c('Sheet announced as unsigned', (await p.locator('#vdRead').innerText()).includes('Лист пока без подписи'), true);
      c('Completion badge hidden', await p.locator('#vdDone').isVisible(), false);
      c('Three dossiers offered', await p.locator('#gcDossier button').count(), 3);
      c('Verdict hidden before assembly', await p.locator('#gcVerdict').isVisible(), false);
    });
    c('Promised quiz count', await p.locator(QUIZ + ' .q').count(), ANSWERS.length);
  },
};
