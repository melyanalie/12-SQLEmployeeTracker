// db.js
const { Client } = require('pg');

const client = new Client({
    user: 'yourUsername',
    host: 'localhost',
    database: 'yourDatabase',
    password: 'yourPassword',
    port: 5432
});

client.connect();

module.exports = client;
