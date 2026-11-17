# PaaniLink – Water Tanker Booking and Dispatch System

Web Engineering Open-Ended Lab, Mid Evaluation frontend.

**GitHub Repository:** [https://github.com/hanzalahk360-commits/PaaniLink](https://github.com/hanzalahk360-commits/PaaniLink)

## 1. Requirements

- Install Node.js 18 or later.
- No extra npm packages are required. The server uses Node.js built-in modules.

## 2. Run the project

1. Extract the ZIP file.
2. Open the extracted `paanilink` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in Chrome or Edge.
6. Check the API at `http://localhost:3000/health`.

Keep the terminal open while using the website. Press `Ctrl + C` to stop the server.

## 3. Run automated tests

In the same project folder, run:

```bash
npm test
```

## 4. Demo accounts

Use the account dropdown on the login page. The demo records are stored in `db.json`.

- Customer: Ali Raza or Sana Malik
- Zone Officer: Bilal Ahmed
- Hydrant Operator: Kamran Shah
- Drivers: Usman Khan or Hassan Ali
- Administrator: Admin Water Board

This is a classroom demo login, not real password-based authentication.

## 5. Main booking flow

1. Customer submits a booking.
2. Commercial booking becomes `Approved`; subsidised booking becomes `Pending`.
3. Zone Officer reviews the subsidised booking and approves or rejects it.
4. Hydrant Operator assigns a tanker and driver to an approved booking.
5. Operator marks the tanker as filled and dispatched.
6. Driver marks the trip `Arrived`, then `Delivered` or `Failed` with a reason.
7. Customer confirms delivery or raises a dispute.
8. Zone Officer can resolve a dispute.

## 6. Existing group variation in the project

- Maximum 2 bookings per customer per day.
- Delivery address must contain at least 10 characters.

The assignment PDF says to include the group variation but does not state the exact group-specific values. Confirm these two rules with the instructor/group before submission.

## 7. Folder structure

- `public/` – HTML, CSS and browser JavaScript pages.
- `server.js` – local static web server and mock REST API.
- `db.json` – sample records used by the mock API.
- `test/` – automated API tests.
- `docs/API-CONTRACT.md` – API endpoints and request/response contract.
- `docs/USE-CASE-DIAGRAM.md` – use case diagram and actor summary.
- `docs/USE-CASE-DIAGRAM.png` – image version of the use case diagram.
- `docs/ASSUMPTIONS.md` – project assumptions.
- `docs/TEST-PLAN.md` – manual test checklist and automated test instructions.

## 8. Mid-version limitations

The project uses a local JSON mock API. It is not the final backend. Real authentication, server-side role authorization, relational database design, transactions, concurrency protection, database pagination and production security must be added in the backend phase. Frontend checks alone do not secure real data.
