const express=require("express");

const router=express.Router();


const adminController=
require("../controllers/adminController");


router.get(
"/calculations",
adminController.getAllCalculations
);



module.exports=router;