    var prevScrollPos = window.pageYOffset;

    // Check scroll direction and add appropriate classes to the body
    window.addEventListener("scroll", function() {
      var currentScrollPos = window.pageYOffset;
      
      if (prevScrollPos < currentScrollPos) {
        // Scrolling down
        document.body.classList.add("fade-in");
        document.body.classList.remove("fade-out");
      } else {
        // Scrolling up
        document.body.classList.remove("fade-in");
        document.body.classList.add("fade-out");
      }

      prevScrollPos = currentScrollPos;
    });