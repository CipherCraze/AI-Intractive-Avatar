# AI Interactive Avatar

An educational AI tutor application with interactive avatars, dynamic backgrounds, and comprehensive learning tools.

## Features

- 🤖 **AI-Powered Explanations**: Uses Google Gemini to generate educational content
- 🎬 **Avatar Videos**: HeyGen integration for realistic avatar presentations  
- 🎨 **Dynamic Backgrounds**: SDXL image generation via HuggingFace
- 📸 **Media Integration**: Pexels API for educational imagery
- 📊 **Interactive Slides**: Animated presentations with Spectacle
- 💫 **Rich Animations**: Lottie animations for visual engagement

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Vercel Serverless Functions
- **AI Services**: Google Gemini, HeyGen, HuggingFace SDXL
- **Media**: Pexels API, Lottie animations

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/CipherCraze/AI-Interactive-Avatar.git
cd AI-Interactive-Avatar
npm install
```

### 2. Environment Setup
Create a `.env.local` file with your API keys:
```env
GEMINI_API_KEY=your_google_gemini_key
HEYGEN_API_KEY=your_heygen_key
HEYGEN_AVATAR_ID=your_avatar_id  
HEYGEN_VOICE_ID=your_voice_id
HF_API_TOKEN=your_huggingface_token
PEXELS_API_KEY=your_pexels_key
```

### 3. Local Development
```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## Deployment to Vercel

### Method 1: Git Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React/Vite

3. **Set Environment Variables**:
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add all your API keys from `.env.local`
   - Make sure to add them for Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to set up your project
```

## API Endpoints

- `POST /api/ask` - Generate educational content with AI
- `GET /api/video-status` - Check HeyGen video generation status
- `POST /api/generate-background` - Create dynamic backgrounds with SDXL
- `GET /api/pexels` - Search for educational media
- `GET /api/health` - Health check and environment status

## Required API Keys

### Google Gemini
- Get from: [Google AI Studio](https://aistudio.google.com/)
- Used for: Educational content generation

### HeyGen  
- Get from: [HeyGen](https://www.heygen.com/)
- Used for: Avatar video generation
- Need: API key, Avatar ID, Voice ID

### HuggingFace
- Get from: [HuggingFace](https://huggingface.co/settings/tokens)
- Used for: SDXL background image generation

### Pexels
- Get from: [Pexels API](https://www.pexels.com/api/)
- Used for: Educational stock photos/videos

## Architecture

```
├── src/
│   ├── components/          # React components
│   │   ├── Chat.tsx        # Main chat interface  
│   │   ├── AvatarStage.tsx # Avatar video display
│   │   ├── SlidesDeck.tsx  # Educational presentations
│   │   └── ...
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client functions
│   │   └── ...
│   └── store/              # Zustand state management
├── api/                    # Vercel serverless functions
│   ├── ask.ts             # Main AI endpoint
│   ├── generate-background.ts # Image generation  
│   ├── video-status.ts    # Video polling
│   └── ...
├── public/                 # Static assets
└── dev-server/            # Local development server (not used in production)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `HEYGEN_API_KEY` | Yes | HeyGen API key |
| `HEYGEN_AVATAR_ID` | Yes | HeyGen avatar identifier |
| `HEYGEN_VOICE_ID` | No | HeyGen voice (defaults to en-US) |
| `HF_API_TOKEN` | Yes | HuggingFace API token |
| `PEXELS_API_KEY` | No | Pexels API key (for stock media) |

## Troubleshooting

### Common Issues

1. **API Keys Not Working**:
   - Ensure no quotes around values in `.env.local`
   - Check `/api/health` endpoint for key validation

2. **Video Generation Fails**:
   - Verify HeyGen API key and avatar ID
   - Check HeyGen account credits

3. **Image Generation Fails**:
   - Verify HuggingFace token
   - App will fallback to solid color backgrounds

4. **Build Errors**:
   - Run `npm run build` locally first
   - Check TypeScript errors

### Vercel-Specific Issues

- **Function Timeout**: Vercel free tier has 10s timeout. Upgrade for longer functions
- **Memory Limits**: Image generation may need higher memory allocation
- **Cold Starts**: First request may be slower due to serverless cold starts

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## License

MIT License - see LICENSE file for details

---

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Verify all API keys are correctly configured
