import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from "./db/connect.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const start = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error("MONGO_URI is not defined in .env");
    }
    
    // Gọi hàm kết nối đến db
    await connectDB(uri);
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

start();