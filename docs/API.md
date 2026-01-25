# HarmoniQ API Documentation

This document provides comprehensive documentation for all API endpoints in the HarmoniQ platform.

## Base URL

All API endpoints are relative to the application root URL.

## Authentication

Most endpoints require authentication. HarmoniQ uses Replit Auth via OpenID Connect. Authentication is handled through session cookies.

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/user` | Get current authenticated user |
| GET | `/api/login` | Initiate login flow |
| POST | `/api/logout` | Log out current user |

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

**Response:** `204 No Content`

### Like/Unlike Song

```
POST /api/songs/:id/like
```

**Authentication:** Required

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

**Authentication:** Not required

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

**Response:** `204 No Content`

### Add Song to Playlist

```
POST /api/playlists/:id/songs
```

**Authentication:** Required

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

**Response:** `204 No Content`

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

## Audio Generation API (Replicate)

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

## Error Responses

All endpoints may return the following error formats:

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
