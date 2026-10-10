/* План B6 для страницы музея русской архитектуры — muzei/arhitektura/tsaritsyno.html.
   День 9 января, «Дворец, который приказали сломать — Царицыно».
   Владелец — Дипсик 5 (deepseek5), выпуск 10.10.2026.

   Механики страницы:
     #observe — главное действие M-49 «Timeline одного места»: три кнопки [data-era]
                (bazhenov → kazakov → museum) меняют кадр #timeline-image, подпись
                #timeline-caption, состояние #timeline-status и строку #timeline-change;
                вопрос [data-answer] с разбором ошибки; награда за все три состояния;
     #game    — порядок-игра: [data-era-order] bazhenov → kazakov → museum,
                #era-sequence собирает последовательность, #era-reset начинает заново;
     #quiz    — [data-quiz] один вопрос с разбором ошибки.

   Счёт — общий движок assets/museum-score.js: страница объявляет реестр наград
   (window.MUSEUM_SCORE.awards) и вызывает window.award() через window.MUSEUM_AWARDS.
   Реестр: states 25 + answer 25 + order 30 + quiz 20 = 100. Другой механики очков нет.
   Награды хранятся в памяти страницы: перезагрузка обнуляет счёт, повтор действия
   очков не добавляет (движок начисляет каждую награду один раз). */

const score = page => page.locator('#score').innerText().then(Number);
const seqCount = page => page.locator('#era-sequence span').count();
const result = page => page.locator('#timeline-result').innerText();
const feedback = page => page.locator('#era-feedback').innerText();
const quizFeedback = page => page.locator('#quiz-feedback').innerText();

const press = async (page, key) => {
  const button = page.locator(`[data-era="${key}"]`);
  await button.scrollIntoViewIfNeeded();
  await button.click();
};
const put = async (page, key) => {
  const button = page.locator(`[data-era-order="${key}"]`);
  await button.scrollIntoViewIfNeeded();
  await button.click();
};

/* Полный набор наград дня: три состояния, верный ответ, собранный порядок, верная викторина. */
const earnAll = async page => {
  await press(page, 'kazakov');
  await press(page, 'museum');
  await page.locator('[data-answer="ukaz"]').click();
  await put(page, 'bazhenov');
  await put(page, 'kazakov');
  await put(page, 'museum');
  await page.locator('[data-quiz="ukaz"]').click();
};

export const scenarios = {
  async entry({page, check, step}) {
    check('Первый вход: счёт 0 — наград за непройденное нет', await score(page), 0);
    check('Первый вход: открыто первое состояние',
      [await page.locator('[data-era="bazhenov"]').getAttribute('aria-pressed'),
        await page.locator('[data-era="kazakov"]').getAttribute('aria-pressed'),
        await page.locator('[data-era="museum"]').getAttribute('aria-pressed')],
      ['true', 'false', 'false']);
    check('Первый вход: порядок не собран', await seqCount(page), 0);
    check('Первый вход: итог вопроса пуст', await result(page), '');
    check('Первый вход: продолжение скрыто', await page.locator('#timeline-finish').isHidden(), true);
    await step('Открыть второе состояние', () => press(page, 'kazakov'));
    check('Двух состояний для награды мало', await score(page), 0);
    await step('Открыть третье состояние', () => press(page, 'museum'));
    check('Три состояния дают награду 25', await score(page), 25);
    check('Строка «что изменилось» сменилась на современную',
      (await page.locator('#timeline-change').innerText()).includes('Реставрация Большого дворца завершена'), true);
    await step('Новый вход в браузере', () => page.reload());
    check('Перезагрузка не сохраняет пройденное', await score(page), 0);
    check('Первое состояние вернулось', await page.locator('[data-era="bazhenov"]').getAttribute('aria-pressed'), 'true');
    check('Порядок после перезагрузки пуст', await seqCount(page), 0);
  },

  async wrong({page, check, step}) {
    await step('Назвать письмо о залах документом о разборке',
      () => page.locator('[data-answer="pismo"]').click());
    check('Неверный ответ объяснён', (await result(page)).startsWith('Посмотри ещё раз.'), true);
    check('Неверный ответ не даёт очков', await score(page), 0);
    await step('Повторить неверный ответ', () => page.locator('[data-answer="pismo"]').click());
    check('Повтор неверного ответа не даёт очков', await score(page), 0);
    check('Верный вариант не объявлен ошибочным',
      await page.locator('[data-answer="ukaz"]').isDisabled(), false);
    await step('Неверный ответ в проверке понимания',
      () => page.locator('[data-quiz="pavel"]').click());
    check('Викторина объясняет ошибку', (await quizFeedback(page)).startsWith('Посмотри ещё раз.'), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 0);
    await step('Повторить неверный ответ викторины',
      () => page.locator('[data-quiz="pavel"]').click());
    check('Повтор не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    await step('Собрать порядок состояний', async () => {
      await put(page, 'bazhenov');
      await put(page, 'kazakov');
      await put(page, 'museum');
    });
    check('Собранный порядок даёт 30', await score(page), 30);
    check('Последовательность собрана из трёх шагов', await seqCount(page), 3);
    await step('Начать заново', () => page.locator('#era-reset').click());
    check('Последовательность очищена', await seqCount(page), 0);
    check('Подсказка вернулась к началу', await feedback(page), 'Выбери первое состояние места.');
    check('Кнопки снова доступны', await page.locator('[data-era-order="museum"]').isDisabled(), false);
    await step('Повторить порядок после сброса', async () => {
      await put(page, 'bazhenov');
      await put(page, 'kazakov');
      await put(page, 'museum');
    });
    check('Сброс не накапливает награду', await score(page), 30);
  },

  async mobile({page, check, step, width}) {
    await step('Полный набор действий дня', () => earnAll(page));
    check(`Максимум на ширине ${width}`, await score(page), 100);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('Текстовый эквивалент игры вместо пустой обещанной игры',
      await page.locator('#game noscript').count(), 1);
    check('Текстовый эквивалент читается без JavaScript',
      (await page.locator('#game noscript').innerText()).length > 150, true);
    check('Текстовая альтернатива переключению состояний читается',
      (await page.locator('#observe details.transcript').textContent()).length > 300, true);
    check('Предметный текст страницы на месте',
      (await page.locator('#history').innerText()).length > 200, true);
  },

  async score({page, check, step}) {
    check('Объявленный реестр наград — шкала из 100',
      await page.evaluate(() => {
        const m = window.MUSEUM_SCORE || {};
        return Object.values(m.awards || {}).reduce((a, b) => a + b, 0);
      }), 100);
    check('Знаменатель в разметке — 100',
      (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    check('Движок подтверждает максимум', await page.evaluate(() => window.museumScore.max()), 100);
    check('Движок подтверждает набранное', await page.evaluate(() => window.museumScore.value()), 100);
    await step('Повторить главное действие', () => press(page, 'bazhenov'));
    await step('Повторить викторину', () => page.locator('[data-quiz="ukaz"]').click());
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Главное предметное действие — переключение состояний', async () => {
      await press(page, 'kazakov');
      await press(page, 'museum');
    });
    check('Главное действие даёт очки', await score(page), 25);
    await step('Повтор главного действия', () => press(page, 'bazhenov'));
    check('Повтор не начисляет дважды', await score(page), 25);
  },

  async empty({page, check, step}) {
    await step('Осмотреть обещанное содержимое', async () => {
      check('Три состояния одного места', await page.locator('[data-era]').count(), 3);
      check('Четыре масштаба показа', await page.locator('#four-scales .evidence-grid > *').count(), 4);
      check('Три варианта ответа о документе', await page.locator('#observe [data-answer]').count(), 3);
      check('Три варианта в проверке понимания', await page.locator('[data-quiz]').count(), 3);
      check('Вводный фильм имеет расшифровку',
        (await page.locator('#rolik details.transcript').textContent()).length > 200, true);
    });
    check('Подпись об источниках содержательна',
      (await page.locator('#sources').innerText()).length > 300, true);
    check('Подпись об источниках называет документ и версию',
      (await page.locator('#sources').innerText()).includes('РГАДА'), true);
  },
};
