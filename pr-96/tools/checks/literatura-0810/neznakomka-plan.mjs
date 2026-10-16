/* План B6 для muzei/literatura/lit-blok-neznakomka.html (26 января).
   Наряд stranicy-lit-0910, claude4, 12.10.2026. Построен по плану 23 января
   (oblomov-plan.mjs): museum-quiz.js (пять вопросов по 20, MUSEUM_SCORE.awards = {q:[5,20]})
   и museum-audioguide.js. Механика дня — «Аудиогид: кадр и подпись меняются по ходу»:
   под плеером блок #agScene из четырёх кадров; кадр переключается вместе с остановкой
   (кнопки .agnav и timeupdate звука). Кадры баллов не дают — очки из викторины. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};

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
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Без JavaScript видны все четыре кадра', await page.locator('#agScene figure:visible').count(), 4);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
    check('Стихотворение доступно без JavaScript',
      (await page.locator('#stih').innerText()).includes('Дыша духами и туманами'), true);
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
    check('Аудиогид показывает остановки', await page.locator('#audioguide').innerText().then(t => t.includes('Шелка и вуаль')), true);
    check('Сначала показан первый кадр', await page.locator('#agScene figure.on').getAttribute('data-f'), '0');
    check('Без звука виден только один кадр', await page.locator('#agScene figure:visible').count(), 1);
    await step('Остановка 3 аудиогида', () => page.locator('#audioguide .agnav button').nth(2).click());
    check('Кадр сменился на третий', await page.locator('#agScene figure.on').getAttribute('data-f'), '2');
    check('Подпись кадра сменилась', (await page.locator('#agScene figure.on figcaption').innerText()).includes('Автограф Блока'), true);
    check('Счётчик кадров', await page.locator('#agSceneK').innerText(), 'Кадр 3 из 4');
    check('Кадры не дают очков', await score(page), 0);
    await step('Верный ответ на первый вопрос', () => page.locator('#quiz .mq-opt').nth(items[0].c).click());
    check('Вопрос о прочитанном даёт очки', await score(page), 20);
    await step('Повторное нажатие того же ответа', () => page.locator('#quiz .mq-opt').nth(items[0].c).click({force: true}));
    check('Повтор не начисляет дважды', await score(page), 20);
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (5 × 20)',
      /пять вопросов о прочитанном, по\s*20/.test(await page.locator('#games .source').innerText()), true);
    check('Четыре кадра под аудиогидом', await page.locator('#agScene figure').count(), 4);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 5);
  }
};
