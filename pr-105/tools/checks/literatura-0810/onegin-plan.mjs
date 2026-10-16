/* План B6 для muzei/literatura/lit-pushkin-evgeniy-onegin.html (9 января).
   claude4, 09.10.2026, наряд stranicy-lit-0910; построен по плану 8 января (liza-plan.mjs).
   Механика по календарю — «Черновик»: пять строк первой строфы листаются от черновых чтений
   к печатному тексту; строка, дочитанная до печати, даёт 8 баллов (d0…d4). Викторина —
   museum-quiz.js, пять вопросов по 12 (q0…q4). Итого 5×8 + 5×12 = 100. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const card = (page, i) => page.locator('#drafts .draft').nth(i);

// Ответить на текущий вопрос вариантом i и перейти к следующему.
const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

// Долистать строку черновика до печатного текста.
const toPrint = async (page, i) => {
  const next = card(page, i).locator('.d-next');
  while (await next.isEnabled()) await next.click();
};

// Полный набор уникальных наград: пять строк до печати и пять верных ответов.
const earnAll = async page => {
  for (let i = 0; i < 5; i++) await toPrint(page, i);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Черновик открыт на первом варианте',
      await card(page, 0).locator('.stage').innerText(), 'Черновик · вариант 1 из 1');
    await step('Долистать первую строку до печати', () => toPrint(page, 0));
    check('Награда ровно за пройденное: 8', await score(page), 8);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик строк снова пуст', await page.locator('#draftCount').innerText(), 'Строк дочитано до печати: 0 из 5');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    check('Назад с первого варианта нельзя', await card(page, 1).locator('.d-prev').isDisabled(), true);
    await step('Нажать «Раньше» на первом варианте силой', () => card(page, 1).locator('.d-prev').click({force: true}));
    check('Строка не сдвинулась', await card(page, 1).locator('.line').innerText(), 'С больным сидеть и день и ночь');
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
    await step('Первая строка до печати', () => toPrint(page, 0));
    check('Награда набрана', await score(page), 8);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Строка снова в черновике', await card(page, 0).locator('.line').evaluate(e => e.classList.contains('is-cross')), true);
    await step('Повторить то же', () => toPrint(page, 0));
    check('Сброс не удваивает награду', await score(page), 8);
  },

  async mobile({page, check, step, width}) {
    await step('Пять строк до печати и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик строк полон', await page.locator('#draftCount').innerText(), 'Строк дочитано до печати: 5 из 5');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Черновик без JavaScript — текстом: пять строк', await page.locator('#draft-text li').count(), 5);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 строк по 8 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {d: [5, 8], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Строк черновика столько же, сколько наград', await page.locator('#drafts .draft').count(), 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('d' + i, 8); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    const c = card(page, 1);
    await step('Листать правку: второй вариант', () => c.locator('.d-next').click());
    check('Показан второй черновой вариант', await c.locator('.line').innerText(), 'Смотреть за ним и день и ночь');
    check('Вариант помечен как зачёркнутый', await c.locator('.line').evaluate(e => e.classList.contains('is-cross')), true);
    check('Подпись этапа', await c.locator('.stage').innerText(), 'Черновик · вариант 2 из 3');
    check('Черновые варианты очков не дают', await score(page), 0);
    await step('Долистать до печати', () => toPrint(page, 1));
    check('В печати Пушкин вернулся к первому чтению', await c.locator('.line').innerText(), 'С больным сидеть и день и ночь');
    check('Печатная строка не зачёркнута', await c.locator('.line').evaluate(e => e.classList.contains('is-cross')), false);
    check('Подпись «В печати»', await c.locator('.stage').innerText(), 'В печати');
    check('Пояснение открыто', await c.locator('.why').isVisible(), true);
    check('Строка до печати даёт 8', await score(page), 8);
    await step('Назад и снова до печати', async () => { await c.locator('.d-prev').click(); await toPrint(page, 1); });
    check('Повтор не начисляет дважды', await score(page), 8);
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Пять строк черновика', await page.locator('#drafts .draft').count(), 5);
    check('У каждой строки есть кнопка листания', await page.locator('#drafts .d-next').count(), 5);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 8 и 5 × 12)',
      /8 за каждую строку черновика.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 5);
  }
};
