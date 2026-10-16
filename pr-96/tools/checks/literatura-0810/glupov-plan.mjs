/* План B6 для muzei/literatura/lit-saltykov-istoriya-goroda.html (27 января).
   claude4, 12.10.2026, наряд stranicy-lit-0910; построен по плану 25 января (levsha-plan.mjs).
   Механика по календарю — «Гротеск»: у пяти градоначальников бегунок (input[type=range], 0…2)
   «как в хронике» → «преувеличение» → «гротеск Щедрина». Бегунок, доведённый до гротеска, даёт 8
   баллов один раз (g0…g4); назад и снова вперёд — без повторной награды. Викторина — museum-quiz.js,
   пять вопросов по 12 (q0…q4). Итого 5×8 + 5×12 = 100. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const range = (page, i) => page.locator('#grotesk .gr-range').nth(i);
const slide = (page, i, v) => range(page, i).fill(String(v));
const text = (page, i) => page.locator('#grotesk .gr-text').nth(i).innerText();

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};
const slideAll = async page => { for (let i = 0; i < 5; i++) await slide(page, i, 2); };
const earnAll = async page => {
  await slideAll(page);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Все бегунки на «хронике»', await page.locator('#grotesk .gr-range').evaluateAll(r => r.map(x => x.value)), ['0', '0', '0', '0', '0']);
    await step('Первый бегунок до гротеска', () => slide(page, 0, 2));
    check('Награда ровно за пройденное: 8', await score(page), 8);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик снова пуст', await page.locator('#grCount').innerText(), 'Пройдено до гротеска: 0 из 5');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Первый бегунок только до «преувеличения»', () => slide(page, 0, 1));
    check('Текст сменился на преувеличение', (await text(page, 0)).includes('всего два слова'), true);
    check('Середина пути не даёт очков', await score(page), 0);
    check('Пояснение ещё не показано', (await page.locator('#grotesk .gr-why').first().innerText()).trim(), '');
    await step('Дальше — до гротеска', () => slide(page, 0, 2));
    check('Гротеск даёт 8', await score(page), 8);
    await step('Назад к хронике и снова к гротеску', async () => { await slide(page, 0, 0); await slide(page, 0, 2); });
    check('Повтор не начисляет дважды', await score(page), 8);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 8);
  },

  async reset({page, check, step}) {
    await step('Первый бегунок до гротеска', () => slide(page, 0, 2));
    check('Награда набрана', await score(page), 8);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Бегунок снова на «хронике»', await range(page, 0).inputValue(), '0');
    await step('Повторить то же', () => slide(page, 0, 2));
    check('Сброс не удваивает награду', await score(page), 8);
  },

  async mobile({page, check, step, width}) {
    await step('Пять бегунков и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик полон', await page.locator('#grCount').innerText(), 'Пройдено до гротеска: 5 из 5');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Гротеск без JavaScript — текстом: пять градоначальников', await page.locator('#gr-text li').count(), 5);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 бегунков по 8 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {g: [5, 8], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Бегунков столько же, сколько наград', await page.locator('#grotesk .gr-range').count(), 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('g' + i, 8); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    check('Сначала — строка «как в хронике»', (await text(page, 0)).includes('немногословен'), true);
    await step('Органчик: бегунок до гротеска', () => slide(page, 0, 2));
    check('Подлинная строка Щедрина', (await text(page, 0)).includes('органчик'), true);
    check('Пояснение самого Щедрина', /романсами/.test(await page.locator('#grotesk .gr-why').first().innerText()), true);
    check('Карточка отмечена пройденной', await page.locator('#grotesk .gr-card').first().evaluate(e => e.classList.contains('is-done')), true);
    check('Гротеск даёт 8', await score(page), 8);
    await step('Прыщ: бегунок до гротеска', () => slide(page, 1, 2));
    check('Два бегунка — 16', await score(page), 16);
    check('Счётчик', await page.locator('#grCount').innerText(), 'Пройдено до гротеска: 2 из 5');
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Пять бегунков', await page.locator('#grotesk .gr-range').count(), 5);
    check('У каждого бегунка подпись для экранного чтения',
      await page.locator('#grotesk .gr-range[aria-label^="Бегунок:"]').count(), 5);
    check('Три деления шкалы у каждого', await page.locator('#grotesk .gr-scale span').count(), 15);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 8 и 5 × 12)',
      /8 за каждый бегунок.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 5);
  }
};
