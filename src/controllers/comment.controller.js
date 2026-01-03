import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    const {videoId} = req.params

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"video file not found to comment")
    }

    if(!content.trim()){
        throw new ApiError(400,"content for comment can't be blank")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment added Successfully"))
})

export {addComment}