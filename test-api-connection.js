#!/usr/bin/env node

/**
 * Simple test script to verify API connection
 * Run this with: node test-api-connection.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';

async function testHealthEndpoint() {
    try {
        console.log('🔍 Testing health endpoint...');
        const response = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health endpoint response:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Health endpoint failed:', error.message);
        return false;
    }
}

async function testAPIStructure() {
    try {
        console.log('🔍 Testing API structure...');
        const response = await axios.get(`${API_BASE_URL}/`);
        console.log('✅ Root endpoint response:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Root endpoint failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting API Connection Tests...\n');
    
    const results = [];
    results.push(await testAPIStructure());
    results.push(await testHealthEndpoint());
    
    const passed = results.filter(Boolean).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('✅ All API connection tests passed!');
        console.log('🎯 Backend is ready for frontend integration');
    } else {
        console.log('❌ Some tests failed. Check backend server status.');
        console.log('💡 Make sure to run: cd backend && python start.py');
    }
}

if (require.main === module) {
    runTests().catch(console.error);
}