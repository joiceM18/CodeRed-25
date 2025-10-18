require('dotenv').config()
const MYSQL = require('mysql2')

console.log(process.env.DB_DATABASE);

const pool = MYSQL.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT) || 3306,
    ssl: {
        rejectUnauthorized: true // or false for testing
    }
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err)
        return
    }
    console.log('Connected to the database')
    connection.release()
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err)
});

module.exports = pool;
