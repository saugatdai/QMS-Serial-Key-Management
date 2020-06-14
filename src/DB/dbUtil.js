const mysql = require('mysql');
const dotenv = require('dotenv');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const async = require('async');
const forEachOf = require('async/forEachOf');


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
        db.query(sql, [email], async (error, results, fields) => {
            if (error) {
                console.log(error);
            } else if (results.length === 0 || !await bcrypt.compare(password, results[0].password)) {
                res.send({ error: "Email or Password invalid" });
            } else if (!results[0].approval) {
                res.send({ error: "You are not approved for log in" });
            } else {
                req.session.user = results[0];
                res.send({ success: "Successfully logged In" });
            }
        });
    } catch (error) {
        res.send({ error: error.toString() });
    }
}


const getSerials = async (user, callback) => {
    const sql = 'select * from `serials` where `marketer`=?';
    db.query(sql, [user.id], async (error, serialResults, fields) => {
        if (error) {
            console.log(error);
        } else {

            try {
                async.forEachOf(serialResults, (serialData, key, macCallback) => {
                    // get mac address for each serialTuples
                    let sql = "select `mac` from `macs` where `serial`=?";
                    db.query(sql,[serialData.id],(error, macResults, fields ) => {
                        serialResults[key].macs = macResults;
                        macCallback();
                    });
                }, function(error){
                    if(error){
                        console.log("error");
                    }else{
                        callback(serialResults);
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    })
}

const putSerial = ({ serial, client, marketer }, callback) => {
    // first check if the serial already exists 
    db.query("select * from `serials` where `serial`=?", [serial], (error, results, fields) => {
        if (error) {
            console.log(error);
        } else if (results.length !== 0) {
            callback("serial already used please try another", null);
        } else {
            //  insert the serial in database
            const sql = "insert into `serials` (`serial`, `client`, `marketer`) values(?,?,?)";
            db.query(sql, [serial, client, marketer], (error, results, fields) => {
                if (error) {
                    console.log(error)
                } else {
                    callback(null, "serial inserted successfully");
                }
            });
        }
    });
}

const registerMac = (({ mac, serial }, callback) => {
    // first check if the serial is valid
    db.query("select * from `serials` where `serial`=?", [serial], (error, serialResults, fields) => {
        if (error) {
            console.log(error);
        } else if (serialResults.length === 0) {
            // no such serial in the database
            callback("No such serial exists", null);
        } else {
            // if serial exists, check for its availability whether in user or not
            db.query("select * from `macs` where `serial`=?", [serialResults[0].id], (error, macResults, fields) => {
                if (error) {
                    console.log(error);
                } else if (macResults.length !== 0) {
                    // serial already in use
                    callback("Serial already in use", null);
                } else {
                    // if the serial is available, insert the macs
                    mac.forEach(mac => {
                        let sql = "insert into `macs` (`mac`,`serial`) values (?,?)";
                        db.query(sql, [mac, serialResults[0].id], (error, macResults, fields) => {
                            if (error) {
                                console.log(error);
                            }
                        });
                    });
                    callback(null, "macs successfully added");
                }
            });
        }
    });
});

const checkForRegistration = ({macs, serial}, callback) => {
    // get the serial id
    let sql = "select `id` from `serials` where `serial` = ?";
    db.query(sql,[serial],(error, serialResults, fields) => {
        if(error){
            console.log(error);
        }else if(serialResults.length === 0){
            callback("Invalid serial",null);
        }else {
           // get macs for the serial
            sql = "select `mac` from `macs` where serial = ?";
            db.query(sql, [serialResults[0].id], (error, macResults, fields) => {
                if(error){
                    console.log(error);
                }else{
                    // now compare the results
                    const result = macResults.filter((macObject, index)=> macs.includes(macObject.mac));
                    if(result.length === macs.length){
                        callback(null,"Valid Registration");
                    }else{
                        callback("invalid mac groups",null);
                    }
                }
            });
        }
    });
}

module.exports = { insertData, validateData, login, getSerials, putSerial, registerMac, checkForRegistration };


