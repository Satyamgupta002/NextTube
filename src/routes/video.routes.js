import { Router } from "express";
import { publishAVideo, getVideoById , updateVideoDetails} from "../controllers/video.controller.js";
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

router.route("/c/:videoIdForUpdate").post(upload.none(),updateVideoDetails)

export default router

