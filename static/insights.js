document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const grid = document.getElementById('insightsGrid');
    const searchInput = document.getElementById('insightsSearch');
    const tagFiltersContainer = document.getElementById('tagFilters');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    const paginationContainer = document.getElementById('paginationContainer');

    // --- State ---
    let allPosts = [];
    let activeTag = 'All';
    let currentPage = 1;
    const POSTS_PER_PAGE = 6; // Number of posts to show per page

    // --- Main Initialization Function ---
    const init = async () => {
        if (!grid || !searchInput || !tagFiltersContainer || !paginationContainer || !suggestionsContainer) {
            console.error("Insights page is missing required elements (grid, search, tags, or pagination container).");
            return;
        }

        try {
            const response = await fetch('/api/insights');
            if (!response.ok) throw new Error(`Failed to load insights from API with status: ${response.status}`);
            allPosts = await response.json();

            renderTags();
            renderPosts();
            setupEventListeners();
        } catch (error) {
            console.error("Error initializing insights:", error);
            grid.innerHTML = `<p class="error-message">Could not load security insights. Please try again later.</p>`;
        }
    };

    // --- Rendering Functions ---

    /**
     * Renders the article cards into the grid.
     */
    const renderPosts = () => {
        grid.classList.add('is-loading'); // Add loading state

        const searchTerm = searchInput.value.toLowerCase();

        const filteredPosts = allPosts.filter(post => {
            const tagMatch = activeTag === 'All' || post.tags.includes(activeTag);
            const searchMatch = post.title.toLowerCase().includes(searchTerm) || post.description.toLowerCase().includes(searchTerm);
            return tagMatch && searchMatch;
        });

        // --- Pagination Logic ---
        const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

        // Use a short timeout to allow the loading spinner to appear before the DOM is blocked
        setTimeout(() => {
            grid.innerHTML = ''; // Clear existing posts

            if (paginatedPosts.length === 0) {
                grid.innerHTML = `<p class="no-results-message">// No insights found matching your criteria.</p>`;
            } else {
                paginatedPosts.forEach(post => {
                    const card = document.createElement('article');
                    card.className = 'post-summary scroll-animated'; // Add scroll-animated class
                    card.innerHTML = `
                        <a href="/insight-post.html?post=${post.slug}" class="post-thumbnail-link">
                            <img src="${post.thumbnail}" alt="${post.title}" class="post-thumbnail" loading="lazy" onerror="this.style.display='none'">
                        </a>
                        <div class="post-content-wrapper">
                            <div class="post-tags">
                                ${post.tags.map(tag => `<span class="tag-item">${tag}</span>`).join('')}
                            </div>
                            <h2><a href="/insight-post.html?post=${post.slug}">${post.title}</a></h2>
                            <p class="post-description">${post.description}</p>
                            <div class="post-footer">
                                <span class="post-date">${post.date}</span>
                                <a href="/insight-post.html?post=${post.slug}" class="read-more-link">Read More &gt;&gt;</a>
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }

            renderPagination(totalPages, filteredPosts.length);
            grid.classList.remove('is-loading'); // Remove loading state

            // Re-initialize scroll animations for the newly added cards
            if (window.initScrollAnimations) {
                window.initScrollAnimations();
            }
        }, 150); // A 150ms delay is a good balance
    };

    /**
     * Extracts unique tags and renders the filter buttons.
     */
    const renderTags = () => {
        const allTags = new Set(allPosts.flatMap(post => post.tags));
        const tags = ['All', ...allTags];

        tagFiltersContainer.innerHTML = tags.map(tag =>
            `<button class="tag-filter-btn ${tag === 'All' ? 'active' : ''}" data-tag="${tag}">${tag}</button>`
        ).join('');
    };

    /**
     * Renders the pagination controls.
     * @param {number} totalPages - The total number of pages.
     * @param {number} totalPosts - The total number of filtered posts.
     */
    const renderPagination = (totalPages, totalPosts) => {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&lt;&lt; Prev</button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        paginationHTML += `
            <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next &gt;&gt;</button>
        `;
        paginationContainer.innerHTML = paginationHTML;
    };

    /**
     * Renders search suggestions based on the input value.
     */
    const renderSuggestions = () => {
        const searchTerm = searchInput.value.toLowerCase();

        if (searchTerm.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }

        const matchingPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm)
        ).slice(0, 5); // Show up to 5 suggestions

        if (matchingPosts.length > 0) {
            suggestionsContainer.innerHTML = matchingPosts.map(post => `
                <a href="/insight-post.html?post=${post.slug}" class="suggestion-item">
                    <img src="${post.thumbnail}" alt="" class="suggestion-thumbnail" onerror="this.style.display='none'">
                    <span class="suggestion-title">${post.title}</span>
                </a>
            `).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    };

    /**
     * Hides the search suggestions dropdown.
     */
    const hideSuggestions = () => {
        // A small delay allows click events on suggestions to fire before hiding
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 150);
    };
    // --- Event Handling ---

    /**
     * Sets up all necessary event listeners.
     */
    const setupEventListeners = () => {
        // 1. Live search input with debounce
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            currentPage = 1; // Reset to first page on new search
            debounceTimer = setTimeout(() => {
                // This still filters the main grid
                renderPosts();
                // Analytics Tracking for search
                if (typeof gtag === 'function' && searchInput.value.length > 2) {
                    gtag('event', 'search', { 'search_term': searchInput.value });
                }
            }, 300);

            // Render suggestions instantly as the user types
            renderSuggestions();
        });

        // Hide suggestions when the input loses focus
        searchInput.addEventListener('blur', hideSuggestions);

        // 2. Tag filter button clicks (using event delegation)
        tagFiltersContainer.addEventListener('click', (e) => {
            if (e.target.matches('.tag-filter-btn')) {
                // Analytics Tracking for tag filter
                if (typeof gtag === 'function') {
                    gtag('event', 'filter_by_tag', { 'tag_label': e.target.dataset.tag });
                }
                currentPage = 1; // Reset to first page on tag change
                const newActiveTag = e.target.dataset.tag;
                if (newActiveTag === activeTag) return; // No change

                activeTag = newActiveTag;

                // Update active class on buttons
                tagFiltersContainer.querySelectorAll('.tag-filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tag === activeTag);
                });

                renderPosts();
            }
        });

        // 3. "Read More" click tracking (using event delegation)
        grid.addEventListener('click', (e) => {
            const readMoreLink = e.target.closest('.read-more-link, .post-thumbnail-link, .post-summary h2 a');
            if (readMoreLink) {
                if (typeof gtag === 'function') {
                    gtag('event', 'read_more', { 'post_slug': readMoreLink.href.split('post=')[1] });
                }
            }
        });

        // 4. Pagination button clicks
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn') && !e.target.disabled) {
                const newPage = parseInt(e.target.dataset.page, 10);
                currentPage = newPage;
                renderPosts();
                window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' }); // Scroll to top of grid
            }
        });

        // Expose a function to re-initialize scroll animations for dynamic content
        window.initScrollAnimations = () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const animatedElements = grid.querySelectorAll('.post-summary.scroll-animated:not(.is-visible)');
            if (animatedElements.length === 0) return;

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = `${index * 50}ms`;
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });

            animatedElements.forEach(el => observer.observe(el));
        };
    };

    // --- Start the application ---
    init();
});