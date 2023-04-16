var spin = new Audio('Music/Spin Eternally/SpinSpinSpinSpin.mp3');
var MaETa = new Audio('Music/Spin Eternally/Ma e ta.mp3');
var Full = new Audio('Music/Spin Eternally/SpinSpinSpinSpinSpin.mp3');

function Spin()
{
	var image = document.getElementById("ASI");
	image.classList.add("spin");
	spin.volume = 0.5;
	spin.play();
	setTimeout(() => 
	{
    image.classList.remove("spin");
	}, 1000);
	
} 

function rng() {
  return Math.floor(Math.random() * 3);
}

