import pool from '../config/db.js';

async function run() {
  const auction_id = Number(process.argv[2] || 1);
  const user_id = Number(process.argv[3] || 4);
  try {
    const [[auction]] = await pool.query('SELECT id, final_price, winner_id, seller_id, ends_at, status FROM auctions WHERE id = ?', [auction_id]);
    if (!auction) throw new Error('Auction not found');
    if (Number(auction.winner_id) !== user_id) throw new Error('User is not winner');
    const finalPrice = Number(auction.final_price || 0);
    console.log('Auction', auction_id, 'finalPrice', finalPrice);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [winnerRows] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [user_id]);
      const winnerBal = winnerRows && winnerRows[0] ? Number(winnerRows[0].balance || 0) : 0;
      console.log('Winner balance:', winnerBal);
      if (winnerBal < finalPrice) {
        console.log('Insufficient funds');
        await conn.rollback();
        process.exit(1);
      }
      const commissionRate = Number(process.env.COMMISSION_RATE || 0.05);
      const commission = Math.round(finalPrice * commissionRate * 100) / 100;
      const sellerShare = Math.round((finalPrice - commission) * 100) / 100;

      await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [finalPrice, user_id]);
      await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [user_id, 'AUCTION_PAYMENT', finalPrice, auction_id, auction.seller_id, 'Payment for won auction']);

      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [sellerShare, auction.seller_id]);
      await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [auction.seller_id, 'SALE_PROCEEDS', sellerShare, auction_id, user_id, 'Proceeds from auction (after commission)']);

      if (commission > 0) {
        await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [commission, 1]);
        await conn.query('INSERT INTO transactions (user_id, type, amount, auction_id, related_user_id, note) VALUES (?, ?, ?, ?, ?, ?)', [1, 'COMMISSION', commission, auction_id, user_id, 'Platform commission']);
      }

      await conn.query('UPDATE auctions SET is_paid = 1 WHERE id = ?', [auction_id]);

      await conn.commit();
      console.log('Simulated payment applied');

      // Show resulting balances
      const [users] = await pool.query('SELECT id, name, email, balance FROM users WHERE id IN (?, ?, 1)', [user_id, auction.seller_id]);
      console.log('Balances after:');
      for (const u of users) console.log(u);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Simulate payment failed', e && e.stack ? e.stack : e);
    process.exit(1);
  } finally {
    process.exit();
  }
}

run();
