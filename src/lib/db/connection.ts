//@ts-nocheck
import mongoose from 'mongoose';

export default async function dbConnect(){
    mongoose.connect(process.env.MONGODB_URI || '').catch(err => console.error('Database connection error:', err));
};