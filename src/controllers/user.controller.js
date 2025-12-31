import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken //gave the user refreshToken by saving it in its object in db
        await user.save({validateBeforeSave:false}) //as we are saving the user by just giving its one field so this false in validdate-, it will not check the other field are given or not

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    console.log('------req.body started-----')
    console.log(req.body)
    console.log('------req.body ended-----')
    //step:1
    const {fullname,email, username,password} = req.body
    // console.log("email:",email);

    //step:2
    //validating any field is not empty
    if([fullname,email,username,password].some((field) => field?.trim() === "")){ // if after trimming as well any field is empty then return true the condition

        throw new ApiError(400,"All Fields are Required")

    //status code is must here to give , others if you wanna ow we set default in its class
    }

    //step-3
    //check duplicate user
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser) {
        throw new ApiError(409,"User with email or username already exists")
    }

    console.log('------req.files started-----')
    console.log(req.files)
    console.log('------req.files ended-----')

    //step-4 
    //check for images(avatar etc)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //step-5
    // upload images to cloudinary
    //if we have not already prepared code to upload files on cloudinary.js we will have to write the code here itself that will be very bad.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    //step-6
    //user creation (entry in db),check created or not
    const user = await User.create({ //entry in db
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",//we will store the url given by cloudinary to the database as strig
        email,
        password,
        username: username.toLowerCase()
    })

    //step-7
    //remove password and refresh token

    const createdUser = await User.findById(user._id).select("-password -refreshToken") //to remove the password and refreshtoken from return response
    
    //step-8
    // check whether user is created
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    
    //step-9
    // sending response to user

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

    //dummy code
    // res.status(200).json({
    //     message:"ok"
    // })//we are sending this to user
})

const loginUser = asyncHandler(async (req,res)=>{
    //step-1: taking req.body from user
    const {email,username,password} = req.body
    console.log(email)

    if(!username && !email){
        throw new ApiError(400,"username and email required")
    }

    //If we want that either username or email
    // if(!(username || email)){
    //     throw new ApiError(400,"Either username or email is required")
    // }

    //step-2: find the user
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist Sign Up")
    }

    //step-3: password correction check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //step -4: generate access and refresh tokens
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }//now the cookies can't be modified by frontend can only be done by server

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user: loggedInUser,accessToken,refreshToken
        },"User logged in Successfully"
    )
    )





})

const logoutUser = asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
       await req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken!==user.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed ")
        )
    } catch (error) {
        throw new ApiError(401,error?.message,"Invalid Refresh Token" )
    }




})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body //it will come from user input field
    const user = User.findById(req.user?._id)

    const isPasswordCorrect = await user. isPasswordCorrect(oldPassword)//matching old password

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword  //set the new password
    await user.save({validateBeforeSave: false}) //save the user with only password changed

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))


})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id,
    {
        $set: { //it is used to set the multiple values
            fullname, //as in our model also it has same name
            email:email
        }
    },{new: true}).select("-password") //remove password

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details updated"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar Image updated succesfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated succesfully"))
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}