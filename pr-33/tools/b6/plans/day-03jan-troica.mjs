/* План B6 для страницы музея «Календарь побед» —
   muzei/kalendar-pobed/day-03jan-troica.html («Монастырь выстоял», снятие осады
   Троице-Сергиева монастыря, январь 1610).

   Механики страницы:
     #timeline — M-74 «Таймлайн / лента параллельных событий»: шесть кадров обороны
                 (враг у стен → осада снята). Очков не даёт — это лента-хроника, а не
                 игра, поэтому в B6 она проверяется только на содержательность, в
                 сценарии empty: шесть кадров и текстовый эквивалент #tlDesc.
     #quiz     — викторина движка assets/museum-quiz.js: пять вопросов по 20 очков.
     #score    — шкала движка assets/museum-score.js; реестр страницы
                 awards:{q:[5,20]} даёт максимум 5 × 20 = 100.

   Что здесь честно, а что нет:
   - Единственный начисляющий интерактив дня — викторина. Главным предметным действием
     (main) взято «ответить на вопрос»: лента обороны очков не даёт, и объявлять главным
     то, что не начисляет, значило бы подменить предмет проверки.
   - «Начать заново» (reset) на странице — перезагрузка: отдельной кнопки сброса у движка
     викторины нет, прогресс между загрузками не сохраняется. Сценарий проверяет именно
     это. Если у страницы появится своя кнопка сброса, сценарий обязан переехать на неё.
   - wrong проверяет не только «нет очков», но и что верный вариант не назван ошибочным:
     у движка после ответа гасятся ВСЕ кнопки, поэтому признак — класс is-right на верном
     варианте, а не доступность кнопки.

   Порядок верных ответов — из разметки страницы (MUSEUM_QUIZ.items[].c): 1, 2, 0, 1, 0.
   Он нарочно не одинаковый: викторина, где верный ответ всегда первый, — брак подачи. */

const CORRECT = [1, 2, 0, 1, 0];

const score = async page => Number((await page.locator('#score').innerText()).trim());

const opt = (page, i) => page.locator('#quiz .mq-opts .mq-opt').nth(i);

// Один вопрос: выбрать вариант и перейти к следующему.
const answer = async (page, i) => {
  await opt(page, CORRECT[i]).click();
  await page.locator('#quiz .mq-next').click();
};

// Полный набор наград: пять верных ответов подряд.
const quizAll = async page => {
  for (let i = 0; i < CORRECT.length; i++) await answer(page, i);
};

export const scenarios = {
  async entry({page, check, step}) {
    check('Первый вход: счёт 0', await score(page), 0);
    check('Викторина стоит на первом вопросе',
      (await page.locator('#quiz .mq-step').innerText()).trim(), '1 / 5');
    check('У вопроса три варианта', await page.locator('#quiz .mq-opts .mq-opt').count(), 3);
    check('Пояснение ещё не показано',
      (await page.locator('#quiz .mq-exp').innerText()).trim(), '');
    await step('Ответить на первый вопрос', () => answer(page, 0));
    check('Награда за пройденный вопрос', await score(page), 20);
    check('Викторина перешла ко второму',
      (await page.locator('#quiz .mq-step').innerText()).trim(), '2 / 5');
    await step('Новый вход в браузере', () => page.reload());
    check('Непройденное не выдаётся за пройденное', await score(page), 0);
    check('Викторина вернулась к началу',
      (await page.locator('#quiz .mq-step').innerText()).trim(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Неверный ответ на первый вопрос', () => opt(page, 0).click());
    check('Неверный ответ не даёт очков', await score(page), 0);
    check('Ошибка объяснена',
      (await page.locator('#quiz .mq-exp').innerText()).length > 40, true);
    check('Верный вариант помечен верным',
      await opt(page, CORRECT[0]).evaluate(el => el.classList.contains('is-right')), true);
    check('Неверный вариант помечен неверным',
      await opt(page, 0).evaluate(el => el.classList.contains('is-wrong')), true);
    check('Верный вариант не объявлен ошибочным',
      await opt(page, CORRECT[0]).evaluate(el => el.classList.contains('is-wrong')), false);
    check('Движок погасил варианты после ответа', await opt(page, 0).isDisabled(), true);
    await step('Повтор неверного ответа', () => opt(page, 0).click({force: true}));
    check('Повтор неверного ответа не даёт очков', await score(page), 0);
  },

  async reset({page, check, step}) {
    await step('Набрать награду за первый вопрос', () => answer(page, 0));
    check('Награда набрана', await score(page), 20);
    await step('Начать заново без ручной очистки браузера', () => page.reload());
    check('После начала заново счёт пуст', await score(page), 0);
    await step('Повторить то же действие', () => answer(page, 0));
    check('Награда не удвоилась', await score(page), 20);
  },

  async mobile({page, check, step, width}) {
    await step('Полный набор верных ответов', () => quizAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    check('Викторина дошла до конца',
      (await page.locator('#quiz .mq-done').innerText()).includes('верных 5 из 5'), true);
  },

  async nojs({page, check, step}) {
    check('Предметный рассказ читается без JavaScript',
      (await page.locator('#story').innerText()).length > 500, true);
    check('Источники читаются без JavaScript',
      (await page.locator('#sources').innerText()).length > 300, true);
    await step('Найти текстовый эквивалент вместо викторины',
      () => page.locator('#quiz noscript').scrollIntoViewIfNeeded());
    check('Есть текстовый эквивалент вместо пустой обещанной викторины',
      await page.locator('#quiz noscript').count(), 1);
    check('Текстовый эквивалент несёт все пять ответов',
      (await page.locator('#quiz noscript').innerText()).includes('12 (22) января 1610 года'), true);
  },

  async score({page, check, step}) {
    await step('Полный набор уникальных наград', () => quizAll(page));
    check('Объявленный максимум 100 достижим', await score(page), 100);
    check('Знаменатель шкалы — 100',
      (await page.locator('#scoreBox').innerText()).includes('/ 100'), true);
    await step('Пройти викторину второй раз', async () => {
      await page.reload();
      await quizAll(page);
    });
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Главное предметное действие — ответ на вопрос',
      () => opt(page, CORRECT[0]).click());
    check('Главное действие даёт 20', await score(page), 20);
    check('Варианты погашены после ответа',
      await opt(page, CORRECT[0]).isDisabled(), true);
    await step('Повторить нажатие на том же вопросе',
      () => opt(page, CORRECT[0]).click({force: true}));
    check('Повтор не начисляет дважды', await score(page), 20);
    await step('Дойти до конца викторины', async () => {
      await page.locator('#quiz .mq-next').click();
      for (let i = 1; i < CORRECT.length; i++) await answer(page, i);
    });
    check('Пять вопросов засчитаны по одному разу', await score(page), 100);
  },

  async empty({page, check, step}) {
    check('Викторина обещает пять вопросов',
      (await page.locator('#quiz .mq-step').innerText()).trim(), '1 / 5');
    check('Заголовок викторины непустой',
      (await page.locator('#quiz .mq-title').innerText()).length > 5, true);
    await step('Осмотреть ленту обороны', async () => {
      check('Шесть кадров на ленте', await page.locator('#timeline .tl-card').count(), 6);
      check('У ленты есть текстовый эквивалент',
        (await page.locator('#tlDesc').innerText()).length > 100, true);
    });
    await step('Осмотреть подпись об источниках', async () => {
      check('Подпись называет основу рассказа',
        (await page.locator('#sources').innerText()).includes('Троицкая осада'), true);
      check('Знаменатель счёта 100',
        (await page.locator('#scoreBox').innerText()).includes('/ 100'), true);
    });
  }
};
