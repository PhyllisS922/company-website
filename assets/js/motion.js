/**
 * Regional Pulse: Semantic Motion System
 * Minimal, reusable entrance animations using IntersectionObserver
 */

(function() {
    'use strict';

    // Configuration
    const ENTRANCE_THRESHOLD = 0.1;
    const GROUP_DELAY_BASE = 80; // 50-120ms range
    const SUPPLEMENTARY_DELAY = 120; // Additional delay for background/supplementary content

    /**
     * Initialize page-definition content (h1 sections) - appear immediately
     */
    function initPageDefinitionMotion() {
        // Find the first section with h1 (page-definition content)
        const motionSections = document.querySelectorAll('main .motion-entrance');
        for (let i = 0; i < motionSections.length; i++) {
            const section = motionSections[i];
            const h1 = section.querySelector('h1');
            if (h1) {
                // Mark as page-definition and apply visible state immediately
                section.classList.add('motion-page-definition', 'visible');
                break; // Only the first h1 section
            }
        }
    }

    /**
     * Initialize entrance animations for elements with .motion-entrance
     * (excluding page-definition content which is handled separately)
     * 
     * HARD ISOLATION: Observers attached to individual elements only
     * NOT attached to parent containers (main, .container, or wrappers)
     */
    function initEntranceMotion() {
        const elements = document.querySelectorAll('.motion-entrance');
        if (elements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Skip if already visible (page-definition content)
                    if (!entry.target.classList.contains('visible')) {
                        entry.target.classList.add('visible');
                    }
                    // Observe once, then disconnect
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: ENTRANCE_THRESHOLD,
            rootMargin: '0px 0px -20px 0px'
        });

        // HARD ISOLATION: Each element observed individually - no shared parent observers
        elements.forEach(el => {
            // Only observe if not already visible (page-definition)
            if (!el.classList.contains('visible')) {
                observer.observe(el);
            }
        });
    }

    /**
     * Initialize sequential group animations
     * Elements with .motion-group appear with subtle delays
     * 
     * HARD ISOLATION: Observers attached to individual .motion-group elements only
     * NOT attached to parent containers
     */
    function initGroupMotion() {
        const groups = document.querySelectorAll('.motion-group');
        if (groups.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const delay = index * GROUP_DELAY_BASE;
                    entry.target.style.transitionDelay = `${delay}ms`;
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: ENTRANCE_THRESHOLD,
            rootMargin: '0px 0px -20px 0px'
        });

        // HARD ISOLATION: Each .motion-group observed individually
        groups.forEach(el => observer.observe(el));
    }

    /**
     * Initialize sequential appearance for list items
     * Supplementary content: appears with additional delay
     * 
     * HARD ISOLATION: Observer attached to individual .motion-group-container only
     * NOT attached to parent sections or wrappers
     */
    function initGroupItemMotion() {
        const containers = document.querySelectorAll('.motion-group-container');
        if (containers.length === 0) return;

        // HARD ISOLATION: Each container observed individually - no shared parent observers
        containers.forEach(container => {
            const items = container.querySelectorAll('.motion-group-item');
            if (items.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        items.forEach((item, index) => {
                            // Add supplementary delay + sequential delay
                            const delay = SUPPLEMENTARY_DELAY + (index * GROUP_DELAY_BASE);
                            setTimeout(() => {
                                item.classList.add('visible');
                            }, delay);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: ENTRANCE_THRESHOLD,
                rootMargin: '0px 0px -20px 0px'
            });

            // Observer attached to individual container, not parent section
            observer.observe(container);
        });
    }

    /**
     * Initialize highlight items sequential animation
     * Supplementary content: appears with additional delay
     * 
     * HARD ISOLATION: Observer attached to individual .highlights-track only
     * NOT attached to parent sections or wrappers
     */
    function initHighlightMotion() {
        const tracks = document.querySelectorAll('.highlights-track');
        if (tracks.length === 0) return;

        // HARD ISOLATION: Each track observed individually - no shared parent observers
        tracks.forEach(track => {
            const items = track.querySelectorAll('.highlight-item');
            if (items.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        items.forEach((item, index) => {
                            // Add supplementary delay + sequential delay
                            const delay = SUPPLEMENTARY_DELAY + (index * GROUP_DELAY_BASE);
                            setTimeout(() => {
                                item.classList.add('visible');
                            }, delay);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: ENTRANCE_THRESHOLD,
                rootMargin: '0px 0px -20px 0px'
            });

            // Observer attached to individual track, not parent section
            observer.observe(track);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPageDefinitionMotion();
            initEntranceMotion();
            initGroupMotion();
            initGroupItemMotion();
            initHighlightMotion();
        });
    } else {
        initPageDefinitionMotion();
        initEntranceMotion();
        initGroupMotion();
        initGroupItemMotion();
        initHighlightMotion();
    }
})();

