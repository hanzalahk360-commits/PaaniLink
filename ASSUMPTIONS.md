# PaaniLink Project Assumptions (Mid Evaluation)

These assumptions make the sample project behaviour clear. They should be confirmed with the course instructor/group where the assignment has not supplied a fixed value.

1. The first phase is a frontend demonstration using a local mock REST API and `db.json`; a real database and authenticated backend belong to the second phase.
2. The sample city data contains two zones and two hydrants. Each sample zone is connected to one hydrant through `hydrantId`.
3. Tanker capacities are 1,000, 3,000, and 6,000 gallons, as described in the project scenario.
4. A commercial booking is automatically marked `Approved`; a subsidised booking remains `Pending` until a Zone Officer reviews it.
5. A customer must have `subsidyStatus: Approved` before placing a subsidised booking.
6. The sample monthly subsidised limit is stored in each customer record as `monthlyLimit`; the supplied sample value is 2.
7. The existing project README defines the group variation as a maximum of 2 bookings per customer per day and a delivery address of at least 10 characters. These values are preserved in the frontend. The assignment PDF mentions a group variation but does not state its exact values, so the group must confirm that these are the assigned values.
8. A tanker and driver are considered occupied for a date when linked to a booking in one of these statuses: `Assigned`, `Dispatched`, `Arrived`, `Delivered`, `Confirmed`, or `Failed`.
9. The hydrant daily quota is checked when the operator assigns a tanker. Only bookings already assigned or further along in the delivery flow count toward the sample quota calculation.
10. A tanker must have the exact capacity requested by the booking and must belong to the operator's hydrant.
11. A Zone Officer can review subsidy applications and bookings only in their own zone. The officer does not dispatch tankers.
12. A Hydrant Operator manages only the hydrant ID stored in their demo user record.
13. A Driver sees only trips assigned to their demo user ID and can update the trip status after dispatch.
14. The Administrator page provides city-level summary information and forms to update sample rates and hydrant quotas. Other advanced administrative CRUD screens are outside the current Mid mockup.
15. Prices, customer records, tanker records, and demo accounts in `db.json` are sample data for coursework only and are not real customer or Water Board records.
16. Date validation uses the browser's local date. The demo does not yet implement hydrant-specific operating-hour or public-holiday scheduling rules.
17. The frontend's checks improve the classroom demonstration but are not a security boundary. The final backend must repeat all important validation and authorization on the server.
