import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";

let isConnected = false;

export const DbConnection = async () => {
    if (isConnected) {
        console.log("✅ Using existing database connection");
        return;
    }

    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI is not defined!');
        throw new Error('MONGODB_URI is required');
    }

    console.log('🔄 Connecting to MongoDB...');

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log('✅ Database Connected Successfully');
    } catch (error) {
        console.error('❌ Database Error:', error.message);
        isConnected = false;
        throw error;
    }
};