import { Router } from "express";
import { addComment } from "../controllers/comment.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.use(verifyJWT) //all routes will take authentication as middleware

router.route("/c/:videoId/addComment").post(upload.none(),addComment)



export default router