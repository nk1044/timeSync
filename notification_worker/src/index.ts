import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { startNotificationWorker } from './notification/worker';
// dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
}));


app.get('/', (req, res) => {
  res.status(200).json({ message: 'Notification Worker is running' });
});

app.get('/check-notifications', async (req: Request, res: Response) => {
  try {
    const result = await startNotificationWorker(req, res);
    if (!res.headersSent) {
      res.status(200).json({ message: 'Notifications checked', result });
    }
  } catch (error) {
    console.error('❌ Error in worker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Notification Worker is running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
