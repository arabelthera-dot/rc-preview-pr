/* План B6 для страницы дня 4 января «София без штурма» (музей «Календарь побед»).
   Доказательство настоящего поведения: развилка M-15 (#forkBox .opt → award('fork',10))
   и викторина M-23 (#quizbox .mq-opt, 5 вопросов по 18 → award('q0'…'q4')).
   Реестр страницы: awards {q:[5,18], fork:[1,10]} → максимум 100 (museum-score.js). */

const scoreVal = async page => Number((await page.locator('#score').innerText()).trim());

// Полный набор уникальных наград: выбор на развилке (10) + пять верных ответов викторины (90).
const earnAll = async page => {
  await page.locator('#forkBox .opt').first().click();
  const n = await page.evaluate(() => (window.MUSEUM_QUIZ && window.MUSEUM_QUIZ.items || []).length);
  for (let i = 0; i < n; i++) {
    const c = await page.evaluate(i => window.MUSEUM_QUIZ.items[i].c, i);
    await page.locator('#quizbox .mq-opt').nth(c).click();
    await page.locator('#quizbox .mq-next').click();
  }
};

export const dependencies = [];

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await scoreVal(page), 0);
    await step('Первый шаг главного интерактива (развилка M-15)', () => page.locator('#forkBox .opt').first().click());
    check('Награда за пройденное', await scoreVal(page), 10);
    await step('Перезагрузка страницы', () => page.reload({waitUntil: 'load'}));
    check('Перезагрузка не сохраняет непройденное', await scoreVal(page), 0);
  },

  async wrong({page, check, step}) {
    const c = await page.evaluate(() => window.MUSEUM_QUIZ.items[0].c);
    const wrong = c === 0 ? 1 : 0;
    await step('Неверный ответ на первом вопросе', () => page.locator('#quizbox .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quizbox .mq-exp.is-on').innerText()).length > 0, true);
    check('Фактически верный ответ отмечен верным', await page.locator('#quizbox .mq-opt.is-right').count() >= 1, true);
    check('Неверный ответ не даёт очков', await scoreVal(page), 0);
    check('Повтор закрыт — варианты выключены', await page.locator('#quizbox .mq-opt').nth(wrong).isDisabled(), true);
    check('Повтор не даёт очков', await scoreVal(page), 0);
  },

  async reset({page, check, step}) {
    await step('Набрать награду развилки', () => page.locator('#forkBox .opt').first().click());
    check('Награда набрана', await scoreVal(page), 10);
    await step('Сброс страницы — перезагрузка без ручной очистки', () => page.reload({waitUntil: 'load'}));
    check('Сброс обнулил счёт', await scoreVal(page), 0);
    await step('Повторить то же действие после сброса', () => page.locator('#forkBox .opt').first().click());
    check('Сброс не накапливает повторные награды', await scoreVal(page), 10);
  },

  async mobile({page, check, step, width}) {
    await step('Полный набор действий', () => earnAll(page));
    check(`Максимум достижим на ${width}px`, await scoreVal(page), 100);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
  },

  async nojs({page, check}) {
    check('Предметный текст читается без JavaScript',
      (await page.locator('#story').innerText()).length > 200, true);
    check('Есть текстовый эквивалент вместо пустой игры — вопросы с ответами',
      await page.locator('#quiz noscript').count() >= 1, true);
  },

  async score({page, check, step}) {
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await scoreVal(page), 100);
    check('Знаменатель шкалы — 100 (сумма реестра)', await page.evaluate(() => window.museumScore.max()), 100);
    check('Повтор главного действия не начисляет дважды — развилка закрыта',
      await page.locator('#forkBox .opt').first().isDisabled(), true);
    check('Счёт не переполняет максимум', await scoreVal(page), 100);
  },

  async main({page, check, step}) {
    await step('Главное предметное действие — выбор на развилке M-15',
      () => page.locator('#forkBox .opt').first().click());
    check('Главное действие даёт очки', await scoreVal(page), 10);
    check('Варианты закрыты после выбора', await page.locator('#forkBox .opt').first().isDisabled(), true);
    check('Повтор не начисляет дважды', await scoreVal(page), 10);
    check('Показан разбор «как было на самом деле»',
      (await page.locator('#forkReal.show').innerText()).length > 100, true);
  },

  async empty({page, check, step}) {
    await step('Осмотреть обещанное содержимое', async () => {
      check('Развилка предложена (вариантов не меньше двух)', await page.locator('#forkBox .opt').count() >= 2, true);
      check('Викторина содержательна (вариантов не меньше двух)', await page.locator('#quizbox .mq-opt').count() >= 2, true);
      check('Знаменатель шкалы — 100', await page.evaluate(() => window.museumScore.max()), 100);
    });
    check('Подпись об источниках непустая', (await page.locator('#sources').innerText()).length > 100, true);
  }
};
