import { analysisModel } from '../../../DataBase/models/analysis.model.js';
import { patientModel } from '../../../DataBase/models/patient.model.js';

// Save analysis result
export const saveAnalysis = async (req, res) => {
    try {
        const { 
            patientId, 
            filename,
            rawScore, 
            predictedClass, 
            confidence,
            label,
            severity,
            description,
            color,
            icon,
            recommendations,
            followUp,
            imagePath,
            clinicalNotes
        } = req.body;

        const doctorId = req.headers.userid;

        console.log('saveAnalysis - Doctor ID:', doctorId);
        console.log('saveAnalysis - Patient ID:', patientId);

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        if (!patientId || rawScore === undefined || predictedClass === undefined) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        // Verify patient exists and belongs to doctor
        const patient = await patientModel.findOne({ 
            _id: patientId, 
            doctorId 
        });

        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        const reportId = `DR-${Date.now()}`;

        const newAnalysis = await analysisModel.create({
            patientId,
            doctorId,
            filename,
            imagePath,
            rawScore,
            predictedClass,
            confidence,
            label,
            severity,
            description,
            color,
            icon,
            recommendations,
            followUp,
            reportId,
            clinicalNotes,
            status: 'pending'
        });

        // Update patient's latest analysis and count
        await patientModel.findByIdAndUpdate(
            patientId,
            {
                latestAnalysis: newAnalysis._id,
                totalAnalyses: patient.totalAnalyses + 1
            },
            { new: true }
        );

        res.status(201).json({
            msg: 'Analysis saved successfully',
            analysis: newAnalysis
        });
    } catch (error) {
        console.error('saveAnalysis error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get patient's analysis history
export const getPatientAnalysisHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.headers.userid;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const patient = await patientModel.findOne({ 
            _id: patientId, 
            doctorId 
        });

        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        const analyses = await analysisModel
            .find({ patientId })
            .populate('reviewedBy', 'userName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            msg: 'Analysis history retrieved',
            count: analyses.length,
            patient: {
                name: patient.name,
                age: patient.age,
                diabetesType: patient.diabetesType
            },
            analyses
        });
    } catch (error) {
        console.error('getPatientAnalysisHistory error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get specific analysis report
export const getAnalysisReport = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const doctorId = req.headers.userid;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const analysis = await analysisModel
            .findById(analysisId)
            .populate('patientId', 'name age gender diabetesType')
            .populate('doctorId', 'userName lastName')
            .populate('reviewedBy', 'userName lastName');

        if (!analysis) {
            return res.status(404).json({ msg: 'Analysis not found' });
        }

        // Verify doctor has access
        if (analysis.doctorId._id.toString() !== doctorId) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        res.status(200).json({
            msg: 'Analysis report retrieved',
            analysis
        });
    } catch (error) {
        console.error('getAnalysisReport error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Update analysis with clinical notes
export const updateAnalysisNotes = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const { clinicalNotes, treatmentPlan } = req.body;
        const doctorId = req.headers.userid;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const analysis = await analysisModel.findById(analysisId);

        if (!analysis) {
            return res.status(404).json({ msg: 'Analysis not found' });
        }

        if (analysis.doctorId.toString() !== doctorId) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const updated = await analysisModel.findByIdAndUpdate(
            analysisId,
            {
                clinicalNotes,
                treatmentPlan,
                status: 'reviewed',
                reviewedBy: doctorId,
                reviewDate: new Date()
            },
            { new: true }
        );

        res.status(200).json({
            msg: 'Analysis updated successfully',
            analysis: updated
        });
    } catch (error) {
        console.error('updateAnalysisNotes error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get all analyses for doctor
export const getDoctorAnalyses = async (req, res) => {
    try {
        const doctorId = req.headers.userid;
        const { status, limit = 20, page = 1 } = req.query;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        let query = { doctorId };
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const analyses = await analysisModel
            .find(query)
            .populate('patientId', 'name age diabetesType')
            .populate('reviewedBy', 'userName lastName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await analysisModel.countDocuments(query);

        res.status(200).json({
            msg: 'Analyses retrieved',
            count: analyses.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            analyses
        });
    } catch (error) {
        console.error('getDoctorAnalyses error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Export analysis as JSON/PDF
export const exportAnalysisReport = async (req, res) => {
    try {
        const { analysisId } = req.params;
        const doctorId = req.headers.userid;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const analysis = await analysisModel
            .findById(analysisId)
            .populate('patientId')
            .populate('doctorId', 'userName lastName');

        if (!analysis) {
            return res.status(404).json({ msg: 'Analysis not found' });
        }

        if (analysis.doctorId._id.toString() !== doctorId) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const reportData = {
            reportTitle: 'Diabetic Retinopathy Analysis Report',
            reportId: analysis.reportId,
            exportDate: new Date().toISOString(),
            
            patientInfo: {
                name: analysis.patientId.name,
                age: analysis.patientId.age,
                gender: analysis.patientId.gender,
                diabetesType: analysis.patientId.diabetesType
            },
            
            doctorInfo: {
                name: `${analysis.doctorId.userName} ${analysis.doctorId.lastName}`,
                id: analysis.doctorId._id
            },
            
            analysisResults: {
                filename: analysis.filename,
                rawScore: analysis.rawScore,
                predictedClass: analysis.predictedClass,
                confidence: analysis.confidence,
                label: analysis.label,
                severity: analysis.severity,
                description: analysis.description,
                recommendations: analysis.recommendations,
                followUp: analysis.followUp
            },
            
            clinicalInfo: {
                clinicalNotes: analysis.clinicalNotes,
                treatmentPlan: analysis.treatmentPlan,
                status: analysis.status,
                reviewDate: analysis.reviewDate
            },
            
            timestamp: analysis.timestamp,
            disclaimer: 'This is an AI-assisted analysis. Clinical decision should be made by qualified ophthalmologists.'
        };

        res.status(200).json({
            msg: 'Report exported',
            report: reportData
        });
    } catch (error) {
        console.error('exportAnalysisReport error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};