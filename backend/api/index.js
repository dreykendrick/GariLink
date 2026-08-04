const path = require('path');

let server;

module.exports = async (req, res) => {
  try {
    if (!server) {
      const distPath = path.join(__dirname, '../dist/main');
      const { createServer } = require(distPath);
      server = await createServer();
    }
    return server(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).json({
      error: 'Serverless execution failed',
      details: err?.message || String(err),
      stack: err?.stack || null
    });
  }
};
