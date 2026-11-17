PAGES.officer = async () => {
  const load = async () => {
    const [bookings, applications] = await Promise.all([
      api(`/bookings?zoneId=${U.zoneId}&_sort=id&_order=desc`),
      api(`/users?zoneId=${U.zoneId}&subsidyStatus=Applied`)
    ]);
    $('#apps').innerHTML = grid(applications.map(user => `
      <article class="card"><header><h3>${esc(user.name)}</h3></header>
      <dl><dt>CNIC</dt><dd>${esc(user.cnic)}</dd><dt>Address</dt><dd>${esc(user.address)}</dd>
      <dt>Proof</dt><dd>${esc(user.subsidyProof || 'Not provided')}</dd></dl>
      <div class="acts">${btn('verify', user.id, 'Approve subsidy')}${btn('deny', user.id, 'Reject application', 'ghost')}</div></article>`),
      'No pending subsidy applications.');

    $('#list').innerHTML = grid(bookings.map(booking => {
      let actions = '';
      if (booking.status === 'Pending') actions = btn('approve', booking.id, 'Approve booking') + btn('reject', booking.id, 'Reject booking', 'ghost');
      if (booking.status === 'Disputed') actions = btn('resolve', booking.id, 'Resolve dispute');
      return card(booking, '', actions);
    }), 'No bookings in your zone.');
  };

  const changeBooking = async (id, status, message) => {
    const booking = await api(`/bookings/${id}`);
    if (booking.zoneId !== U.zoneId) return say('This booking is outside your zone.');
    const allowed = status === 'Resolved' ? booking.status === 'Disputed' : booking.status === 'Pending';
    if (!allowed) return say('This booking status cannot be changed with this action.');
    await set(id, { status });
    say(message, true);
    await load();
  };
  H.approve = id => changeBooking(id, 'Approved', 'Booking approved.');
  H.reject = id => changeBooking(id, 'Rejected', 'Booking rejected.');
  H.resolve = id => changeBooking(id, 'Resolved', 'Dispute marked as resolved.');

  H.verify = async id => {
    const user = await api(`/users/${id}`);
    if (user.zoneId !== U.zoneId || user.subsidyStatus !== 'Applied') return say('This application is not available for your zone.');
    await api(`/users/${id}`, 'PATCH', { subsidyStatus: 'Approved' });
    say('Subsidy application approved.', true);
    await load();
  };
  H.deny = async id => {
    const user = await api(`/users/${id}`);
    if (user.zoneId !== U.zoneId || user.subsidyStatus !== 'Applied') return say('This application is not available for your zone.');
    await api(`/users/${id}`, 'PATCH', { subsidyStatus: 'Rejected' });
    say('Subsidy application rejected.', true);
    await load();
  };

  await load();
};

if (U && U.role === 'officer') PAGES.officer().catch(error => say(error.message));
