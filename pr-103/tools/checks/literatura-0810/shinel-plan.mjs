/* План B6 для muzei/literatura/lit-gogol-shinel.html (11 января).
   claude4, 09.10.2026, наряд stranicy-lit-0910; построен по плану 10 января (petr-plan.mjs).
   Механика по календарю — «Детектив деталей»: на рисунке Кустодиева «Акакий Акакиевич в новой
   шинели» пять мест (.spot); строка повести показывает, какое искать сейчас. Верное место — 8 баллов
   (f0…f4), неверное помечается и очков не даёт. Викторина — museum-quiz.js, пять вопросов
   по 12 (q0…q4). Итого 5×8 + 5×12 = 100. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const spot = (page, i) => page.locator('#detPic .spot').nth(i);

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

// Задания идут по порядку мест: текущему заданию k соответствует место k.
const findAll = async page => { for (let i = 0; i < 5; i++) await spot(page, i).click(); };
const earnAll = async page => {
  await findAll(page);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Первое задание', await page.locator('#detStep').innerText(), 'Деталь 1 из 5');
    await step('Найти воротник', () => spot(page, 0).click());
    check('Награда ровно за найденное: 8', await score(page), 8);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик деталей снова пуст', await page.locator('#detCount').innerText(), 'Найдено деталей: 0 из 5');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Нажать не то место (будка вместо воротника)', () => spot(page, 2).click());
    check('Подсказка показана', (await page.locator('#detHint').innerText()).trim().length > 15, true);
    check('Неверное место помечено', await spot(page, 2).evaluate(e => e.classList.contains('is-miss')), true);
    check('Верное место не объявлено ошибочным', await spot(page, 0).evaluate(e => e.classList.contains('is-miss')), false);
    check('Неверный выбор не даёт очков', await score(page), 0);
    check('Задание не сдвинулось', await page.locator('#detStep').innerText(), 'Деталь 1 из 5');
    await step('Повторно то же неверное место', () => spot(page, 2).click());
    check('Повтор не даёт очков', await score(page), 0);
    await step('Теперь верное место', () => spot(page, 0).click());
    check('Верное после ошибки даёт 8', await score(page), 8);
    check('Пометка ошибки снята', await spot(page, 2).evaluate(e => e.classList.contains('is-miss')), false);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 8);
  },

  async reset({page, check, step}) {
    await step('Найти воротник', () => spot(page, 0).click());
    check('Награда набрана', await score(page), 8);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Место снова не найдено', await spot(page, 0).evaluate(e => e.classList.contains('is-found')), false);
    await step('Повторить то же', () => spot(page, 0).click());
    check('Сброс не удваивает награду', await score(page), 8);
  },

  async mobile({page, check, step, width}) {
    await step('Пять деталей и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик деталей полон', await page.locator('#detCount').innerText(), 'Найдено деталей: 5 из 5');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Детектив без JavaScript — текстом: пять деталей', await page.locator('#det-text li').count(), 5);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 5 деталей по 8 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {f: [5, 8], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Мест на рисунке столько же, сколько наград', await page.locator('#detPic .spot').count(), 5);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('f' + i, 8); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Найти воротник из кошки', () => spot(page, 0).click());
    check('Место отмечено найденным', await spot(page, 0).evaluate(e => e.classList.contains('is-found')), true);
    check('Пояснение про куницу', /куниц/.test(await page.locator('#detWhy').innerText()), true);
    check('Следующее задание — шляпа', /шляпе/.test(await page.locator('#detQuote').innerText()), true);
    check('Найденное даёт 8', await score(page), 8);
    await step('Повторный клик по найденному', () => spot(page, 0).click());
    check('Повтор не начисляет дважды', await score(page), 8);
    await step('Найти шляпу', () => spot(page, 1).click());
    check('Две детали — 16', await score(page), 16);
    check('Список найденного', await page.locator('#detFound li').count(), 2);
    check('Счётчик', await page.locator('#detCount').innerText(), 'Найдено деталей: 2 из 5');
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Пять мест на рисунке', await page.locator('#detPic .spot').count(), 5);
    check('У каждого места есть подпись для экранного чтения',
      await page.locator('#detPic .spot[aria-label^="Место на рисунке"]').count(), 5);
    check('Задание — строка повести', (await page.locator('#detQuote').innerText()).length > 40, true);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 8 и 5 × 12)',
      /8 за каждую деталь.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 5);
  }
};
