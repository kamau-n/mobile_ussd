const mysql = require("mysql")

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "Farmers"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Database Connectection successfull!");
})


module.exports = con;