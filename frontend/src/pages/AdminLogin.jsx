import {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../index.css";


function AdminLogin(){


const [username,setUsername]=useState("");
const [password,setPassword]=useState("");

const navigate = useNavigate();



const login=()=>{


if(username==="admin" && password==="sail123"){


localStorage.setItem("admin","true");


navigate("/admin");


}

else{


alert("Invalid Admin Credentials");


}


};




return(


<div className="login-page">


<div className="login-card">


<h1>
Admin Login
</h1>


<input

placeholder="Username"

onChange={(e)=>setUsername(e.target.value)}

/>



<input

type="password"

placeholder="Password"

onChange={(e)=>setPassword(e.target.value)}

/>




<button

className="button"

onClick={login}

>

Login

</button>


</div>


</div>


)

}


export default AdminLogin;