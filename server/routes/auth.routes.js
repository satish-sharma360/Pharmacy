import express, { Router } from "express";
import { getAllUsers, getProfile, login, register, updateProfile } from "../controllers/auth.controller.js";
import { uploadProfileImage } from "../middleware/upload.middleware.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";


const authRouter = express.Router()

authRouter.post('/register',uploadProfileImage,register)
authRouter.post('/login',login)

authRouter.use(protect) //All routes after this middleware are protected 

authRouter.get('profile', getProfile)
authRouter.put('profile', uploadProfileImage ,updateProfile)

authRouter.get('/user' ,restrictTo('admin') ,getAllUsers)

export default authRouter