import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface SongConcept {
  title: string;
  lyrics: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  energy: string;
}

export interface ChordProgression {
  root: string;
  variety: string;
  numeral: string;
}

export async function generateSongConcept(prompt: string, genre?: string, mood?: string): Promise<SongConcept> {
  const ai = getAI();
  const genreHint = genre ? `Genre should be ${genre}.` : "";
  const moodHint = mood ? `Mood should be ${mood}.` : "";
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an expert music producer and songwriter. Create a detailed song concept based on: "${prompt}". ${genreHint} ${moodHint}
    
    Provide complete, professional song lyrics with proper structure including [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] sections.
    Make the lyrics emotionally resonant, poetic, and suitable for the genre.
    
    Return a JSON object with:
    - title: A catchy, memorable song title
    - lyrics: Complete song lyrics with section markers
    - genre: Specific musical style (use the provided genre if given)
    - mood: Emotional atmosphere (use the provided mood if given)  
    - bpm: Suggested tempo as a number (60-180)
    - key: Musical key (e.g., "C Major", "A Minor")
    - energy: Description of the track's intensity`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: { type: Type.STRING },
          genre: { type: Type.STRING },
          mood: { type: Type.STRING },
          bpm: { type: Type.NUMBER },
          key: { type: Type.STRING },
          energy: { type: Type.STRING }
        },
        required: ["title", "lyrics", "genre", "mood", "bpm", "key", "energy"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function generateLyricsOnly(prompt: string, genre?: string, mood?: string): Promise<{ title: string; lyrics: string }> {
  const ai = getAI();
  const genreHint = genre ? `in the ${genre} style` : "";
  const moodHint = mood ? `with a ${mood} feeling` : "";
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an expert songwriter. Write professional song lyrics ${genreHint} ${moodHint} based on this concept: "${prompt}".

    Create complete, emotionally resonant lyrics with proper song structure:
    - [Verse 1] - Set the scene
    - [Chorus] - The hook, memorable and singable
    - [Verse 2] - Develop the story
    - [Chorus] - Repeat with slight variation
    - [Bridge] - Emotional climax or perspective shift
    - [Outro] - Resolution

    Return JSON with "title" and "lyrics".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: { type: Type.STRING }
        },
        required: ["title", "lyrics"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export async function suggestChordProgression(mood: string, key: string): Promise<ChordProgression[]> {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Suggest a 4-chord progression in the key of ${key} that feels "${mood}". 
    Use standard note names (C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B) and common chord types (Major, Minor, Major 7th, Minor 7th, Dominant 7th, m7b5).
    Return JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          progression: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                root: { type: Type.STRING, description: "The root note, e.g., C, Eb" },
                variety: { type: Type.STRING, description: "The chord type, e.g., Minor 7th" },
                numeral: { type: Type.STRING, description: "The Roman numeral analysis, e.g., ii7" }
              },
              required: ["root", "variety", "numeral"]
            }
          }
        },
        required: ["progression"]
      }
    }
  });
  
  const data = JSON.parse(response.text || '{"progression": []}');
  return data.progression;
}

export async function reharmonizeProgression(currentProgression: ChordProgression[], key: string): Promise<ChordProgression[]> {
  const ai = getAI();
  const progStr = currentProgression.map(p => `${p.root} ${p.variety}`).join(', ');
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Re-harmonize the following chord progression in the key of ${key} to make it more sophisticated (use jazz extensions, tritone substitutions, or secondary dominants where appropriate).
    Original: [${progStr}].
    Return exactly 4 chords in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          progression: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                root: { type: Type.STRING },
                variety: { type: Type.STRING },
                numeral: { type: Type.STRING }
              },
              required: ["root", "variety", "numeral"]
            }
          }
        },
        required: ["progression"]
      }
    }
  });
  
  const data = JSON.parse(response.text || '{"progression": []}');
  return data.progression;
}

export async function lookupScales(notes: string[]): Promise<{ scale: string; reasoning: string }[]> {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Identify the most likely musical scales or modes that contain exactly these notes: [${notes.join(', ')}]. 
    Provide up to 3 possible scales with brief reasoning. Return JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scale: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["scale", "reasoning"]
            }
          }
        },
        required: ["results"]
      }
    }
  });
  
  const data = JSON.parse(response.text || '{"results": []}');
  return data.results;
}

export async function getProductionTips(genre: string, mood: string, energy: string): Promise<string> {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a professional music producer. Give ONE concise production tip (max 25 words) for a ${genre} track with ${mood} mood and ${energy} energy.
    Focus on mixing, arrangement, or sound design. Be specific and actionable.`,
    config: {
      systemInstruction: "You are a seasoned studio engineer. Provide one punchy, helpful tip."
    }
  });
  
  return response.text || "Layer your harmonies and add subtle reverb for depth.";
}

export async function analyzeLyrics(lyrics: string): Promise<{
  themes: string[];
  emotionalArc: string;
  suggestions: string[];
}> {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze these song lyrics and provide insights:
    
    ${lyrics}
    
    Return JSON with:
    - themes: Array of 3-5 main themes
    - emotionalArc: Description of the emotional journey
    - suggestions: 2-3 ways to improve the lyrics`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          themes: { type: Type.ARRAY, items: { type: Type.STRING } },
          emotionalArc: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["themes", "emotionalArc", "suggestions"]
      }
    }
  });
  
  return JSON.parse(response.text || '{"themes":[],"emotionalArc":"","suggestions":[]}');
}

export async function generateCoverArtPrompt(title: string, genre: string, mood: string): Promise<string> {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a detailed image generation prompt for album cover art.
    Song: "${title}"
    Genre: ${genre}
    Mood: ${mood}
    
    The prompt should describe an abstract, artistic visualization that captures the essence of the song.
    Include style descriptors like "high fidelity", "neon", "cinematic", etc.
    Return just the prompt text, no JSON.`
  });
  
  return response.text || `Abstract visualization of ${genre} music, ${mood} atmosphere, high fidelity, artistic`;
}
