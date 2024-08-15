// Function to scroll back to the home section
function scrollToHome() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show the navbar on all sections except the homepage
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const homeHeight = document.getElementById('home').offsetHeight;

    if (window.scrollY >= homeHeight) {
        navbar.style.display = 'flex';
    } else {
        navbar.style.display = 'none';
    }
});
