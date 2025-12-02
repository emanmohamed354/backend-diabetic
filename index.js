import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import { DbConnection } from './DataBase/dbConnection.js';
import userRouter from './src/modules/user/user.router.js';
import patientRouter from './src/modules/patient/patient.router.js';
import analysisRouter from './src/modules/analysis/analysis.router.js';

const app = express();
const port = process.env.PORT || 3000;

DbConnection();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`📨 ${req.method} | ${req.url}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running ✅' });
});

// Routes
app.use('/users', userRouter);
app.use('/patients', patientRouter);
app.use('/analysis', analysisRouter);

app.get('/', (req, res) => {
    res.send('Welcome to Pharmacy API');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

export default app;