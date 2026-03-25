// src/models/Course.model.js
const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  description: { type: String, default: '' },
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  topics: { type: [TopicSchema], required: true },
  source: { type: String, enum: ['project', 'course'], default: 'course' },
  stars: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: true },
  trustCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  trustedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Indexes
CourseSchema.index({ owner: 1 });
CourseSchema.index({ source: 1 });

// ✅ Check if model already exists before creating
module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);

