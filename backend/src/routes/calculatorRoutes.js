const router=require("express").Router();


const controller =
require("../controllers/calculatorController");


router.post(
"/calculate",
controller.calculate
);


module.exports=router;