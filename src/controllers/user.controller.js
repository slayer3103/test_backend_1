import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/coludinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessTokenAndRefreshToken = async (userid) => {
    try {
        //finding the user and creating its instance
        const user = User.findById(userid)
        //generating tokens for the instance
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        //adding tokens to the db entry of instance
        user.refreshToken = refreshToken
        // Saving and preventing the default behaviour of db to validate the data that is newly added
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, 'Failed in Access Token and Refresh Token creation')
    }

}
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
        $or: [{ username }, { email }]
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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
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
        new ApiResponse(createdUser, "successfully created new user", 200)

    )


})
const loginUser = asyncHandler(async (req, res) => {

    // requesting username, email and password from frontend 
    const { username, email, password } = req.body

    // checking if such username or email exists in db
    const user = await User.findById({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, 'Invalid Username or Email')
    }

    //check if the password provided matches in db
    const passwordCheck = await User.isPasswordCorrect(password)
    if (!passwordCheck) {
        throw new ApiError(401, 'Invalid user Credentials')
    }

    //generating accesstoken and refreshtoken for verified user
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    // sending data as cookies to the frontend

    //method 1 - calling data from db
    // const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    // method 2 - calling from the locally(on server values)
    const loggedInUser = await user.select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("access token", accessToken, options)
        .cookie("refresh token", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged in user"
            )
        )
})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    res
    .status(200)
    .clearCookie('Refresh Token',refreshToken,options)
    .clearCookie('Access Token',accessToken,options)
})

export { registerUser, loginUser, logoutUser }