const db = require("../config/db");


exports.getAllCalculations = (req,res)=>{


const sql = "SELECT * FROM calculations ORDER BY id DESC";


db.query(sql,(err,result)=>{


if(err){

return res.status(500).json(err);

}


res.json(result);


});


};