# HarmoniQ API Documentation

This document provides comprehensive documentation for all API endpoints in the HarmoniQ platform.

**Last Updated:** 2026-03-13

## Base URL

All API endpoints are relative to the application root URL.

## Authentication

Most endpoints require authentication. HarmoniQ uses Replit Auth via OpenID Connect. Authentication is handled through session cookies.

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/user` | Required | Get current authenticated user |
| GET | `/api/login` | None | Initiate OIDC login flow (redirects to Replit) |
| GET | `/api/callback` | None | OIDC callback (handles token exchange) |
| GET | `/api/logout` | None | Log out current user (destroys session) |

### Rate Limiting

Two rate limiters are applied:
- **AI Rate Limiter** (50 requests / 15 minutes): Applied to AI generation endpoints
- **Write Rate Limiter** (100 requests / 15 minutes): Applied to database write endpoints

Admin users (listed in `ADMIN_USER_IDS` env var) bypass rate limits.

---

## Songs API

### List User's Songs

```
GET /api/songs
```

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "title": "My Song",
    "lyrics": "Song lyrics...",
    "description": "A love song",
    "genre": "Pop",
    "mood": "Happy",
    "creationMode": "description",
    "hasVocal": true,
    "vocalGender": "female",
    "recordingType": "studio",
    "audioUrl": "https://...",
    "imageUrl": "https://...",
    "isPublic": false,
    "playCount": 10,
    "likeCount": 5,
    "createdAt": "2026-01-25T00:00:00Z"
  }
]
```

### List Public Songs

```
GET /api/songs/public
```

**Authentication:** Not required

**Response:** Same as above, but only returns songs where `isPublic: true`

### Get Single Song

```
GET /api/songs/:id
```

**Authentication:** Required

**Parameters:**
- `id` (path) - Song ID

**Response:** Single song object

**Errors:**
- `404` - Song not found
- `401` - Unauthorized (song is private and not owned by user)

### Create Song

```
POST /api/songs
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Request Body:**
```json
{
  "title": "My Song",
  "lyrics": "Song lyrics...",
  "description": "Optional description",
  "genre": "Pop",
  "mood": "Happy",
  "creationMode": "description",
  "hasVocal": true,
  "vocalGender": "female",
  "recordingType": "studio",
  "audioUrl": "https://...",
  "imageUrl": "https://...",
  "isPublic": false
}
```

**Required Fields:** `title`, `lyrics`

**Response:** Created song object with `201` status

### Delete Song

```
DELETE /api/songs/:id
```

**Authentication:** Required (must own the song)
**Rate Limit:** Write (100/15min)

**Response:** `204 No Content`

### Like/Unlike Song

```
POST /api/songs/:id/like
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Response:**
```json
{
  "liked": true,
  "likeCount": 6
}
```

### Increment Play Count

```
POST /api/songs/:id/play
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Response:**
```json
{
  "playCount": 11
}
```

### Get User's Liked Song IDs

```
GET /api/songs/liked-ids
```

**Authentication:** Required

**Response:**
```json
{
  "likedIds": [1, 5, 12, 23]
}
```

### Get User's Liked Songs

```
GET /api/songs/liked
```

**Authentication:** Required

**Response:** Array of full song objects that the user has liked

---

## Playlists API

### List User's Playlists

```
GET /api/playlists
```

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "name": "My Playlist",
    "description": "Favorite songs",
    "imageUrl": "https://...",
    "isPublic": false,
    "createdAt": "2026-01-25T00:00:00Z"
  }
]
```

### Get Playlist with Songs

```
GET /api/playlists/:id
```

**Authentication:** Required

**Response:** Playlist object with `songs` array

### Create Playlist

```
POST /api/playlists
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Request Body:**
```json
{
  "name": "My Playlist",
  "description": "Optional description",
  "imageUrl": "https://...",
  "isPublic": false
}
```

**Required Fields:** `name`

### Delete Playlist

```
DELETE /api/playlists/:id
```

**Authentication:** Required (must own the playlist)
**Rate Limit:** Write (100/15min)

**Response:** `204 No Content`

### Add Song to Playlist

```
POST /api/playlists/:id/songs
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Request Body:**
```json
{
  "songId": 123
}
```

### Remove Song from Playlist

```
DELETE /api/playlists/:id/songs/:songId
```

**Authentication:** Required
**Rate Limit:** Write (100/15min)

**Response:** `204 No Content`

---

## AI Suggestions API

### AI Suggest

```
POST /api/generate/ai-suggest
```

**Authentication:** Required

**Request Body:**
```json
{
  "context": "lyrics",
  "currentValue": "A song about...",
  "field": "prompt"
}
```

**Response:**
```json
{
  "suggestion": "AI-generated suggestion text..."
}
```

---

## Lyrics Generation API

### Generate Lyrics (OpenAI)

```
POST /api/generate/lyrics
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "A love song about summer",
  "genre": "Pop",
  "mood": "Happy",
  "style": "Modern"
}
```

**Required Fields:** `prompt`

**Response:**
```json
{
  "title": "Summer Love",
  "lyrics": "Verse 1:\n..."
}
```

### Generate Song Concept (Gemini)

```
POST /api/generate/song-concept
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "An energetic dance track",
  "genre": "EDM",
  "mood": "Hype"
}
```

**Response:**
```json
{
  "title": "Dance Floor",
  "lyrics": "...",
  "bpm": 128,
  "key": "A minor",
  "energy": "high",
  "productionNotes": "..."
}
```

### Generate Lyrics Only (Gemini)

```
POST /api/generate/lyrics-gemini
```

**Authentication:** Required

**Request Body:** Same as song concept

**Response:**
```json
{
  "title": "Song Title",
  "lyrics": "..."
}
```

### Get Random Prompt

```
GET /api/generate/random-prompt
```

**Authentication:** Not required

**Response:**
```json
{
  "prompt": "A love song about meeting someone at a coffee shop on a rainy day"
}
```

### Get Random Lyrics Sample

```
GET /api/generate/random-lyrics
```

**Authentication:** Not required

**Response:**
```json
{
  "lyrics": "Verse 1:\nWalking down..."
}
```

### Analyze Lyrics

```
POST /api/generate/analyze-lyrics
```

**Authentication:** Required

**Request Body:**
```json
{
  "lyrics": "Your song lyrics here..."
}
```

**Response:** Analysis object with themes, emotions, and suggestions

### Get Production Tips

```
POST /api/generate/production-tips
```

**Authentication:** Required

**Request Body:**
```json
{
  "genre": "Pop",
  "mood": "Happy",
  "energy": "medium"
}
```

**Response:**
```json
{
  "tip": "Production tips for your song..."
}
```

### Generate Cover Art Prompt

```
POST /api/generate/cover-art-prompt
```

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Summer Love",
  "genre": "Pop",
  "mood": "Happy"
}
```

**Response:**
```json
{
  "prompt": "AI image generation prompt..."
}
```

---

## Music Theory API

### Generate Chord Progression

```
POST /api/music-theory/chord-progression
```

**Authentication:** Required

**Request Body:**
```json
{
  "mood": "Happy",
  "key": "C major"
}
```

**Response:**
```json
{
  "progression": "C - G - Am - F"
}
```

### Reharmonize Progression

```
POST /api/music-theory/reharmonize
```

**Authentication:** Required

**Request Body:**
```json
{
  "progression": "C - G - Am - F",
  "key": "C major"
}
```

**Response:**
```json
{
  "progression": "Cmaj7 - G/B - Am7 - Fmaj9"
}
```

### Lookup Scales

```
POST /api/music-theory/lookup-scales
```

**Authentication:** Required

**Request Body:**
```json
{
  "notes": ["C", "D", "E", "G", "A"]
}
```

**Response:**
```json
{
  "results": [
    { "scale": "C Major Pentatonic", "notes": ["C", "D", "E", "G", "A"] }
  ]
}
```

---

## Audio Generation API (MusicGen via Replicate)

Short-form audio generation using Meta's MusicGen model (5-30 seconds).

### Generate Music (Synchronous)

```
POST /api/audio/generate
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "Upbeat electronic dance music",
  "duration": 15,
  "genre": "EDM",
  "mood": "Energetic",
  "instrumental": true
}
```

**Response:**
```json
{
  "audioUrl": "https://replicate.delivery/...",
  "duration": 15
}
```

### Start Async Music Generation

```
POST /api/audio/generate/start
```

**Authentication:** Required

**Request Body:** Same as synchronous generation

**Response:**
```json
{
  "predictionId": "abc123..."
}
```

### Check Generation Status

```
GET /api/audio/status/:predictionId
```

**Authentication:** Required

**Response:**
```json
{
  "status": "succeeded",
  "output": "https://replicate.delivery/..."
}
```

Status values: `starting`, `processing`, `succeeded`, `failed`

### Generate Sound Effect

```
POST /api/audio/sound-effect
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "Thunder rumbling in the distance",
  "duration": 5
}
```

### Generate with Reference Audio

```
POST /api/audio/generate-with-reference
```

**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
- `referenceAudio` (file, required): Audio file to use as style reference (max 10MB, audio/* only; validated by magic bytes)
- `prompt` (text, required): Text description of desired output
- `duration` (text, optional): Duration in seconds (default: 15)

**Response:** Async — returns prediction ID for polling via `/api/audio/status/:predictionId`
```json
{
  "predictionId": "abc123...",
  "status": "processing"
}
```

---

## Stable Audio API (fal.ai)

Extended duration music generation (up to 3 minutes) using Stable Audio.

### Generate Sample (15 seconds)

```
POST /api/stable-audio/sample
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "Ambient electronic with soft pads",
  "genre": "Ambient",
  "mood": "Calm",
  "bpm": 80,
  "key": "D minor",
  "instrumental": true
}
```

**Response:**
```json
{
  "audioUrl": "https://fal.media/...",
  "duration": 15
}
```

### Generate Full Track

```
POST /api/stable-audio/full
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "Epic orchestral cinematic score",
  "duration": 120,
  "genre": "Cinematic",
  "mood": "Epic",
  "bpm": 100,
  "key": "E minor",
  "instrumental": true,
  "useV25": true
}
```

**Notes:**
- Default Stable Audio: max 47 seconds
- With `useV25: true`: up to 180 seconds (3 minutes)

### Start Async Generation

```
POST /api/stable-audio/start
```

**Authentication:** Required

**Request Body:** Same as full track

**Response:**
```json
{
  "requestId": "request_abc123..."
}
```

### Check Async Status

```
GET /api/stable-audio/status/:requestId
```

**Authentication:** Required

**Response:**
```json
{
  "status": "succeeded",
  "audioUrl": "https://fal.media/..."
}
```

### Transform Audio

```
POST /api/stable-audio/transform
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "Add more bass and drums",
  "audioUrl": "https://existing-audio-url.mp3",
  "duration": 60
}
```

---

## Bark Vocals API (Replicate)

AI-powered singing vocals generation using Suno's Bark model.

### Get Available Voices

```
GET /api/bark/voices
```

**Authentication:** Required

**Response:**
```json
{
  "voices": [
    { "id": "v2/en_speaker_0", "name": "Speaker 0 (Male)", "gender": "male" },
    { "id": "v2/en_speaker_6", "name": "Speaker 6 (Female)", "gender": "female" }
  ]
}
```

### Generate Singing Vocals

```
POST /api/bark/generate
```

**Authentication:** Required

**Request Body:**
```json
{
  "lyrics": "La la la, singing in the sun",
  "voicePreset": "v2/en_speaker_6",
  "textTemp": 0.7,
  "waveformTemp": 0.7
}
```

**Parameters:**
- `lyrics` (required): Text to sing (max 2000 characters)
- `voicePreset`: Voice ID from available voices
- `textTemp`: Temperature for text generation (0.1-1.0)
- `waveformTemp`: Temperature for waveform generation (0.1-1.0)

**Response:**
```json
{
  "audioUrl": "https://replicate.delivery/..."
}
```

### Start Async Vocal Generation

```
POST /api/bark/generate/start
```

**Authentication:** Required

**Request Body:** Same as synchronous generation

**Response:**
```json
{
  "predictionId": "abc123..."
}
```

Use `GET /api/audio/status/:predictionId` to check status.

### Check Bark Configuration

```
GET /api/bark/status
```

**Authentication:** Required

**Response:**
```json
{
  "configured": true
}
```

---

## Suno API (DefAPI / Multi-Provider)

Studio-quality music generation with realistic vocals via Suno.

### Check Suno Status

```
GET /api/suno/status
```

**Authentication:** Required

**Response:**
```json
{
  "configured": true,
  "provider": "defapi"
}
```

### Generate Song (Synchronous)

```
POST /api/suno/generate
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "An upbeat pop song about dancing in the rain",
  "lyrics": "Optional custom lyrics...",
  "genre": "Pop",
  "mood": "Happy",
  "model": "chirp-bluejay",
  "instrumental": false
}
```

**Parameters:**
- `prompt` (required): Description of the song
- `lyrics`: Custom lyrics (if empty, Suno generates lyrics)
- `model`: One of `chirp-crow` (v5), `chirp-bluejay` (v4.5+, default), `chirp-auk` (v4.5), `chirp-v4` (v4)
- `instrumental`: If true, generates without vocals

**Response:**
```json
{
  "audioUrl": "https://cdn.suno.ai/...",
  "title": "Dancing in the Rain",
  "lyrics": "Generated lyrics...",
  "imageUrl": "https://cdn.suno.ai/..."
}
```

### Start Async Song Generation

```
POST /api/suno/generate/start
```

**Authentication:** Required

**Request Body:** Same as synchronous generation

**Response:**
```json
{
  "taskId": "task_abc123..."
}
```

### Check Suno Generation Status

```
GET /api/suno/status/:taskId
```

**Authentication:** Required

**Response:**
```json
{
  "status": "completed",
  "result": {
    "audioUrl": "https://cdn.suno.ai/...",
    "title": "Dancing in the Rain",
    "lyrics": "..."
  }
}
```

Status values: `pending`, `processing`, `completed`, `failed`

### Generate Lyrics with Suno

```
POST /api/suno/lyrics
```

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "A heartfelt ballad about lost love"
}
```

**Response:**
```json
{
  "lyrics": "Generated lyrics text..."
}
```

### Get Suno User Info

```
GET /api/suno/user
```

**Authentication:** Required

**Response:**
```json
{
  "creditsLeft": 50,
  "provider": "defapi"
}
```

---

## ACE-Step 1.5 API (Replicate)

Commercial-grade full song generation with vocals via ACE-Step 1.5 model.

### Get ACE-Step Configuration

```
GET /api/ace-step/config
```

**Authentication:** Required

**Response:**
```json
{
  "configured": true,
  "maxDuration": 300
}
```

### Generate Song

```
POST /api/ace-step/generate
```

**Authentication:** Required

**Request Body:**
```json
{
  "tags": "pop, upbeat, female vocal, synth",
  "lyrics": "Optional song lyrics with verse/chorus structure...",
  "duration": 60,
  "seed": 42
}
```

**Parameters:**
- `tags` (required): Style tags describing the song (genre, mood, instruments)
- `lyrics` (optional): Song lyrics text
- `duration` (optional, default: 60): Duration in seconds
- `seed` (optional): Random seed for reproducibility

**Response:**
```json
{
  "predictionId": "abc123...",
  "status": "processing"
}
```

### Check ACE-Step Generation Status

```
GET /api/ace-step/status/:predictionId
```

**Authentication:** Required

**Response:**
```json
{
  "status": "succeeded",
  "output": "https://replicate.delivery/..."
}
```

Status values: `starting`, `processing`, `succeeded`, `failed`

---

## AI Chat API (Conversations)

AI-powered chat conversations using OpenAI. Authentication is enforced via Express middleware (`app.use("/api/conversations", isAuthenticated, aiRateLimiter.middleware)`) applied before route registration.

### List Conversations

```
GET /api/conversations
```

**Authentication:** Required (via middleware)
**Rate Limit:** AI (50/15min)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Chat about music theory",
    "createdAt": "2026-01-25T00:00:00Z"
  }
]
```

### Get Conversation with Messages

```
GET /api/conversations/:id
```

**Authentication:** Required (via middleware)
**Rate Limit:** AI (50/15min)

**Response:**
```json
{
  "id": 1,
  "title": "Chat about music theory",
  "messages": [
    { "id": 1, "role": "user", "content": "What is a chord?", "createdAt": "..." },
    { "id": 2, "role": "assistant", "content": "A chord is...", "createdAt": "..." }
  ]
}
```

### Create Conversation

```
POST /api/conversations
```

**Authentication:** Required (via middleware)
**Rate Limit:** AI (50/15min)

**Request Body:**
```json
{
  "title": "New conversation"
}
```

### Delete Conversation

```
DELETE /api/conversations/:id
```

**Authentication:** Required (via middleware)
**Rate Limit:** AI (50/15min)

**Response:** `204 No Content`

### Send Message (with AI Response)

```
POST /api/conversations/:id/messages
```

**Authentication:** Required (via middleware)
**Rate Limit:** AI (50/15min)

**Request Body:**
```json
{
  "content": "What are the best chord progressions for pop music?"
}
```

**Response:** AI-generated response message

---

## Image Generation API

### Generate Image

```
POST /api/generate-image
```

**Authentication:** Required (via middleware: `app.use("/api/generate-image", isAuthenticated, aiRateLimiter.middleware)`)
**Rate Limit:** AI (50/15min)

**Request Body:**
```json
{
  "prompt": "Album cover art, synthwave style sunset",
  "style": "digital-art"
}
```

**Response:**
```json
{
  "imageUrl": "https://..."
}
```

---

## Endpoint Summary

### Public Endpoints (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/songs/public` | List public songs |
| GET | `/api/generate/random-prompt` | Random song prompt |
| GET | `/api/generate/random-lyrics` | Random lyrics sample |
| GET | `/api/login` | Initiate login |
| GET | `/api/callback` | OIDC callback |
| GET | `/api/logout` | Logout |

### Authenticated Endpoints

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| GET | `/api/auth/user` | - | Current user |
| GET | `/api/songs` | - | User's songs |
| GET | `/api/songs/:id` | - | Get song |
| POST | `/api/songs` | Write | Create song |
| DELETE | `/api/songs/:id` | Write | Delete song |
| POST | `/api/songs/:id/like` | Write | Like/unlike |
| POST | `/api/songs/:id/play` | Write | Increment play |
| GET | `/api/songs/liked-ids` | - | Liked song IDs |
| GET | `/api/songs/liked` | - | Liked songs |
| GET | `/api/playlists` | - | User's playlists |
| GET | `/api/playlists/:id` | - | Get playlist |
| POST | `/api/playlists` | Write | Create playlist |
| DELETE | `/api/playlists/:id` | Write | Delete playlist |
| POST | `/api/playlists/:id/songs` | Write | Add song to playlist |
| DELETE | `/api/playlists/:id/songs/:songId` | Write | Remove song |
| POST | `/api/generate/ai-suggest` | - | AI suggestion |
| POST | `/api/generate/lyrics` | - | Generate lyrics (OpenAI) |
| POST | `/api/generate/song-concept` | - | Song concept (Gemini) |
| POST | `/api/generate/lyrics-gemini` | - | Lyrics (Gemini) |
| POST | `/api/generate/analyze-lyrics` | - | Analyze lyrics |
| POST | `/api/generate/production-tips` | - | Production tips |
| POST | `/api/generate/cover-art-prompt` | - | Cover art prompt |
| POST | `/api/music-theory/chord-progression` | - | Chord progression |
| POST | `/api/music-theory/reharmonize` | - | Reharmonize |
| POST | `/api/music-theory/lookup-scales` | - | Scale lookup |
| POST | `/api/audio/generate` | - | MusicGen (sync) |
| POST | `/api/audio/generate/start` | - | MusicGen (async) |
| GET | `/api/audio/status/:predictionId` | - | Check MusicGen status |
| POST | `/api/audio/sound-effect` | - | Sound effect |
| POST | `/api/audio/generate-with-reference` | - | Generate with reference audio |
| POST | `/api/stable-audio/sample` | - | Stable Audio sample |
| POST | `/api/stable-audio/full` | - | Stable Audio full |
| POST | `/api/stable-audio/start` | - | Stable Audio (async) |
| GET | `/api/stable-audio/status/:requestId` | - | Check Stable Audio status |
| POST | `/api/stable-audio/transform` | - | Transform audio |
| GET | `/api/bark/voices` | - | Available voices |
| POST | `/api/bark/generate` | - | Bark vocals (sync) |
| POST | `/api/bark/generate/start` | - | Bark vocals (async) |
| GET | `/api/bark/status` | - | Bark config status |
| GET | `/api/suno/status` | - | Suno config status |
| POST | `/api/suno/generate` | - | Suno generate (sync) |
| POST | `/api/suno/generate/start` | - | Suno generate (async) |
| GET | `/api/suno/status/:taskId` | - | Check Suno status |
| POST | `/api/suno/lyrics` | - | Suno lyrics |
| GET | `/api/suno/user` | - | Suno user/credits |
| GET | `/api/ace-step/config` | - | ACE-Step config |
| POST | `/api/ace-step/generate` | - | ACE-Step generate |
| GET | `/api/ace-step/status/:predictionId` | - | Check ACE-Step status |
| GET | `/api/conversations` | AI | List conversations |
| GET | `/api/conversations/:id` | AI | Get conversation |
| POST | `/api/conversations` | AI | Create conversation |
| DELETE | `/api/conversations/:id` | AI | Delete conversation |
| POST | `/api/conversations/:id/messages` | AI | Send message (AI response) |
| POST | `/api/generate-image` | AI | Generate image |

---

## Error Responses

All endpoints may return the following error formats:

### Rate Limited (429)
```json
{
  "message": "Rate limit exceeded. Try again later."
}
```

### Validation Error (400)
```json
{
  "message": "Field is required",
  "field": "title"
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthorized"
}
```

### Not Found (404)
```json
{
  "message": "Song not found"
}
```

### Service Unavailable (503)
```json
{
  "message": "Audio generation is not configured"
}
```

### Internal Server Error (500)
```json
{
  "message": "Failed to generate lyrics"
}
```
