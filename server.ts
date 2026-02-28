import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

const db = new Database('documents.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS documents_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    content TEXT,
    content_length INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: 'fake-admin-token' });
    } else {
      res.status(401).json({ success: false, message: 'Password incorreta' });
    }
  });

  app.post('/api/admin/upload', upload.single('file'), async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) return res.status(400).send('No file uploaded.');

    let text = '';
    const filename = file.originalname;
    const buffer = file.buffer;

    console.log(`[Upload] Processing file: ${filename} (${buffer.length} bytes)`);

    try {
      if (filename.endsWith('.pdf')) {
        // Handle different export styles of pdf-parse more robustly
        let pdfParser;
        try {
          // Try direct path which is usually the function in pdf-parse
          pdfParser = require('pdf-parse/lib/pdf-parse.js');
        } catch (e) {
          console.log('[Upload] Failed to require pdf-parse/lib/pdf-parse.js, trying main');
          const pdfLib = require('pdf-parse');
          pdfParser = typeof pdfLib === 'function' ? pdfLib : pdfLib.default;
        }

        if (typeof pdfParser !== 'function') {
          console.error('[Upload] pdf-parse structure:', JSON.stringify(pdf));
          throw new Error('Não foi possível inicializar o processador de PDF (Função não encontrada).');
        }
        
        const data = await pdfParser(buffer);
        text = data.text;
      } else if (filename.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (filename.endsWith('.txt')) {
        text = buffer.toString('utf-8');
      } else {
        return res.status(400).send('Formato de ficheiro não suportado.');
      }

      console.log(`[Upload] Extracted ${text.length} characters from ${filename}`);
      
      if (text.trim().length === 0) {
        console.warn(`[Upload] Warning: No text extracted from ${filename}. It might be a scan or empty.`);
      }

      db.prepare('INSERT INTO documents_v3 (filename, content, content_length) VALUES (?, ?, ?)').run(filename, text, text.length);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Upload] Error extracting text:', error);
      res.status(500).send(`Erro ao processar o ficheiro: ${error.message}`);
    }
  });

  app.post('/api/admin/upload-text', (req, res) => {
    const { filename, text } = req.body;
    if (!filename || !text) return res.status(400).send('Missing filename or text.');

    try {
      db.prepare('INSERT INTO documents_v3 (filename, content, content_length) VALUES (?, ?, ?)').run(filename, text, text.length);
      res.json({ success: true });
    } catch (error) {
      console.error('[UploadText] Error:', error);
      res.status(500).send('Erro ao guardar o texto.');
    }
  });

  app.get('/api/admin/documents', (req, res) => {
    const docs = db.prepare('SELECT id, filename, content_length, created_at FROM documents_v3').all();
    res.json(docs);
  });

  app.delete('/api/admin/documents/:id', (req, res) => {
    db.prepare('DELETE FROM documents_v3 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/chat/context', (req, res) => {
    try {
      const docs = db.prepare('SELECT content FROM documents_v3').all() as { content: string }[];
      const context = docs.map(d => d.content).join('\n\n');
      res.json({ context });
    } catch (error) {
      console.error('[Context] Error:', error);
      res.status(500).json({ error: 'Erro ao obter contexto.' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
