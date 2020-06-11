const mysql = require('mysql');

dotenv.config({path: '/.env'});



const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect(error => {
    if(error){
        console.log('failed to connect to the database' + error);
    }else{
        console.log('successfully connected to the database');
    }
});

