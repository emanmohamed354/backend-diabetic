import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'user',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    diabetesType: {
        type: String,
        enum: ['type1', 'type2', 'gestational'],
        required: true
    },
    email: {
        type: String,
        lowercase: true
    },
    phone: String,
    medicalHistory: String,
    medications: [String],
    
    latestAnalysis: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'analysis'
    },
    
    totalAnalyses: {
        type: Number,
        default: 0
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const patientModel = mongoose.model('patient', patientSchema);