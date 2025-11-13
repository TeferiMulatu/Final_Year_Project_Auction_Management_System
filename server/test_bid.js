(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bidder@gmail.com', password: 'bidder@123' })
    });
    const loginBody = await loginRes.json();
    console.log('LOGIN_STATUS', loginRes.status);
    console.log('LOGIN_BODY', loginBody);
    if (!loginBody.token) return console.error('No token, aborting');
    const token = loginBody.token;

    // Place bid
    const bidRes = await fetch('http://localhost:5000/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ auction_id: 1, amount: 305 })
    });
    console.log('BID_STATUS', bidRes.status);
    try {
      const bidBody = await bidRes.json();
      console.log('BID_BODY', bidBody);
    } catch (e) {
      console.log('BID_NO_JSON', e.message);
    }
  } catch (e) {
    console.error('TEST ERROR', e);
  }
})();
