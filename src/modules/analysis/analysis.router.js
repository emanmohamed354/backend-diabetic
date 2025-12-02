import express from 'express';
import {
    saveAnalysis,
    getPatientAnalysisHistory,
    getAnalysisReport,
    updateAnalysisNotes,
    getDoctorAnalyses,
    exportAnalysisReport
} from './analysis.controller.js';

const analysisRouter = express.Router();

// Analysis routes
analysisRouter.post('/save', saveAnalysis);
analysisRouter.get('/patient/:patientId/history', getPatientAnalysisHistory);
analysisRouter.get('/:analysisId', getAnalysisReport);
analysisRouter.put('/:analysisId/notes', updateAnalysisNotes);
analysisRouter.get('/doctor/all', getDoctorAnalyses);
analysisRouter.get('/:analysisId/export', exportAnalysisReport);

export default analysisRouter;