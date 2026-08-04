const { createServer } = require('../dist/src/main');

let server;

module.exports = async (req, res) => {
  try {
    if (!server) {
      server = await createServer();
    }
    server(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).json({ error: 'Serverless execution failed', details: String(err) });
  }
};
