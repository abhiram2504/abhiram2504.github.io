document.addEventListener('DOMContentLoaded', function() {
    const textElement = document.querySelector('.typewriter');
    
    // Function to restart animation
    function restartAnimation() {
        textElement.classList.remove('restart-animation');
        void textElement.offsetWidth; // Trigger reflow
        textElement.classList.add('restart-animation');
    }

    // Restart animation after a delay or an event
    setTimeout(restartAnimation, 10000); // Restart animation after 5 seconds
});


