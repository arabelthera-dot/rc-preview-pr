/* План B6 для muzei/literatura/lit-bek-volokolamskoe-shosse.html (3 января).
   Наряд literatura-bek-prava-0810 (ответ А), claude4, 08.10.2026. Каркас и счёт — как у
   1–2 января (museum-quiz.js, пять вопросов по 20). Главный интерактив другой:
   museum-fact-or-myth.js (M-97 «Документ, свидетельство или пересказ?»), очков не даёт —
   это проверяется в main. Верные ответы читаются из window.MUSEUM_QUIZ. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));

// Ответить на текущий вопрос вариантом i и перейти к следующему.
const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

// Полный набор уникальных наград: все пять вопросов — верно.
const earnAll = async page => {
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    const items = await quiz(page);
    await step('Верный ответ на первый вопрос', () => answer(page, items[0].c));
    check('Награда ровно за пройденное: 20', await score(page), 20);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Выбранный неверный не помечен верным',
      await page.locator('#quiz .mq-opt').nth(wrong).evaluate(e => e.classList.contains('is-wrong')), true);
    check('Неверный ответ не даёт очков', await score(page), 0);
    await step('Повторное нажатие (кнопки заблокированы)',
      () => page.locator('#quiz .mq-opt').nth(first.c).click({force: true}));
    check('Повтор не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    const items = await quiz(page);
    await step('Верный ответ на первый вопрос', () => answer(page, items[0].c));
    check('Награда набрана', await score(page), 20);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    await step('Повторить тот же ответ', () => answer(page, items[0].c));
    check('Сброс не удваивает награду', await score(page), 20);
  },

  async mobile({page, check, step, width}) {
    await step('Пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    // Пять моментов читаются подряд; подробности каждого — в своём <details>.
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Вместо пустой викторины и развилки — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина и разборы: 5 ответов + 4 разбора',
      await page.locator('#games-text details').count(), 9);
    check('Текстовый разбор «документ или пересказ» на месте',
      (await page.locator('#games-text').textContent()).includes('пересказ, а не подтверждённая цитата'), true);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 вопросов по 20', await page.evaluate(() => window.MUSEUM_SCORE.awards), {q: [5, 20]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => { for (let i = 0; i < 5; i++) window.award('q' + i, 20); }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    const items = await quiz(page);
    await step('Ответить на первую фразу «Документ или пересказ?»', () => page.locator('#factOrMyth .fm-opt').first().click());
    check('Разбор открыт', (await page.locator('#factOrMyth .fm-reveal').innerText()).includes('Серебрякова'), true);
    check('«Документ или пересказ» очков не даёт', await score(page), 0);
    await step('Пройти остальные фразы', async () => {
      for (let s = 0; s < 4; s++) {
        const next = page.locator('#factOrMyth .fm-next');
        if (await next.count()) await next.click();
        const opt = page.locator('#factOrMyth .fm-opt:not([disabled])').first();
        if (await opt.count()) await opt.click();
      }
    });
    check('И после всех фраз счёт 0', await score(page), 0);
    await step('Верный ответ на первый вопрос', () => page.locator('#quiz .mq-opt').nth(items[0].c).click());
    check('Вопрос о прочитанном даёт очки', await score(page), 20);
    await step('Повторное нажатие того же ответа', () => page.locator('#quiz .mq-opt').nth(items[0].c).click({force: true}));
    check('Повтор не начисляет дважды', await score(page), 20);
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('«Документ или пересказ» отрисован', await page.locator('#factOrMyth .fm-opt').count() > 0, true);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 20)',
      /пять вопросов о прочитанном, по\s*20/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 8);
  }
};
