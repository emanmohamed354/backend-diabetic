import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    resetPasswordOTP: { type: Number },
    otpExpiry: { type: Date },
    wishlist: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'product' }]
}, {
    timestamps: true
});

export const userModel = mongoose.model('user', userSchema);