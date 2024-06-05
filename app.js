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


app.get('/index', (req, res) => {
    // Handle the request to /index
    res.render('index'); // or any other appropriate response
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Routes

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { error: req.session.error }); // Pass error message to login template
    req.session.error = null; // Clear error message after displaying it
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

            if (!password || !user.password) {
                req.session.error = 'Password or username is undefined'; // Set error message
                return res.redirect('/login'); // Redirect with error message
            }

            bcrypt.compare(password, user.password, (err, match) => {
                if (err) {
                    console.error(`Bcrypt error: ${err}`);
                    return res.status(500).send('Internal Server Error');
                }

                if (match) {
                    req.session.user = user;
                    console.log(`Login successful for username: ${username}`);

                    if (user.first_login) {
                        return res.redirect('/change-password');
                    } else {
                        return res.redirect('/dashboard');
                    }
                } else {
                    req.session.error = 'Invalid username or password'; // Set error message
                    return res.redirect('/login'); // Redirect with error message
                }
            });
        } else {
            req.session.error = 'Invalid username or password'; // Set error message
            return res.redirect('/login'); // Redirect with error message
        }
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(`Error destroying session: ${err}`);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/login');
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
