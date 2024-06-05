const mysql = require('mysql2')
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    port: '3000',
    database: 'dcidatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.connect((err) => {
        if (err) {
            console.error('Database conneciton failed' + err.stack);
            return;
        }
        console.log('Connected to database');
});

module.exports = connection;