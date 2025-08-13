# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hume EVI (Empathic Voice Interface) Next.js starter application using the App Router. It provides a voice-enabled chat interface with real-time emotion detection and video input capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Required Environment Variables

Create a `.env` file with:
- `HUME_API_KEY` - Your Hume API key (required)
- `HUME_SECRET_KEY` - Your Hume secret key (required)
- `NEXT_PUBLIC_HUME_CONFIG_ID` - Optional Hume config ID for custom voice configurations
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID for video recording storage
- `CLOUDFLARE_STREAM_API_TOKEN` - Cloudflare Stream API token for uploads
- `NEXT_PUBLIC_APP_URL` - Your app URL (default: http://localhost:3000)

Get Hume keys from https://beta.hume.ai/settings/keys
Get Cloudflare credentials from https://dash.cloudflare.com/profile/api-tokens

## Architecture

### Core Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with Tailwind v4 for styling
- **shadcn/ui** components (configured in `components.json`)
- **Hume Voice SDK** (`@humeai/voice-react` and `hume`)

### Key Components

#### Server Components
- `app/page.tsx` - Root page that fetches access token server-side
- `utils/getHumeAccessToken.ts` - Server-only token fetching using Hume SDK
- `app/api/recording/` - API routes for Cloudflare Stream integration

#### Client Components
- `components/Chat.tsx` - Main chat wrapper with VoiceProvider
- `components/StartCall.tsx` - Call initialization with access token
- `components/VideoInput.tsx` - Camera video capture component with stream export
- `components/Messages.tsx` - Message display with expressions
- `components/Controls.tsx` - Voice chat controls
- `components/Expressions.tsx` - Real-time emotion visualization
- `components/RecordingControls.tsx` - Video/audio recording with cloud upload

#### Recording Infrastructure
- `hooks/useRecording.ts` - Native MediaRecorder hook for video/audio capture
- `utils/cloudflareUpload.ts` - TUS-based resumable upload to Cloudflare Stream

### Authentication Flow
1. Server fetches access token using API/Secret keys
2. Token passed to client components as prop
3. Client uses token to connect to Hume EVI service

### State Management
- Voice state managed by `@humeai/voice-react` VoiceProvider
- Local state for UI interactions (video, messages, etc.)
- No global state management library

### Styling Approach
- Tailwind CSS v4 with CSS variables
- shadcn/ui components for consistent UI
- Motion animations using `motion/react`
- Theme support via `next-themes`

## Common Development Tasks

### Adding New Voice Features
Voice functionality is handled through the `useVoice` hook from `@humeai/voice-react`. The VoiceProvider in `Chat.tsx` manages the connection.

### Modifying UI Components
UI components are in `/components/ui/` and follow shadcn/ui patterns. Use the `cn()` utility for conditional classes.

### Handling Errors
Error handling uses `sonner` for toast notifications. The VoiceProvider has an `onError` callback for voice-related errors.

### Working with Video
The `VideoInput` component handles camera access. It uses MediaStream API and includes proper cleanup on unmount.

## Key Dependencies
- `@humeai/voice-react` - Hume's React SDK for voice interface
- `hume` - Core Hume SDK for authentication
- `motion` - Animation library (Motion One)
- `sonner` - Toast notifications
- `lucide-react` - Icon library
- `next-themes` - Theme management