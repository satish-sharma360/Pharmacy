import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('✅ Connected to MongoDB successfully!');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1)
    }
}
export default connectDb