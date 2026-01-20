import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/coludinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async (userid) => {
    try {
        //finding the user and creating its instance
        const user = await User.findById(userid)
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
    const { email, username, password } = req.body

    //if no username or email
    if (!(username || email)) {
        throw new ApiError(401, 'please enter username and email')
    }

    // checking if such username or email exists in db
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new ApiError(404, 'Invalid  username or Email')
    }

    //check if the password provided matches in db
    const passwordCheck = await user.isPasswordCorrect(password)
    if (!passwordCheck) {
        throw new ApiError(401, 'Invalid user Credentials')
    }

    //generating accesstoken and refreshtoken for verified user
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)



    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
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
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie('refreshToken', options)
        .clearCookie('accessToken', options)
        .json(
            new ApiResponse(
                201,
                "user logged out successfully"
            )
        )
})
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.body.refreshToken || req.cookies.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "unauthorized request ")
    }
    try {
        const decodedUser = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedUser._id)
        if (!user) {
            throw new ApiError(402, "invalid refreshToken")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, 'refreshtoken mismatch')
        }
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        return res.
            status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    { accessToken, refreshToken: newRefreshToken },
                    "refresh token refresh successfully",
                    200
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "something went wrong")
    }
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "password is incorrect")
    }
    if (oldPassword === newPassword) {
        throw new ApiError(401, "old and new password are the same")
    }
    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                {},
                "password changed successfully",
                200
            )
        )
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(req.user, "current user fetched successfully ", 200)
        )
})
const updateDetails = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body
    if (!(username || fullName || email || password)) {
        throw new ApiError(400, "all feilds are required")
    }
    const user = await User.findById(req.user?._id)
    const verifyUser = await user.isPasswordCorrect(password)
    if (!verifyUser) {
        throw new ApiError(400, "the password fgiven is incorrect hesnce cannot fulfill the request")
    }
    if (await User.findOne(username))
        throw new ApiError(400, "user name already exists")
    if (await User.findOne(email))
        throw new ApiError(400, "email name already exists")

    User.findByIdAndUpdate(
        user._id,
        {
            username,
            email,
            fullName
        },
        {
            new: true
        }).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                {}, "account details updated successfully", 200
            )
        )
})
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "missing avatar")
    }
    try {
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar.url) {
            throw new ApiError(400, "error while uploading the avatar")
        }
        const oldAvatarURL = await User.findById(req.user?._id).avatar
        await deleteFromCloudinary(oldAvatarURL)
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true }
        ).select("-password")

        return res
            .status(200)
            .json(
                new ApiResponse(
                    user, "avatar image updated successfully", 200
                )
            )
    } catch (error) {
        throw new ApiError(
            500, error?.message
        )
    }
})
const updatedCoverImage = asyncHandler(async (req, res) => {
    const { coverImageLocalPath } = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(404, "connot find the coverimage file locally")
    }
    try {
        const coverImage = await uploadOnCloudinary(coverLocalImagePath)
        if (!coverImage.url) {
            throw new ApiError(401, "failed to upload image on the cloudinary server")
        }
        const oldCoverImagePath = await User.findById(req.user?._id).coverImage
        await deleteFromCloudinary(oldCoverImagePath)
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res.status(200)
            .json(
                new ApiResponse(
                    user, "cover image changed successfully", 200
                )
            )
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateDetails, updateAvatar, updatedCoverImage }