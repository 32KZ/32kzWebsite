var toggle = 0;
var MaETa = new Audio('Music/Spin Eternally/Ma e ta.mp3');
function ShowInDev() 
{
	if (toggle === 0) 
	{
		document.getElementById("InDev").style.display = "block";
		toggle = 1;
		Secret();
		
	}
	else 
	{
		document.getElementById("InDev").style.display = "none";
		toggle = 0;
	}
}

function Secret()
{
	MaETa.play()
} 