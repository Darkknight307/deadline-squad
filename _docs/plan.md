# Deadline Squad — plan

Spec produced by the chat brainstorm (`chat-brainstorm.md`).

## Problem

Students in the same study group track the same deadlines (quizzes, assignments,
exams) separately — in chats, notes and Moodle. People miss deadlines because
nobody sees one shared, always up-to-date list.

## Idea

A shared deadline tracker for study groups. Any member adds a deadline once and
the whole group sees it as an animated card with a live countdown. Each student
marks deadlines done for themselves.

## Users

- **Student** — has an account, belongs to one or more groups.
- **Group owner** — the student who created the group; can manage any deadline in it.

## Decisions

1. **Shared, with a server.** Data lives on a backend with a database, not only in the browser.
2. **Accounts:** sign up and log in with email + password. Passwords are stored hashed.
3. **Groups:** a student can create several groups and join several groups.
   - The creator is the group **owner**.
   - A group has a 6-character **invite code**; others join by entering it.
4. **Deadlines:** any member of a group can add a deadline to it.
   - Fields: **title**, **course**, **due date-time**, **description** (optional).
5. **Editing/deleting** a deadline: only its **author** or the **group owner**.
6. **Done status is personal**: every student ticks "done" for themselves; it does
   not change what other members see.
7. **Main screen = animated cards + live countdown.**
   - Upcoming deadlines sorted by due time, soonest first.
   - Each card shows a live countdown (days/hours/minutes/seconds).
   - Urgency colour: overdue / < 24 h / < 3 days / later.
   - Cards animate in, re-order smoothly, and celebrate with confetti when marked done.
8. **Past deadlines** go to a separate "Past" section.
9. **Not in v1:** notifications (email/push), Moodle import, file attachments,
   comments/chat, deadline types or weights.

## Main flows

1. Sign up / log in with email + password.
2. Create a group (get an invite code) or join one with a code.
3. Open a group (or "All my groups") and see upcoming deadline cards with countdowns.
4. Add a deadline; everyone in the group sees it.
5. Mark a deadline done (only for me) — confetti.
6. Author/owner edits or deletes a deadline.
7. Past deadlines are listed separately.
