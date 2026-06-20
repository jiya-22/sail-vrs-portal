const express = require("express");
const cors = require("cors");


require("./config/db");


const app = express();



app.use(cors());

app.use(express.json());




app.get("/",(req,res)=>{

res.send("SAIL VRS Backend Running");

});





app.use(
"/api/employees",
require("./routes/employeeRoutes")
);



app.use(
"/api/calculator",
require("./routes/calculatorRoutes")
);





app.listen(5000,()=>{


console.log("Server running on port 5000");


});