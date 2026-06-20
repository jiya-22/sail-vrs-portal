import "../index.css";


function Home(){

return(

<div className="home">


{/* NAVBAR */}

<nav className="navbar">





<div className="nav-links">


<a href="#">
Home
</a>


<a href="#">
Eligibility
</a>


<a href="#">
Calculator
</a>


<a href="#">
Contact
</a>


</div>



</nav>






{/* HERO SECTION */}



<section className="hero">



<div className="logo-box">


<img

src="/sail_logo.png"

className="logo"

/>


</div>





<div className="hero-content">


<h1>

VOLUNTARY

<br/>

RETIREMENT SCHEME

</h1>




<p>

A digital portal for eligible SAIL employees
to check VRS eligibility and calculate
retirement compensation.

</p>

<button

className="button"

onClick={()=>window.location.href="/calculator"}

>

Start Calculation

</button>


</div>



</section>







{/* INFORMATION CARDS */}




<div className="section">





<div className="card">


<h2>
WHO CAN APPLY
</h2>


<p>
✔ Age 50 years or above
</p>


<p>
✔ Minimum 15 years service
</p>


<p>
✔ Eligible SAIL employees
</p>


</div>







<div className="card">


<h2>
ACP CRITERIA
</h2>


<p>
Executives:
</p>


<p>
50-54 years → ACP ≤ 42.5
</p>


<p>
54-57 years → ACP ≤ 45
</p>


<p>
57+ years → Any ACP
</p>


</div>







<div className="card">


<h2>
COMPENSATION
</h2>


<p>
Formula A
</p>


<p>
Formula B
</p>


<p>
75% whichever is lower
</p>



</div>





</div>








{/* FOOTER */}



<footer>


<p>

SAIL VRS Portal © 2026 | Employee Retirement Management System

</p>


</footer>




</div>


)


}


export default Home;