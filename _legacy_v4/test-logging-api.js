// ABOUTME: Test script for the enhanced structured logging API endpoints
// ABOUTME: Tests new category, severity, and operation filtering parameters

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1/logs';

async function testLoggingAPI() {
  console.log('🧪 Testing Enhanced Logging API...\n');

  try {
    // Test 1: Basic endpoint connectivity
    console.log('1. Testing basic connectivity...');
    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Test endpoint:', testResponse.data.data.message);

    // Test 2: Categories aggregation endpoint
    console.log('\n2. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories`);
    console.log('✅ Categories endpoint response:', {
      categories: categoriesResponse.data.data.categories,
      severities: categoriesResponse.data.data.severities,
      operations: categoriesResponse.data.data.operations,
      totalLogs: categoriesResponse.data.data.totalLogs
    });

    // Test 3: Logs with new filter parameters
    console.log('\n3. Testing logs endpoint with new filters...');
    const filtersToTest = [
      { description: 'Category filter', params: { category: 'device,sensor' } },
      { description: 'Severity filter', params: { severity: 'high,critical' } },
      { description: 'Operation filter', params: { operation: 'health_check' } },
      { description: 'Combined filters', params: { category: 'device', severity: 'high', limit: 10 } }
    ];

    for (const filterTest of filtersToTest) {
      try {
        const response = await axios.get(`${BASE_URL}`, { params: filterTest.params });
        console.log(`✅ ${filterTest.description}:`, {
          count: response.data.data.count,
          hasSourceLocation: response.data.data.logs.some(log => log.sourceLocation),
          hasBusinessContext: response.data.data.logs.some(log => log.businessContext),
          filter: response.data.data.filter
        });
      } catch (error) {
        console.log(`❌ ${filterTest.description}: ${error.message}`);
      }
    }

    // Test 4: Live logs with new filters
    console.log('\n4. Testing live logs endpoint with new filters...');
    const liveResponse = await axios.get(`${BASE_URL}/live`, {
      params: { category: 'device', limit: 5 }
    });
    console.log('✅ Live logs with filters:', {
      count: liveResponse.data.data.count,
      isLive: liveResponse.data.data.isLive,
      hasEnhancements: liveResponse.data.data.logs.some(log =>
        log.sourceLocation !== undefined && log.businessContext !== undefined
      )
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testLoggingAPI();