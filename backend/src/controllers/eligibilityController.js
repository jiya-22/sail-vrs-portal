exports.checkEligibility=(req,res)=>{


const {
age,
service_years,
category,
acp

}=req.body;



let eligible=true;

let reason="Eligible for VRS";



// Service check

if(service_years < 15){

eligible=false;

reason="Service less than 15 years";

}


// Age check

else if(age < 50){

eligible=false;

reason="Age below 50 years";

}


// Executive ACP check

else if(category==="executive"){


if(age>=50 && age<54 && acp>42.5){

eligible=false;

reason="ACP exceeds limit for age group";

}


else if(age>=54 && age<57 && acp>45){

eligible=false;

reason="ACP exceeds limit for age group";

}


}



res.json({

eligible,

reason

});


};