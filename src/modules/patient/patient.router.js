import express from 'express';
import {
    getDoctorPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientStats
} from './patient.controller.js';

const patientRouter = express.Router();

// Patient routes
patientRouter.get('/all', getDoctorPatients);
patientRouter.get('/:patientId', getPatientById);
patientRouter.get('/:patientId/stats', getPatientStats);
patientRouter.post('/create', createPatient);
patientRouter.put('/:patientId/update', updatePatient);
patientRouter.delete('/:patientId/delete', deletePatient);

export default patientRouter;