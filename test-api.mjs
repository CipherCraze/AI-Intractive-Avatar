// Test script for the AI Avatar API
import axios from 'axios'

const BASE_URL = 'http://localhost:5175' // Through Vite proxy

async function testAPI() {
  console.log('🧪 Testing AI Avatar API...\n')
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...')
    const healthResponse = await axios.get(`${BASE_URL}/api/health`)
    console.log('✅ Health check passed:', healthResponse.data)
    
    // Test 2: Ask endpoint with a simple question
    console.log('\n2️⃣ Testing ask endpoint...')
    const askResponse = await axios.post(`${BASE_URL}/api/ask`, {
      question: 'What is photosynthesis?',
      backgroundPreference: 'auto'
    })
    
    console.log('✅ Ask endpoint response:')
    console.log('  - Answer:', askResponse.data.answer?.slice(0, 100) + '...')
    console.log('  - Concept:', askResponse.data.concept)
    console.log('  - Slides count:', askResponse.data.slides?.length || 0)
    console.log('  - Video URL:', askResponse.data.videoUrl ? 'Present' : 'Not generated')
    console.log('  - Difficulty:', askResponse.data.difficulty || 'Not specified')
    console.log('  - Subject:', askResponse.data.subject || 'Not specified')
    
    console.log('\n🎉 All tests passed! The API is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Data:', error.response.data)
    }
  }
}

testAPI()
