// Simple server to handle scene save/load
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from models directory
app.use('/models', express.static(path.join(__dirname, 'models')));

// Save scene endpoint
app.post('/api/save-scene', (req, res) => {
  try {
    const { data } = req.body;
    const filePath = path.join(__dirname, 'saved-3d-env.json');
    
    fs.writeFileSync(filePath, data, 'utf8');
    
    console.log('Scene saved to:', filePath);
    res.json({ success: true, message: 'Scene saved successfully' });
  } catch (error) {
    console.error('Error saving scene:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load scene endpoint
app.get('/api/load-scene', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'saved-3d-env.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'No saved scene found' });
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    
    console.log('Scene loaded from:', filePath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error loading scene:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List models endpoint
app.get('/api/list-models', (req, res) => {
  try {
    const modelsDir = path.join(__dirname, 'models');
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir);
    }
    
    // Read all files in models directory
    const files = fs.readdirSync(modelsDir);
    
    // Filter for GLTF/GLB files
    const models = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.gltf' || ext === '.glb';
    });
    
    console.log('Models found:', models);
    res.json({ success: true, models });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Scene save/load server running on http://localhost:${PORT}`);
});
