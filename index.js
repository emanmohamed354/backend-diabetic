import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import { DbConnection } from './DataBase/dbConnection.js';
import userRouter from './src/modules/user/user.router.js';

const app = express();
const port = process.env.PORT || 3000;

DbConnection();

// Middlewares (BEFORE routes)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`Request: ${req.method} | ${req.url}`);
    next();
});

// Routes
app.use('/users', userRouter);

app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// ✅ Global Error Handler (AFTER all routes)
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(port, () => console.log(`Server running on port ${port}`));