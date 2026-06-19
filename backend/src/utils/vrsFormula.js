function calculateVRS(data){


let salary =
Number(data.basicPay) + Number(data.DA);



let formulaA =
(35 * salary * data.completedYears)
+
(25 * salary * data.remainingYears);



let formulaB =
30 * salary * data.monthsLeft;



let finalAmount =
Math.min(
formulaA * 0.75,
formulaB * 0.75
);



return {

salary: salary,

formulaA: formulaA,

formulaB: formulaB,

finalAmount: finalAmount

};


}


module.exports = calculateVRS;