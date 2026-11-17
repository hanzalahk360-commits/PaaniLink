const $ = selector => document.querySelector(selector);
const page = document.body.dataset.page;
const PAGES = {};
const H = {};

// All pages use Fetch to communicate with the local mock REST API.
const api = async (url, method = 'GET', data) => {
  const options = { method, headers: { Accept: 'application/json' } };
  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('Cannot connect to the local server. Please run npm start and try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const today = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};
const say = (message, success = false) => {
  const box = $('#msg');
  if (!box) return;
  box.textContent = message;
  box.className = success ? 'ok' : 'err';
};
const btn = (action, id, label, style = '') =>
  `<button type="button" class="${style}" data-act="${esc(action)}" data-id="${esc(id)}">${esc(label)}</button>`;
const opts = (list, valueKey, label) => list.map(item => {
  const text = typeof label === 'function' ? label(item) : item[label];
  return `<option value="${esc(item[valueKey])}">${esc(text)}</option>`;
}).join('');
const set = (id, data) => api(`/bookings/${encodeURIComponent(id)}`, 'PATCH', data);
const grid = (items, emptyText) => items.length ? items.join('') : `<p>${esc(emptyText)}</p>`;

// Use this helper for every form so API errors are shown on the page.
const safeSubmit = (selector, handler) => {
  const form = $(selector);
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await handler(event);
    } catch (error) {
      say(error.message || 'Something went wrong. Please try again.');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
};
const card = (booking, extra = '', actions = '') => `
  <article class="card">
    <header><h3>Booking ${esc(booking.id)}: ${Number(booking.size).toLocaleString()} gal</h3>
    <span class="tag s-${esc(booking.status)}">${esc(booking.status)}</span></header>
    <dl><dt>Date</dt><dd>${esc(booking.date)}</dd><dt>Type</dt><dd>${esc(booking.type)}</dd>
    <dt>Address</dt><dd>${esc(booking.address)}</dd><dt>Price</dt><dd>Rs ${Number(booking.price).toLocaleString()}</dd>
    ${booking.note ? `<dt>Note</dt><dd>${esc(booking.note)}</dd>` : ''}${extra}</dl>
    <div class="acts">${actions}</div>
  </article>`;

let U = null;
try { U = JSON.parse(sessionStorage.getItem('user') || 'null'); }
catch { sessionStorage.removeItem('user'); }
if (page !== 'index') {
  if (!U || U.role !== page) {
    location.href = 'index.html';
  } else {
    $('#who').innerHTML = `<span>${esc(U.name)}</span><button type="button" id="out" class="ghost">Log out</button>`;
    $('#out').onclick = () => {
      sessionStorage.removeItem('user');
      location.href = 'index.html';
    };
  }
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-act]');
  if (!button || !H[button.dataset.act]) return;
  button.disabled = true;
  try {
    await H[button.dataset.act](button.dataset.id, button);
  } catch (error) {
    say(error.message);
  } finally {
    button.disabled = false;
  }
});
