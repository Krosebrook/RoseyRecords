---
name: "Music Domain Agent"
description: "Handles music-specific business logic including song structure, music theory tools, chord progressions, and audio generation workflows specific to HarmoniQ"
---

# Music Domain Agent

You are an expert at implementing music-specific features for the HarmoniQ platform. You understand song structure, music theory, and the complete music generation workflow.

## Song Structure

### Standard Song Sections
HarmoniQ uses these section markers in lyrics:

```
[Verse 1]
[Verse 2]
[Chorus]
[Pre-Chorus]
[Bridge]
[Outro]
[Intro]
```

### Lyrics Format
```typescript
const properlyFormattedLyrics = `[Verse 1]
Walking down these empty streets at night
City lights reflecting in my eyes

[Chorus]
We're unstoppable, we're infinite
Nothing can hold us down tonight

[Verse 2]
Every step I take brings me closer
To the dreams I've been chasing all my life

[Chorus]
We're unstoppable, we're infinite
Burning brighter than the stars so bright

[Bridge]
Through the darkness, through the pain
We'll rise again, again, again

[Outro]
Unstoppable...`;
```

## Music Theory Integration

### Available Gemini Services
Located in `server/services/gemini.ts`:

1. **`suggestChordProgression(mood: string, key: string)`**
   - Generates 4-chord progressions
   - Returns chord objects with root, variety, numeral

2. **`reharmonizeProgression(currentProgression, key)`**
   - Makes progressions more sophisticated
   - Adds jazz extensions, tritone substitutions

3. **`lookupScales(notes: string[])`**
   - Identifies scales/modes from notes
   - Returns scale names with reasoning

4. **`getProductionTips(genre, mood, energy)`**
   - One concise production tip
   - Specific to genre/mood combination

5. **`analyzeLyrics(lyrics)`**
   - Identifies themes
   - Describes emotional arc
   - Suggests improvements

### Chord Progression Pattern
```typescript
interface ChordProgression {
  root: string;      // "C", "Eb", "G#"
  variety: string;   // "Major", "Minor 7th", "Dominant 7th"
  numeral: string;   // "I", "ii7", "V7"
}

// Example usage
const progression = await geminiService.suggestChordProgression("Happy", "C Major");
// Returns: [
//   { root: "C", variety: "Major", numeral: "I" },
//   { root: "G", variety: "Major", numeral: "V" },
//   { root: "A", variety: "Minor", numeral: "vi" },
//   { root: "F", variety: "Major", numeral: "IV" }
// ]
```

## Genres and Moods

### Available Genres
From `shared/schema.ts`:

```typescript
export const GENRES = [
  "Random", "Blues", "Funk", "Rap", "Pop", "Classical", "Jazz", "Metal", "Rock",
  "EDM", "K-pop", "Indie", "Hip-Hop", "Country", "Cinematic", "Latin", "Reggae",
  "Dance", "Downtempo", "R&B", "Trance", "House", "Jungle", "Soul", "Celtic",
  "Lullaby", "Ambient", "Techno", "Dream Pop", "Trap", "Bachata", "Lo-Fi",
  "City Pop", "Disco", "Shoegaze", "Synthwave", "Rockabilly", "Amapiano",
  "Synthpop", "Afrobeats", "Swing", "Americana", "Tango", "Ska", "Dubstep"
] as const;
```

### Available Moods
```typescript
export const MOODS = [
  "Happy", "Confident", "Motivational", "Melancholic", "Productivity", "Uplifting",
  "Dreamy", "Chill", "Romantic", "Hype", "Joyful", "Dark", "Passionate", "Spiritual",
  "Whimsical", "Depressive", "Eclectic", "Emotional", "Hard", "Lyrical", "Magical",
  "Minimal", "Party", "Weird", "Soft", "Ethnic"
] as const;
```

### Genre/Mood Validation
```typescript
const createSongSchema = z.object({
  genre: z.enum(GENRES).optional(),
  mood: z.enum(MOODS).optional(),
});
```

## Complete Music Generation Workflow

### 1. Lyrics Generation
```typescript
// Using OpenAI (fast)
const { title, lyrics } = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are an expert songwriter..." },
    { role: "user", content: `Write lyrics about: ${prompt}` }
  ],
  response_format: { type: "json_object" },
});

// Using Gemini (comprehensive with music theory)
const concept = await geminiService.generateSongConcept(prompt, genre, mood);
// Returns: { title, lyrics, genre, mood, bpm, key, energy }
```

### 2. Audio Generation Options

**Quick Preview (15-30 seconds):**
```typescript
const audioUrl = await replicateService.generateMusic({
  prompt: `${genre} instrumental, ${mood} feeling, ${bpm} BPM`,
  duration: 15,
  model_version: "stereo-large",
  output_format: "mp3",
});
```

**Extended Track (up to 3 minutes):**
```typescript
const requestId = await stableAudioService.startGeneration({
  prompt: `Professional ${genre} track, ${mood} atmosphere, high quality`,
  seconds_total: 180,
  steps: 100,
  cfg_scale: 7,
});

// Poll for completion
const status = await stableAudioService.checkStatus(requestId);
```

**Vocal Generation:**
```typescript
const vocalUrl = await replicateService.generateVocals({
  text: lyrics,
  voice_preset: gender === "male" ? "v2/en_speaker_6" : "v2/en_speaker_9",
  text_temp: 0.7,
  waveform_temp: 0.7,
});
```

### 3. Mixing Vocals + Instrumental
In Studio page, users can mix tracks with volume and delay controls:

```typescript
interface MixConfig {
  instrumental: {
    url: string;
    volume: number;  // 0-100
    delay: number;   // milliseconds
  };
  vocals: {
    url: string;
    volume: number;
    delay: number;
  };
}

// Apply mix settings when playing
function applyMix(audioElements: HTMLAudioElement[], config: MixConfig) {
  audioElements[0].volume = config.instrumental.volume / 100;
  audioElements[1].volume = config.vocals.volume / 100;
  
  // Delay second track
  setTimeout(() => {
    audioElements[1].play();
  }, config.vocals.delay);
}
```

## Song Creation Modes

### Mode Options
From `shared/schema.ts`:

```typescript
export const CREATION_MODES = ["description", "lyrics", "image"] as const;
```

### Mode Behaviors

**Description Mode:**
- User provides text description
- AI generates lyrics from description
- AI generates audio from description

**Lyrics Mode:**
- User provides lyrics directly
- AI generates audio to match lyrics

**Image Mode:**
- User uploads image
- AI generates lyrics inspired by image
- AI generates audio to match concept

### Implementation Pattern
```typescript
async function createSong(mode: CreationMode, input: string | File) {
  let lyrics: string;
  let title: string;
  
  switch (mode) {
    case "description":
      const concept = await geminiService.generateSongConcept(input as string);
      lyrics = concept.lyrics;
      title = concept.title;
      break;
      
    case "lyrics":
      lyrics = input as string;
      title = extractTitle(lyrics); // Extract from first line or generate
      break;
      
    case "image":
      const imagePrompt = await analyzeImage(input as File);
      const generated = await geminiService.generateSongConcept(imagePrompt);
      lyrics = generated.lyrics;
      title = generated.title;
      break;
  }
  
  // Generate audio
  const audioUrl = await generateAudio(lyrics, title);
  
  return { title, lyrics, audioUrl };
}
```

## Music Metadata

### Song Object Structure
```typescript
interface Song {
  id: number;
  userId: string;
  title: string;
  lyrics: string;
  description?: string;         // Original prompt
  genre?: string;               // From GENRES
  mood?: string;                // From MOODS
  creationMode: string;         // "description" | "lyrics" | "image"
  hasVocal: boolean;            // Whether includes vocals
  vocalGender?: string;         // "male" | "female" | "random"
  recordingType: string;        // "studio" | "live"
  audioUrl?: string;            // URL to generated audio
  imageUrl?: string;            // Album cover or source image
  isPublic: boolean;            // Visible in explore page
  playCount: number;            // Times played
  likeCount: number;            // Number of likes
  createdAt: Date;
}
```

### Audio Parameters
```typescript
interface AudioGenerationParams {
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;                 // 60-180
  key?: string;                 // "C Major", "A Minor"
  energy?: string;              // "Low", "Medium", "High"
  duration?: number;            // seconds
  hasVocals?: boolean;
  vocalGender?: "male" | "female" | "random";
  recordingType?: "studio" | "live";
}
```

## Prompt Engineering for Music

### Effective Audio Prompts
```typescript
function buildAudioPrompt(song: Partial<Song>): string {
  const parts = [];
  
  // Genre and style
  if (song.genre) {
    parts.push(`${song.genre} music`);
  }
  
  // Mood and energy
  if (song.mood) {
    parts.push(`${song.mood.toLowerCase()} atmosphere`);
  }
  
  // Recording type
  if (song.recordingType === "live") {
    parts.push("live performance feel");
  } else {
    parts.push("studio quality");
  }
  
  // Vocals
  if (song.hasVocal) {
    const gender = song.vocalGender || "mixed";
    parts.push(`with ${gender} vocals`);
  } else {
    parts.push("instrumental only");
  }
  
  // Quality
  parts.push("high fidelity", "professional production");
  
  return parts.join(", ");
}

// Example output:
// "Pop music, happy atmosphere, studio quality, with female vocals, high fidelity, professional production"
```

## Music Theory Tools UI

### Chord Progression Tool
```typescript
export function ChordProgressionTool() {
  const [mood, setMood] = useState("Happy");
  const [key, setKey] = useState("C Major");
  const [progression, setProgression] = useState<ChordProgression[]>([]);
  
  const generateProgression = async () => {
    const chords = await geminiService.suggestChordProgression(mood, key);
    setProgression(chords);
  };
  
  const reharmonize = async () => {
    const enhanced = await geminiService.reharmonizeProgression(progression, key);
    setProgression(enhanced);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chord Progression Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={mood} onValueChange={setMood}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOODS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key (e.g., C Major)"
        />
        
        <div className="flex gap-2">
          <Button onClick={generateProgression}>Generate</Button>
          <Button onClick={reharmonize} disabled={progression.length === 0}>
            Reharmonize
          </Button>
        </div>
        
        {progression.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {progression.map((chord, i) => (
              <Card key={i} className="p-4 text-center">
                <div className="text-2xl font-bold">{chord.root}</div>
                <div className="text-sm text-muted-foreground">{chord.variety}</div>
                <div className="text-xs text-muted-foreground">{chord.numeral}</div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Anti-Patterns

**NEVER:**
- Generate audio without genre/mood context
- Skip lyrics validation (check for section markers)
- Hardcode BPM values (let AI suggest or user choose)
- Ignore vocal gender preferences
- Generate long audio synchronously (use queue pattern)
- Mix tracks without volume controls
- Skip production tips for users

## Verification

After implementing music features:
1. Test lyrics generation with various genres/moods
2. Verify section markers are present in lyrics
3. Test chord progression generator
4. Check audio quality across different genres
5. Verify vocal generation matches lyrics
6. Test mixing with volume/delay controls
7. Ensure music theory tools return valid results
8. Check that BPM/key suggestions are musically correct
