/* План B6 для страницы музея русской архитектуры — muzei/arhitektura/dubrovicy.html.
   День 8 января, «Корона вместо купола — Дубровицы». Владелец — Дипсик 5 (deepseek5).

   Механики страницы (assets/dubrovicy-page.js), все на состоянии, без счёта:
     #observe — силуэт: [data-silhouette=built|removed] меняет кадр, подпись и статус;
                [data-answer] — вопрос «что венчает столп» с разбором ошибки;
     #game    — сборка верха снизу вверх: [data-layer] body→tower→crown→cross,
                [data-layer] не по порядку даёт подсказку, #layer-reset начинает заново;
     #quiz    — [data-quiz] один вопрос с разбором ошибки.

   Честная граница — в omissions: у страницы нет механики очков (нет ни #score, ни
   разметки наград), поэтому код score проверять нечем. Остальные семь сценариев
   написаны: там, где договор говорит «даёт очки и не начисляет повторно», страница
   проверяется по состоянию (кадр, подпись, собранная последовательность), потому что
   очков у неё нет, а поведение «повтор ничего не добавляет» — есть. Подмены зелёным
   нет: каждое утверждение — наблюдение настоящего поведения страницы. */

export const omissions = {
  score: 'У страницы нет механики очков: нет ни #score, ни разметки наград, ни знаменателя. ' +
         'Счёт из 100 проверять нечем — сценарий не написан, код остаётся НЕ ПРОВЕРЕНО. ' +
         'Это свойство выпуска, а не пробел доказательства: интерактивы дня работают на состоянии.',
};

const BUILT = 'media/dubrovicy/siluet-kak-postroeno.webp';
const REMOVED = 'media/dubrovicy/siluet-uslovno-bez-zaversheniya.webp';
const BUILT_TEXT = 'Показан силуэт храма с короной и крестом.';
const REMOVED_TEXT = 'Завершение снято условно: видно, что осталось бы от силуэта без короны.';
const LAYERS = ['body', 'tower', 'crown', 'cross'];

const shot = page => page.locator('#silhouette-image').getAttribute('src');
const statusText = page => page.locator('#silhouette-status').innerText();
const seqCount = page => page.locator('#layer-sequence span').count();
const feedback = page => page.locator('#layer-feedback').innerText();
const result = page => page.locator('#silhouette-result').innerText();
const put = (page, key) => page.locator(`[data-layer="${key}"]`).click();
const putAll = async page => { for (const key of LAYERS) await put(page, key); };
const reset = page => page.locator('#layer-reset').click();

export const scenarios = {
  async entry({page, check, step}) {
    check('Первый вход: показано «как построено»', await shot(page), BUILT);
    check('Первый вход: состояние силуэта объявлено', await statusText(page), BUILT_TEXT);
    check('Первый вход: последовательность не собрана', await seqCount(page), 0);
    check('Первый вход: итог пуст — пройденное не выдано заранее', await result(page), '');
    check('Первый вход: продолжение скрыто', await page.locator('#silhouette-finish').isHidden(), true);
    check('Первый вход: нажата только кнопка построенного вида',
      [await page.locator('[data-silhouette="built"]').getAttribute('aria-pressed'),
       await page.locator('[data-silhouette="removed"]').getAttribute('aria-pressed')], ['true', 'false']);
    await step('Открыть второе состояние силуэта', () => page.locator('[data-silhouette="removed"]').click());
    check('Второе состояние показывает условно снятое завершение', await shot(page), REMOVED);
    check('Состояние объяснено словами', await statusText(page), REMOVED_TEXT);
    check('Сравнение подсказывает ответить на вопрос',
      (await result(page)).includes('Оба состояния открыты'), true);
    await step('Новый вход в браузере', () => page.reload());
    check('Непройденное не выдаётся за пройденное после перезагрузки', await shot(page), BUILT);
    check('Последовательность после перезагрузки пуста', await seqCount(page), 0);
  },

  async wrong({page, check, step}) {
    await step('Назвать верхний ярус первым', () => put(page, 'cross'));
    check('Неверный ярус назван прямо', (await feedback(page)).includes('Пока нет.'), true);
    check('Подсказка объясняет порядок сборки',
      (await feedback(page)).includes('Крест ставят последним'), true);
    check('Неверный ярус не попал в последовательность', await seqCount(page), 0);
    await step('Повторить неверный ярус', () => put(page, 'cross'));
    check('Повтор неверного яруса ничего не добавляет', await seqCount(page), 0);
    await step('Неверный ответ в проверке понимания', () => page.locator('[data-quiz="dome"]').click());
    check('Неверный ответ проверки объяснён',
      (await page.locator('#quiz-feedback').innerText()).includes('Посмотри ещё раз'), true);
    check('Фактически верный ответ не назван ошибочным',
      (await page.locator('#quiz-feedback').innerText()).includes('корон'), true);
    await step('Верный ответ проверки', () => page.locator('[data-quiz="crown"]').click());
    check('Верный ответ подтверждён',
      (await page.locator('#quiz-feedback').innerText()).includes('Верно'), true);
  },

  async reset({page, check, step}) {
    await step('Собрать два нижних яруса', async () => { await put(page, 'body'); await put(page, 'tower'); });
    check('Два яруса собраны', await seqCount(page), 2);
    await step('Начать заново', () => reset(page));
    check('Сброс очищает последовательность', await seqCount(page), 0);
    check('Сброс возвращает исходную подсказку', await feedback(page), 'Выбери нижний ярус.');
    check('Сброс включает все ярусы снова',
      await page.locator('[data-layer]').evaluateAll(b => b.map(x => x.disabled)),
      [false, false, false, false]);
    await step('Повторить сборку после сброса', () => putAll(page));
    check('После сброса собирается ровно четыре яруса', await seqCount(page), 4);
    check('Сборка подтверждена словами',
      (await feedback(page)).includes('Последовательность собрана'), true);
    await step('Сбросить и начать снова', async () => { await reset(page); await put(page, 'body'); });
    check('Сброс не накапливает повторную сборку', await seqCount(page), 1);
  },

  async mobile({page, check, step, width}) {
    check(`Нет горизонтального переполнения на ${width}`, await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth), true);
    await step('Собрать верх храма снизу вверх', () => putAll(page));
    check(`Сборка даёт тот же результат на ${width}`, await seqCount(page), 4);
    check(`Итог сборки тот же на ${width}`,
      (await feedback(page)).includes('Последовательность собрана'), true);
    await step('Переключить силуэт', () => page.locator('[data-silhouette="removed"]').click());
    check(`Кадр переключился на ${width}`, await shot(page), REMOVED);
    check(`Подпись кадра та же на ${width}`,
      (await page.locator('#silhouette-caption').innerText()).includes('завершение снято по основанию короны'), true);
    await step('Ответить на вопрос о верхе', () => page.locator('[data-answer="crown"]').click());
    check(`Ответ принят одинаково на ${width}`, (await result(page)).includes('Верно'), true);
    check(`Продолжение открылось на ${width}`,
      await page.locator('#silhouette-finish').isVisible(), true);
  },

  async nojs({page, check}) {
    check('Вместо пустой игры — текстовый эквивалент', await page.locator('#game noscript').count(), 1);
    check('Текстовый эквивалент игры содержателен',
      (await page.locator('#game noscript p').textContent()).length > 120, true);
    check('Предметный текст дня читается без JavaScript',
      (await page.locator('#history').textContent()).length > 200, true);
    check('Текстовая альтернатива сравнению на месте без JavaScript',
      (await page.locator('#observe details.transcript p').textContent()).length > 200, true);
    check('Источники и права читаются без JavaScript',
      (await page.locator('#sources').textContent()).length > 100, true);
  },

  async main({page, check, step}) {
    await step('Снять завершение одним движением', () => page.locator('[data-silhouette="removed"]').click());
    check('Главный интерактив сменил кадр', await shot(page), REMOVED);
    await step('Вернуть построенный вид', () => page.locator('[data-silhouette="built"]').click());
    check('Главный интерактив возвращает исходный кадр', await shot(page), BUILT);
    await step('Ответить на главный вопрос дня', () => page.locator('[data-answer="crown"]').click());
    check('Главный ответ принят', (await result(page)).includes('Верно'), true);
    check('Продолжение маршрута открылось', await page.locator('#silhouette-finish').isVisible(), true);
    await step('Ответить повторно', () => page.locator('[data-answer="crown"]').click());
    check('Повтор не добавляет второй итог', await page.locator('#silhouette-result strong').count(), 1);
    check('Повтор не закрывает продолжение', await page.locator('#silhouette-finish').isVisible(), true);
  },

  async empty({page, check, step}) {
    check('Обещаны два состояния силуэта', await page.locator('[data-silhouette]').count(), 2);
    check('Обещаны четыре яруса сборки', await page.locator('[data-layer]').count(), 4);
    check('Обещаны три варианта ответа о верхе', await page.locator('[data-answer]').count(), 3);
    check('Обещаны три варианта проверки понимания', await page.locator('[data-quiz]').count(), 3);
    check('Обещаны два маршрута осмотра', await page.locator('[data-route]').count(), 2);
    await step('Осмотреть названия интерактивов', async () => {
      check('Главный интерактив назван', (await page.locator('#observe h2').innerText()).length > 10, true);
      check('Игра названа', (await page.locator('#game h2').innerText()).length > 10, true);
      check('Проверка понимания названа', (await page.locator('#quiz h2').innerText()).length > 10, true);
    });
    check('Подпись об источниках непустая', (await page.locator('#sources').innerText()).length > 100, true);
    check('Источники перечислены ссылками', await page.locator('#sources ol li a').count(), 4);
  },
};
