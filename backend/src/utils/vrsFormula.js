function calculateVRS(data){


const salary = Number(data.salary);


const serviceYears = Number(data.serviceYears);



const formulaA = salary * 12 * serviceYears;



const formulaB = salary * 15;



const finalAmount = Math.min(

formulaA,

formulaB

) * 0.75;



return {


salary,

formulaA,

formulaB,

finalAmount


};


}



module.exports = calculateVRS;