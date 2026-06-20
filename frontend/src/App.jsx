import {BrowserRouter, Routes, Route} from "react-router-dom";

import Home from "./pages/Home";
import Calculator from "./pages/Calculator";


function App(){


return(

<BrowserRouter>


<Routes>


<Route path="/" element={<Home/>}/>


<Route path="/calculator" element={<Calculator/>}/>


</Routes>


</BrowserRouter>


)


}


export default App;