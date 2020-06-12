const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');

const { validateData, insertData, login, getSerials } = require('./DB/dbUtil');

dotenv.config({ path: './.env' });

const port = 3000 || process.env.port;

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


app.get('/', async (req, res) => {
    console.log(req.session);
    if(req.session.user){
        res.render('dashboard');
    }else{
        res.render('operation');
    }
});

app.post('/login', login);

app.get('/dashboard', (req, res) => {
    if(!req.session.user){
        res.render('operation');
    }else{
        getSerials(req.session.user, (serials) => {
            res.render('dashboard', {serials});
        });
    }
});

app.post('/register', validateData, insertData );

app.listen(port, () => {
    console.log(`Server started on the port address : ${port}`);
});

