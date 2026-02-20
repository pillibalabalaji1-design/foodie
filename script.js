const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a');
const form = document.getElementById('preorderForm');
const formMessage = document.getElementById('formMessage');
const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (form && formMessage) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      formMessage.textContent = 'Please fill in all required fields before submitting your pre-order request.';
      return;
    }

    formMessage.textContent =
      'Thank you! Your pre-order request has been received. Our team will contact you shortly to confirm details.';
    form.reset();
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.card, .menu-item, .benefit, blockquote').forEach((item) => {
  item.classList.add('reveal');
  observer.observe(item);
});
