import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
const router = Router()


router.route("/register").post(registerUser) // we will run post after routing to /register, since ye aya h app.js ke /users ke bad to ye ese likha jayega https://localhost:8000/users/register


export default router