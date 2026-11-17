PAGES.operator = async () => {
  const load = async () => {
    const [hydrant, bookings, tankers, drivers] = await Promise.all([
      api(`/hydrants/${U.hydrantId}`),
      api(`/bookings?hydrantId=${U.hydrantId}&_sort=date&_order=asc`),
      api(`/tankers?hydrantId=${U.hydrantId}`),
      api(`/users?role=driver&hydrantId=${U.hydrantId}`)
    ]);

    $('#hy').innerHTML = `<p><strong>${esc(hydrant.name)}</strong>: daily quota ${Number(hydrant.quota).toLocaleString()} gallons,
      hours ${esc(hydrant.hours)}. Status: ${hydrant.available ? 'Available' : 'Unavailable'}.</p>` +
      btn('hydrant', hydrant.id, hydrant.available ? 'Mark hydrant unavailable' : 'Mark hydrant available', 'ghost');

    $('#tk').innerHTML = grid(tankers.map(tanker => `
      <article class="card"><header><h3>${esc(tanker.plate)}</h3>
      <span class="tag ${tanker.available ? 's-Approved' : 's-Cancelled'}">${tanker.available ? 'Available' : 'Unavailable'}</span></header>
      <dl><dt>Capacity</dt><dd>${Number(tanker.capacity).toLocaleString()} gal</dd></dl>
      <div class="acts">${btn('tanker', tanker.id, tanker.available ? 'Mark unavailable' : 'Mark available', 'ghost')}</div></article>`),
      'No tankers registered for this hydrant.');

    const dispatchable = bookings.filter(booking => ['Approved', 'Assigned'].includes(booking.status));
    $('#list').innerHTML = grid(dispatchable.map(booking => {
      const assignedTanker = tankers.find(item => item.id === booking.tankerId);
      const assignedDriver = drivers.find(item => item.id === booking.driverId);
      const details = assignedTanker ? `<dt>Tanker</dt><dd>${esc(assignedTanker.plate)}</dd>
        <dt>Driver</dt><dd>${esc(assignedDriver ? assignedDriver.name : 'Not found')}</dd>` : '';
      let actions = '';
      if (booking.status === 'Approved') {
        const availableTankers = tankers.filter(item => item.available && item.capacity === booking.size);
        actions = `<label for="tk${booking.id}">Tanker</label><select id="tk${booking.id}" class="tk" required>
          <option value="">Select tanker</option>${opts(availableTankers, 'id', 'plate')}</select>
          <label for="dr${booking.id}">Driver</label><select id="dr${booking.id}" class="dr" required>
          <option value="">Select driver</option>${opts(drivers, 'id', 'name')}</select>` +
          btn('assign', booking.id, 'Assign tanker and driver');
      } else if (booking.status === 'Assigned') {
        actions = btn('dispatch', booking.id, 'Mark filled and left');
      }
      return card(booking, details, actions);
    }), 'No approved bookings waiting for dispatch.');
  };

  H.hydrant = async id => {
    const hydrant = await api(`/hydrants/${id}`);
    await api(`/hydrants/${id}`, 'PATCH', { available: !hydrant.available });
    say('Hydrant status updated.', true);
    await load();
  };
  H.tanker = async id => {
    const tanker = await api(`/tankers/${id}`);
    await api(`/tankers/${id}`, 'PATCH', { available: !tanker.available });
    say('Tanker availability updated.', true);
    await load();
  };
  H.dispatch = async id => {
    const booking = await api(`/bookings/${id}`);
    if (booking.status !== 'Assigned') return say('Only an assigned booking can be dispatched.');
    await set(id, { status: 'Dispatched' });
    say('Tanker marked as filled and dispatched.', true);
    await load();
  };
  H.assign = async (id, button) => {
    const cardElement = button.closest('.card');
    const tankerId = Number(cardElement.querySelector('.tk').value);
    const driverId = Number(cardElement.querySelector('.dr').value);
    if (!tankerId || !driverId) return say('Please select both a tanker and a driver.');

    const [booking, hydrant, tanker, driver, sameDay] = await Promise.all([
      api(`/bookings/${id}`), api(`/hydrants/${U.hydrantId}`),
      api(`/tankers/${tankerId}`), api(`/users/${driverId}`),
      api(`/bookings?hydrantId=${U.hydrantId}&date=${encodeURIComponent((await api(`/bookings/${id}`)).date)}`)
    ]);
    if (booking.status !== 'Approved') return say('This booking is no longer waiting for assignment.');
    if (booking.hydrantId !== U.hydrantId || !hydrant.available) return say('This hydrant is unavailable or does not serve this booking.');
    if (!tanker.available || tanker.hydrantId !== U.hydrantId || tanker.capacity !== booking.size) return say('Choose an available tanker with the exact required capacity.');
    if (driver.role !== 'driver' || driver.hydrantId !== U.hydrantId) return say('Choose a driver registered at this hydrant.');

    const activeStatuses = ['Assigned', 'Dispatched', 'Arrived', 'Delivered', 'Confirmed', 'Failed'];
    const otherBookings = sameDay.filter(item => item.id !== booking.id && activeStatuses.includes(item.status));
    if (otherBookings.some(item => item.tankerId === tankerId || item.driverId === driverId)) {
      return say('This tanker or driver is already booked for that date.');
    }
    const usedGallons = otherBookings.reduce((total, item) => total + Number(item.size), 0);
    if (usedGallons + Number(booking.size) > Number(hydrant.quota)) {
      return say(`Daily quota exceeded. ${usedGallons.toLocaleString()} gallons are already assigned.`);
    }

    await set(id, { status: 'Assigned', tankerId, driverId });
    say('Tanker and driver assigned successfully.', true);
    await load();
  };

  await load();
};

if (U && U.role === 'operator') PAGES.operator().catch(error => say(error.message));
