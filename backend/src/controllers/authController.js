import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function signup(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        error: true,
        message: 'All fields are required'
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }]
    });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: existingUser.email.toLowerCase() === normalizedEmail
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }
    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password
    });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: true,
      message: 'Error creating user account',
      details: error.message
    });
  }
}
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required'
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
      });
    }
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }
    try {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log(`Login attempt failed: Invalid password for user: ${user.email}`);
        return res.status(401).json({
          error: true,
          message: 'Invalid email or password'
        });
      }
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }
    console.log(`Login successful for user: ${user.email}`);
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: true,
      message: 'Error during login',
      details: error.message
    });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching profile',
      details: error.message
    });
  }
}

