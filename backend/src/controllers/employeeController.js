const db = require("../config/db");


exports.addEmployee = (req,res)=>{


const {
name,
employee_id,
age,
service_years,
category,
acp

}=req.body;



const sql = `
INSERT INTO employees
(name,employee_id,age,service_years,category,acp)

VALUES(?,?,?,?,?,?)
`;



db.query(

sql,

[
name,
employee_id,
age,
service_years,
category,
acp
],


(err,result)=>{


if(err){

return res.status(500).json(err);

}



res.json({

message:"Employee Added Successfully",

employeeId:result.insertId

});


}


);


};