import express from 'express';
import { changeMyPassword, signIn, signUp, updateUserData, forgetPassword, resetPassword } from './user.controller.js';

import { getUsers } from './user.controller.js';
import { catchAsync } from './catchAsync.js';

userRouter.post('/signUp', catchAsync(signUp));
userRouter.post('/signIn', catchAsync(signIn));
userRouter.post('/changeMyPassword', catchAsync(changeMyPassword));
userRouter.get('/show', catchAsync(getUsers));
userRouter.put('/updateUserData', catchAsync(updateUserData));
userRouter.post('/forget-password', catchAsync(forgetPassword));
userRouter.post('/reset-password', catchAsync(resetPassword));

export default userRouter;
