// ===================================
// Landing Page Interactions
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // ===================================
    // Mobile Navigation Toggle
    // ===================================
    const mobileToggle = document.querySelector('.nav__mobile-toggle');
    const navMenu = document.querySelector('.nav__menu');
    
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('nav__menu--open');
        mobileToggle.classList.toggle('nav__mobile-toggle--active');
        
        // Animate hamburger lines
        const lines = mobileToggle.querySelectorAll('.nav__mobile-toggle-line');
        lines.forEach((line, index) => {
          line.style.transform = mobileToggle.classList.contains('nav__mobile-toggle--active')
            ? index === 0 ? 'rotate(45deg) translateY(8px)'
            : index === 1 ? 'opacity(0)'
            : 'rotate(-45deg) translateY(-8px)'
            : '';
        });
      });
    }
    
    // ===================================
    // Smooth Scroll for Navigation Links
    // ===================================
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const navHeight = document.querySelector('.nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight - 20;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    });
    
    // ===================================
    // Scroll-triggered Animations
    // ===================================
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const animateOnScroll = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Stagger animations for child elements
          const children = entry.target.querySelectorAll('.animate-child');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('visible');
            }, index * 100);
          });
        }
      });
    }, observerOptions);
    
    // Add animation classes to elements
    const sections = document.querySelectorAll('.problem__item, .solution__feature, .results__testimonial');
    sections.forEach(section => {
      section.classList.add('animate-on-scroll');
      animateOnScroll.observe(section);
    });
    
    // ===================================
    // Video Demo Modal
    // ===================================
    const demoButtons = document.querySelectorAll('.hero__cta-secondary, .hero__video-play');
    const body = document.body;
    
    demoButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openVideoModal();
      });
    });
    
    function openVideoModal() {
      const modal = document.createElement('div');
      modal.className = 'video-modal';
      modal.innerHTML = `
        <div class="video-modal__backdrop"></div>
        <div class="video-modal__container">
          <button class="video-modal__close" aria-label="Close video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="video-modal__content">
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        </div>
      `;
      
      body.appendChild(modal);
      body.style.overflow = 'hidden';
      
      // Add styles for modal
      const style = document.createElement('style');
      style.textContent = `
        .video-modal {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
        }
        
        .video-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }
        
        .video-modal__container {
          position: relative;
          width: 100%;
          max-width: 900px;
          background: var(--color-gray-900);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }
        
        .video-modal__close {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.5);
          color: var(--color-white);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all var(--transition-base);
        }
        
        .video-modal__close:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }
        
        .video-modal__content {
          aspect-ratio: 16 / 9;
          width: 100%;
        }
        
        .video-modal__content iframe {
          width: 100%;
          height: 100%;
        }
      `;
      document.head.appendChild(style);
      
      // Close modal functionality
      const closeModal = () => {
        modal.remove();
        style.remove();
        body.style.overflow = '';
      };
      
      modal.querySelector('.video-modal__close').addEventListener('click', closeModal);
      modal.querySelector('.video-modal__backdrop').addEventListener('click', closeModal);
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      });
    }
    
    // ===================================
    // CTA Button Animations
    // ===================================
    const ctaButtons = document.querySelectorAll('.button--primary');
    
    ctaButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.className = 'button__ripple';
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
    
    // Add ripple styles
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
      .button__ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(rippleStyle);
    
    // ===================================
    // Form Validation & Submission
    // ===================================
    const signupForms = document.querySelectorAll('.hero__cta-primary, .results__cta-button');
    
    signupForms.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Add loading state
        button.classList.add('button--loading');
        button.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
          button.classList.remove('button--loading');
          button.disabled = false;
          
          // Show success message
          showNotification('🎉 Welcome! Check your email to get started.', 'success');
        }, 2000);
      });
    });
    
    // ===================================
    // Notification System
    // ===================================
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = message;
      
      // Add notification styles
      const notificationStyle = document.createElement('style');
      notificationStyle.textContent = `
        .notification {
          position: fixed;
          top: var(--space-8);
          right: var(--space-8);
          padding: var(--space-4) var(--space-6);
          background: var(--color-gray-900);
          color: var(--color-white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 3000;
          transform: translateX(400px);
          transition: transform var(--transition-base);
        }
        
        .notification--success {
          background: var(--color-success);
        }
        
        .notification--error {
          background: var(--color-error);
        }
        
        .notification--show {
          transform: translateX(0);
        }
      `;
      
      if (!document.querySelector('.notification-styles')) {
        notificationStyle.className = 'notification-styles';
        document.head.appendChild(notificationStyle);
      }
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.add('notification--show'), 10);
      
      // Remove after delay
      setTimeout(() => {
        notification.classList.remove('notification--show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
    
    // ===================================
    // Parallax Effects
    // ===================================
    const parallaxElements = document.querySelectorAll('.hero__video-wrapper');
    
    if (parallaxElements.length > 0) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
          const rate = scrolled * -0.3;
          element.style.transform = `translateY(${rate}px)`;
        });
      });
    }
    
    // ===================================
    // Performance Optimization
    // ===================================
    // Debounce function for scroll events
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    // Throttle function for resize events
    function throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
    
    // ===================================
    // Analytics Tracking
    // ===================================
    const trackEvent = (category, action, label) => {
      // Google Analytics or other tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          event_category: category,
          event_label: label
        });
      }
    };
    
    // Track CTA clicks
    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('click', () => {
        const label = button.textContent.trim();
        trackEvent('CTA', 'click', label);
      });
    });
    
    // Track scroll depth
    let scrollDepthTracked = {
      25: false,
      50: false,
      75: false,
      100: false
    };
    
    const trackScrollDepth = debounce(() => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
      
      Object.keys(scrollDepthTracked).forEach(depth => {
        if (scrollPercent >= depth && !scrollDepthTracked[depth]) {
          scrollDepthTracked[depth] = true;
          trackEvent('Engagement', 'scroll_depth', `${depth}%`);
        }
      });
    }, 250);
    
    window.addEventListener('scroll', trackScrollDepth);
  });