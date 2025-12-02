import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'patient',
        required: true
    },
    doctorId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'user',
        required: true
    },
    
    // Image information
    filename: String,
    imagePath: String,
    cloudinaryImageId: String, 
    
    // Analysis results
    rawScore: {
        type: Number,
        required: true
    },
    predictedClass: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3, 4]
    },
    confidence: {
        type: Number,
        required: true
    },
    
    // DR Information
    label: String, // 'No DR', 'Mild NPDR', etc
    severity: String, // 'Normal', 'Mild', 'Moderate', etc
    description: String,
    color: String,
    icon: String,
    
    recommendations: [String],
    followUp: String,
    
    // Metadata
    reportId: {
        type: String,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    
    clinicalNotes: String,
    treatmentPlan: String,
    
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'archived'],
        default: 'pending'
    },
    
    reviewedBy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'user'
    },
    reviewDate: Date
}, {
    timestamps: true
});

export const analysisModel = mongoose.model('analysis', analysisSchema);