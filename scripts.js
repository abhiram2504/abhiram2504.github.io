document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.slide');

    let currentIndex = 0;

    function updateCarousel() {
        const newTransformValue = -currentIndex * 100 + '%';
        carousel.style.transform = 'translateX(' + newTransformValue + ')';
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    }

    // Change slide on arrow click or other navigation triggers
    // You can add event listeners for arrows, buttons, etc.

    // Example for arrow buttons
    document.querySelector('.carousel-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('arrow-next')) {
            nextSlide();
        } else if (event.target.classList.contains('arrow-prev')) {
            prevSlide();
        }
    });

    // You can customize the navigation buttons and add more features as needed
});

