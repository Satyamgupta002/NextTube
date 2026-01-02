import { Router } from "express";
import { changeCurrentPassword, registerUser, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar", // it should be same as the name of the input which is taking in frontend 
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser) // we will run post after routing to /register, since ye aya h app.js ke /users ke bad to ye ese likha jayega https://localhost:8000/users/register

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) //we used middleware before logout User

router.route("/refresh-token").post(refreshAccessToken)  //here we did not user our auth middleware veritfyJWT because here we will just use cookies stored in his browser sent with the refresh token request

router.route("/change-password").post(upload.none(),verifyJWT, changeCurrentPassword) // though you can change the password when you are logged in but at the server side we will make it authenticate the user as server runs on coming request he does not remember the user.
//if we are taking data through direct json then don't need to write upload.none() but if we are taking form data then it is needed to put upload.none()

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").post(upload.none(),verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile) //as we are taking username for getting channel details from params so it has syntax which is written in route() and also here we are using get as we are not sending any data in current user route also we can user get only
router.route("/watchhistory").get(verifyJWT, getWatchHistory)


export default router