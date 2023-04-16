//Main


//Variables
var totalClicks = 0;


//Functions
      function registerClick() {
			totalClicks++;
			document.getElementById("ClickDisplay").innerHTML = "Clicks: " + totalClicks;
		
		
      }
	  
	  
	  
	  function StartTimer() {
		
		document.getElementById("Start").disabled = true; //Disable Start button
		document.getElementById("ClickDisplay").innerHTML = "Clicks: 0";
		totalClicks = 0;
		//-=-=-=-=-=-=-=-
		
		document.getElementById("sectimer").style.display = "block"; 	// Show <p id>
		document.getElementById("ClickDisplay").style.display= "block"; // Show <p id>
		document.getElementById("clicks").style.display = "none";  		// hide <p id>
		document.getElementById("cps").style.display = "none";  		// hide <p id>
		
		//-=-=-=-=-=-=-=-
		
		//-=-=-=-=-=-=-=-
		
		//Set up timer
		var timer = 5;
		document.getElementById("sectimer").innerHTML = "Seconds remaining:" + timer;
		
		var interval = setInterval(() => 
		{ //Start Interval "interval"
		
		console.log(timer);
		
		//Decrement and update timer.
		timer--;
		document.getElementById("sectimer").innerHTML = "Seconds remaining:" + timer;
		
		//Check for 0
		if (timer === 0) 
		
		{
		
		document.getElementById("sectimer").style.display = "none";  // hide <p id>
		document.getElementById("ClickDisplay").style.display = "none";  // hide <p id>
		clearInterval(interval);
		
		}
		
		}, 1000); //Do this every second
		
		//-=-=-=-=-=-=-=-
		
		//Async
		
	    
		var startTime = new Date().getTime();
		
		//-=-=-=-=-=-=-=-
        
		var clickInterval = window.setInterval(function()
		
		{
        
		var elapsedTime = new Date().getTime() - startTime;
        
		if(elapsedTime > 5000) 
		{
          
		  window.clearInterval(clickInterval);
		  var ClicksPerSecond = totalClicks / 5;
		  document.getElementById("clicks").style.display = "block";  // show <p id>
		  document.getElementById("cps").style.display = "block";  // show <p id>
          document.getElementById("clicks").innerHTML = "You clicked " + totalClicks + " times in 5 seconds!";
		  document.getElementById("cps").innerHTML = "That's " + ClicksPerSecond + " Clicks per second!";
		  totalClicks = 0;
		  document.getElementById("Start").disabled = false;
		  activeCheck = false;
		  
        }
		
		}, 10);
		//-=-=-=-=-=-=-=-
		
		
	  }