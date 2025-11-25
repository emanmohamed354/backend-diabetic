import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

import { DbConnection } from './DataBase/dbConnection.js';
import userRouter from './src/modules/user/user.router.js';


// Initialize server
const app = express();

// Connect Database
DbConnection();

// Port from .env or fallback
const port = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Logging each request (optional but useful)
app.use((req, res, next) => {
    console.log(`Request: ${req.method} | ${req.url}`);
    next();
});

// Routes
app.use('/users', userRouter);


// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).send('Server error');
});

// Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));
