PAGES.customer = async () => {
  const rates = await api('/rates');
  $('#size').innerHTML = '<option value="">Select tanker size</option>' + opts(rates, 'size', rate =>
    `${Number(rate.size).toLocaleString()} gallons`);
  $('#date').min = today();

  const load = async () => {
    U = await api(`/users/${U.id}`);
    sessionStorage.setItem('user', JSON.stringify(U));
    const [bookings, tankers] = await Promise.all([
      api(`/bookings?customerId=${U.id}&_sort=id&_order=desc`), api('/tankers')
    ]);

    if (U.subsidyStatus === 'Approved') {
      $('#sub').innerHTML = '<p class="ok">Your subsidised status is approved.</p>';
    } else if (U.subsidyStatus === 'Applied') {
      $('#sub').innerHTML = '<p>Your subsidy application is waiting for the Zone Officer.</p>';
    } else {
      $('#sub').innerHTML = `
        <form id="sf" novalidate>
          <h2>Apply for subsidised status</h2>
          <label for="proof">Proof details (household, hospital or mosque registration)</label>
          <textarea id="proof" name="proof" rows="3" required placeholder="Enter your proof details"></textarea>
          <button type="submit">Submit subsidy application</button>
        </form>`;
      safeSubmit('#sf', async () => {
        const proof = $('#proof').value.trim();
        if (proof.length < 10) return say('Please enter proof details of at least 10 characters.');
        await api(`/users/${U.id}`, 'PATCH', { subsidyStatus: 'Applied', subsidyProof: proof });
        say('Subsidy application submitted.', true);
        await load();
      });
    }

    $('#list').innerHTML = grid(bookings.map(booking => {
      const tanker = tankers.find(item => item.id === booking.tankerId);
      let actions = '';
      if (['Pending', 'Approved'].includes(booking.status)) actions += btn('cancel', booking.id, 'Cancel booking', 'ghost');
      if (booking.status === 'Delivered') actions += btn('confirm', booking.id, 'Confirm delivery') + btn('dispute', booking.id, 'Dispute delivery', 'ghost');
      return card(booking, tanker ? `<dt>Tanker</dt><dd>${esc(tanker.plate)}</dd>` : '', actions);
    }), 'No bookings yet. Place your first booking above.');
  };

  H.cancel = async id => {
    const booking = await api(`/bookings/${id}`);
    if (!['Pending', 'Approved'].includes(booking.status)) return say('This booking can no longer be cancelled.');
    await set(id, { status: 'Cancelled' });
    say('Booking cancelled.', true);
    await load();
  };
  H.confirm = async id => {
    const booking = await api(`/bookings/${id}`);
    if (booking.status !== 'Delivered') return say('Only a delivered booking can be confirmed.');
    await set(id, { status: 'Confirmed' });
    say('Delivery confirmed.', true);
    await load();
  };
  H.dispute = async id => {
    const booking = await api(`/bookings/${id}`);
    if (booking.status !== 'Delivered') return say('Only a delivered booking can be disputed.');
    await set(id, { status: 'Disputed' });
    say('Dispute sent to the Zone Officer.', true);
    await load();
  };

  safeSubmit('#bf', async event => {
    const form = new FormData(event.target);
    const size = Number(form.get('size'));
    const type = form.get('type');
    const date = form.get('date');
    const address = String(form.get('address') || '').trim();
    const rate = rates.find(item => Number(item.size) === size);
    if (!rate) return say('Please select a tanker size.');
    if (!['Commercial', 'Subsidised'].includes(type)) return say('Please select a valid booking type.');
    if (!date || date < today()) return say('Please choose today or a future date.');
    if (address.length < 10) return say('Delivery address must be at least 10 characters.');

    const mine = await api(`/bookings?customerId=${U.id}`);
    const sameDay = mine.filter(item => item.date === date && !['Cancelled', 'Rejected'].includes(item.status));
    if (sameDay.length >= 2) return say('Maximum 2 bookings per customer per day. Choose another date.');

    if (type === 'Subsidised') {
      if (U.subsidyStatus !== 'Approved') return say('Your subsidised status must be approved first.');
      const month = date.slice(0, 7);
      const monthly = mine.filter(item => item.type === 'Subsidised' && item.date.startsWith(month) &&
        !['Cancelled', 'Rejected'].includes(item.status));
      if (monthly.length >= Number(U.monthlyLimit || 0)) return say('Your monthly subsidised booking limit has been reached.');
    }

    const zone = await api(`/zones/${U.zoneId}`);
    await api('/bookings', 'POST', {
      customerId: U.id, zoneId: U.zoneId, hydrantId: zone.hydrantId,
      size, type, date, address,
      price: type === 'Subsidised' ? rate.subsidised : rate.commercial,
      status: type === 'Subsidised' ? 'Pending' : 'Approved',
      tankerId: null, driverId: null, note: ''
    });
    event.target.reset();
    $('#date').min = today();
    say('Booking placed successfully.', true);
    await load();
  });

  await load();
};

if (U && U.role === 'customer') PAGES.customer().catch(error => say(error.message));
