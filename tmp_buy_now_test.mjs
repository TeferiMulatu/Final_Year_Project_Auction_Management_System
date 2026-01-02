(async ()=>{
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'bidder@gmail.com', password:'bidder@123'})});
    const loginJson = await loginRes.json();
    console.log('LOGIN', loginRes.status, JSON.stringify(loginJson));
    const token = loginJson.token;
    const bidRes = await fetch('http://localhost:5000/api/bids',{method:'POST', headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({auction_id:1, amount:38000.00, deposit_paid:8750.00})});
    const bidText = await bidRes.text();
    console.log('BID', bidRes.status, bidText);
  } catch (err) {
    console.error('ERR', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
