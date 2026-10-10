export const GenericCatalog = [
    { id: 'g-milk', name: 'Milk', emoji: '🥛' },
    { id: 'g-bread', name: 'Bread', emoji: '🍞' },
    { id: 'g-eggs', name: 'Eggs', emoji: '🥚' },
    { id: 'g-cheese', name: 'Cheese', emoji: '🧀' },
    { id: 'g-butter', name: 'Butter', emoji: '🧈' },
    { id: 'g-apple', name: 'Apples', emoji: '🍎' },
    { id: 'g-banana', name: 'Bananas', emoji: '🍌' },
    { id: 'g-tomato', name: 'Tomatoes', emoji: '🍅' },
    { id: 'g-potato', name: 'Potatoes', emoji: '🥔' },
    { id: 'g-onion', name: 'Onions', emoji: '🧅' },
    { id: 'g-garlic', name: 'Garlic', emoji: '🧄' },
    { id: 'g-carrot', name: 'Carrots', emoji: '🥕' },
    { id: 'g-chicken', name: 'Chicken', emoji: '🍗' },
    { id: 'g-meat', name: 'Meat', emoji: '🥩' },
    { id: 'g-fish', name: 'Fish', emoji: '🐟' },
    { id: 'g-rice', name: 'Rice', emoji: '🍚' },
    { id: 'g-pasta', name: 'Pasta', emoji: '🍝' },
    { id: 'g-water', name: 'Water', emoji: '💧' },
    { id: 'g-coffee', name: 'Coffee', emoji: '☕' },
    { id: 'g-tp', name: 'Toilet Paper', emoji: '🧻' }
];

export function searchGenericCatalog(query) {
    if (!query) return GenericCatalog;
    const lowerQuery = query.toLowerCase();
    return GenericCatalog.filter(item => item.name.toLowerCase().includes(lowerQuery));
}
