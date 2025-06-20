import mongoose from "mongoose";
import { logger } from "./logger";


const connectDB = async () => {
    try {
        const _mongodb_uri = process.env.MONGODB_URI as string;
        const connectionInstance = await mongoose.connect(_mongodb_uri);
        logger.info(`MongoDB connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        logger.error("error will trying to connect to mongodb: ", error);
    }
}


export { connectDB };
