# PaaniLink Mock API Contract (Mid Evaluation)

## 1. Base URL and format

- Local base URL: `http://localhost:3000`
- All API request and response bodies use JSON.
- The frontend uses the browser `fetch()` function for API communication.
- IDs are numeric in the sample database.
- This is a student-level mock API backed by `db.json`, not the final authenticated production backend.

## 2. Common response behaviour

| HTTP status | Meaning |
|---|---|
| 200 | Request completed successfully |
| 201 | New record created |
| 400 | Invalid JSON request body or invalid request format |
| 404 | Resource, endpoint, or record was not found |
| 405 | HTTP method is not supported for that endpoint |
| 500 | Unexpected server or local data-file error |

Errors are returned as JSON, for example:

```json
{ "error": "Record not found." }
```

## 3. Resource endpoints

The following operations are supported for each collection: `zones`, `hydrants`, `tankers`, `rates`, `users`, and `bookings`.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/resource` | Get all records | 200 + array |
| GET | `/resource/:id` | Get one record | 200 + object |
| POST | `/resource` | Add a record; server assigns the next ID if omitted | 201 + object |
| PATCH | `/resource/:id` | Update only supplied fields | 200 + updated object |
| PUT | `/resource/:id` | Replace fields while preserving the record ID | 200 + updated object |
| DELETE | `/resource/:id` | Delete a record | 200 + deleted object |

Replace `resource` with one of the six collection names above.

### List filters, sorting and pagination

- Exact-match filters use normal query parameters, for example `/bookings?customerId=1`.
- Multiple filters can be combined, for example `/bookings?zoneId=1&status=Pending`.
- Sorting: `?_sort=date&_order=asc` or `?_sort=id&_order=desc`.
- Pagination: `?_page=1&_limit=10`.
- Underscore parameters are reserved for sorting and pagination.

## 4. Data fields used by the frontend

| Resource | Main fields |
|---|---|
| zones | `id`, `name`, `hydrantId` |
| hydrants | `id`, `name`, `quota`, `hours`, `available` |
| tankers | `id`, `plate`, `capacity`, `hydrantId`, `available` |
| rates | `id`, `size`, `commercial`, `subsidised` |
| users | `id`, `name`, `role`, `cnic`, `phone`, `address`, `zoneId`, `hydrantId`, `subsidyStatus`, `monthlyLimit`, `subsidyProof` |
| bookings | `id`, `customerId`, `zoneId`, `hydrantId`, `size`, `type`, `date`, `address`, `price`, `status`, `tankerId`, `driverId`, `note` |

Fields that do not apply to a role or record may be absent. `tankerId` and `driverId` are `null` until assigned.

## 5. Frontend API usage by role

| Role / page | Fetch requests used |
|---|---|
| Login / registration | `GET /users`, `GET /zones`, `GET /users?cnic=...`, `POST /users` |
| Customer | `GET /rates`, `GET /users/:id`, `GET /bookings?customerId=...`, `GET /tankers`, `GET /zones/:id`, `POST /bookings`, `PATCH /users/:id`, `GET /bookings/:id`, `PATCH /bookings/:id` |
| Zone Officer | `GET /bookings?zoneId=...`, `GET /users?zoneId=...&subsidyStatus=Applied`, `GET /users/:id`, `PATCH /users/:id`, `GET /bookings/:id`, `PATCH /bookings/:id` |
| Hydrant Operator | `GET /hydrants/:id`, `GET /bookings?hydrantId=...`, `GET /tankers?hydrantId=...`, `GET /users?role=driver&hydrantId=...`, `GET /bookings/:id`, `PATCH /hydrants/:id`, `PATCH /tankers/:id`, `PATCH /bookings/:id` |
| Driver | `GET /bookings?driverId=...`, `GET /bookings/:id`, `PATCH /bookings/:id` |
| Administrator | `GET /hydrants`, `GET /tankers`, `GET /rates`, `GET /users`, `GET /bookings`, `PATCH /rates/:id`, `PATCH /hydrants/:id` |

## 6. Booking status values and intended flow

- Commercial booking: `Approved` after submission.
- Subsidised booking: `Pending`, then officer changes it to `Approved` or `Rejected`.
- Operator assigns tanker and driver: `Assigned`.
- Operator records filled and departure: `Dispatched`.
- Driver records arrival: `Arrived`.
- Driver records delivery outcome: `Delivered` or `Failed`.
- Customer confirms a delivered booking: `Confirmed`.
- Customer disputes a delivered booking: `Disputed`; officer can mark it `Resolved`.
- Customer may cancel a `Pending` or `Approved` booking: `Cancelled`.

## 7. Important limitation for the Mid version

The mock API is intentionally simple and stores records in a local JSON file. It does not implement real user authentication, server-side role authorization, database transactions, concurrent booking protection, or production security. The browser stores a selected demo account in `sessionStorage`. These controls must be implemented in the backend phase before the system is used with real customers.
