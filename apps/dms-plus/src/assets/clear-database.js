/**
 * Clear Database Utility
 * Run this in the browser console to clear the IndexedDB database
 * Usage: Copy and paste this function in browser console and call clearDMSDatabase()
 */

window.clearDMSDatabase = function() {
  if (confirm('Are you sure you want to clear the DMS database? This will remove all data and reload the page.')) {
    // Import Dexie from the global scope
    if (typeof Dexie !== 'undefined') {
      Dexie.delete('DMSPlusDB').then(() => {
        console.log('Database cleared successfully');
        window.location.reload();
      }).catch(error => {
        console.error('Error clearing database:', error);
      });
    } else {
      // Fallback method using IndexedDB directly
      const deleteRequest = indexedDB.deleteDatabase('DMSPlusDB');
      
      deleteRequest.onsuccess = function() {
        console.log('Database cleared successfully');
        window.location.reload();
      };
      
      deleteRequest.onerror = function() {
        console.error('Error clearing database');
      };
    }
  }
};

console.log('Clear database function loaded. Call clearDMSDatabase() to clear the database.');