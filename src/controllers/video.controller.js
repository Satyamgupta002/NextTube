import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import {getVideoDurationInSeconds} from "get-video-duration";


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title){
        throw new ApiError(400,"Title is Required")
    }
    
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;


    if(!videoLocalPath){
        throw new ApiError(400,"Video file not found")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail file not found")
    }
    const duration = await getVideoDurationInSeconds(videoLocalPath)
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)


    if(!videoFile){
        throw new ApiError(400,"Something Happened when uploading video on cloudinary")
    }

    if(!thumbnail){
        throw new ApiError(400,"Something Happened when uploading thumbnail on cloudinary")
    }
    const video = await Video.create({ //entry in db
       
        title,
        description,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        duration,
        owner:req.user?._id
    })

    if (!video) {
    throw new ApiError(500, "Something went wrong while uploading video");
  }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video Published Successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    //assuming that id will come without Object outside

    if(!videoId.trim()){
        throw new ApiError(400,"Video Id is required")
    }

    const video = await Video.findById(new mongoose.Types.ObjectId(videoId))

    if(!video){
        throw new ApiError(400,"Video not found in db")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video Fetched Successfully"))
}) 

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoIdForUpdate } = req.params
    //TODO: update video details like title, description
    const {title, description} = req.body
    
    const video = await Video.findById(videoIdForUpdate)

    if(String(video.owner) != String(req.user._id)){
        throw new ApiError(404,"Unauthorized Request to update Video Details")
    }
        

    if(title && title.trim()){
        video.title = title
    }else{
        throw new ApiError(400,"Title is blank")
    }

    if(description && description.trim()){
        video.description = description
    }else{
        throw new ApiError(400,"Description is blank")
    }

    await video.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video Details Changed Successfully"))
    
})

export {publishAVideo,getVideoById,updateVideoDetails}