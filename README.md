# CareWell Clinic – front desk

A small React app for the reception desk of a 2–3 doctor clinic. It covers the receptionist's day: registering patients, running the queue for each doctor, recording the prescription and payment at the end of a visit, and keeping track of who still owes money or needs a follow-up.

Live demo: https://shravya-b.github.io/clinic-front-desk/

Everything is stored in your browser, so feel free to click around. "Reset demo data" in the sidebar puts it back to the starting state.

## Running it

You'll need Node 20.19+ (Vite 7 doesn't run on older versions).

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

There's no backend. A small service layer fakes the API on top of localStorage.

## The problem

I picked a clinic front desk because it's a real workflow with a clear user, and in small clinics it's still mostly run on paper. One receptionist handles walk-ins, tokens, three doctors' queues, payments and follow-ups, usually with a register and a cash book. The things that go wrong are predictable:

- patients keep asking how long they'll wait, and nobody really knows
- it's hard to tell which doctor is free and who is running late
- partial payments get forgotten
- follow-ups aren't tracked, so people who were told to come back next week just don't

## Who it's for

The receptionist. They're interrupted all the time and are usually talking to a patient while using the app, so I tried to keep things quick and hard to get wrong:

- Registering someone only needs a name and phone number, and you can do it from inside the booking dialog without losing what you've filled in.
- The queue board shows who's waiting, who's with which doctor, and a rough wait time for each person. It updates on its own.
- You can't start a second consultation for a doctor who's already busy, double-book someone, or record more money than is owed.
- Anything unpaid shows up under pending payments and can be collected from the dashboard, the queue, or the patient's page.
- Allergies are shown whenever a visit is being handled.

## What's in it

There are three pages:

- **Dashboard** – a summary for any date: appointments, how many are waiting, money collected (split by cash / UPI / card), pending payments and follow-ups due.
- **Appointments** – the live queue as a board (Scheduled → Waiting → In consultation → Completed). You can filter by doctor, check people in, start and complete consultations, cancel, and take payments. Completing a visit is where the prescription, fee, payment and follow-up date are entered.
- **Patients** – search by name or phone, sort by name / last visit / balance due, register and edit patients, and see each patient's visit history.

[FEATURES.md](FEATURES.md) has the full list.

## How it's put together

```
src/
  types/        domain types (Patient, Appointment, Payment...)
  lib/          plain functions: queue estimates, billing, dates, validation
  services/     the fake API: latency, failures, localStorage, seed data
  hooks/        useQuery, useMutation, useNow...
  components/   generic UI pieces (Button, Modal, Field, DataTable...) and the layout
  features/     the clinic-specific components, grouped by area
  pages/        one file per route
```

The rule I tried to stick to: pages only compose things, features hold the clinic logic, generic components don't know anything about clinics, and only the services touch storage.

**Data flow.** Components read through a small `useQuery(key, fetcher)` hook and write through `useMutation`. After any write, the service layer fires a "data changed" event and every mounted query refetches. That's what keeps the dashboard, the queue and an open dialog in sync without a global store. Wait times aren't stored anywhere; they're worked out from timestamps every 30 seconds.

**State.** There's no Redux or Zustand. Almost everything is either "server" data (handled by `useQuery`) or local to a component (`useState`). The selected date and selected patient live in the URL, so refreshing or sharing a link keeps your place. Toasts are the only thing in context.

## Decisions worth explaining

- **The fake API behaves like a real one.** Every call waits 250–650 ms, can fail, and returns a copy of the data. That way the loading and error states actually get used, and nothing can mutate the "database" by accident. Swapping in a real backend would only touch the service files.
- **Business rules live in the services, not just the UI.** Things like "one consultation per doctor" are enforced where a server would enforce them, and the UI mirrors them so you get feedback before you click. Patient validation is the same function in both places.
- **Writes are all or nothing.** A write works on a copy and only saves if it succeeds, so a rejected action never leaves half-updated data.
- **One hook for all appointment actions.** `useAppointmentActions` handles check-in, start, complete, cancel, payment and viewing details. The board, dashboard and patient page all use it, so the workflow behaves the same everywhere.
- **Native `<dialog>` for modals.** The browser gives focus trapping and Esc for free.
- **If a refresh fails, keep the old data but say so.** Blanking the queue because one request failed would be worse than showing slightly old data, but the receptionist needs to know it might be out of date, so there's a small "couldn't refresh" notice with a retry button.

## Libraries

- **React 19 + TypeScript** (strict). The typed domain model caught a lot of status-related mistakes while I was building.
- **Vite** for the dev server and build.
- **React Router** for routing, URL state and lazy-loaded pages.
- **Plain CSS with design tokens.** No UI kit, Tailwind or chart library. I wanted to build the components myself, and it keeps the bundle small (about 91 kB gzipped). The tokens also made dark mode cheap.
- **My own `useQuery` / `useMutation`** instead of TanStack Query. For an app this size it's about 100 lines and easy to follow. In a real project I'd use TanStack Query.
- **Vitest + Testing Library** for tests.

## Testing

`npm test` runs 40 tests:

- the pure logic: wait estimates, queue order, billing, dates, validation
- the service rules, run against the real localStorage layer: double booking, one consultation per doctor, partial then full payment, overpayment, failed writes leaving data untouched, patient search and sorting, and the fake network modes
- components and pages with Testing Library: form validation, the loading / error / empty / stale states, the payments chart, and page-level flows on Appointments, Patients and the Dashboard

What's missing: end-to-end tests (Playwright) and automated accessibility checks (axe).

## Accessibility and responsiveness

Labels on every input, with errors linked to their fields; a skip link; a title per page; live regions for loading, errors and toasts; status never shown by colour alone; and everything works with the keyboard. On phones the sidebar becomes a bottom nav, the queue board becomes tabs, and dialogs open as bottom sheets. Dark mode follows the system setting.

## Assumptions

- One clinic, one receptionist, no login.
- The doctor writes the prescription in their own system and the receptionist records it when closing the visit.
- Fees are per doctor, in rupees, and can be changed at checkout.
- Wait estimates use a fixed average consultation time per doctor.
- Families often share a phone number, so a patient only counts as a duplicate if both the name and the number match.

## Tradeoffs

- Refetching every query after any write is simple and always correct, but wasteful. With more data I'd only invalidate the queries that changed.
- localStorage is fine for a demo but it's one device, and it re-saves the whole dataset on every write.
- Seed data is generated relative to "now" so the queue always looks live. The catch is that people left "waiting" yesterday stay waiting until you reset.
- Toasts are shown above dialogs, but while a dialog is open you can't click a toast's close button (the browser blocks everything outside a modal). They disappear on their own after 4 seconds.
- The payments chart is plain HTML/CSS. That's fine for one bar; anything over time would need a chart library.

## What I'd do next

- Learn each doctor's real average consultation time instead of using a fixed number.
- Printable prescriptions and receipts, and an SMS/WhatsApp "you're next" message.
- An end-of-day close: cash summary by payment method, and marking unfinished visits as no-shows.
- A doctor's view of their own queue.
- Playwright and axe checks in CI.

The thing I'd refactor first is `useAppointmentActions`. It currently returns the dialogs as JSX, which mixes behaviour and rendering; a small dialog context would be cleaner. If the app got much bigger I'd also move to TanStack Query, a generated API client, and server push for the queue instead of refetching.

## Demo settings

The sidebar (desktop only) has two extra controls for trying things out:

- **Simulated network**: Normal, Flaky (about 30% of requests fail) or Offline (everything fails). Offline is the easiest way to see the error states.
- **Reset demo data**: starts over with fresh sample data.
