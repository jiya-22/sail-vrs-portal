const mysql = require("mysql2");


const db = mysql.createConnection({

    host:"localhost",

    user:"root",

    password:"penguin@22",

    database:"sail_vrs"

});


db.connect((err)=>{

    if(err){

        console.log("Database connection failed");
        console.log(err);

    }
    else{

        console.log("MYSQL Connected");

    }

});


module.exports = db;