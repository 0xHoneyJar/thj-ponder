import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:AezOWOUiPwoaPxSrXmxnDvgtUpAXUGZC@postgres-zwah.railway.internal:5432/railway';

console.log('Testing database connection...');
const maskedUrl = DATABASE_URL.replace(/:([^@]+)@/, ':****@');
console.log('DATABASE_URL:', maskedUrl);

const client = new Client({
  connectionString: DATABASE_URL,
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT current_database(), current_user, version()');
  })
  .then(result => {
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('PostgreSQL version:', result.rows[0].version.split(',')[0]);
    client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });