import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/coludinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

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
    const existingUser = await User.findOne({
        $or: [ { username }]
    })
    if (existingUser) {
        throw new ApiError(409, 'user already exists')
    }

    //uploading avatar and coverImage on cloudinary

    const avatarLocalPath = req.files?.avatar[0]?.path
    
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    //or this method is helpful when it is important to send cover image as if dont send it its default value will be "" 
    //but if we use the method above and dont send the value then it will be undefined
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0) {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'avatar file is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'avatar file failed to upload on cloudinary')
    }

    // creating an entry of user in db

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        password
    })

    // remove password and refreshtoken from db
    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    //check if the user has been created in db
    if (!createdUser) {
        throw new ApiError(500, 'failed to add user to db')
    }

    return res.status(201).json(
        new ApiResponse(createdUser, "successfully created new user",200)

    )


})

export { registerUser }