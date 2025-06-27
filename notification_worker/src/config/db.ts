import mongoose from "mongoose";


const connectDB = async () => {
    try {
        const _mongodb_uri = process.env.MONGODB_URI as string;
        const connectionInstance = await mongoose.connect(_mongodb_uri);
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("error will trying to connect to mongodb: ", error);
    }
}


export { connectDB };
