# Features

A full list of what the app does, grouped by page. File paths are under `src/`.

## Dashboard

- Pick any date (previous / next / today, or a date picker). The date is kept in the URL.
- Four numbers for the day: appointments, waiting now, money collected, and money still pending.
- Live queue per doctor: who they're seeing right now and for how long, plus how many are waiting and how many they've seen.
- Transactions for the day, with a bar showing the split between cash, UPI and card. Handy for checking the cash drawer at the end of the day. If a payment settles an older visit, the row says which visit.
- Pending payments for the selected date, or for all dates, with a "Collect" button on each.
- Follow-ups due that day. Each one shows "Booked" if the patient already has an appointment, otherwise a "Book" button that opens booking with the patient and doctor filled in.

Code: `pages/DashboardPage.tsx`, `features/dashboard/`, `features/billing/CollectionsBreakdown.tsx`

## Appointments

- Queue board with four columns: Scheduled, Waiting, In consultation, Completed. Cancelled ones are in a collapsible section underneath.
- Each waiting patient shows their place in line and an estimated wait, updated every 30 seconds.
- Filter by doctor; move between dates.
- Check in (today only), start a consultation, complete it, cancel, record a payment, or open the visit details.
- "Start consultation" is disabled while that doctor is with someone else.
- Completing a visit: diagnosis, medicines, advice, the fee, how much was paid now and how, and an optional follow-up date (quick buttons for 3 days, 1 week, 2 weeks, 1 month). Anything not paid is marked as pending.
- Visit details: patient info and allergies, a timeline (booked, checked in, started, completed), the prescription, and each payment.
- On a phone, the board turns into tabs, one column at a time.

Code: `pages/AppointmentsPage.tsx`, `features/appointments/`, `lib/queue.ts`

## Patients

- Search by name or by part of a phone number.
- Sort by name, most recent visit, or balance due.
- Register a new patient, or edit an existing one. Only name and phone are required.
- Patient page: contact details, allergies, number of visits, balance due, and visit history. Unpaid visits have a "Collect" button.
- "Book appointment" from a patient's page opens booking with them already selected.
- On a phone, the list and the patient page are separate screens.

Code: `pages/PatientsPage.tsx`, `features/patients/`

## Booking

- Search for the patient, or register them without leaving the dialog (whatever you typed in the search box is carried over).
- Doctor cards show the specialty, fee, and for today, how many people are waiting and roughly how long it'll take.
- Pick a date and an optional time. For today, "Patient is at the clinic" puts them straight into the queue with a token.

Code: `features/appointments/BookAppointmentModal.tsx`

## Rules the app enforces

These are checked by the service layer, and the UI shows them before you hit the server.

- Appointments go scheduled → waiting → in consultation → completed. Only scheduled or waiting ones can be cancelled.
- Only today's appointments can be checked in.
- A doctor can only have one consultation going at a time.
- No bookings in the past, and no second active booking for the same patient, doctor and day.
- Completing a visit needs a diagnosis; the follow-up has to be after the visit.
- A payment has to be more than zero and can't be more than what's owed.
- A patient counts as a duplicate only if both name and phone match.
- If any of these fail, nothing is saved.

Code: `services/appointmentService.ts`, `services/patientService.ts`, `lib/validation.ts`

## Loading, empty and error states

- Spinners and skeletons while loading.
- Empty states that say what's missing, often with a next step (for example, "Register patient" when a search finds nothing).
- An error panel with "Try again" when something can't load.
- If a refresh fails while data is already showing, the data stays and a small notice says it might be out of date.
- Errors from an action show inside the dialog or as a toast. Successful actions get a short confirmation toast.

## Other

- Works on desktop, tablet and phone. Dialogs become bottom sheets on small screens.
- Keyboard accessible, with labelled fields, a skip link, and screen-reader announcements for loading, errors and toasts.
- Dark mode follows the system setting.
- Data is saved in localStorage and stays in sync across open tabs.
- Demo controls in the sidebar: a simulated network switch (Normal / Flaky / Offline) and "Reset demo data".
