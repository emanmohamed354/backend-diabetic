import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import FormData from 'form-data';
import multer from 'multer';
import { DbConnection } from './DataBase/dbConnection.js';
import analysisRouter from './src/modules/analysis/analysis.router.js';
import patientRouter from './src/modules/patient/patient.router.js';
import userRouter from './src/modules/user/user.router.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

DbConnection();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`📨 ${req.method} | ${req.url}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running ✅' });
});

// Proxy configuration for ML prediction service
const mlPredictUrl = process.env.ML_PREDICT_URL || 'http://54.37.106.163:8000/predict';
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ msg: 'File too large. Maximum size is 10MB' });
        }
        return res.status(400).json({ msg: 'File upload error', error: err.message });
    }
    next(err);
};

app.post('/predict', upload.single('file'), handleMulterError, async (req, res, next) => {
    try {
        console.log('📤 Received /predict request');
        
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded. Please select an image file.' });
        }

        console.log(`📎 File: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);
        console.log(`🌐 Forwarding to external ML server: ${mlPredictUrl}`);

        // Create FormData to forward to external ML server
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype || 'application/octet-stream'
        });

        // Forward request to external ML prediction server
        const response = await axios.post(mlPredictUrl, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 60000, // 60 seconds timeout for ML processing
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log('✅ ML Server Response:', response.status);
        console.log('📊 Prediction result:', JSON.stringify(response.data, null, 2));
        
        return res.status(response.status).json(response.data);
        
    } catch (error) {
        console.error('❌ Error proxying /predict to external server:', error.message);
        
        if (error.response) {
            console.error('External server error:', error.response.status, error.response.data);
            return res.status(error.response.status).json({
                msg: 'External ML server error',
                ...error.response.data
            });
        }
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                msg: 'External ML server is not reachable',
                error: `Cannot connect to ${mlPredictUrl}`,
                details: error.message
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                msg: 'Request timeout - ML server took too long to respond',
                error: error.message
            });
        }

        return res.status(500).json({
            msg: 'Failed to contact external analysis service',
            error: error.message,
            mlServerUrl: mlPredictUrl
        });
    }
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