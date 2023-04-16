var toggle = 0;

function ShowInDev() 
{
	if (toggle === 0) 
	{
		document.getElementById("InDev").style.display = "block";
		toggle = 1;
	}
	else 
	{
		document.getElementById("InDev").style.display = "none";
		toggle = 0;
	}
}

document.getElementById("InDev").style.display = "none";