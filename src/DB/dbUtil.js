const mysql = require('mysql');
const dotenv = require('dotenv');
const validator = require('validator');
const bcrypt = require('bcryptjs');


dotenv.config({ path: './.env' });


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect(error => {
    if (error) {
        console.log('failed to connect to the database' + error);
    } else {
        console.log('successfully connected to the database');
    }
});

const validateData = async (req, res, next) => {
    try {
        const { email, mobile, password, confirm } = { ...req.body };
        // validating mobile number
        if (mobile.length !== 10 || parseInt(mobile).toString() !== mobile) {
            throw new Error('Moblie number is 10 digit long');
        }
        else if (password.length < 8) {
            throw new Error('Passwords must be at least 8 characters long');
        }
        // checking for the password match
        else if (password !== confirm) {
            throw new Error('Passwords does not match');
        }
        // check if email exists
        else if (!validator.isEmail(email)) {
            throw new Error('Please insert a proper email');
        }
        next();
    } catch (error) {
        res.send({ error: error.toString() })
    }
}

const insertData = async (req, res) => {
    const { name, email, mobile, password } = { ...req.body };

    const hashedPassword = await bcrypt.hash(password, 8);

    // check for existing email
    db.query("select * from `marketers` where `email`= ?", email, (error, results, fields) => {
        if (error) {
            console.log(error.toString());
        }
        if (results.length !== 0) {
            res.send({ error: "Email already exists" });
        } else {
            // insert the datas
            db.query("insert into marketers (`name`,`email`,`mobile`,`password`) values (?,?,?,?)", [name, email, mobile, hashedPassword], (error, results, fields) => {
                if (error) {
                    console.log(error.toString())
                } else {
                    res.send({ success: "Info submitted. You'll be notified after approval" });
                }
            });
        }
    });
}

const login = async (req, res) => {
    try {
        const { email, password } = { ...req.body };
        // check for empty fields
        if (!email || !password) {
            throw new Error("Username or Password can not be empty");
        }
        // validate information from the database
        const sql = "select * from `marketers` where `email`=?";
        db.query(sql,[email], async (error, results, fields) => {
            if(error){
                console.log(error);
            }else if(results.length === 0 || !await bcrypt.compare(password, results[0].password)){
                res.send({error: "Email or Password invalid"});
            }else if(!results[0].approval){
                res.send({error: "You are not approved for log in"});
            }else{
                req.session.user = results[0];
                res.send({success: "Successfully logged In"});
            }
        });
    }catch(error){
        res.send({error: error.toString()});
    }
}

const getSerials = (user, callback) => {
    const sql = 'select * from `serials` where marketer=?';

    db.query(sql,[user.id],(error, results, fields) => {
        if(error){
            console.log(error);
        }else{
            callback(results);
        }
    })
}

module.exports = { insertData, validateData, login, getSerials };


