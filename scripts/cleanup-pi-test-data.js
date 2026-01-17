/**
 * Cleanup script to delete all PI test data (sourceSystem='PI')
 * This removes incorrectly numbered PI requests before regenerating them
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4004/pi';

async function cleanupPITestData() {
  console.log('🧹 Cleaning up PI test data...\n');

  try {
    // First, get all PI requests
    console.log('📋 Fetching all PI requests...');
    const response = await axios.get(`${BASE_URL}/PIRequests`, {
      params: {
        $select: 'ID,requestNumber,name1,createdAt'
      }
    });

    const requests = response.data.value;
    console.log(`   Found ${requests.length} PI requests total\n`);

    // Filter to only delete COUPA-prefixed requests (incorrectly numbered old test data)
    const oldRequests = requests.filter(r => r.requestNumber && r.requestNumber.startsWith('COUPA-'));
    const newRequests = requests.filter(r => r.requestNumber && r.requestNumber.startsWith('PI-'));

    console.log(`   ${oldRequests.length} old COUPA-prefixed requests (will delete)`);
    console.log(`   ${newRequests.length} new PI-prefixed requests (will keep)\n`);

    if (oldRequests.length === 0) {
      console.log('✅ No old COUPA-prefixed requests to delete. Database is clean.\n');
      return;
    }

    // Delete each old request
    let successCount = 0;
    let errorCount = 0;

    for (const request of oldRequests) {
      try {
        console.log(`🗑️  Deleting: ${request.requestNumber} - ${request.name1}`);
        // OData V4 requires GUID format in URL
        await axios.delete(`${BASE_URL}/PIRequests(ID=${request.ID},IsActiveEntity=true)`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${request.requestNumber}:`, error.response?.data?.error?.message || error.message);
        errorCount++;
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log(`   Deleted: ${successCount} requests`);
    console.log(`   Errors: ${errorCount} requests\n`);

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run cleanup
cleanupPITestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
