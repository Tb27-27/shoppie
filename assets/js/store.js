const STORAGE_KEY = 'shoppie_lists_v1';

export function getLists() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveLists(lists) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

export function createList(name) {
    const lists = getLists();
    const newList = {
        id: 'list_' + Date.now(),
        name: name,
        items: []
    };
    lists.push(newList);
    saveLists(lists);
    return newList;
}

export function deleteList(listId) {
    let lists = getLists();
    lists = lists.filter(l => l.id !== listId);
    saveLists(lists);
}

export function deleteAllLists() {
    saveLists([]);
}

export function getList(listId) {
    return getLists().find(l => l.id === listId);
}

export function addItemToList(listId, product) {
    const lists = getLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    // Check if item already exists in this list
    const existing = list.items.find(i => i.id === product.id);
    if (existing) {
        existing.amount += 1;
    } else {
        list.items.push({
            id: product.id,
            name: product.name,
            brand: product.brand || '',
            emoji: product.emoji || null,
            image_url: product.image_url || null,
            amount: 1,
            checked: false
        });
    }
    saveLists(lists);
}

export function updateItemAmount(listId, itemId, delta) {
    const lists = getLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const item = list.items.find(i => i.id === itemId);
    if (item) {
        item.amount += delta;
        if (item.amount <= 0) {
            list.items = list.items.filter(i => i.id !== itemId);
        }
    }
    saveLists(lists);
}

export function toggleItemCheck(listId, itemId, state = null) {
    const lists = getLists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const item = list.items.find(i => i.id === itemId);
    if (item) {
        item.checked = state !== null ? state : !item.checked;
    }
    saveLists(lists);
}

export function generateMasterList() {
    const lists = getLists();
    const masterMap = {};

    lists.forEach(list => {
        list.items.forEach(item => {
            if (!masterMap[item.id]) {
                masterMap[item.id] = { ...item, sourceLists: [list.id] };
            } else {
                masterMap[item.id].amount += item.amount;
                masterMap[item.id].sourceLists.push(list.id);
                // If any instance is unchecked, the master is unchecked
                if (!item.checked) masterMap[item.id].checked = false;
            }
        });
    });

    return Object.values(masterMap);
}

export function toggleMasterItemCheck(itemId, state) {
    const lists = getLists();
    lists.forEach(list => {
        const item = list.items.find(i => i.id === itemId);
        if (item) {
            item.checked = state;
        }
    });
    saveLists(lists);
}

export function archiveAllChecked() {
    const lists = getLists();
    lists.forEach(list => {
        // Keep only unchecked items
        list.items = list.items.filter(i => !i.checked);
    });
    saveLists(lists);
}
