import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/coludinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    // bringinf values from frontend or source
    const { email, fullName, username, password } = req.body

    //checking if any valiue is empty
    if (
        [email, fullName, username, password].some((feild) => (feild?.trim() === ''))
    ) {
        throw new ApiError(400, 'all feilds are required')
    }

    //checking if the email is incorrect
    if (
        !email.includes("@")
    ) {
        throw new ApiError(401, 'invalid email')
    }

    //checking if username or email already exist in the database
    const existingUser = User.findOne({
        $or: [{ email }, { username }]
    })
    if (existingUser) {
        throw new ApiError(409, 'user already exists')
    }

    //uploading avatar and coverImage on cloudinary

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!{
        $or: [{ avatarLocalPath }, { coverImageLocalPath }]
    }
    ) {
        throw new ApiError(400, 'avatar and coverimage are required ')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!{
        $or: [{ avatar }, { coverImage }]
    }) {
        throw new ApiError(400, 'avatar and cover image failed to upload on cloudinary')
    }

    // creating an entry of user in db

    const user =await User.create({
        username:username.toLowerCase(),
        email,
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||'',
        password
    })

     // remove password and refreshtoken from db
    const createdUser=await User.findById(user._id).select('-password -refreshToken')
    
    //check if the user has been created in db
    if (!createdUser) {
        throw new ApiError(500,'failed to add user to db')
    }

    return res.status(201).json(
        new ApiResponse(200,'successfully created a new user ',createdUser)
    )


})

export { registerUser }