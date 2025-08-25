// Test script for direct server access
import axios from 'axios'

async function testDirectAPI() {
  console.log('🧪 Testing direct server access...\n')
  
  try {
    console.log('Testing health endpoint on port 5000...')
    const response = await axios.get('http://localhost:5000/api/health')
    console.log('✅ Direct server test passed:', response.data)
  } catch (error) {
    console.error('❌ Direct server test failed:', error.message)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
  }
}

testDirectAPI()
