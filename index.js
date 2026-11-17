PAGES.index = async () => {
  const [users, zones] = await Promise.all([api('/users'), api('/zones')]);
  $('#acct').innerHTML = '<option value="">Select account</option>' +
    opts(users, 'id', user => `${user.name} (${user.role})`);
  $('#zone').innerHTML = '<option value="">Select zone</option>' + opts(zones, 'id', 'name');

  const openAccount = user => {
    sessionStorage.setItem('user', JSON.stringify(user));
    location.href = `${user.role}.html`;
  };

  safeSubmit('#lf', async () => {
    const user = users.find(item => String(item.id) === $('#acct').value);
    if (!user) return say('Please select an account.');
    openAccount(user);
  });

  safeSubmit('#rg', async event => {
    const form = Object.fromEntries(new FormData(event.target));
    form.name = form.name.trim();
    form.address = form.address.trim();
    if (!/^[A-Za-z ]{3,}$/.test(form.name)) return say('Name must contain at least 3 English letters.');
    if (!/^\d{13}$/.test(form.cnic)) return say('CNIC must contain exactly 13 digits without dashes.');
    if (!/^03\d{9}$/.test(form.phone)) return say('Phone must be in the format 03XXXXXXXXX.');
    if (form.address.length < 10) return say('Address must be at least 10 characters.');
    if (!zones.some(zone => String(zone.id) === form.zoneId)) return say('Please select a valid zone.');
    if ((await api(`/users?cnic=${encodeURIComponent(form.cnic)}`)).length) return say('This CNIC is already registered.');

    const newUser = await api('/users', 'POST', {
      ...form,
      zoneId: Number(form.zoneId),
      role: 'customer',
      subsidyStatus: 'None',
      monthlyLimit: 2,
      subsidyProof: ''
    });
    openAccount(newUser);
  });
};

PAGES.index().catch(error => say(error.message));
