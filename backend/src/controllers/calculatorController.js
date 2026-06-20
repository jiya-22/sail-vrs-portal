const calculateVRS =
require("../utils/vrsFormula");


const db=require("../config/db");



exports.calculate=(req,res)=>{


const result =
calculateVRS(req.body);




const sql = `

INSERT INTO calculations

(
employee_id,
name,
age,
department,
designation,
service_years,
salary,
acp,
formulaA,
formulaB,
final_amount

)

VALUES(?,?,?,?,?,?,?,?,?,?,?)

`;




db.query(

sql,


[

req.body.employeeId,

req.body.name,

req.body.age,

req.body.department,

req.body.designation,

req.body.serviceYears,

result.salary,

req.body.acp,

result.formulaA,

result.formulaB,

result.finalAmount

],




(err,data)=>{


if(err){

console.log(err);

return res.status(500).json(err);

}




res.json({

message:"Calculation saved",

result

});

}



);



};