import dotenv from 'dotenv'
dotenv.config({ path: `./env` })
console.log(dotenv.config());

import { app } from './app.js'
import connectDB from './db/index.js'




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
    .then(() => {
        app.on('error', (error) => {    
            console.error(`problem with connection: ${error}`)
            throw error
        })
        app.listen(process.env.PORT || 3000, () => {
            console.log(`SERVER IS RUNNING AT  PORT : ${process.env.PORT}`);

        })

    })
    .catch((err) => (
        console.log(`mongoDB connection failed : ${err}`)
    ))
    .finally(() => (
        console.log(`executed express app`)

    ))
