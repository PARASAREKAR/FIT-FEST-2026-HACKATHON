/**
 * PulseSync High-Performance Scroll & Quick Navigation System
 * Zero-jank 120 FPS native hardware scrolling with ultra-responsive controls
 */

class ScrollAnimationSystem {
  constructor() {
    this.jumpBar = null;
    this.backToTopBtn = null;
    this.jumpBarDismissed = false;
  }

  init() {
    this.setupSmoothScroll();
    this.setupFloatingJumpBar();
  }

  setupSmoothScroll() {
    // Intercept in-page anchor links for clean, smooth target scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#' || !href) return;
        
        // If it's a tab link handled by view routing, let app.js handle it
        if (anchor.classList.contains('nav-link') || anchor.classList.contains('bottom-nav-item')) {
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  setupFloatingJumpBar() {
    this.jumpBar = document.getElementById('floating-quick-jump-bar');
    this.backToTopBtn = document.getElementById('btn-back-to-top');
    let ticking = false;

    // Passive scroll listener for zero-lag 120 FPS UI updates
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Quick Jump Bar
          if (this.jumpBar && !this.jumpBarDismissed) {
            if (scrollY > 350) {
              this.jumpBar.classList.add('visible');
            } else {
              this.jumpBar.classList.remove('visible');
            }
          }

          // Back to Top Button (Class toggle only, zero reflow)
          if (this.backToTopBtn) {
            if (scrollY > 380) {
              this.backToTopBtn.classList.add('visible');
            } else {
              this.backToTopBtn.classList.remove('visible');
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    if (this.backToTopBtn) {
      this.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlight-flash');
      setTimeout(() => el.classList.remove('highlight-flash'), 1800);
    }
  }

  dismissJumpBar() {
    this.jumpBarDismissed = true;
    if (this.jumpBar) {
      this.jumpBar.classList.remove('visible');
      setTimeout(() => {
        if (this.jumpBar) this.jumpBar.style.display = 'none';
      }, 250);
    }
  }
}

window.scrollAnim = new ScrollAnimationSystem();
