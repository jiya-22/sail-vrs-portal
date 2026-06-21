import {BrowserRouter,Routes,Route} from "react-router-dom";

import Home from "./pages/Home";
import Calculator from "./pages/Calculator";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";


function App(){


return(

<BrowserRouter>


<Routes>


<Route path="/" element={<Home/>}/>


<Route path="/calculator" element={<Calculator/>}/>


<Route path="/admin-login" element={<AdminLogin/>}/>


<Route path="/admin" element={<Admin/>}/>


</Routes>


</BrowserRouter>


)


}


export default App;