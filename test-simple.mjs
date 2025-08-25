// Test the simple server
import axios from 'axios'

async function testSimpleServer() {
  try {
    const response = await axios.get('http://localhost:5001/api/health')
    console.log('✅ Simple server test passed:', response.data)
  } catch (error) {
    console.error('❌ Simple server test failed:', error.message)
  }
}

testSimpleServer()
