/* План B6 для muzei/literatura/lit-chekhov-toska.html (29 января).
   claude4, 12.10.2026, наряд stranicy-lit-0910; построен по плану 28 января (parus-plan.mjs).
   Механика по календарю — «Сокращение»: четыре фрагмента «Тоски» в редакции 1886 года, каждый разбит
   на фразы-кнопки. Фраза, которой нет в окончательном тексте, вычёркивается; когда вычеркнуто всё
   лишнее, открывается окончательная редакция и 10 баллов один раз (c0…c3). Фраза, которую Чехов
   оставил, гаснет с подсказкой, очков нет. Викторина — museum-quiz.js, пять вопросов по 12 (q0…q4).
   Итого 4×10 + 5×12 = 100. */

const score = async page => Number(await page.locator('#score').innerText());
const quiz = page => page.evaluate(() => window.MUSEUM_QUIZ.items.map(i => ({c: i.c, n: i.o.length})));
const card = (page, i) => page.locator('#sokr .cx-card').nth(i);
const msg = (page, i) => card(page, i).locator('.cx-msg').innerText();
const cutAll = async (page, i) => {
  const segs = card(page, i).locator('.cx-s[data-cut="1"]');
  const n = await segs.count();
  for (let k = 0; k < n; k++) await segs.nth(k).click();
};

const answer = async (page, i) => {
  await page.locator('#quiz .mq-opt').nth(i).click();
  await page.locator('#quiz .mq-next').click();
};
const earnAll = async page => {
  for (let i = 0; i < 4; i++) await cutAll(page, i);
  for (const item of await quiz(page)) await answer(page, item.c);
};

export const omissions = {};

export const scenarios = {
  async entry({page, check, step}) {
    check('Пустой контекст: счёт 0', await score(page), 0);
    check('Полоса итога пуста', await page.locator('#dayBar').evaluate(e => e.style.width), '0%');
    check('Диплом закрыт', await page.locator('#dipl').isVisible(), false);
    check('Окончательный текст скрыт до сокращения', await page.locator('#sokr .cx-fin:visible').count(), 0);
    await step('Вычеркнуть «forte» (с. 232)', () => cutAll(page, 0));
    check('Награда ровно за сделанное: 10', await score(page), 10);
    await step('Перезагрузка страницы', () => page.reload());
    check('После перезагрузки прогресс не выдуман: 0', await score(page), 0);
    check('Счётчик снова пуст', await page.locator('#cxCount').innerText(), 'Сокращено: 0 из 4');
    check('Викторина снова с первого вопроса', await page.locator('#quiz .mq-step').innerText(), '1 / 5');
  },

  async wrong({page, check, step}) {
    await step('Нажать фразу, которую Чехов оставил (с. 232)', () => card(page, 0).locator('.cx-s[data-cut="0"]').first().click());
    check('Подсказка', await msg(page, 0), 'Эту фразу Чехов оставил. Ищи другую.');
    check('Оставленная фраза не даёт очков', await score(page), 0);
    check('Нажатая фраза гаснет', await card(page, 0).locator('.cx-s[data-cut="0"]').first().isDisabled(), true);
    check('Окончательный текст ещё скрыт', await card(page, 0).locator('.cx-fin').isVisible(), false);
    await step('Вычеркнуть одну из трёх лишних фраз (с. 235)', () => card(page, 2).locator('.cx-s[data-cut="1"]').first().click());
    check('Неполное сокращение не даёт очков', await score(page), 0);
    check('Подсказка, сколько осталось', await msg(page, 2), 'Верно, этого в окончательном тексте нет. Осталось вычеркнуть: 2.');
    await step('Вычеркнуть «forte»', () => cutAll(page, 0));
    check('Верное сокращение даёт 10', await score(page), 10);
    const [first] = await quiz(page);
    const wrong = first.c === 0 ? 1 : 0;
    await step('Неверный вариант первого вопроса', () => page.locator('#quiz .mq-opt').nth(wrong).click());
    check('Разбор показан', (await page.locator('#quiz .mq-exp').innerText()).trim().length > 40, true);
    check('Верный вариант подсвечен как верный',
      await page.locator('#quiz .mq-opt').nth(first.c).evaluate(e => e.classList.contains('is-right')), true);
    check('Неверный ответ викторины не даёт очков', await score(page), 10);
  },

  async reset({page, check, step}) {
    await step('Сокращение на с. 236', () => cutAll(page, 3));
    check('Награда набрана', await score(page), 10);
    await step('Начать заново: перезагрузка без очистки хранилища', () => page.reload());
    check('Счёт сброшен', await score(page), 0);
    check('Фразы снова открыты', await card(page, 3).locator('.cx-s:enabled').count(), 3);
    await step('Повторить то же', () => cutAll(page, 3));
    check('Сброс не удваивает награду', await score(page), 10);
  },

  async mobile({page, check, step, width}) {
    await step('Четыре сокращения и пять верных ответов', () => earnAll(page));
    check(`Максимум на ${width}`, await score(page), 100);
    check('Счётчик полон', await page.locator('#cxCount').innerText(), 'Сокращено: 4 из 4');
    check('Итог викторины', await page.locator('#quiz .mq-done').innerText(), 'Вопросы пройдены: верных 5 из 5.');
    check('Диплом открыт', await page.locator('#dipl').isVisible(), true);
    check('Нет горизонтального переполнения',
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  },

  async nojs({page, check}) {
    check('История читается без JavaScript',
      (await page.locator('main').innerText()).length > 2000, true);
    check('Эпизоды истории раскрываются без JavaScript', await page.locator('main details').count() >= 5, true);
    check('Сокращение без JavaScript — текстом: четыре правки', await page.locator('#cx-text li').count(), 4);
    check('Вместо пустой викторины — текстовый эквивалент',
      (await page.locator('#games').innerText()).length > 400, true);
    check('Текстовая викторина: пять вопросов с ответами',
      await page.locator('#games-text details').count(), 5);
  },

  async score({page, check, step}) {
    check('Знаменатель шкалы 100', (await page.locator('#scoreBox').innerText()).replace(/\s+/g, ' ').trim(), '⭐ 0 / 100');
    check('Реестр наград: 4 сокращения по 10 и 5 вопросов по 12',
      await page.evaluate(() => window.MUSEUM_SCORE.awards), {c: [4, 10], q: [5, 12]});
    check('Вопросов в викторине столько же, сколько наград', (await quiz(page)).length, 5);
    check('Фрагментов столько же, сколько наград', await page.locator('#sokr .cx-card').count(), 4);
    await step('Полный набор уникальных наград', () => earnAll(page));
    check('Объявленный максимум достижим', await score(page), 100);
    await step('Повторные награды тем же ключом', () => page.evaluate(() => {
      for (let i = 0; i < 5; i++) { window.award('c' + i, 10); window.award('q' + i, 12); }
    }));
    check('Повтор не переполняет максимум', await score(page), 100);
  },

  async main({page, check, step}) {
    await step('Вычеркнуть авторскую фразу на с. 236', () => cutAll(page, 3));
    check('Фраза зачёркнута', await card(page, 3).locator('.cx-s.is-cut').innerText(), 'Ничего ведь нет лучше, как выслушать человека…');
    check('Открыт окончательный текст', await card(page, 3).locator('.cx-fin').isVisible(), true);
    check('Окончательный текст — без вычеркнутой фразы',
      (await card(page, 3).locator('.cx-fin').innerText()).includes('выслушать человека'), false);
    check('Карточка отмечена', await card(page, 3).evaluate(e => e.classList.contains('is-done')), true);
    check('Сокращение даёт 10', await score(page), 10);
    await step('Вычеркнуть весь абзац на с. 235 (три фразы)', () => cutAll(page, 2));
    check('Два сокращения — 20', await score(page), 20);
    check('Счётчик', await page.locator('#cxCount').innerText(), 'Сокращено: 2 из 4');
  },

  async empty({page, check}) {
    const items = await quiz(page);
    check('В каждом вопросе три варианта', items.map(i => i.n), [3, 3, 3, 3, 3]);
    check('Четыре фрагмента', await page.locator('#sokr .cx-card').count(), 4);
    check('В каждом фрагменте есть что вычеркнуть и что оставить',
      await page.locator('#sokr .cx-card').evaluateAll(cs => cs.every(c =>
        c.querySelector('.cx-s[data-cut="1"]') && c.querySelector('.cx-s[data-cut="0"]'))), true);
    check('Фраз-кнопок всего', await page.locator('#sokr .cx-s').count(), 14);
    check('Аудиогид на месте', await page.locator('audio, [data-audioguide], .ag-play, #audioguide button').count() > 0, true);
    check('Подпись о баллах совпадает с реестром (4 × 10 и 5 × 12)',
      /10 за каждое сокращение.*по 12/.test(await page.locator('#games .source').innerText()), true);
    check('Источники названы', await page.locator('#istochniki .source-list li').count(), 6);
  }
};
