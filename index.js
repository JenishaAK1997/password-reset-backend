const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const moment = require('moment');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://aasim:XfpFdiCzA3zYUPen@cluster0.kulamu6.mongodb.net/?retryWrites=true&w=majority');

// Define the User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  resetToken: String,
  resetTokenTime: Date,
});

const User = mongoose.model('User', userSchema);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jeniak51997@gmail.com',
    pass: 'zfvxkqdiznaeqhrc',
  },
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    return res.status(200).json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Generate Reset Token and Send Email
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate random token and set the expiration time
    const resetToken = Math.random().toString(36).slice(2);
    const resetTokenTime = new Date();

    // Save the token and time in the user's document
    user.resetToken = resetToken;
    user.resetTokenTime = resetTokenTime;
    await user.save();

    // Send reset email
    const mailOptions = {
      from: 'jeniak51997@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: http://localhost:5173/?x=${resetToken}&m=${email}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success:false,message: 'Error sending reset email' });
      } else {
        return res.status(200).json({ success:true,message: 'Reset link sent to your email' });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Reset Password with Token
app.post('/api/token', async (req, res) => {
  const { email, resetToken, resetTokenTime } = req.body;
  const user = await User.findOne({
    email,
    resetToken
  });

  if (user) {
    // Parse the ISO 8601 formatted date string
    const resetTokenTimeDate = moment(resetTokenTime).toDate();

    // Check if the reset token is not expired (15 minutes window)
    const currentTime = Date.now();
    const tokenExpirationTime = resetTokenTimeDate.getTime() + 15 * 60 * 1000; // 15 minutes in milliseconds

    if (currentTime <= tokenExpirationTime) {
      // Token is valid, and it's not expired
      res.json({ success: true, message: 'Password reset successful' });
    } else {
      // Token is expired
      res.json({ success: false, message: 'Reset token has expired' });
    }
  } else {
    // Token is not valid
    res.json({ success: false, message: 'Invalid reset token or email' });
  }


});


app.post('/api/update-password', async (req, res) => {
  try {
    const { email, newpassword } = req.body;

    // Find the user by email and update the password (this is a simplified example)
    const user = await User.findOneAndUpdate({ email }, { password: newpassword });

    if (user) {
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
