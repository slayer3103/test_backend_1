import dotenv from 'dotenv'
dotenv.config({path: `./env`})
console.log(dotenv.config());


import mongoose from "mongoose";
import {DB_NAME} from './constants.js'
import express from 'express'
import connectDB from './db/index.js'
const app = express()


//approach 1 - where we put everything in index.js so that db connsection and server runs at the start of the application 
/*
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on('error', (error) => {
            console.error('Error connecting to MongoDB',error)
            throw error
        })
        app.listen((process.env.PORT),()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error('Error connecting to MongoDB',error)
        throw error
    }
})()
*/

//approach 2
connectDB()
