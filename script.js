/* ============================================
   PRINCE WILLIAMS PHOTOGRAPHY
   Interactive JavaScript
   ============================================ */

'use strict';

// ===== THEME MANAGEMENT =====
(function initTheme() {
  const saved = localStorage.getItem('pw-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

document.addEventListener('DOMContentLoaded', function () {

  // ===== ELEMENTS =====
  const html          = document.documentElement;
  const themeBtn      = document.getElementById('theme-toggle');
  const sunIcon       = document.getElementById('sun-icon');
  const moonIcon      = document.getElementById('moon-icon');
  const hamburger     = document.getElementById('hamburger');
  const mobileMenu    = document.getElementById('mobile-menu');
  const mobileClose   = document.getElementById('mobile-close');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const scrollTopBtn  = document.getElementById('scroll-top');
  const cookieBanner  = document.getElementById('cookie-banner');
  const cookieAccept  = document.getElementById('cookie-accept');
  const cookieDecline = document.getElementById('cookie-decline');
  const mobileLinks   = document.querySelectorAll('.mobile-nav-link');

  // ===== THEME TOGGLE =====
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('pw-theme', theme);
    if (theme === 'dark') {
      sunIcon.style.display  = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display  = 'block';
      moonIcon.style.display = 'none';
    }
  }

  // Apply correct icon on load
  const currentTheme = html.getAttribute('data-theme') || 'light';
  applyTheme(currentTheme);

  themeBtn && themeBtn.addEventListener('click', function () {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // ===== MOBILE MENU =====
  function openMobileMenu() {
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('visible');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger    && hamburger.addEventListener('click', openMobileMenu);
  mobileClose  && mobileClose.addEventListener('click', closeMobileMenu);
  mobileOverlay && mobileOverlay.addEventListener('click', closeMobileMenu);

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close mobile menu on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // ===== FAQ ACCORDION =====
  const faqToggles = document.querySelectorAll('.faq-toggle');

  faqToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const answerId = toggle.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);
      const isOpen   = toggle.getAttribute('aria-expanded') === 'true';

      // Close all others
      faqToggles.forEach(function (t) {
        const id  = t.getAttribute('aria-controls');
        const ans = document.getElementById(id);
        t.setAttribute('aria-expanded', 'false');
        if (ans) ans.classList.remove('open');
      });

      // Toggle clicked
      if (!isOpen) {
        toggle.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      }
    });
  });

  // ===== SCROLL TO TOP =====
  function handleScroll() {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  scrollTopBtn && scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== COOKIE BANNER =====
  const cookieAccepted = localStorage.getItem('pw-cookie');
  if (!cookieAccepted) {
    setTimeout(function () {
      cookieBanner && cookieBanner.classList.add('show');
    }, 1800);
  }

  function dismissCookie() {
    cookieBanner && cookieBanner.classList.remove('show');
  }

  cookieAccept && cookieAccept.addEventListener('click', function () {
    localStorage.setItem('pw-cookie', 'accepted');
    dismissCookie();
  });

  cookieDecline && cookieDecline.addEventListener('click', function () {
    localStorage.setItem('pw-cookie', 'declined');
    dismissCookie();
  });

  // ===== TESTIMONIALS SLIDER =====
  const testimonials = [
    {
      quote: "Prince Williams captured our wedding day with such artistry and warmth. Every photo tells the story of how we felt — the joy, the tears, the laughter. We can't stop looking at them. He truly is a master of his craft.",
      name:  "Amara & Chidi O.",
      event: "Lagos Garden Wedding, 2025",
      avatar: "images/photographer.jpg"
    },
    {
      quote: "From the very first consultation, Prince made us feel completely at ease. On the day, he was invisible — yet somehow caught every single emotion. Our photos are beyond anything we imagined. Absolutely breathtaking.",
      name:  "Ifeoma & David K.",
      event: "Abuja Cathedral Wedding, 2025",
      avatar: "images/portfolio-wedding.jpg"
    },
    {
      quote: "We flew Prince out to our destination wedding in Tuscany and it was the best decision we made. His eye for light and intimate moments is unmatched. Every image looks like a scene from a film. Highly recommend!",
      name:  "Adaeze & Marcus F.",
      event: "Tuscany Destination Wedding, 2024",
      avatar: "images/portfolio-engagement.jpg"
    }
  ];

  let currentIndex    = 0;
  const blockquote    = document.getElementById('testimonial-blockquote');
  const avatarEl      = document.getElementById('testimonial-avatar');
  const nameEl        = document.getElementById('testimonial-name');
  const eventEl       = document.getElementById('testimonial-event');
  const dotsContainer = document.getElementById('testimonial-dots');
  const prevBtn       = document.getElementById('prev-testimonial');
  const nextBtn       = document.getElementById('next-testimonial');

  // Build dots
  if (dotsContainer) {
    testimonials.forEach(function (_, i) {
      const dot = document.createElement('button');
      dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsContainer.appendChild(dot);
    });
  }

  function goTo(index) {
    // Fade out
    setOpacity(0);

    setTimeout(function () {
      currentIndex = (index + testimonials.length) % testimonials.length;
      const t = testimonials[currentIndex];

      if (blockquote)  blockquote.textContent = t.quote;
      if (nameEl)      nameEl.textContent      = t.name;
      if (eventEl)     eventEl.textContent     = t.event;
      if (avatarEl)    avatarEl.src            = t.avatar;
      if (avatarEl)    avatarEl.alt            = t.name;

      // Update dots
      document.querySelectorAll('.testimonial-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === currentIndex);
      });

      // Fade in
      setOpacity(1);
    }, 300);
  }

  function setOpacity(val) {
    [blockquote, avatarEl, nameEl, eventEl].forEach(function (el) {
      if (el) el.style.opacity = val;
    });
  }

  prevBtn && prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
  nextBtn && nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); });

  // Auto-rotate
  setInterval(function () { goTo(currentIndex + 1); }, 6000);

  // ===== NAVBAR SCROLL EFFECT =====
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = '0 1px 0 var(--border)';
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // ===== INTERSECTION OBSERVER — FADE IN SECTIONS =====
  const fadeEls = document.querySelectorAll('.about-section, .blog-section, .faqs-section, .testimonials-section, .shop-section, .contact-section, .press-section');

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
        sectionObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeEls.forEach(function (el) {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    sectionObserver.observe(el);
  });

  // ===== PORTFOLIO CARD OBSERVER =====
  const portfolioSection = document.querySelector('.portfolio-section');
  if (portfolioSection) {
    portfolioSection.style.opacity   = '0';
    portfolioSection.style.transform = 'translateY(30px)';
    portfolioSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    sectionObserver.observe(portfolioSection);
  }

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navH = document.getElementById('navbar').offsetHeight;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ===== ACTIVE NAV LINK =====
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  const activeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.style.opacity = '1';
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.style.fontWeight = '700';
          } else {
            link.style.fontWeight = '500';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(function (s) { activeObserver.observe(s); });

}); // end DOMContentLoaded

// ===== CONTACT FORM HANDLER =====
function handleFormSubmit(e) {
  e.preventDefault();
  const btn     = e.target.querySelector('button[type="submit"]');
  const success = document.getElementById('form-success');

  btn.textContent = 'Sending...';
  btn.disabled    = true;
  btn.style.opacity = '0.6';

  setTimeout(function () {
    btn.textContent = 'Send Message';
    btn.disabled    = false;
    btn.style.opacity = '1';
    if (success) {
      success.style.display = 'block';
      setTimeout(function () {
        success.style.display = 'none';
      }, 5000);
    }
    e.target.reset();
  }, 1400);
}
