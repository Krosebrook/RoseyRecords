
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const mockUser = {
  id: 1,
  username: 'palette_tester',
  displayName: 'Palette Tester',
  photos: [{ value: 'https://placehold.co/400' }],
  emails: [{ value: 'tester@example.com' }]
};

app.get('/api/auth/user', (req, res) => res.json(mockUser));
app.get('/api/bark/status', (req, res) => res.json({ configured: true }));
app.get('/api/bark/voices', (req, res) => res.json({ voices: [{ id: 'v2/en_speaker_6', name: 'Speaker 6', gender: 'male' }] }));
app.get('/api/suno/status', (req, res) => res.json({ configured: true, styles: ['Pop'], models: [{ id: 'chirp-bluejay', name: 'Chirp Bluejay', description: 'desc' }] }));
app.get('/api/suno/user', (req, res) => res.json({ credits: 100 }));
app.get('/api/ace-step/config', (req, res) => res.json({ configured: true, maxDuration: 240, durationOptions: [{value: 60, label: '1 min'}] }));


const publicPath = path.join(__dirname, '../dist/public');
app.use(express.static(publicPath));

app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
