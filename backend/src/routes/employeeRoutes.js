const router=require("express").Router();


const employeeController=
require("../controllers/employeeController");



router.post(
"/add",
employeeController.addEmployee
);



module.exports=router;