# Pexels API Integration for Dynamic Backgrounds

## Overview
The AI Avatar application now includes dynamic background integration using the Pexels API, providing contextually relevant photos and videos based on the educational topic being discussed.

## Features

### 🖼️ **Dynamic Background Content**
- **Automatic Topic Mapping**: Each educational concept is automatically mapped to relevant search terms
- **Photo & Video Support**: Fetches both high-quality photos and videos from Pexels
- **Smart Fallbacks**: If no photos are found, automatically tries videos and vice versa
- **Content Rotation**: Automatically cycles through multiple background images/videos

### 🎛️ **User Controls**
- **Toggle On/Off**: Users can enable/disable Pexels backgrounds
- **Opacity Control**: Adjustable opacity from 10% to 100% for optimal avatar visibility
- **Content Type Selection**: Choose between photos, videos, or auto-selection
- **Manual Navigation**: Previous/next buttons to manually browse through content

### 🔍 **Topic-Aware Search**
The system uses intelligent search mapping for better results:

```typescript
const conceptMap = {
  'Photosynthesis': 'plants green leaves nature sunlight',
  'Coordinate Geometry': 'mathematics geometry graph grid',
  'DNA Structure': 'dna science laboratory molecular biology',
  'Wave Motion': 'ocean waves water physics motion',
  'Binary Search': 'computer technology data network',
  // ... and many more
}
```

## Setup Instructions

### 1. **Get Pexels API Key**
1. Visit [Pexels API](https://www.pexels.com/api/)
2. Sign up for a free account
3. Generate your API key

### 2. **Add to Environment Variables**
Add your Pexels API key to `.env.local`:
```bash
PEXELS_API_KEY="your_pexels_api_key_here"
```

### 3. **API Endpoints**
The integration includes both Vercel serverless functions and dev server endpoints:

- **Vercel**: `/api/pexels`
- **Dev Server**: `http://localhost:5000/api/pexels`

### 4. **Usage Examples**

#### Fetch Photos for a Topic:
```bash
GET /api/pexels?query=photosynthesis&type=photos&per_page=5
```

#### Fetch Videos for a Topic:
```bash
GET /api/pexels?query=wave motion&type=videos&per_page=3
```

## Component Architecture

### **PexelsBackground.tsx**
Main component that handles:
- Content fetching and caching
- Auto-rotation through multiple images/videos
- User interaction controls
- Responsive design

### **API Integration**
- **Frontend**: `fetchPexelsContent()` function in `src/lib/api.ts`
- **Backend**: Pexels API endpoints in `api/pexels.ts` and `dev-server/server.mjs`

### **State Management**
Background settings are managed in Zustand store:
```typescript
backgroundSettings: {
  usePexelsBackground: boolean
  backgroundOpacity: number
  backgroundType: 'photos' | 'videos' | 'auto'
}
```

## Visual Integration

### **Layer Structure** (from back to front):
1. **Pexels Background** (z-index: 0) - Dynamic photos/videos
2. **Animation Layer** (z-index: 1-5) - Lottie animations
3. **Interactive Visualizations** (z-index: 5) - Canvas-based interactions
4. **Avatar Video** (z-index: 10) - HeyGen avatar with blend modes
5. **UI Controls** (z-index: 30) - Settings and navigation

### **Blend Modes**
- **With Pexels Background**: `overlay` mode for better integration
- **Animation Only**: `screen` mode for Lottie animations
- **Default**: `normal` mode

## Performance Considerations

### **Optimization Features**
- **Lazy Loading**: Images/videos load only when needed
- **Caching**: Content is cached to avoid repeated API calls
- **Responsive Images**: Uses appropriate image sizes for different screens
- **Error Handling**: Graceful fallbacks when content fails to load

### **Rate Limiting**
- Pexels free tier: 200 requests/hour
- The app batches requests and caches results to stay within limits
- Shows user-friendly error messages when rate limit is exceeded

## Customization

### **Adding New Topics**
To add new educational topics with custom search terms:

1. **Update Animation Map** (`src/lib/animationMap.ts`):
```typescript
export const animationMap: Record<string, string> = {
  'Your New Topic': '/animations/your-animation.json',
  // ... existing topics
}
```

2. **Update Search Map** (`src/components/PexelsBackground.tsx`):
```typescript
const conceptMap: Record<string, string> = {
  'Your New Topic': 'relevant search keywords for pexels',
  // ... existing mappings
}
```

### **Styling Customization**
The component supports custom CSS classes and styling:
```tsx
<PexelsBackground
  concept="Photosynthesis"
  isActive={true}
  opacity={0.7}
  className="custom-background-class"
/>
```

## Troubleshooting

### **Common Issues**

1. **No Background Appears**
   - Check if Pexels API key is correctly set in `.env.local`
   - Verify the concept name matches the mapping
   - Check browser console for API errors

2. **Rate Limit Exceeded**
   - Wait for the rate limit to reset (hourly)
   - Consider upgrading to Pexels Pro for higher limits
   - Use browser caching to reduce API calls

3. **Performance Issues**
   - Reduce `per_page` parameter for fewer images
   - Lower background opacity to reduce visual complexity
   - Disable auto-rotation for static backgrounds

### **API Response Format**
```json
{
  "success": true,
  "type": "photos",
  "query": "photosynthesis",
  "content": [
    {
      "id": 12345,
      "url": "https://images.pexels.com/photos/...",
      "alt": "Green plant in sunlight",
      "width": 1920,
      "height": 1080
    }
  ],
  "total": 5
}
```

## Future Enhancements

### **Planned Features**
- **AI-Generated Descriptions**: Use Gemini to generate more specific search terms
- **User Preferences**: Save individual background preferences
- **Content Quality Scoring**: Prioritize higher-quality, more relevant content
- **Offline Mode**: Cache popular backgrounds for offline use
- **Custom Upload**: Allow users to upload their own educational backgrounds

### **Advanced Integration Ideas**
- **Speech Synchronization**: Change backgrounds based on specific keywords in avatar speech
- **Interactive Elements**: Clickable backgrounds that trigger educational content
- **3D Backgrounds**: Integration with Three.js for 3D educational environments
- **AR Support**: Background replacement for augmented reality experiences

## Benefits

### **Educational Value**
- **Visual Context**: Students see relevant imagery while learning
- **Memory Enhancement**: Visual associations improve information retention
- **Engagement**: Dynamic content keeps students interested
- **Accessibility**: Multiple content types support different learning styles

### **Technical Benefits**
- **Scalable**: Easy to add new topics and content types
- **Performant**: Optimized for smooth playback and minimal resource usage
- **Flexible**: Configurable opacity and blending for different use cases
- **Reliable**: Graceful error handling and fallbacks

This Pexels integration transforms the static avatar environment into a dynamic, visually rich educational experience that adapts to the content being taught.
