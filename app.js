const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const connection = require('./db');

const app = express();
const PORT = 3005;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check user roles
function checkRole(role) {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role === role) {
            return next();
        }
        res.status(403).send('Forbidden');
    };
}

// Routes

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Attempting login for username: ${username}`);
    
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(`Database query error: ${err}`);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) {
                    console.error(`Bcrypt error: ${err}`);
                    return res.status(500).send('Internal Server Error');
                }

                if (match) {
                    req.session.user = user;
                    console.log(`Login successful for username: ${username}`);
                    return res.redirect('/dashboard');
                } else {
                    console.log(`Invalid password for username: ${username}`);
                    return res.send('Invalid username or password');
                }
            });
        } else {
            console.log(`No user found with username: ${username}`);
            return res.send('Invalid username or password');
        }
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Ensure only superadmins can access the registration form
app.get('/register', [isAuthenticated, checkRole('superadmin')], (req, res) => {
    res.render('register');
});

// Handle the registration form submission
app.post('/register', [isAuthenticated, checkRole('superadmin')], (req, res) => {
    const { username, password, role } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        connection.query(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hash, role],
            (err, results) => {
                if (err) throw err;
                res.send('User registered successfully! <a href="/register">Register another user</a>');
            }
        );
    });
});




// Route examples for different roles
app.get('/superadmin', [isAuthenticated, checkRole('superadmin')], (req, res) => {
    res.send('Superadmin page');
});

app.get('/admin', [isAuthenticated, checkRole('admin')], (req, res) => {
    res.send('Admin page');
});

app.get('/staff', [isAuthenticated, checkRole('staff')], (req, res) => {
    res.send('Staff page');
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
