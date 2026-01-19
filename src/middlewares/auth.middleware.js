import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // first get the access token of users either directly from cookies or headers
        const accessToken = await req.cookies?.accessToken || req.header('Authorization').replace('Bearer ', "")
        if (!accessToken) {
            throw new ApiError(401, 'UNAUTHORIZED ACTION')
        }
        //then verifying the token with token secret & finding user in database
        const decodedUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const user = User.findById(decodedUser._id).select("-password -refreshToken")
        if (!user) {
            // TODO: need to add frontend later
            throw new ApiError(401, 'Invalid token')
        }
        // adding the data of user to req as a parameter named user
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(500, error?.message||'db unreachable or Invalid token')
    }
})