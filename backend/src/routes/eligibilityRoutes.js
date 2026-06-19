const router=require("express").Router();


const controller=
require("../controllers/eligibilityController");


router.post(
"/check",
controller.checkEligibility
);


module.exports=router;