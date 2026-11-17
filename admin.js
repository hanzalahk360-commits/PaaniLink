PAGES.admin = async () => {
  const table = (headings, rows) => `<div class="scroll"><table><thead><tr>${headings.map(item => `<th scope="col">${esc(item)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  const load = async () => {
    const [hydrants, tankers, rates, users, bookings] = await Promise.all([
      api('/hydrants'), api('/tankers'), api('/rates'), api('/users'), api('/bookings')
    ]);
    const counts = {};
    bookings.forEach(booking => counts[booking.status] = (counts[booking.status] || 0) + 1);
    $('#rep').innerHTML = `<p class="stat"><strong>${bookings.length}</strong>Total bookings</p>` +
      Object.entries(counts).map(([status, count]) => `<p class="stat"><strong>${count}</strong>${esc(status)}</p>`).join('');
    $('#rt').innerHTML = table(['Size (gal)', 'Commercial (Rs)', 'Subsidised (Rs)'], rates.map(rate => [rate.size, rate.commercial, rate.subsidised]));
    $('#hyd').innerHTML = table(['Hydrant', 'Daily quota (gal)', 'Hours', 'Available'], hydrants.map(item => [item.name, item.quota, item.hours, item.available ? 'Yes' : 'No']));
    $('#tnk').innerHTML = table(['Plate', 'Capacity (gal)', 'Hydrant', 'Available'], tankers.map(item => [item.plate, item.capacity, item.hydrantId, item.available ? 'Yes' : 'No']));
    $('#usr').innerHTML = table(['Name', 'Role', 'Zone'], users.map(item => [item.name, item.role, item.zoneId || '-']));
    $('#rsel').innerHTML = '<option value="">Select tanker size</option>' + opts(rates, 'id', 'size');
    $('#qsel').innerHTML = '<option value="">Select hydrant</option>' + opts(hydrants, 'id', 'name');
  };

  safeSubmit('#rf', async event => {
    const form = new FormData(event.target);
    const id = form.get('id');
    const commercial = Number(form.get('commercial'));
    const subsidised = Number(form.get('subsidised'));
    if (!id) return say('Please select a tanker size.');
    if (!Number.isFinite(commercial) || commercial <= 0 || !Number.isFinite(subsidised) || subsidised <= 0) return say('Both rates must be greater than zero.');
    if (subsidised >= commercial) return say('Subsidised rate must be lower than the commercial rate.');
    await api(`/rates/${id}`, 'PATCH', { commercial, subsidised });
    say('Rates updated successfully.', true);
    await load();
  });

  safeSubmit('#qf', async event => {
    const form = new FormData(event.target);
    const id = form.get('id');
    const quota = Number(form.get('quota'));
    if (!id) return say('Please select a hydrant.');
    if (!Number.isInteger(quota) || quota < 1000) return say('Quota must be a whole number of at least 1,000 gallons.');
    await api(`/hydrants/${id}`, 'PATCH', { quota });
    say('Hydrant quota updated successfully.', true);
    await load();
  });

  await load();
};

if (U && U.role === 'admin') PAGES.admin().catch(error => say(error.message));
