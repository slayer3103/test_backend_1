import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError.js'


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: '16kb' }))  // rate limiting
app.use(express.urlencoded({ extended: true, limit: '16kb' }))    // url encoding 
app.use(express.static('public'))

app.use(cookieParser())

// importing router 
import userRouter from '../src/routes/user.route.js'

// routes decleration
app.use('/api/v1/user', userRouter)

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: err.data
        });
    }

    // Handle generic errors
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

export { app }