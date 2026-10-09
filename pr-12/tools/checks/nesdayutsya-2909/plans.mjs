// B6-план дней «Русские не сдаются» со счётом (сборщик pilot-nesdayutsya/build-ochki-prava.py).
// Очки только за верные ответы викторины по документам (museum-quiz.js M-23, 5 × 20 = 100);
// «Слово героя», «Факт или миф», карта пути — рассматривание без очков и без неверного ответа.
// Счёт живёт до перезагрузки: страница это объявляет, план это проверяет.
// Все действия — клики посетителя; счёт и состояние скриптом не подменяются.
const score = async p => Number((await p.locator('#score').innerText()).trim());
const opts = (p, i) => p.locator('#quizBox .mq-opt').nth(i);
async function answer(p, i) { await opts(p, i).click(); }
async function next(p) { await p.locator('#quizBox .mq-next').click(); }
async function allCorrect(p, answers) {
  for (const [n, a] of answers.entries()) { await answer(p, a); await next(p); }
}
const wrongOf = a => (a === 0 ? 1 : 0);

export function make(day) {
  const d = day;
  return {
    async entry({page: p, check, step}) {
      check('Fresh score', await score(p), 0);
      check('First question visible', await p.locator('#quizBox .mq-q').isVisible(), true);
      check('Question counter', (await p.locator('#quizBox .mq-step').innerText()).trim(), '1 / 5');
      check('Diploma closed', await p.locator('#dipl').isVisible(), false);
      check('Rank before answers', (await p.locator('#dayTxt').innerText()).trim(), '0 / 100 · звание: Гость музея');
      check('Persistence rule stated', (await p.locator('#quiz').innerText()).includes('счёт не сохраняется'), true);
      await step('Answer first question correctly', () => answer(p, d.answers[0]));
      check('Reward after correct answer', await score(p), 20);
      await step('Reload page', () => p.reload());
      check('Session-only score cleared on reload', await score(p), 0);
      check('Quiz back at question 1', (await p.locator('#quizBox .mq-step').innerText()).trim(), '1 / 5');
    },
    async wrong({page: p, check, step}) {
      const w = wrongOf(d.answers[0]);
      await step('Choose wrong answer', () => answer(p, w));
      check('Wrong answer earns nothing', await score(p), 0);
      check('Wrong option marked', await opts(p, w).evaluate(e => e.classList.contains('is-wrong')), true);
      check('Correct option shown', await opts(p, d.answers[0]).evaluate(e => e.classList.contains('is-right')), true);
      check('Explanation shown', (await p.locator('#quizBox .mq-exp').innerText()).trim(), d.explain0);
      check('Answer locked after first choice', await opts(p, d.answers[0]).isDisabled(), true);
      await step('Force click on the correct (locked) option', () => opts(p, d.answers[0]).click({force: true}));
      check('Locked option earns nothing', await score(p), 0);
      check('Next question offered', await p.locator('#quizBox .mq-next').isVisible(), true);
    },
    async reset({page: p, check, step}) {
      // Одноразовая викторина: ответ блокируется, разбор после ответа; новая попытка — новый
      // визит (перезагрузка), и он обнуляет весь маршрут вместе с учётом наград.
      await step('Answer first question correctly', () => answer(p, d.answers[0]));
      check('Reward once', await score(p), 20);
      await step('Start again: reload', () => p.reload());
      check('Route and rewards cleared', await score(p), 0);
      check('Controls back to initial state', await opts(p, d.answers[0]).isEnabled(), true);
      await step('Answer the same question again', () => answer(p, d.answers[0]));
      check('New pass earns once, no carry-over', await score(p), 20);
    },
    async mobile({page: p, check, step, width}) {
      check('No horizontal overflow at ' + width, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await step('Answer all five correctly', () => allCorrect(p, d.answers));
      check('Maximum at ' + width, await score(p), 100);
      check('Quiz summary at ' + width, (await p.locator('#quizBox .mq-done').innerText()).trim(), 'Вопросы пройдены: верных 5 из 5.');
      check('Diploma at ' + width, await p.locator('#dipl').isVisible(), true);
    },
    async nojs({page: p, check}) {
      const quiz = p.locator('#quiz noscript');
      check('Quiz text equivalent present', await quiz.count(), 1);
      const text = await quiz.textContent();
      check('No-JS limitation explained', text.includes('без него очки не начисляются'), true);
      check('All five answers disclosed', d.answerTexts.every(a => text.includes('Ответ: ' + a + '.')), true);
      check('Score block explains limitation', (await p.locator('#itog noscript').textContent()).includes('требует JavaScript'), true);
      check('Story readable without JS', (await p.locator('#dokument').innerText()).length > 400, true);
    },
    async score({page: p, check, step}) {
      const seen = [];
      for (const [n, a] of d.answers.entries()) {
        if (n === 4) check('Before last reward', await score(p), 80);
        await step('Correct answer ' + (n + 1), () => answer(p, a));
        seen.push(await score(p));
        await step('Next', () => next(p));
      }
      check('Score steps', seen.join(','), '20,40,60,80,100');
      check('Reachable maximum', await score(p), 100);
      check('Top rank', (await p.locator('#dayTxt').innerText()).trim(), '100 / 100 · звание: Знаток подвига');
      check('Diploma points', (await p.locator('#dpts').innerText()).trim(), '100');
      check('Diploma title', (await p.locator('#dipl b').innerText()).trim(), d.diploma);
      check('Progress bar full', await p.locator('#dayBar').evaluate(e => e.style.width), '100%');
      check('Manifest declares 5 × 20', await p.locator('#museum-score-manifest').textContent(),
        '{"maximum": 100, "awards": [{"id": "quiz", "count": 5, "each": 20}]}');
    },
    async main({page: p, check, step}) {
      await step('Answer main quiz question correctly', () => answer(p, d.answers[0]));
      check('Main reward', await score(p), 20);
      await step('Repeat the same answer', () => opts(p, d.answers[0]).click({force: true}));
      check('No duplicate reward', await score(p), 20);
    },
    async empty({page: p, check, step}) {
      const items = await p.evaluate(() => window.MUSEUM_QUIZ.items);
      check('Five questions', items.length, 5);
      check('Each question has ≥3 options and an explanation', items.every(q => q.o.length >= 3 && q.e.length > 20), true);
      check('Declared answers match page data', items.map(q => q.c).join(','), d.answers.join(','));
      check('Options rendered', await p.locator('#quizBox .mq-opt').count(), items[0].o.length);
      check('Exhibits in rights register', await p.locator('#sources-rights figure[data-rc-exhibit-id]').count(), d.kadry);
      check('Rights rows', await p.locator('#sources-rights tr[data-rc-rights-id]').count(), d.kadry);
      await step('Inspect subject interactive', () => d.subject(p, check));
    }
  };
}
