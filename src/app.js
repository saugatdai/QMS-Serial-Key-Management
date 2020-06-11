const express = require('express');
const dotenv = require('dotenv');

const port = 3000 || process.env.port;

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'hbs');

app.post('/login', (req,res) => {
    console.log('got login request');
    console.log(req.body);
    res.send({success : 'request successful'});
});

app.post('/register', (req,res) => {
    console.log(req.body);

    res.send({success : 'request successful'});
});

app.listen(port, () => {
    console.log(`Server started on the port address : ${port}`);
});