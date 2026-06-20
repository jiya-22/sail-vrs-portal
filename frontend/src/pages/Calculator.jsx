import { useState } from "react";
import "../index.css";


function Calculator(){


const [form,setForm]=useState({

employeeId:"",
name:"",
age:"",
department:"",
designation:"",
serviceYears:"",
salary:"",
acp:""

});


const [result,setResult]=useState(null);

const [message,setMessage]=useState("");




const handleChange=(e)=>{


setForm({

...form,

[e.target.name]:e.target.value

});


};





const calculateVRS=async()=>{


if(form.age < 50){

setMessage("Employee is not eligible. Minimum age required is 50 years.");

return;

}



if(form.serviceYears < 15){


setMessage("Employee is not eligible. Minimum service required is 15 years.");

return;


}



setMessage("");



try{


const response = await fetch(

"http://localhost:5000/api/calculator/calculate",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify(form)

}

);



const data = await response.json();



setResult(data.result);



}


catch(error){

console.log(error);

setMessage("Server connection failed");

}



};






return(


<div className="calculator-page">



<h1>

SAIL VRS Compensation Calculator

</h1>




<p className="subtitle">

Employee eligibility verification and retirement benefit calculation

</p>







<div className="calculator-card">





<input

name="employeeId"

placeholder="Employee ID"

onChange={handleChange}

/>





<input

name="name"

placeholder="Employee Name"

onChange={handleChange}

/>





<input

name="age"

placeholder="Age"

onChange={handleChange}

/>





<input

name="department"

placeholder="Department"

onChange={handleChange}

/>





<input

name="designation"

placeholder="Designation"

onChange={handleChange}

/>





<input

name="serviceYears"

placeholder="Years of Service"

onChange={handleChange}

/>





<input

name="salary"

placeholder="Basic Salary"

onChange={handleChange}

/>





<input

name="acp"

placeholder="ACP"

onChange={handleChange}

/>






<button

className="button"

onClick={calculateVRS}

>

Check Eligibility & Calculate

</button>





</div>






{

message &&

<div className="error-box">

{message}

</div>


}







{

result &&

<div className="result-card">



<h2>

VRS Calculation Result

</h2>




<p>

Employee: {form.name}

</p>



<p>

Formula A : ₹ {result.formulaA}

</p>




<p>

Formula B : ₹ {result.formulaB}

</p>




<h3>

Final VRS Amount : ₹ {result.finalAmount}

</h3>



</div>



}





</div>



)


}


export default Calculator;