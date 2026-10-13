# Chat brainstorm — Deadline Squad

This is the chat history of the brainstorm that produced `_docs/plan.md`.
It follows the flow from the article "AI-native development: specifications":
start from a vague idea, ask the assistant to help scope it, ask **one question at a
time with short options**, and at the end ask it to save everything as a markdown spec.

- Date: 2026-10-13
- Participants: **Student** (Darkknight307) and **Assistant** (Claude)
- Language: the chat happened in Kazakh; an English translation follows every message.

---

**Student:** Маған осы тапсырманы орындау керек. Тапсырманы 100% талапқа сай орындауың үшін не керек, маған сұрақ қоя бер.
> *I need to complete this assignment (build an app with the AI-native workflow). Ask me whatever you need to do it fully to the requirements.*

**Assistant:** Жақсы. Алдымен ауқымды анықтайық. Қандай қосымша жасаймыз? Шағын, бірнеше issue-ге бөлінетін веб-қосымша болғаны дұрыс. Нұсқалар:
1. Студенттік дедлайн трекер (курстар, тапсырмалар, дедлайн, статус)
2. Кітапхана / кітап алмасу
3. Топтық жоба тапсырмалары (mini-Trello)
4. Өз идеяңыз
> *Let's set the scope first. What app should we build? It should be a small web app that splits into several issues. Options: (1) student deadline tracker, (2) book library / exchange, (3) group project tasks (mini-Trello), (4) your own idea.*

**Student:** Студенттік дедлайн трекер.
> *Student deadline tracker.*

**Assistant:** Қандай стек? Python FastAPI + SQLite, Django немесе Node.js?
> *Which stack? Python FastAPI + SQLite, Django, or Node.js?*

**Student:** Анимациясы ең күшті болатыны.
> *Whichever gives the strongest animations.*

**Assistant:** Онда фронтенд — React + TypeScript + Vite + Motion (Framer Motion) + Tailwind. Стектің толық таңдауын brainstorm-нан кейін жеке қадамда жасаймыз. Сұрақ №1: Дедлайн трекерді кім қолданады?
1. Тек өзім (жеке студент, аккаунтсыз)
2. Топтастармен бөлісу
3. v1-де жеке, бөлісу — кейін
> *Then the frontend is React + TypeScript + Vite + Motion (Framer Motion) + Tailwind; we'll fix the full stack in a separate step after the brainstorm. Question 1: who uses the tracker? (1) only me, (2) shared with groupmates, (3) personal in v1, sharing later.*

**Student:** Топтастармен бөлісу.
> *Shared with groupmates.*

**Assistant:** Сұрақ №2: Топтастармен қалай бөлісеміз? (Сервер болса — тіркелу, дерекқор керек, уақыт көп кетеді)
1. Сілтеме арқылы (share link), серверсіз
2. Ортақ топ кеңістігі (сервер)
3. JSON файл экспорт/импорт
> *Question 2: how do we share with groupmates? (A server means sign-up and a database — more work.) (1) share link, no server, (2) shared group space on a server, (3) JSON export/import.*

**Student:** Сервер болады. Уайымдама, бэкендтік тапсырмаларды Claude Code-пен жасаймыз.
> *There will be a server. Don't worry, we'll do the backend tasks with Claude Code.*

**Assistant:** Сұрақ №3: Топтастар топқа қалай кіреді?
1. Топ коды + аты (тіркелусіз)
2. Email + құпиясөз аккаунт
3. Аты + құпиясөз, топ кодымен қосылу
> *Question 3: how do groupmates get into a group? (1) group code + name, no sign-up, (2) email + password account, (3) name + password, join by group code.*

**Student:** Email + құпиясөз аккаунт.
> *Email + password account.*

**Assistant:** Сұрақ №4: Топтағы дедлайнды кім қоса/өзгерте алады, ал «орындадым» белгісі қалай жұмыс істейді?
1. Кез келген мүше қосады; статус әркімдікі жеке
2. Тек топ иесі (староста) қосады; статус жеке
3. Кез келген мүше; статус ортақ
> *Question 4: who can add/change a group deadline, and how does "done" work? (1) any member adds; done status is personal, (2) only the group owner adds; status personal, (3) any member; status shared.*

**Student:** Кез келген мүше қосады; статус әркімдікі жеке.
> *Any member adds; the done status is personal for each student.*

**Assistant:** Сұрақ №5: Басты экранда дедлайндар қалай көрсетіледі? (Анимация осы жерде ең көп болады)
1. Карточкалар + кері санау таймері (жақыны жоғарыда, түс бойынша шұғылдық, орындалса конфетти)
2. Уақыт сызығы (timeline)
3. Айлық күнтізбе
> *Question 5: how are deadlines shown on the main screen? (1) cards + live countdown (soonest first, urgency colours, confetti when done), (2) timeline, (3) monthly calendar.*

**Student:** Карточкалар + кері санау таймері.
> *Cards + countdown timer.*

**Assistant:** Сұрақ №6: Дедлайн карточкасында қандай өрістер болады?
1. Тақырып, пән, дедлайн уақыты, сипаттама
2. + Сілтеме (Moodle) және маңыздылығы
3. + Типі (quiz, assignment, exam)
> *Question 6: which fields does a deadline card have? (1) title, course, due time, description, (2) + Moodle link and weight, (3) + type.*

**Student:** Тақырып, пән, дедлайн уақыты, сипаттама.
> *Title, course, due time, description.*

**Assistant:** Сұрақ №7: Дедлайн өтіп кетсе не болады? Және бірінші нұсқада (v1) нені жасамаймыз?
1. Өткендер бөлек бөлімде; v1-де хабарландыру жоқ (email/push, Moodle импорт — кейін)
2. Өткендер автоматты жасырылады; хабарландыру жоқ
3. Өткендер бөлек; v1-де email еске салу бар
> *Question 7: what happens when a deadline passes, and what is NOT in v1? (1) past ones go to a separate section; no notifications in v1 (email/push, Moodle import later), (2) past ones hidden automatically; no notifications, (3) past ones separate; email reminders in v1.*

**Student:** Өткендер бөлек бөлімде; v1-де хабарландыру жоқ.
> *Past deadlines in a separate section; no notifications in v1.*

**Assistant:** Сұрақ №8: Бір студент бірнеше топта бола ала ма, және дедлайнды кім өзгертіп/өшіре алады?
1. Бірнеше топ; өзгерту/өшіру — автор не топ иесі
2. Бір топ; өзгерту/өшіру — автор не топ иесі
3. Бірнеше топ; кез келген мүше өзгертеді
> *Question 8: can a student be in several groups, and who can edit/delete a deadline? (1) several groups; edit/delete by the author or the group owner, (2) one group; author or owner, (3) several groups; any member edits.*

**Student:** Бірнеше топ; өзгерту/өшіру — автор не топ иесі.
> *Several groups; edit/delete by the author or the group owner.*

**Assistant:** Жарайды, шешімдердің қысқаша қорытындысы:
- Топтастармен ортақ дедлайн трекер, сервер + дерекқор бар.
- Email + құпиясөзбен тіркелу/кіру.
- Студент бірнеше топ аша/қосыла алады; топқа 6 таңбалы шақыру кодымен кіреді, топты ашқан адам — иесі.
- Топтың кез келген мүшесі дедлайн қосады: тақырып, пән, дедлайн уақыты, сипаттама.
- Өзгерту/өшіру — тек автор немесе топ иесі.
- «Орындадым» статусы әр студентке жеке.
- Басты экран: анимацияланған карточкалар, тірі кері санау, шұғылдық түсі, жақыны жоғарыда, орындалғанда конфетти; өткендер бөлек бөлімде.
- v1-де жоқ: хабарландыру (email/push), Moodle импорты, файлдар, чат.

Енді барлығын markdown спецификация етіп `_docs/plan.md` файлына сақтаймын.
> *OK, summary of the decisions: shared group deadline tracker with a server and database; email + password accounts; a student can create/join several groups, joins with a 6-character invite code, creator is the owner; any member adds a deadline (title, course, due time, description); edit/delete only by author or group owner; "done" is personal; main screen is animated cards with a live countdown, urgency colours, soonest first, confetti when done, past deadlines in a separate section; not in v1: notifications, Moodle import, files, chat. Now I'm saving everything as a markdown spec in `_docs/plan.md`.*

---

*Note: the assistant asked each question with short numbered options in the chat UI (one question per message, as in the article); the student's answers above are the options they picked or the text they typed. The 6-character invite code and the creator-is-owner rule were proposed by the assistant in the options of questions 3 and 8.*
