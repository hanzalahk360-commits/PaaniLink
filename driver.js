PAGES.driver = async () => {
  const load = async () => {
    const bookings = await api(`/bookings?driverId=${U.id}&_sort=date&_order=asc`);
    $('#list').innerHTML = grid(bookings.map(booking => {
      let actions = '';
      if (booking.status === 'Dispatched') actions = btn('arrive', booking.id, 'Mark arrived');
      if (booking.status === 'Arrived') {
        actions = `<label for="reason${booking.id}">Failure reason (only if delivery fails)</label>
          <select id="reason${booking.id}" class="reason"><option value="">Select reason</option>
          <option>House locked</option><option>Road blocked</option><option>Customer not available</option></select>` +
          btn('delivered', booking.id, 'Mark delivered') + btn('failed', booking.id, 'Mark failed', 'danger');
      }
      return card(booking, '', actions);
    }), 'No trips assigned to you.');
  };

  H.arrive = async id => {
    const booking = await api(`/bookings/${id}`);
    if (booking.driverId !== U.id || booking.status !== 'Dispatched') return say('This trip is not ready to be marked arrived.');
    await set(id, { status: 'Arrived' });
    say('Trip marked as arrived.', true);
    await load();
  };
  H.delivered = async id => {
    const booking = await api(`/bookings/${id}`);
    if (booking.driverId !== U.id || booking.status !== 'Arrived') return say('Only your arrived trip can be marked delivered.');
    await set(id, { status: 'Delivered' });
    say('Delivery recorded. Waiting for customer confirmation.', true);
    await load();
  };
  H.failed = async (id, button) => {
    const reason = button.closest('.card').querySelector('.reason').value;
    if (!reason) return say('Please select a reason for the failed delivery.');
    const booking = await api(`/bookings/${id}`);
    if (booking.driverId !== U.id || booking.status !== 'Arrived') return say('Only your arrived trip can be marked failed.');
    await set(id, { status: 'Failed', note: reason });
    say('Trip marked as failed.', true);
    await load();
  };

  await load();
};

if (U && U.role === 'driver') PAGES.driver().catch(error => say(error.message));
