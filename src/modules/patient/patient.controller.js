import { patientModel } from '../../../DataBase/models/patient.model.js';
import { analysisModel } from '../../../DataBase/models/analysis.model.js';

// Get all patients for a doctor
export const getDoctorPatients = async (req, res) => {
    try {
        // ✅ Get doctorId from header or JWT
        const doctorId = req.headers.userid;
        
        console.log('getDoctorPatients - Doctor ID:', doctorId);
        console.log('Headers:', req.headers);
        
        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized - Doctor ID required' });
        }

        const patients = await patientModel
            .find({ doctorId, isActive: true })
            .populate('latestAnalysis')
            .sort({ createdAt: -1 });

        res.status(200).json({
            msg: 'Patients fetched successfully',
            count: patients.length,
            patients
        });
    } catch (error) {
        console.error('getDoctorPatients error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get single patient with all records
export const getPatientById = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.headers.userid;

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const patient = await patientModel.findOne({ 
            _id: patientId, 
            doctorId,
            isActive: true 
        }).populate('latestAnalysis');

        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        const analyses = await analysisModel
            .find({ patientId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            msg: 'Patient details fetched',
            patient,
            analyses,
            analysisCount: analyses.length
        });
    } catch (error) {
        console.error('getPatientById error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const createPatient = async (req, res) => {
    try {
        const { name, age, gender, diabetesType, email, phone, medicalHistory, medications } = req.body;
        const doctorId = req.headers.userid;

        console.log('createPatient - Doctor ID:', doctorId);
        console.log('createPatient - Payload:', req.body);

        if (!doctorId) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        // ✅ Validate all required fields
        if (!name || !age || !gender || !diabetesType) {
            return res.status(400).json({ 
                msg: 'Missing required fields',
                required: ['name', 'age', 'gender', 'diabetesType']
            });
        }

        if (age < 1 || age > 120) {
            return res.status(400).json({ msg: 'Invalid age' });
        }

        // ✅ Check for exact duplicate (same name AND age)
        const existingPatient = await patientModel.findOne({ 
            doctorId, 
            name: { $regex: `^${name}$`, $options: 'i' }, // Case-insensitive
            age: parseInt(age)
        });

        if (existingPatient) {
            return res.status(400).json({ 
                msg: `Patient "${name}" with age ${age} already exists in your records`,
                existingPatientId: existingPatient._id
            });
        }

        const newPatient = await patientModel.create({
            doctorId,
            name,
            age: parseInt(age),
            gender,
            diabetesType,
            email,
            phone,
            medicalHistory,
            medications: Array.isArray(medications) ? medications : []
        });

        res.status(201).json({
            msg: 'Patient created successfully',
            patient: newPatient
        });
    } catch (error) {
        console.error('createPatient error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Update patient information
export const updatePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { name, age, gender, diabetesType, email, phone, medicalHistory, medications } = req.body;
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

        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (age) updatedFields.age = age;
        if (gender) updatedFields.gender = gender;
        if (diabetesType) updatedFields.diabetesType = diabetesType;
        if (email) updatedFields.email = email;
        if (phone) updatedFields.phone = phone;
        if (medicalHistory) updatedFields.medicalHistory = medicalHistory;
        if (medications) updatedFields.medications = medications;

        const updated = await patientModel.findByIdAndUpdate(
            patientId,
            updatedFields,
            { new: true }
        );

        res.status(200).json({
            msg: 'Patient updated successfully',
            patient: updated
        });
    } catch (error) {
        console.error('updatePatient error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Delete patient (soft delete)
export const deletePatient = async (req, res) => {
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

        await patientModel.findByIdAndUpdate(
            patientId,
            { isActive: false },
            { new: true }
        );

        res.status(200).json({ msg: 'Patient deleted successfully' });
    } catch (error) {
        console.error('deletePatient error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Get patient statistics
export const getPatientStats = async (req, res) => {
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

        const analyses = await analysisModel.find({ patientId });

        const stats = {
            totalAnalyses: analyses.length,
            normalCases: analyses.filter(a => a.predictedClass === 0).length,
            mildCases: analyses.filter(a => a.predictedClass === 1).length,
            moderateCases: analyses.filter(a => a.predictedClass === 2).length,
            severeCases: analyses.filter(a => a.predictedClass === 3).length,
            proliferativeCases: analyses.filter(a => a.predictedClass === 4).length,
            lastAnalysis: analyses[0] || null,
            averageConfidence: analyses.length > 0 
                ? (analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length).toFixed(2)
                : 0
        };

        res.status(200).json({
            msg: 'Patient statistics',
            patient,
            stats
        });
    } catch (error) {
        console.error('getPatientStats error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};