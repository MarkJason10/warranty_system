const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const connection = require('./db');

// Example user details
const username = 'superadmin';
const password = '123';
const role = 'superadmin';

// Hash the password
bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hash, role],
        (err, results) => {
            if (err) throw err;
            console.log('User registered successfully!');
        }
    );
});
