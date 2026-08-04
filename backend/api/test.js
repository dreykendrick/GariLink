// Minimal test - no imports at all, pure JS to check if Vercel can boot
module.exports = async (req, res) => {
  res.status(200).json({
    ok: true,
    url: req.url,
    method: req.method,
    time: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDb: !!process.env.DATABASE_URL,
      hasJwt: !!process.env.JWT_ACCESS_SECRET,
    }
  });
};
