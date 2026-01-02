// Simple test script: login as bidder and call /api/wallet
import http from 'http'

function httpPost(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data)
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }
    const req = http.request(opts, (res) => {
      let raw = ''
      res.on('data', (d) => raw += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) } catch (e) { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function httpGet(path, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    }
    const req = http.request(opts, (res) => {
      let raw = ''
      res.on('data', (d) => raw += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) } catch (e) { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function runTest() {
  // Retry login if server not yet up
  let loginRes = null
  for (let i = 0; i < 10; i++) {
    try {
      loginRes = await httpPost('/api/auth/login', { email: 'bidder@gmail.com', password: 'bidder@123' })
      break
    } catch (e) {
      console.log('Login attempt failed, retrying...', e && e.message)
      await new Promise(r => setTimeout(r, 500))
    }
  }
  console.log('Login response:', loginRes)
  if (!loginRes || loginRes.status >= 400) {
    console.error('Login failed, aborting test')
    process.exit(1)
  }
  const token = loginRes.body && loginRes.body.token
  if (!token) {
    console.error('No token returned')
    process.exit(1)
  }
  const walletRes = await httpGet('/api/wallet', token)
  console.log('Wallet response:', walletRes)
}

runTest().catch(e => { console.error('Test script error', e && e.stack ? e.stack : e); process.exit(1) })
