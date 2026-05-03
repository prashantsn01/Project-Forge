const express = require('express');
const cors = require('cors');
const archiver = require('archiver');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '4mb' }));

// ─────────────────────────────────────────────────────────────
// POST /api/generate  –  calls OpenAI and returns files
// ─────────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { description, stack, features, level, commentMode } = req.body;

  if (!description || !stack) {
    return res.status(400).json({ error: 'description and stack are required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  const featList = (features || []).join(', ') || 'auth, REST API, database';
  const levelMap = { '1': '1st year (clean, well-commented fundamentals)', '2': '2nd year (design patterns)', '3': '3rd year (industry architecture)', '4': 'Final year (production-grade)' };
  const commentMap = { learning: 'every line explained with why, not just what', standard: 'key architectural decisions only', clean: 'professional minimal comments' };

  const systemPrompt = `You are ProjectForge, an expert fullstack code generator for CS students. 
You generate COMPLETE, RUNNABLE code — zero placeholders, zero TODOs, zero stubs.
Every function must be fully implemented. Every file must be complete and correct.
You respond ONLY with a valid JSON object (no markdown fences, no extra text).`;

  const userPrompt = `Generate a complete fullstack project for this student request:

PROJECT: ${description}
TECH STACK: ${stack}
FEATURES: ${featList}
ACADEMIC LEVEL: ${levelMap[level] || levelMap['3']}
CODE COMMENTS: ${commentMap[commentMode] || commentMap['standard']}

Return a JSON object with this exact shape:
{
  "projectName": "CamelCaseName",
  "description": "one sentence description",
  "stack": "${stack}",
  "totalLines": <estimated number>,
  "folders": [
    {
      "dir": "backend/",
      "files": [
        {
          "name": "server.js",
          "color": "#fbbf24",
          "code": "<full file contents as a string — no truncation>"
        }
      ]
    }
  ],
  "insights": [
    { "t": "Why concept X was chosen", "b": "explanation with <code>inline code</code>" }
  ],
  "setupSteps": ["npm install", "cp .env.example .env", "npm run dev"]
}

RULES:
- Every file must be COMPLETE. No "// ... rest of implementation" shortcuts.
- Match the stack exactly. For "React + Node.js": backend = Express + MongoDB + JWT, frontend = React + Vite + Axios.
- For "Java Spring Boot": use Spring Security, Spring Data JPA, PostgreSQL, Lombok.
- For "HTML/CSS/JS": pure vanilla, no frameworks, localStorage or REST API.
- Name models/routes/components after the actual project domain.
- Color guide: .js/.ts = #fbbf24, .jsx/.tsx = #61dafb, .java = #86efac, .css = #3b82f6, .html = #f97316, .json = #34d399, .env = #f87171, .md = #a78bfa, .xml = #93c5fd
- Insights should teach real concepts, reference specific code in the generated files.
- Generate at least 6 files for HTML stack, 10 for React stack, 9 for Spring stack.`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'OpenAI API error' });
    }

    const data = await openaiRes.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let project;
    try {
      project = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Model returned invalid JSON', raw: rawText.slice(0, 500) });
    }

    res.json({ ok: true, project });

  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/download  –  stream a ZIP of all generated files
// ─────────────────────────────────────────────────────────────
app.post('/api/download', (req, res) => {
  const { project } = req.body;
  if (!project || !project.folders) {
    return res.status(400).json({ error: 'No project data provided' });
  }

  const safeName = (project.projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const folder of project.folders) {
    for (const file of folder.files) {
      const filePath = path.join(safeName, folder.dir || '', file.name);
      archive.append(file.code || '', { name: filePath });
    }
  }

  archive.finalize();
});

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', aiPowered: true });
});

app.listen(PORT, () => {
  console.log(`\n🔥 ProjectForge backend running on http://localhost:${PORT}`);
  console.log(`   AI-powered project generation via OpenAI API`);
  console.log(`   Set OPENAI_API_KEY in .env to enable generation\n`);
});
