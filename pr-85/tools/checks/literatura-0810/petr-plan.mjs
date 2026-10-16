/* План B6 для muzei/literatura/lit-tolstoy-petr-pervyy.html (10 января).
   claude4, 09.10.2026, наряд stranicy-lit-0910; построен по плану 9 января (onegin-plan.mjs).
   Механика по календарю — «Лента времени»: пять шагов работы Толстого над Петром (1917–1943);
   к каждому читатель выбирает, что в тот же год происходило в мире. Верный выбор — 8 баллов
   (t0…t4), неверный вариант гаснет, очков не даёт. Викторина — museum-quiz.js, пять вопросов
   по 12 (q0…q4). Итого 5×8 + 5×12 = 100. */

const RIGHT = [0, 1, 2, 0, 1];
const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const card = (page, i) => page.locator('#lenta .lenta-item').nth(i);
const opt = (page, i, j) => card(page, i).locator('.opts button').nth(j);

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

// Верный выбор на шаге ленты.
const pick = (page, i) => opt(page, i, RIGHT[i]).click();

const earnAll = async page => {
  for (let i = 0; i < 5; i++) await pick(page, i);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Лента не пройдена', await page.locator('#lentaCount').innerText(), 'Шагов пройдено: 0 из 5');
    await step('Верный выбор на первом шаге', () => pick(page, 0));
    check('Награда ровно за пройденное: 8', await score(page), 8);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик шагов снова пуст', await page.locator('#lentaCount').innerText(), 'Шагов пройдено: 0 из 5');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Неверный вариант на шаге 1917', () => opt(page, 0, 1).click());
    check('Объяснение показано', (await card(page, 0).locator('.hint').innerText()).trim().length > 20, true);
    check('Неверный вариант помечен', await opt(page, 0, 1).evaluate(e => e.classList.contains('is-wrong')), true);
    check('Верный вариант не объявлен ошибочным', await opt(page, 0, 0).evaluate(e => e.classList.contains('is-wrong')), false);
    check('Неверный выбор не даёт очков', await score(page), 0);
    await step('Повторное нажатие на погасший вариант', () => opt(page, 0, 1).click({force: true}));
    check('Повтор не даёт очков', await score(page), 0);
    await step('Теперь верный вариант', () => pick(page, 0));
    check('Верный после ошибки даёт 8', await score(page), 8);
    check('Пояснение с источником открыто', await card(page, 0).locator('.why').isVisible(), true);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 8);
  },

  async reset({page, check, step}) {
    await step('Первый шаг ленты', () => pick(page, 0));
    check('Награда набрана', await score(page), 8);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Шаг снова не пройден', await card(page, 0).evaluate(e => e.classList.contains('is-done')), false);
    await step('Повторить то же', () => pick(page, 0));
    check('Сброс не удваивает награду', await score(page), 8);
  },

  async mobile({page, check, step, width}) {
    await step('Пять шагов ленты и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик шагов полон', await page.locator('#lentaCount').innerText(), 'Шагов пройдено: 5 из 5');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Лента без JavaScript — текстом: пять шагов', await page.locator('#lenta-text li').count(), 5);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 шагов по 8 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {t: [5, 8], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Шагов ленты столько же, сколько наград', await page.locator('#lenta .lenta-item').count(), 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('t' + i, 8); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    const c = card(page, 2);
    check('Шаг 1929: три варианта', await c.locator('.opts button').count(), 3);
    await step('Неверный: начало Второй мировой', () => opt(page, 2, 0).click());
    check('Неверный очков не даёт', await score(page), 0);
    await step('Верный: крах Нью-Йоркской биржи', () => pick(page, 2));
    check('Шаг пройден', await c.evaluate(e => e.classList.contains('is-done')), true);
    check('Пояснение называет Великую депрессию', /Великую депрессию/.test(await c.locator('.why').innerText()), true);
    check('Верный выбор даёт 8', await score(page), 8);
    check('Кнопки шага заблокированы', await c.locator('.opts button:not([disabled])').count(), 0);
    await step('Повторный клик по верному силой', () => opt(page, 2, 2).click({force: true}));
    check('Повтор не начисляет дважды', await score(page), 8);
    check('Счётчик шагов', await page.locator('#lentaCount').innerText(), 'Шагов пройдено: 1 из 5');
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Пять шагов ленты', await page.locator('#lenta .lenta-item').count(), 5);
    check('У каждого шага три варианта', await page.locator('#lenta .opts button').count(), 15);
    check('У каждого шага ссылка на источник', await page.locator('#lenta .why a').count(), 5);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 8 и 5 × 12)',
      /8 за каждый верно угаданный шаг.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 7);
  }
};
