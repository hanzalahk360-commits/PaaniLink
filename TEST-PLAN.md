# PaaniLink Mid Evaluation Test Plan

## Test environment

- Node.js 18 or later (tested with Node.js v22.16.0 in the preparation environment).
- Browser: latest Chrome or Edge recommended.
- Local server: `npm start`, then open `http://localhost:3000`.
- API health check: `http://localhost:3000/health`.
- Sample data: `db.json`.

## Automated API tests

Run `npm test`. The test suite checks static page delivery, API reads, filters and sorting, record creation and updates, booking flow operations, rate/quota updates, and missing-record responses.

## Manual role and form checklist

| Test ID | Role / screen | Test action | Expected result |
|---|---|---|---|
| T01 | Login | Open the root page | Login and registration forms appear |
| T02 | Login | Submit without selecting an account | Helpful validation message appears |
| T03 | Registration | Enter an invalid name | Registration is blocked |
| T04 | Registration | Enter a CNIC other than 13 digits | Registration is blocked |
| T05 | Registration | Enter a phone not matching `03XXXXXXXXX` | Registration is blocked |
| T06 | Registration | Enter an address shorter than 10 characters | Registration is blocked |
| T07 | Registration | Reuse an existing CNIC | Duplicate registration is blocked |
| T08 | Customer | Submit a booking with no tanker size | Booking is blocked |
| T09 | Customer | Select a past date | Booking is blocked |
| T10 | Customer | Enter an address shorter than 10 characters | Booking is blocked |
| T11 | Customer | Make a third non-cancelled booking on the same date | Group variation rule blocks it |
| T12 | Customer | Request subsidy before subsidy approval | Subsidised booking is blocked |
| T13 | Customer | Submit proof shorter than 10 characters | Subsidy application is blocked |
| T14 | Zone Officer | Open the officer page | Only records for the officer's zone appear |
| T15 | Zone Officer | Approve or reject a pending subsidised booking | Booking status updates and list refreshes |
| T16 | Zone Officer | Try to approve a booking that is not Pending | Action is blocked by status check |
| T17 | Hydrant Operator | Choose no tanker or no driver | Assignment is blocked |
| T18 | Hydrant Operator | Choose a tanker with wrong capacity/hydrant | Assignment is blocked |
| T19 | Hydrant Operator | Assign a tanker/driver already assigned that date | Assignment is blocked by frontend check |
| T20 | Hydrant Operator | Assign more gallons than the daily quota | Assignment is blocked |
| T21 | Hydrant Operator | Dispatch a booking not in Assigned status | Dispatch is blocked |
| T22 | Driver | Open driver page | Only trips assigned to that driver appear |
| T23 | Driver | Mark arrival before dispatch | Action is not available / blocked |
| T24 | Driver | Mark failed without selecting a reason | Failure is blocked |
| T25 | Customer | Confirm or dispute a booking before Delivered | Action is not available / blocked |
| T26 | Administrator | Submit an empty or non-positive rate | Rate update is blocked |
| T27 | Administrator | Set subsidised rate equal to or above commercial rate | Rate update is blocked |
| T28 | Administrator | Set quota below 1,000 or a decimal quota | Quota update is blocked |
| T29 | Responsive | Test at 360px width | Page content remains usable without desktop-only layout |
| T30 | Responsive | Test at laptop width | Forms, cards and tables remain readable |

## Test execution record

The automated API test suite is executed during project preparation. The manual browser checklist is provided for the student/group to run in the target browser and record actual pass/fail results. Do not mark a manual test as passed until it has been performed.

| Test category | Status |
|---|---|
| JavaScript syntax checks | PASS – `node --check` run on server, frontend and test JavaScript files |
| Automated API tests | PASS – 12 tests passed, 0 failed |
| HTTP server smoke check | PASS – homepage and `/health` returned HTTP 200 |
| Manual role workflows | Pending – run the browser checklist on the student computer |
| 360px and laptop responsive checks | Pending – verify in Chrome/Edge on the student computer |
