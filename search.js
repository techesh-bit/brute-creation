// ======================
// ANIMAL SEARCH APP - MAIN JS
// ======================

// DOM Elements
const searchInput = document.querySelector('.search-input');
const searchForm = document.querySelector('.search-form');
const resultsContainer = document.querySelector('.search-results');
const filterButtons = document.querySelectorAll('.filter-button');

// Current filters
let currentFilters = {
    type: 'all',
    age: 'all'
};

// ======================
// 1. FETCH ANIMALS FROM BACKEND
// ======================
async function fetchAnimals(searchTerm = '') {
    try {
        // Build query URL
        const url = new URL('http://localhost:8080/api/animals/search');
        if (searchTerm) url.searchParams.append('q', searchTerm);
        
        // Add filters if not 'all'
        if (currentFilters.type !== 'all') {
            url.searchParams.append('type', currentFilters.type);
        }
        if (currentFilters.age !== 'all') {
            url.searchParams.append('age', currentFilters.age);
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching animals:', error);
        showError();
        return [];
    }
}

// ======================
// 2. DISPLAY RESULTS
// ======================
function displayResults(animals) {
    resultsContainer.innerHTML = '';

    if (animals.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-paw"></i>
                <p>No animals found matching your search.</p>
            </div>
        `;
        return;
    }

    animals.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        card.innerHTML = `
            <img src="${animal.imageUrl}" class="animal-image" alt="${animal.name} the ${animal.breed}">
            <div class="animal-info">
                <h3 class="animal-name">${animal.name}</h3>
                <p class="animal-details">${animal.breed} • ${animal.age} • ${animal.gender}</p>
                <div class="animal-traits">
                    ${animal.traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
                </div>
                <p class="animal-description">${animal.description}</p>
                <button class="view-button" data-animal-id="${animal.id}">
                    View Details <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        resultsContainer.appendChild(card);
    });

    // Add event listeners to new buttons
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', (e) => {
            openModal(e.target.dataset.animalId);
        });
    });
}

// ======================
// 3. SEARCH FUNCTIONALITY
// ======================
async function handleSearch(e) {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    const animals = await fetchAnimals(searchTerm);
    displayResults(animals);
}

// ======================
// 4. FILTER FUNCTIONALITY
// ======================
function setupFilters() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Determine filter type (type or age)
            const filterType = button.parentElement.classList.contains('type-filters') ? 'type' : 'age';
            
            // Update current filters
            currentFilters[filterType] = button.dataset.value;
            
            // Update UI
            document.querySelectorAll(`.${filterType}-filters .filter-button`)
                .forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Trigger new search
            triggerSearch();
        });
    });
}

async function triggerSearch() {
    const animals = await fetchAnimals(searchInput.value.trim());
    displayResults(animals);
}

// ======================
// 5. MODAL FUNCTIONALITY
// ======================
async function openModal(animalId) {
    try {
        const response = await fetch(`http://localhost:8080/api/animals/${animalId}`);
        if (!response.ok) throw new Error('Animal not found');
        
        const animal = await response.json();
        showModal(animal);
    } catch (error) {
        console.error('Error fetching animal details:', error);
        showError('Failed to load animal details');
    }
}

function showModal(animal) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <img src="${animal.imageUrl}" class="modal-image" alt="${animal.name}">
            <h2 class="modal-title">${animal.name}</h2>
            <h3 class="modal-subtitle">${animal.breed} • ${animal.age} • ${animal.gender}</h3>
            
            <div class="modal-section">
                <h4 class="modal-section-title">About Me</h4>
                <p class="modal-text">${animal.description}</p>
            </div>
            
            <div class="modal-section">
                <h4 class="modal-section-title">Health</h4>
                <p class="modal-text">
                    <strong>Vaccinated:</strong> ${animal.vaccinated ? 'Yes' : 'No'}<br>
                    <strong>Neutered/Spayed:</strong> ${animal.neutered ? 'Yes' : 'No'}
                </p>
            </div>
            
            <div class="modal-section">
                <h4 class="modal-section-title">Adoption Info</h4>
                <p class="modal-text">
                    <strong>Fee:</strong> $${animal.adoptionFee || '150'}<br>
                    <strong>Requirements:</strong> ${animal.requirements || 'None specified'}
                </p>
            </div>
            
            <button class="adopt-button">
                <i class="fas fa-heart"></i> Interested in Adopting
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.adopt-button').addEventListener('click', () => {
        alert(`Thank you for your interest in adopting ${animal.name}! We'll contact you soon.`);
    });
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// ======================
// 6. ERROR HANDLING
// ======================
function showError(message = 'Failed to load animals. Please try again later.') {
    resultsContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="retry-button">Retry</button>
        </div>
    `;
    
    document.querySelector('.retry-button').addEventListener('click', triggerSearch);
}

// ======================
// 7. INITIALIZATION
// ======================
function init() {
    // Event listeners
    searchForm.addEventListener('submit', handleSearch);
    searchInput.addEventListener('input', debounce(triggerSearch, 300));
    
    // Setup filters
    setupFilters();
    
    // Load initial animals
    triggerSearch();
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Helper: Debounce search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Start the app
document.addEventListener('DOMContentLoaded', init);