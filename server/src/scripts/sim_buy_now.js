import fetch from 'node-fetch';

const API = process.env.API_BASE || 'http://localhost:5000';

async function run() {
  try {
    // Login as seeded bidder
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bidder@gmail.com', password: 'bidder@123' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson));
    const token = loginJson.token;

    // Place buy-now bid for auction 1 (buy_now_price 38000)
    const bidRes = await fetch(`${API}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ auction_id: 1, amount: 38000, deposit_paid: 8750 })
    });
    const bidJson = await bidRes.json();
    console.log('Bid response status:', bidRes.status, 'body:', bidJson);
  } catch (err) {
    console.error('Sim buy-now failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
