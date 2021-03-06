const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const hbs = require('hbs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateData, insertData, login, getSerials, putSerial, registerMac, checkForRegistration } = require('./src/DB/dbUtil');

dotenv.config({ path: './.env' });

const port = process.env.port || 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.set('views', './views');
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, '../views/partials'), function (err) {
    if (err) {
        console.log(error);
    }
});

app.get('/', async (req, res) => {
    if (req.session.user) {
        getSerials(req.session.user, (serials) => {
            res.render('dashboard', { serials: serials, title: "Dashboard", serial: uuidv4() });
        });
    } else {
        res.render('operation', { title: "QMS Serial" });
    }
});

app.post('/login', login);

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        res.render('operation', { title: "Qms Serial" });
    } else {
        await getSerials(req.session.user, (serials) => {
            res.render('dashboard', { serials: serials, title: "Dashboard", serial: uuidv4() });
        });
    }
});

app.post('/register', validateData, insertData);

app.post('/addserial', (req, res) => {
    if (req.session.user) {
        putSerial({ ...req.body, marketer: req.session.user.id }, (error, message) => {
            if (error) {
                res.send({ error });
            } else {
                res.send({ success: message });
            }
        });
    } else {
        res.send({ error: "Not Logged in" });
    }
});

app.post('/registermac', (req, res) => {
    registerMac({ ...req.body }, (error, message) => {
        if (error) {
            res.send({ error: error });
        } else {
            res.send({ success: message });
        }
    })
});

app.post('/recoverlicense', (req, res) => {
    checkForRegistration({ ...req.body }, (error, success) => {
        if (error) {
            res.send({ error });
        } else {
            res.send({ success });
        }
    })
});


app.listen(port, () => {
    console.log(`Server started on the port address : ${port}`);
});

