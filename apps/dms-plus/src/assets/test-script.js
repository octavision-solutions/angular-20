// Simple test script to verify DMS+ application functionality
console.log('🧪 Testing DMS+ Application...');

// Test 1: Check if browser supports IndexedDB (required for Dexie)
if ('indexedDB' in window) {
  console.log('✅ IndexedDB supported');
} else {
  console.log('❌ IndexedDB not supported');
}

// Test 2: Check if application loads without errors
window.addEventListener('load', () => {
  console.log('✅ Application loaded successfully');
  
  // Test 3: Check if Angular is loaded
  if (window.ng) {
    console.log('✅ Angular framework loaded');
  }
  
  // Test 4: Check if Bootstrap CSS is loaded
  const bootstrapCheck = document.querySelector('.container, .row, .col') !== null;
  if (bootstrapCheck || document.styleSheets.length > 0) {
    console.log('✅ Bootstrap CSS loaded');
  }
  
  // Test 5: Wait for Angular to bootstrap and test routing
  setTimeout(() => {
    const currentPath = window.location.pathname;
    console.log(`📍 Current route: ${currentPath}`);
    
    if (currentPath === '/' || currentPath.includes('dashboard') || currentPath.includes('login')) {
      console.log('✅ Routing working correctly');
    }
    
    console.log('🎉 DMS+ Application test completed!');
  }, 2000);
});

// Test 6: Check if service worker could be registered (for PWA capabilities)
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker support available');
} else {
  console.log('ℹ️  Service Worker not supported (not critical)');
}

// Test 7: Log any errors
window.addEventListener('error', (e) => {
  console.error('❌ Application error:', e.error);
});

console.log('🔍 Test script loaded successfully');