import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

router.route("/register").post(
    upload.fields([
        {
            name: "avatar", // it should be same as the name of the input which is taking in frontend 
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser) // we will run post after routing to /register, since ye aya h app.js ke /users ke bad to ye ese likha jayega https://localhost:8000/users/register

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) //we used middleware before logout User

router.route("/refresh-token").post(refreshAccessToken)


export default router