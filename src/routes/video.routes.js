import { Router } from "express";
import { publishAVideo, getVideoById , updateVideoDetails, deleteVideo, togglePublishStatus} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.use(verifyJWT) //all routes will take authentication as middleware

router.route("/publish-video").post(
    upload.fields([
            {
                name: "videoFile", // it should be same as the name of the input which is taking in frontend 
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),publishAVideo)

router.route("/c/:videoId").get(getVideoById)

router.route("/c/:videoIdtoUpdate").post(upload.single("thumbnail"),updateVideoDetails)

router.route("/c/:videoIdtoDelete").delete(deleteVideo)

router.route("/c/:videoIdtoTogglePublishStatus/togglePublishStatus").get(togglePublishStatus)

export default router

