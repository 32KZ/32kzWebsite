function Spin()
{
	var image = document.getElementById("ASI");
	image.classList.add("spin");
	var audio = new Audio('Music/Spin Eternally/SpinSpinSpinSpin.mp3');
	audio.play();
	setTimeout(() => 
	{
    image.classList.remove("spin");
	}, 1000);
	
} 
