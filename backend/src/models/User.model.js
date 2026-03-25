const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const zlib = require('zlib');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters (compressed)'],
    default: ''
  },
  bioCompressed: {
    type: Buffer,
    select: false
  },
  quote: {
    type: String,
    maxlength: [400, 'Quote cannot exceed 400 characters (compressed)'],
    default: ''
  },
  quoteCompressed: {
    type: Buffer,
    select: false
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    maxlength: 10000
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    maxlength: 10000
  }],

  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  myCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  savedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  pinnedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],

  emailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pushToken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  autoIndex: true
});

// Index for pinned courses optimization
userSchema.index({ pinnedCourses: 1 });

// TTL index for OTP cleanup (1 hour)
userSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 3600 });

// Compound indexes for optimization
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Compress text fields before saving
userSchema.pre('save', function(next) {
  if (this.isModified('bio') && this.bio) {
    try {
      this.bioCompressed = Buffer.from(zlib.deflateSync(this.bio));
    } catch (e) {
      console.error('Bio compression failed:', e);
    }
  }
  if (this.isModified('quote') && this.quote) {
    try {
      this.quoteCompressed = Buffer.from(zlib.deflateSync(this.quote));
    } catch (e) {
      console.error('Quote compression failed:', e);
    }
  }
  next();
});

// Decompress on query (post hook)
userSchema.post('findOne', function(doc) {
  if (doc && doc.bioCompressed) {
    try {
      doc.bio = zlib.inflateSync(doc.bioCompressed).toString();
      delete doc.bioCompressed;
    } catch (e) {
      console.error('Bio decompression failed:', e);
    }
  }
  if (doc && doc.quoteCompressed) {
    try {
      doc.quote = zlib.inflateSync(doc.quoteCompressed).toString();
      delete doc.quoteCompressed;
    } catch (e) {
      console.error('Quote decompression failed:', e);
    }
  }
});

// Hash password before saving (keep existing)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.otpExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;

  return user;
};

module.exports = mongoose.model('User', userSchema);

