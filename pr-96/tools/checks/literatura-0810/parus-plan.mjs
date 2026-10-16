/* План B6 для muzei/literatura/lit-kataev-parus.html (28 января).
   claude4, 12.10.2026, наряд stranicy-lit-0910; построен по плану 27 января (glupov-plan.mjs).
   Механика по календарю — «Таймлайн»: пять событий 1934–1936 годов, у каждого четыре кнопки-года
   (1933–1936). Верный год ставит событие на ленту рядом с выходом «Паруса» и даёт 8 баллов один раз
   (l0…l4); неверный год — подсказка «раньше/позже», кнопка гаснет, очков нет. Викторина —
   museum-quiz.js, пять вопросов по 12 (q0…q4). Итого 5×8 + 5×12 = 100. */

const YEARS = [1934, 1934, 1935, 1936, 1936];
const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const card = (page, i) => page.locator('#lenta .lt-card').nth(i);
const pick = (page, i, y) => card(page, i).locator(`.lt-y[data-y="${y}"]`).click();
const msg = (page, i) => card(page, i).locator('.lt-msg').innerText();

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};
const placeAll = async page => { for (let i = 0; i < 5; i++) await pick(page, i, YEARS[i]); };
const earnAll = async page => {
  await placeAll(page);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('На ленте только книга', await page.locator('#lentaAxis .lt-in li').count(), 1);
    await step('Челюскин — на 1934 год', () => pick(page, 0, 1934));
    check('Награда ровно за поставленное: 8', await score(page), 8);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик снова пуст', await page.locator('#ltCount').innerText(), 'На ленте: 0 из 5');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Челюскин — на 1933 год (неверно)', () => pick(page, 0, 1933));
    check('Подсказка направления', await msg(page, 0), 'Позже. Попробуй другой год.');
    check('Неверный год не даёт очков', await score(page), 0);
    check('Неверная кнопка гаснет', await card(page, 0).locator('.lt-y[data-y="1933"]').isDisabled(), true);
    await step('Челюскин — на 1936 год (неверно)', () => pick(page, 0, 1936));
    check('Подсказка в другую сторону', await msg(page, 0), 'Раньше. Попробуй другой год.');
    await step('Челюскин — на 1934 год', () => pick(page, 0, 1934));
    check('Верный год даёт 8', await score(page), 8);
    check('После верного ответа все кнопки закрыты', await card(page, 0).locator('.lt-y:enabled').count(), 0);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 8);
  },

  async reset({page, check, step}) {
    await step('Метро — на 1935 год', () => pick(page, 2, 1935));
    check('Награда набрана', await score(page), 8);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Кнопки года снова открыты', await card(page, 2).locator('.lt-y:enabled').count(), 4);
    await step('Повторить то же', () => pick(page, 2, 1935));
    check('Сброс не удваивает награду', await score(page), 8);
  },

  async mobile({page, check, step, width}) {
    await step('Пять событий на ленте и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик полон', await page.locator('#ltCount').innerText(), 'На ленте: 5 из 5');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Лента без JavaScript — текстом: пять событий', await page.locator('#lt-text li').count(), 5);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 событий по 8 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {l: [5, 8], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Событий на ленте столько же, сколько наград', await page.locator('#lenta .lt-card').count(), 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('l' + i, 8); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('«Сумбур вместо музыки» — на 1936 год', () => pick(page, 3, 1936));
    check('Пояснение с датой', (await msg(page, 3)).startsWith('28 января 1936 года.'), true);
    check('Событие легло в колонку 1936 года перед книгой',
      await page.locator('#lentaAxis [data-col="1936"] .lt-in li').first().innerText(), '28 января 1936 года — «Правда» печатает статью «Сумбур вместо музыки» — разгром оперы Шостаковича «Леди Макбет Мценского уезда».');
    check('Книга остаётся последней в колонке',
      await page.locator('#lentaAxis [data-col="1936"] .lt-in li').last().evaluate(e => e.classList.contains('lt-book')), true);
    check('Карточка отмечена', await card(page, 3).evaluate(e => e.classList.contains('is-done')), true);
    check('Верный год даёт 8', await score(page), 8);
    await step('Перелёт Чкалова — на 1936 год', () => pick(page, 4, 1936));
    check('Два события — 16', await score(page), 16);
    check('Счётчик', await page.locator('#ltCount').innerText(), 'На ленте: 2 из 5');
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Пять событий', await page.locator('#lenta .lt-card').count(), 5);
    check('У каждого ряда кнопок подпись для экранного чтения',
      await page.locator('#lenta .lt-ys[aria-label^="Выбери год"]').count(), 5);
    check('Четыре года у каждого события', await page.locator('#lenta .lt-y').count(), 20);
    check('Четыре колонки ленты', await page.locator('#lentaAxis .lt-col').count(), 4);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 8 и 5 × 12)',
      /8 за каждое событие.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 11);
  }
};
