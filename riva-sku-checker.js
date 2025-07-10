// Riva Fashion SKU Checker
// Paste this code in the browser console on https://www.rivafashion.com/en-kw/

function showBulkSKUPrompt() {
    return new Promise((resolve) => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            font-family: Arial, sans-serif;
        `;
        
        // Create content
        modal.innerHTML = `
            <h2 style="margin-top: 0; color: #333; text-align: center;">
                🔍 Riva Fashion SKU Checker
            </h2>
            <p style="color: #666; margin-bottom: 15px;">
                Paste your SKUs below, one per line:
            </p>
            <textarea 
                id="skuTextarea" 
                placeholder="101120-25009-039&#10;101109-25020-005&#10;101110-25013-048&#10;161105-25004-075"
                style="
                    width: 100%;
                    height: 200px;
                    padding: 10px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 14px;
                    resize: vertical;
                    box-sizing: border-box;
                "
            ></textarea>
            <div style="margin-top: 15px; text-align: center;">
                <button 
                    id="startCheck" 
                    style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 10px;
                    "
                >
                    Start Checking
                </button>
                <button 
                    id="cancelCheck" 
                    style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    "
                >
                    Cancel
                </button>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #666; text-align: center;">
                💡 Tip: You can paste multiple SKUs at once using Ctrl+V
            </div>
        `;
        
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        // Focus on textarea
        const textarea = document.getElementById('skuTextarea');
        textarea.focus();
        
        // Handle buttons
        document.getElementById('startCheck').onclick = () => {
            const value = textarea.value.trim();
            document.body.removeChild(backdrop);
            resolve(value);
        };
        
        document.getElementById('cancelCheck').onclick = () => {
            document.body.removeChild(backdrop);
            resolve(null);
        };
        
        // Handle Enter key (Ctrl+Enter to submit)
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const value = textarea.value.trim();
                document.body.removeChild(backdrop);
                resolve(value);
            }
        });
        
        // Handle Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(backdrop);
                document.removeEventListener('keydown', escapeHandler);
                resolve(null);
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function analyzeResults(sku, resolve) {
    try {
        // First, check for explicit "No results found" text
        const pageText = document.body.textContent.toLowerCase();
        if (pageText.includes('no results found')) {
            console.log(`❌ SKU ${sku}: No results found`);
            resolve({ enabled: false, message: "No results found", link: null });
            return;
        }
        // Check for "0 results" or similar patterns
        if (pageText.includes('0 results') || 
            pageText.includes('no products found') ||
            pageText.includes('no items found') ||
            pageText.includes('nothing found')) {
            console.log(`❌ SKU ${sku}: No results found`);
            resolve({ enabled: false, message: "No results found", link: null });
            return;
        }
        // Look for common "no results" elements
        const noResultsElements = document.querySelectorAll('*');
        for (let element of noResultsElements) {
            const text = element.textContent.toLowerCase().trim();
            if (text === 'no results found' || 
                text === 'no products found' ||
                text === 'no items found' ||
                text.includes('no results') && text.length < 50) {
                console.log(`❌ SKU ${sku}: No results found`);
                resolve({ enabled: false, message: "No results found", link: null });
                return;
            }
        }
        // Check if we're on a search results page with actual products
        const searchUrl = window.location.href.toLowerCase();
        if (searchUrl.includes('search') || searchUrl.includes('q=')) {
            // We're on a search page, look for actual product results
            const productElements = document.querySelectorAll(
                '.product-item, .product-card, .item-product, .product, ' +
                '[data-product-id], .catalogsearch-result-item, .product-item-info'
            );
            // Filter out non-product elements
            const actualProducts = Array.from(productElements).filter(el => {
                const text = el.textContent.toLowerCase();
                return !text.includes('no results') && 
                       !text.includes('not found') &&
                       el.offsetHeight > 0 && // Element is visible
                       el.offsetWidth > 0;
            });
            // Try to find the product element that matches the SKU
            let link = null;
            let found = false;
            for (let el of actualProducts) {
                // Try .product-item-info a.product-item-photo first
                let a = el.querySelector('a.product-item-photo');
                if (!a) {
                    // Try .product-item-link (the name link)
                    a = el.querySelector('a.product-item-link');
                }
                // Check if SKU is in href, text, or HTML
                if (a && a.href && a.href.toLowerCase().includes(sku.toLowerCase())) {
                    link = a.href;
                    found = true;
                    break;
                } else if (el.textContent.toLowerCase().includes(sku.toLowerCase())) {
                    if (a && a.href) {
                        link = a.href;
                        found = true;
                        break;
                    }
                } else if (el.innerHTML.toLowerCase().includes(sku.toLowerCase())) {
                    if (a && a.href) {
                        link = a.href;
                        found = true;
                        break;
                    }
                }
            }
            if (found) {
                console.log(`✅ SKU ${sku}: Found product with matching SKU`);
                resolve({ enabled: true, message: `Found product with matching SKU`, link });
                return;
            } else if (actualProducts.length > 0) {
                // Fallback: found products but none matched SKU exactly
                console.log(`❌ SKU ${sku}: No exact match for SKU in search results`);
                resolve({ enabled: false, message: "No exact match for SKU in search results", link: null });
                return;
            }
        }
        // Check if we're on a direct product page
        if (window.location.href.includes('/product/') || 
            document.querySelector('.product-view, .product-detail, .catalog-product-view')) {
            // Only use current URL as the product link if the SKU is present in the URL, product details text, or innerHTML
            let link = null;
            const urlLower = window.location.href.toLowerCase();
            const skuLower = sku.toLowerCase();
            let found = false;
            if (urlLower.includes(skuLower)) {
                found = true;
            } else {
                const productDetailEl = document.querySelector('.product-view, .product-detail, .catalog-product-view');
                if (productDetailEl) {
                    if (productDetailEl.textContent.toLowerCase().includes(skuLower)) {
                        found = true;
                    } else if (productDetailEl.innerHTML.toLowerCase().includes(skuLower)) {
                        found = true;
                    }
                } else if (document.body.textContent.toLowerCase().includes(skuLower)) {
                    found = true;
                } else if (document.body.innerHTML.toLowerCase().includes(skuLower)) {
                    found = true;
                }
            }
            if (found) {
                link = window.location.href;
                console.log(`✅ SKU ${sku}: Direct product page found`);
                resolve({ enabled: true, message: "Direct product page found", link });
            } else {
                // SKU not found on this product page
                console.log(`❌ SKU ${sku}: No results found on direct product page`);
                resolve({ enabled: false, message: "No results found", link: null });
            }
            return;
        }
        // Look for product grid or listing containers
        const productContainers = document.querySelectorAll(
            '.products-grid, .product-list, .search-results, .products-wrapper'
        );
        for (let container of productContainers) {
            const products = container.querySelectorAll('.product-item, .product-card, .item');
            if (products.length > 0) {
                // Try to extract the first product link
                let link = null;
                for (let el of products) {
                    let a = el.querySelector('a.product-item-photo');
                    if (!a) {
                        a = el.querySelector('a.product-item-link');
                    }
                    if (a && a.href) {
                        link = a.href;
                        break;
                    }
                }
                console.log(`✅ SKU ${sku}: Found ${products.length} product(s) in container`);
                resolve({ enabled: true, message: `Found ${products.length} product(s)`, link });
                return;
            }
        }
        // Default case - assume no results if we can't find clear indicators
        console.log(`❌ SKU ${sku}: No clear results found`);
        resolve({ enabled: false, message: "No clear results found", link: null });
    } catch (error) {
        console.error(`Error analyzing results for ${sku}:`, error);
        resolve({ enabled: false, message: `Analysis error: ${error.message}`, link: null });
    }
}

async function checkSingleSKU(sku) {
    return new Promise((resolve, reject) => {
        try {
            // Find search input and button
            const searchInput = document.getElementById('search');
            const searchButton = document.getElementById('searchlink-btn');
            
            if (!searchInput || !searchButton) {
                reject(new Error("Search elements not found on page"));
                return;
            }
            
            // Clear previous search
            searchInput.value = '';
            searchInput.focus();
            
            // Enter the SKU
            searchInput.value = sku;
            
            // Trigger input events to ensure the website recognizes the input
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log(`Searching for: ${sku}`);
            
            // Set up result detection before clicking search
            const originalURL = window.location.href;
            
            // Create a mutation observer to detect page changes
            const observer = new MutationObserver((mutations) => {
                // Check if we're on search results page or if content has changed
                if (window.location.href !== originalURL || 
                    document.querySelector('.search-results') || 
                    document.querySelector('.products-grid') ||
                    document.querySelector('.no-results') ||
                    document.querySelector('.search-result')) {
                    
                    observer.disconnect();
                    
                    // Wait a bit for content to load
                    setTimeout(() => {
                        analyzeResults(sku, resolve);
                    }, 1500);
                }
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });
            
            // Click search button
            searchButton.click();
            
            // Fallback timeout in case mutation observer doesn't trigger
            setTimeout(() => {
                observer.disconnect();
                analyzeResults(sku, resolve);
            }, 8000);
            
        } catch (error) {
            reject(error);
        }
    });
}

async function checkSKUs() {
    // Show the bulk SKU input prompt
    const skuInput = await showBulkSKUPrompt();
    
    if (!skuInput) {
        console.log("No SKUs entered. Exiting...");
        return;
    }
    
    // Parse SKUs from the textarea input
    const skus = skuInput.split('\n')
        .map(sku => sku.trim())
        .filter(sku => sku.length > 0);
    
    if (skus.length === 0) {
        console.log("No valid SKUs found. Exiting...");
        return;
    }
    
    console.log(`Checking ${skus.length} SKUs:`, skus);
    
    const results = [];
    
    for (let i = 0; i < skus.length; i++) {
        const sku = skus[i];
        console.log(`\n--- Checking SKU ${i + 1}/${skus.length}: ${sku} ---`);
        
        try {
            const result = await checkSingleSKU(sku);
            results.push({
                sku: sku,
                enabled: result.enabled,
                message: result.message,
                link: result.link || null
            });
            
            // Add delay between searches to avoid overwhelming the server
            if (i < skus.length - 1) {
                console.log("Waiting 2 seconds before next search...");
                await delay(2000);
            }
            
        } catch (error) {
            console.error(`Error checking SKU ${sku}:`, error);
            results.push({
                sku: sku,
                enabled: false,
                message: `Error: ${error.message}`
            });
        }
    }
    
    // Display final results
    // console.log("\n=== FINAL RESULTS ===");
    // console.table(results);
    //
    // const enabledSKUs = results.filter(r => r.enabled);
    // const disabledSKUs = results.filter(r => !r.enabled);
    //
    // console.log(`\n✅ Enabled SKUs (${enabledSKUs.length}):`, enabledSKUs.map(r => r.sku));
    // console.log(`❌ Disabled/Not Found SKUs (${disabledSKUs.length}):`, disabledSKUs.map(r => r.sku));

    showResultsModal(results);
}

// --- GUI Report Modal and CSV Download ---
function showResultsModal(results) {
    // Remove any existing modal
    const oldModal = document.getElementById('skuResultsModalBackdrop');
    if (oldModal) oldModal.remove();

    // Modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'skuResultsModalBackdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex; align-items: center; justify-content: center;
    `;

    // Modal dialog
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px 20px 20px 20px;
        width: 600px;
        max-width: 95vw;
        max-height: 85vh;
        box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        font-family: Arial, sans-serif;
        overflow-y: auto;
    `;

    // Modal content
    modal.innerHTML = `
        <h2 style="margin-top:0; color:#333; text-align:center;">SKU Check Results</h2>
        <div style="margin-bottom: 18px; text-align:center; color:#666; font-size:14px;">
            Checked <b>${results.length}</b> SKUs
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:15px;">
            <thead>
                <tr style="background:#f5f5f5;">
                    <th style="padding:8px 6px; border-bottom:1px solid #ddd;">SKU</th>
                    <th style="padding:8px 6px; border-bottom:1px solid #ddd;">Status</th>
                    <th style="padding:8px 6px; border-bottom:1px solid #ddd;">Message</th>
                    <th style="padding:8px 6px; border-bottom:1px solid #ddd;">Link</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(r => `
                    <tr>
                        <td style=\"padding:6px 4px; border-bottom:1px solid #eee; font-family:monospace;\">${escapeHtml(r.sku)}</td>
                        <td style=\"padding:6px 4px; border-bottom:1px solid #eee; text-align:center; color:${r.enabled ? '#28a745' : '#dc3545'}; font-weight:bold;\">${r.enabled ? '✅ Enabled' : '❌ Not Found'}</td>
                        <td style=\"padding:6px 4px; border-bottom:1px solid #eee;\">${escapeHtml(r.message)}</td>
                        <td style=\"padding:6px 4px; border-bottom:1px solid #eee; text-align:center;\">${r.link ? `<a href='${escapeHtml(r.link)}' target='_blank'>View</a>` : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
        <div style="margin-top:18px; text-align:center;">
            <button id="downloadCSVBtn" style="background:#007bff; color:white; border:none; padding:10px 22px; border-radius:4px; cursor:pointer; font-size:16px; margin-right:10px;">Download CSV</button>
            <button id="checkOtherSKUsBtn" style="background:#28a745; color:white; border:none; padding:10px 22px; border-radius:4px; cursor:pointer; font-size:16px; margin-right:10px;">Check Other SKUs</button>
            <button id="closeResultsModalBtn" style="background:#6c757d; color:white; border:none; padding:10px 22px; border-radius:4px; cursor:pointer; font-size:16px;">Close</button>
        </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Download CSV handler
    document.getElementById('downloadCSVBtn').onclick = function() {
        downloadResultsCSV(results);
    };
    // Add handler for Check Other SKUs
    document.getElementById('checkOtherSKUsBtn').onclick = function() {
        backdrop.remove();
        setTimeout(() => checkSKUs(), 200); // slight delay to avoid modal stacking
    };
    // Close modal handler
    document.getElementById('closeResultsModalBtn').onclick = function() {
        backdrop.remove();
    };
    // Escape key closes modal
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            backdrop.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(tag) {
        const chars = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        };
        return chars[tag] || tag;
    });
}

function downloadResultsCSV(results) {
    const header = ['SKU', 'Status', 'Message', 'Link'];
    const rows = results.map(r => [
        r.sku,
        r.enabled ? 'Enabled' : 'Not Found',
        r.message.replace(/\r?\n|\r/g, ' '),
        r.link || ''
    ]);
    const csvContent = [header, ...rows]
        .map(row => row.map(field => '"' + ('' + field).replace(/"/g, '""') + '"').join(','))
        .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sku-check-results.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Start the SKU checking process
console.log("🚀 Starting Riva Fashion SKU Checker...");
console.log("Make sure you're on https://www.rivafashion.com/en-kw/ before running this script");

checkSKUs(); 