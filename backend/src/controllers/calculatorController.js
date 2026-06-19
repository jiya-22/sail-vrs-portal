const calculateVRS =
require("../utils/vrsFormula");


const db=require("../config/db");



exports.calculate=(req,res)=>{


const result =
calculateVRS(req.body);



const sql = `

INSERT INTO calculations
(employee_id,salary,formulaA,formulaB,final_amount)

VALUES(?,?,?,?,?)

`;



db.query(

sql,

[

req.body.employee_id,

result.salary,

result.formulaA,

result.formulaB,

result.finalAmount

],


(err,data)=>{


if(err){

return res.status(500).json(err);

}



res.json({

message:"Calculation saved",

result

});


}



);



};