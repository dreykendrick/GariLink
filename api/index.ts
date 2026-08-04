import 'reflect-metadata';
import { createServer } from '../backend/src/main';

let server: any;

export default async function handler(req: any, res: any) {
  try {
    if (!server) {
      server = await createServer();
    }
    return server(req, res);
  } catch (err: any) {
    console.error('Vercel serverless error:', err);
    res.status(500).json({
      error: 'Serverless execution failed',
      details: err?.message || String(err),
      stack: err?.stack || null
    });
  }
}
