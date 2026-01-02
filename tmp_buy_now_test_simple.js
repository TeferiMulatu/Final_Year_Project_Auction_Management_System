const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(options, res => {
      let out = '';
      res.on('data', d => out += d.toString());
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
}

(async ()=>{
  try {
    const login = await post('/api/auth/login', { email: 'bidder@gmail.com', password: 'bidder@123' });
    console.log('LOGIN', login.status, login.body);
    const token = JSON.parse(login.body).token;
    const bid = await post('/api/bids', { auction_id:1, amount:38000.00, deposit_paid:8750.00 }, token);
    console.log('BID', bid.status, bid.body);
  } catch (err) {
    console.error('ERR', err.stack || err);
  }
})();
