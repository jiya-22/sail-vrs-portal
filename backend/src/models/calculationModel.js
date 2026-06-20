const db = require("../config/db");


const saveCalculation=(data,callback)=>{


const sql=`

INSERT INTO vrs_calculations

(employeeId,name,age,department,designation,serviceYears,salary,acp,formulaA,formulaB,finalAmount)

VALUES (?,?,?,?,?,?,?,?,?,?,?)

`;



db.query(sql,data,callback);


};



module.exports={

saveCalculation

};