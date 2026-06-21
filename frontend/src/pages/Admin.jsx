import {useNavigate} from "react-router-dom";
import {useEffect,useState} from "react";
import "../index.css";


function Admin(){

    const navigate = useNavigate();


if(!localStorage.getItem("admin")){

navigate("/admin-login");

}


const [employees,setEmployees]=useState([]);

const totalAmount = employees.reduce(
(sum,emp)=>sum + Number(emp.final_amount),
0
);


const totalEmployees = employees.length;


useEffect(()=>{


fetch(
"http://localhost:5000/api/admin/calculations"
)


.then(res=>res.json())


.then(data=>setEmployees(data))


.catch(err=>console.log(err));


},[]);





return(


<div className="admin-page">


<h1>
SAIL VRS Admin Dashboard
</h1>

<button

className="button"

onClick={()=>{

localStorage.removeItem("admin");

navigate("/admin-login");

}}

>

Logout

</button>

<div className="dashboard-cards">


<div className="dash-card">

<h2>
{totalEmployees}
</h2>

<p>
Total Applications
</p>

</div>




<div className="dash-card">

<h2>
₹ {totalAmount}
</h2>

<p>
Total Compensation
</p>

</div>



<div className="dash-card">

<h2>
SAIL
</h2>

<p>
VRS Portal
</p>

</div>


</div>


<p className="subtitle">
Employee Retirement Calculation Records
</p>




<table>


<thead>

<tr>

<th>Employee ID</th>

<th>Name</th>

<th>Department</th>

<th>Designation</th>

<th>Age</th>

<th>Service</th>

<th>Salary</th>

<th>Final Amount</th>


</tr>

</thead>





<tbody>


{

employees.map((emp)=>(


<tr key={emp.id}>


<td>
{emp.employee_id}
</td>


<td>
{emp.name}
</td>


<td>
{emp.department}
</td>


<td>
{emp.designation}
</td>


<td>
{emp.age}
</td>


<td>
{emp.service_years} yrs
</td>


<td>
₹ {emp.salary}
</td>


<td className="amount">

₹ {emp.final_amount}

</td>



</tr>


))


}



</tbody>



</table>




</div>


)


}


export default Admin;