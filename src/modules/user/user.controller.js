import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { userModel } from '../../../DataBase/models/user.model.js';

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = Date.now() + 3600000;
        user.resetPasswordOTP = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE,
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP code is ${otp}. It will expire in 1 hour.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email error:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.status(200).json({ message: 'OTP sent successfully' });
        });
    } catch (error) {
        console.error('forgetPassword error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.resetPasswordOTP !== Number(otp) || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const signUp = async (req, res) => {
    try {
        const { userName, lastName, email, password, confirmPassword, age, gender, address, phone, role } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        await userModel.create({
            userName,
            lastName,
            email,
            password: hashedPassword,
            age,
            gender,
            address,
            phone,
            role
        });

        res.status(201).json({ msg: 'User created successfully' });
    } catch (error) {
        console.error('signUp error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Account Not Found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ msg: 'Password Incorrect' });
        }

        const token = jwt.sign({
            age: user.age,
            email: user.email,
            userName: user.userName,
            role: user.role,
            gender: user.gender,
            phone: user.phone,
            address: user.address,
            lastName: user.lastName,
            userId: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES
        });

        res.status(200).json({ msg: 'success', token });
    } catch (error) {
        console.error('signIn error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        user.password = await bcrypt.hash(newPassword, 8);
        await user.save();

        res.status(200).json({ msg: 'Password changed successfully' });
    } catch (error) {
        console.error('changeMyPassword error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

function generateToken(user) {
    return jwt.sign(
        {
            age: user.age,
            email: user.email,
            userName: user.userName,
            role: user.role,
            gender: user.gender,
            phone: user.phone,
            address: user.address,
            lastName: user.lastName,
            userId: user._id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
    );
}

export const updateUserData = async (req, res) => {
    try {
        const { email, password, userName, age, gender, address, phone, lastName } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const updatedFields = {};
        if (userName) updatedFields.userName = userName;
        if (lastName) updatedFields.lastName = lastName;
        if (age) updatedFields.age = age;
        if (gender) updatedFields.gender = gender;
        if (address) updatedFields.address = address;
        if (phone) updatedFields.phone = phone;

        await userModel.updateOne({ email }, { $set: updatedFields });
        const updatedUser = await userModel.findOne({ email });

        res.status(200).json({
            msg: 'User updated successfully',
            token: generateToken(updatedUser),
            user: updatedUser
        });
    } catch (error) {
        console.error('updateUserData error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, '_id userName email');

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json({ users });
    } catch (error) {
        console.error('getUsers error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};