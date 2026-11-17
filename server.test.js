const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../server');

const sourceDb = path.join(__dirname, '..', 'db.json');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paanilink-test-'));
const testDb = path.join(tempDir, 'db.json');
fs.copyFileSync(sourceDb, testDb);
const server = createServer({ dbPath: testDb });
let baseUrl;

test.before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function request(route, method = 'GET', data) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

test('serves the login page and linked frontend files', async () => {
  const page = await fetch(baseUrl + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Welcome to PaaniLink/);
  const script = await fetch(baseUrl + '/common.js');
  assert.equal(script.status, 200);
});

test('returns role records and supports filters and sorting', async () => {
  const users = await request('/users');
  assert.equal(users.status, 200);
  assert.ok(users.body.some(user => user.role === 'customer'));
  const drivers = await request('/users?role=driver&hydrantId=1');
  assert.equal(drivers.status, 200);
  assert.ok(drivers.body.length >= 1);
  assert.ok(drivers.body.every(user => user.role === 'driver' && user.hydrantId === 1));
  const sorted = await request('/bookings?_sort=id&_order=desc');
  assert.ok(sorted.body[0].id > sorted.body[sorted.body.length - 1].id);
});

test('customer can create a booking and cancel it', async () => {
  const created = await request('/bookings', 'POST', {
    customerId: 2, zoneId: 1, hydrantId: 1, size: 1000, type: 'Commercial',
    date: '2026-12-01', address: 'House 99, Gulshan', price: 3000,
    status: 'Approved', tankerId: null, driverId: null, note: ''
  });
  assert.equal(created.status, 201);
  const cancelled = await request(`/bookings/${created.body.id}`, 'PATCH', { status: 'Cancelled' });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.status, 'Cancelled');
});

test('zone officer can read zone bookings and update subsidy status', async () => {
  const zoneBookings = await request('/bookings?zoneId=1');
  assert.equal(zoneBookings.status, 200);
  const update = await request('/users/2', 'PATCH', { subsidyStatus: 'Applied', subsidyProof: 'Registered low income household proof' });
  assert.equal(update.status, 200);
  assert.equal(update.body.subsidyStatus, 'Applied');
});

test('operator can assign a tanker and driver and dispatch a booking', async () => {
  const created = await request('/bookings', 'POST', {
    customerId: 2, zoneId: 1, hydrantId: 1, size: 1000, type: 'Commercial',
    date: '2026-12-02', address: 'Flat 10, Gulshan', price: 3000,
    status: 'Approved', tankerId: null, driverId: null, note: ''
  });
  const assigned = await request(`/bookings/${created.body.id}`, 'PATCH', {
    status: 'Assigned', tankerId: 1, driverId: 5
  });
  assert.equal(assigned.body.status, 'Assigned');
  const dispatched = await request(`/bookings/${created.body.id}`, 'PATCH', { status: 'Dispatched' });
  assert.equal(dispatched.body.status, 'Dispatched');
});

test('driver can update trip status and customer can confirm delivery', async () => {
  const created = await request('/bookings', 'POST', {
    customerId: 2, zoneId: 1, hydrantId: 1, size: 1000, type: 'Commercial',
    date: '2026-12-03', address: 'Flat 11, Gulshan', price: 3000,
    status: 'Dispatched', tankerId: 2, driverId: 5, note: ''
  });
  const arrived = await request(`/bookings/${created.body.id}`, 'PATCH', { status: 'Arrived' });
  assert.equal(arrived.body.status, 'Arrived');
  const delivered = await request(`/bookings/${created.body.id}`, 'PATCH', { status: 'Delivered' });
  assert.equal(delivered.body.status, 'Delivered');
  const confirmed = await request(`/bookings/${created.body.id}`, 'PATCH', { status: 'Confirmed' });
  assert.equal(confirmed.body.status, 'Confirmed');
});

test('administrator can update rates and hydrant quota', async () => {
  const rate = await request('/rates/1', 'PATCH', { commercial: 3200, subsidised: 900 });
  assert.equal(rate.body.commercial, 3200);
  const quota = await request('/hydrants/1', 'PATCH', { quota: 35000 });
  assert.equal(quota.body.quota, 35000);
});

test('returns a useful 404 response for missing records', async () => {
  const missing = await request('/bookings/99999');
  assert.equal(missing.status, 404);
  assert.match(missing.body.error, /not found/i);
});

test('health endpoint reports that the mock API is running', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');
});

test('serves every role page and shared stylesheet', async () => {
  for (const file of ['index.html', 'customer.html', 'officer.html', 'operator.html', 'driver.html', 'admin.html', 'style.css']) {
    const response = await fetch(`${baseUrl}/${file}`);
    assert.equal(response.status, 200, `${file} should load`);
  }
});

test('supports pagination and PUT while preserving record IDs', async () => {
  const firstPage = await request('/users?_page=1&_limit=2');
  assert.equal(firstPage.status, 200);
  assert.equal(firstPage.body.length, 2);
  const before = await request('/users/1');
  const replaced = await request('/users/1', 'PUT', { name: 'Ali Updated', role: 'customer' });
  assert.equal(replaced.status, 200);
  assert.equal(replaced.body.id, before.body.id);
  assert.equal(replaced.body.name, 'Ali Updated');
});

test('returns a clear client error for malformed JSON', async () => {
  const response = await fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json'
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.error, /valid JSON/i);
});
