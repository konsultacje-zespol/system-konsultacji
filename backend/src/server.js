import express from 'express';

// Minimal server from S1-DQ-1. S1-BE2-1 replaces it with createApp() from src/app.js.
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API działa na http://localhost:${port}`);
});
