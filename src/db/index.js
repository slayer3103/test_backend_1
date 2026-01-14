import mongoose, { connect } from "mongoose";
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log('Database connected')
        console.log(`\nconnection instance is : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.error('Error: ', error)
        process.exit(1) // or throw (error)
    }
}
export default connectDB

