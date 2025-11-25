import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { userModel } from './../../../DataBase/models/user.model.js';
import nodemailer from 'nodemailer';

export const forgetPassword = async (req, res) => {
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
        from: 'rosheta950@gmail.com',
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP code is ${otp}. It will expire in 1 hour.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email', error });
        }
        return res.status(200).json({ message: 'OTP sent successfully' });
    });
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Find the user by email
    const user = await userModel.findOne({ email });
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid and not expired
    if (user.resetPasswordOTP !== otp || user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 8); 
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
};

export const signUp = async (req, res) => {
    const { userName, lastName, email, password, confirmPassword, age, gender, address, phone ,role} = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'Passwords do not match' });
    }

    try {
        // Check if user already exists
        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'User already exists' });
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 8);
            
            // Create new user
            await userModel.create({
                userName,
                lastName, // Directly add lastName
                email,
                password: hashedPassword,
                age,
                gender,
                address, // Directly add address without manipulation
                phone,
                role
            });
            res.status(201).json({ msg: 'User created successfully' });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Server error');
    }
};

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                let token = jwt.sign({
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
                res.status(201).json({ msg: "success", token });
            } else {
                res.status(400).json({ msg: "Password Incorrect" });
            }
        } else {
            res.status(400).json({ msg: "Account Not Found" });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};
export const changeMyPassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ msg: 'New passwords do not match' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 8);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ msg: 'Password changed successfully' });
    } catch (error) {
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
    const { email, password, userName, age, gender, address, phone, lastName } = req.body;

    try {
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
        if (lastName) updatedFields.lastName = lastName; // Directly update lastName
        if (age) updatedFields.age = age;
        if (gender) updatedFields.gender = gender;
        if (address) updatedFields.address = address; // Directly update address
        if (phone) updatedFields.phone = phone;

        // Update the user using email as the identifier
        await userModel.updateOne({ email }, { $set: updatedFields });

        const updatedUser = await userModel.findOne({ email });

        // Generate a new token with updated user info
        const newToken = generateToken(updatedUser);

        res.status(200).json({
            msg: 'User updated successfully',
            token: newToken,
            user: updatedUser
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
}

export const getUsers = async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await userModel.find({}, '_id userName email'); // Fetch only the fields you want

        // Check if any users were found
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Respond with the user IDs and other selected fields
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};


