import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res) => {
    res.status(200).json({
        message:"ok"
    })//we are sending this to user
})


export {registerUser}