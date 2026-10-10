export async function searchOpenFoodFacts(query) {
    if (!query) return [];
    
    // We use search.pl with search_simple=1 and json=1 to get product matches
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            return data.products.map(p => ({
                id: p.code || p.id,
                name: p.product_name || 'Unknown Product',
                brand: p.brands || '',
                image_url: p.image_thumb_url || p.image_front_thumb_url || null
            })).filter(p => p.name !== 'Unknown Product'); // Filter out empty names
        }
        return [];
    } catch (error) {
        console.error("Error fetching from Open Food Facts:", error);
        return [];
    }
}

// Simple debounce helper
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
