import express from 'express';
import cors from 'cors';
import { postsRouter } from './routes/posts.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api', postsRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
