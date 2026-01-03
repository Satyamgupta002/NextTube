import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) //this json and urlencoded etc. are middlewares
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import

import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'


//routes decalaration
app.use("/api/v1/users",userRouter)//Run this (userRouter)middleware ONLY for routes that start with /users 
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comments",commentRouter)



export {app}