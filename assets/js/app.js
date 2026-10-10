import { GenericCatalog, searchGenericCatalog } from './catalog.js';
import { searchOpenFoodFacts, debounce } from './api.js';
import * as Store from './store.js';

// --- Custom Modal Logic ---
const CustomModal = {
    overlay: document.getElementById('custom-modal'),
    title: document.getElementById('modal-title'),
    message: document.getElementById('modal-message'),
    input: document.getElementById('modal-input'),
    btnCancel: document.getElementById('modal-btn-cancel'),
    btnConfirm: document.getElementById('modal-btn-confirm'),
    
    show(title, message, isPrompt, placeholder = '') {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.message.textContent = message;
            
            if (isPrompt) {
                this.input.classList.remove('hidden');
                this.input.placeholder = placeholder;
                this.input.value = '';
                // slight delay to allow display before focus
                setTimeout(() => this.input.focus(), 50);
            } else {
                this.input.classList.add('hidden');
            }
            
            this.overlay.classList.remove('hidden');
            
            const cleanup = () => {
                this.overlay.classList.add('hidden');
                this.btnCancel.onclick = null;
                this.btnConfirm.onclick = null;
            };
            
            this.btnCancel.onclick = () => {
                cleanup();
                resolve(null);
            };
            
            this.btnConfirm.onclick = () => {
                const val = isPrompt ? this.input.value : true;
                cleanup();
                resolve(val);
            };
        });
    },
    
    confirm(title, message) {
        return this.show(title, message, false);
    },
    
    prompt(title, message, placeholder) {
        return this.show(title, message, true, placeholder);
    }
};

// --- State ---
let currentView = 'view-dashboard';
let currentListId = null;

// --- DOM Elements ---
const headerTitle = document.getElementById('header-title');
const btnBack = document.getElementById('btn-back');

// Views
const viewDashboard = document.getElementById('view-dashboard');
const viewChildList = document.getElementById('view-child-list');
const viewProductSearch = document.getElementById('view-product-search');
const viewMasterList = document.getElementById('view-master-list');

// --- Routing / View Management ---
function switchView(viewId, title = 'Shoppie') {
    [viewDashboard, viewChildList, viewProductSearch, viewMasterList].forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });
    
    document.getElementById(viewId).classList.remove('hidden');
    // slight delay to allow display:block to apply before opacity transition
    setTimeout(() => document.getElementById(viewId).classList.add('active'), 10);
    
    headerTitle.textContent = title;
    currentView = viewId;

    if (viewId === 'view-dashboard') {
        btnBack.classList.add('hidden');
        currentListId = null;
        renderDashboard();
    } else {
        btnBack.classList.remove('hidden');
    }
}

btnBack.addEventListener('click', () => {
    if (currentView === 'view-product-search') {
        switchView('view-child-list', Store.getList(currentListId).name);
        renderChildList();
    } else {
        switchView('view-dashboard');
    }
});

// --- Dashboard View ---
function renderDashboard() {
    const lists = Store.getLists();
    const container = document.getElementById('dashboard-lists');
    container.innerHTML = '';

    if (lists.length === 0) {
        container.innerHTML = '<div style="padding:1rem; color:#777;">No lists yet. Create one!</div>';
    }

    lists.forEach(list => {
        const uncheckedCount = list.items.filter(i => !i.checked).length;
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `
            <div>
                <div class="item-title">${list.name}</div>
                <div class="item-subtitle">${list.items.length} items (${uncheckedCount} left)</div>
            </div>
            <button class="delete-btn" data-id="${list.id}">🗑️</button>
        `;
        
        el.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const isConfirmed = await CustomModal.confirm('Delete List', 'Are you sure you want to delete this list?');
                if (isConfirmed) {
                    Store.deleteList(list.id);
                    renderDashboard();
                }
                return;
            }
            currentListId = list.id;
            switchView('view-child-list', list.name);
            renderChildList();
        });
        
        container.appendChild(el);
    });
}

document.getElementById('btn-create-list').addEventListener('click', async () => {
    const name = await CustomModal.prompt('New List', 'Enter list name:', 'e.g. Mom, Dave');
    if (name && name.trim()) {
        Store.createList(name.trim());
        renderDashboard();
    }
});

document.getElementById('btn-remove-all').addEventListener('click', async () => {
    const isConfirmed = await CustomModal.confirm('Delete All Lists', 'Are you ABSOLUTELY sure you want to delete all lists? This cannot be undone.');
    if (isConfirmed) {
        Store.deleteAllLists();
        renderDashboard();
    }
});

// --- Child List View ---
function renderChildList() {
    const list = Store.getList(currentListId);
    if (!list) return switchView('view-dashboard');
    
    document.getElementById('child-list-title').textContent = list.name;
    const container = document.getElementById('child-list-items');
    container.innerHTML = '';

    if (list.items.length === 0) {
        container.innerHTML = '<div style="padding:1rem; color:#777;">List is empty.</div>';
    }

    list.items.forEach(item => {
        const el = document.createElement('div');
        el.className = `list-item ${item.checked ? 'checked' : ''}`;
        
        let visual = item.emoji ? `<span style="font-size:1.5rem; margin-right:10px;">${item.emoji}</span>` : 
                     item.image_url ? `<img src="${item.image_url}" style="width:30px; height:30px; object-fit:cover; margin-right:10px; border-radius:4px;">` : 
                     `<span style="margin-right:10px;">🛒</span>`;

        el.innerHTML = `
            <div style="display:flex; align-items:center; flex:1;" class="item-click-area">
                <input type="checkbox" class="item-check" ${item.checked ? 'checked' : ''}>
                ${visual}
                <div>
                    <div class="item-title">${item.name}</div>
                    ${item.brand ? `<div class="item-subtitle">${item.brand}</div>` : ''}
                </div>
            </div>
            <div style="display:flex; align-items:center;">
                <button class="action-btn secondary" style="width:30px; padding:0.2rem; margin:0 5px;" data-action="dec">-</button>
                <span class="item-amount">${item.amount}</span>
                <button class="action-btn secondary" style="width:30px; padding:0.2rem; margin:0 5px;" data-action="inc">+</button>
            </div>
        `;
        
        el.querySelector('.item-click-area').addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const cb = el.querySelector('.item-check');
                cb.checked = !cb.checked;
            }
            Store.toggleItemCheck(currentListId, item.id);
            renderChildList();
        });

        el.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                Store.updateItemAmount(currentListId, item.id, delta);
                renderChildList();
            });
        });
        
        container.appendChild(el);
    });
}

document.getElementById('btn-add-product').addEventListener('click', () => {
    switchView('view-product-search', 'Add Product');
    document.getElementById('product-search-input').value = '';
    renderProductSearch('');
});

// --- Product Search View ---
const searchInput = document.getElementById('product-search-input');
const genericContainer = document.getElementById('generic-catalog-results');
const apiContainer = document.getElementById('api-catalog-results');
const searchLoader = document.getElementById('search-loader');
const btnAddCustom = document.getElementById('btn-add-custom');

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    let visual = '';
    if (product.emoji) visual = `<div class="emoji">${product.emoji}</div>`;
    else if (product.image_url) visual = `<img src="${product.image_url}">`;
    else visual = `<div class="emoji">🛒</div>`;

    div.innerHTML = `
        ${visual}
        <span class="name">${product.name}</span>
        ${product.brand ? `<span class="brand">${product.brand}</span>` : ''}
    `;

    div.addEventListener('click', () => {
        Store.addItemToList(currentListId, product);
        switchView('view-child-list', Store.getList(currentListId).name);
        renderChildList();
    });
    return div;
}

async function renderProductSearch(query) {
    // 1. Generic Results (Instant)
    genericContainer.innerHTML = '';
    const genericMatches = searchGenericCatalog(query);
    genericMatches.forEach(p => genericContainer.appendChild(createProductCard(p)));

    // Custom Button setup
    if (query.trim().length > 0) {
        btnAddCustom.classList.remove('hidden');
        btnAddCustom.textContent = `Add custom "${query}"`;
        btnAddCustom.onclick = () => {
            Store.addItemToList(currentListId, {
                id: 'custom_' + Date.now(),
                name: query.trim()
            });
            switchView('view-child-list', Store.getList(currentListId).name);
            renderChildList();
        };
    } else {
        btnAddCustom.classList.add('hidden');
    }

    // 2. API Results (Debounced)
    apiContainer.innerHTML = '';
    if (query.trim().length > 2) {
        searchLoader.classList.remove('hidden');
        const apiMatches = await searchOpenFoodFacts(query);
        searchLoader.classList.add('hidden');
        apiMatches.forEach(p => apiContainer.appendChild(createProductCard(p)));
    } else {
        searchLoader.classList.add('hidden');
    }
}

const debouncedApiSearch = debounce((query) => renderProductSearch(query), 500);

searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    // Update generic instantly, API is debounced inside
    renderProductSearch(query);
});

// --- Combined List View ---
document.getElementById('btn-generate-master').addEventListener('click', () => {
    switchView('view-master-list', 'Combined List');
    renderMasterList();
});

function renderMasterList() {
    const masterItems = Store.generateMasterList();
    const container = document.getElementById('master-list-items');
    container.innerHTML = '';

    if (masterItems.length === 0) {
        container.innerHTML = '<div style="padding:1rem;">Nothing to buy!</div>';
    }

    masterItems.forEach(item => {
        const el = document.createElement('div');
        el.className = `list-item ${item.checked ? 'checked' : ''}`;
        
        let visual = item.emoji ? `<span style="font-size:1.5rem; margin-right:10px;">${item.emoji}</span>` : 
                     item.image_url ? `<img src="${item.image_url}" style="width:30px; height:30px; object-fit:cover; margin-right:10px; border-radius:4px;">` : 
                     `<span style="margin-right:10px;">🛒</span>`;

        el.innerHTML = `
            <div style="display:flex; align-items:center; flex:1;" class="item-click-area">
                <input type="checkbox" class="item-check" ${item.checked ? 'checked' : ''}>
                ${visual}
                <div>
                    <div class="item-title">${item.name} <span class="item-amount" style="font-size:0.9rem">${item.amount}</span></div>
                    ${item.brand ? `<div class="item-subtitle">${item.brand}</div>` : ''}
                </div>
            </div>
        `;
        
        el.querySelector('.item-click-area').addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const cb = el.querySelector('.item-check');
                cb.checked = !cb.checked;
            }
            // Update this item in all child lists
            Store.toggleMasterItemCheck(item.id, el.querySelector('.item-check').checked);
            renderMasterList();
        });
        
        container.appendChild(el);
    });
}

document.getElementById('btn-finish-shopping').addEventListener('click', async () => {
    const isConfirmed = await CustomModal.confirm('Finish Shopping', 'Are you done shopping? This will archive all checked items.');
    if (isConfirmed) {
        Store.archiveAllChecked();
        switchView('view-dashboard');
    }
});

// Initialize
renderDashboard();
