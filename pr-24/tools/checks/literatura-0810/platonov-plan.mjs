/* План B6 для muzei/literatura/lit-platonov-kotlovan.html (5 января).
   claude4, 08.10.2026. Счёт: museum-find-word.js (find, 20 — одно верное слово «запятую»)
   + museum-quiz.js (четыре вопроса по 20). Главное действие — «Найди деталь»: промах
   объясняется и очков не даёт, находка даёт 20 один раз. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const picks = page => page.locator('#findWord .fw-pick');
const HIT = 3;   // «запятую»
const MISS = 0;  // «рапорт»

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

// Полный набор уникальных наград: найденное слово и все четыре вопроса — верно.
const earnAll = async page => {
  await picks(page).nth(HIT).click();
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Ни одно слово не отмечено до выбора', await page.locator('#findWord .is-hit, #findWord .is-miss').count(), 0);
    await step('Найти слово «запятую»', () => picks(page).nth(HIT).click());
    check('Награда ровно за пройденное: 20', await score(page), 20);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Слова снова не отмечены', await page.locator('#findWord .is-hit').count(), 0);
  },

  async wrong({page, check, step}) {
    await step('Нажать «рапорт» — не то слово', () => picks(page).nth(MISS).click());
    check('Разбор промаха показан', (await page.locator('#findWord .fw-why').innerText()).trim().length > 60, true);
    check('Промах помечен как промах', await picks(page).nth(MISS).evaluate(e => e.classList.contains('is-miss')), true);
    check('Промах не даёт очков', await score(page), 0);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ не даёт очков', await score(page), 0);
    await step('Повторное нажатие (кнопки заблокированы)',
      () => page.locator('#quiz .mq-opt').nth(first.c).click({force: true}));
    check('Повтор не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    await step('Найти слово', () => picks(page).nth(HIT).click());
    check('Награда набрана', await score(page), 20);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    await step('Найти то же слово ещё раз', () => picks(page).nth(HIT).click());
    check('Сброс не удваивает награду', await score(page), 20);
  },

  async mobile({page, check, step, width}) {
    await step('Слово и четыре верных ответа', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 4 из 4.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript', (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('#five-stories details').count(), 5);
    check('Вместо пустых игр — текстовый эквивалент', (await page.locator('#games').innerText()).length > 400, true);
    check('Фраза из повести и разбор слов без JavaScript',
      (await page.locator('#games-text blockquote').innerText()).includes('запятую'), true);
    check('Текстовая викторина: разбор слов + четыре ответа', await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: слово 20 + 4 вопроса по 20', await page.evaluate(() => window.MUSEUM_SCORE.awards), {find: 20, q: [4, 20]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 4);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      window.award('find', 20); for (let i = 0; i < 4; i++) window.award('q' + i, 20);
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Нажать «плоту» — событие повести, не след бумаги', () => picks(page).nth(2).click());
    check('Промах объяснён и без очков', await score(page), 0);
    await step('Найти «запятую»', () => picks(page).nth(HIT).click());
    check('Находка даёт 20', await score(page), 20);
    check('Сравнение двух документов открылось',
      (await page.locator('#findWord .fw-after').innerText()).includes('кулачества, как класса'), true);
    await step('Ещё одно слово после находки', () => picks(page).nth(4).click());
    check('Повтор не начисляет дважды', await score(page), 20);
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3]);
    check('В отрывке пять слов-кандидатов', await picks(page).count(), 5);
    check('Источник отрывка подписан', (await page.locator('#findWord .fw-src').innerText()).includes('Платонов'), true);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (20 + 4 × 20)',
      /20 за найденное слово и по 20 за четыре вопроса/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 7);
  }
};
