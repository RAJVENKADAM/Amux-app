// src/models/Project.model.js
const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  youtubeUrl: { type: String, required: true },
  description: { type: String, default: '' },
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  topics: { type: [TopicSchema], required: true },
  source: { type: String, enum: ['project', 'course'], default: 'project' },
  stars: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: true },
}, { timestamps: true });

ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ source: 1 });
module.exports = mongoose.model('Project', ProjectSchema, 'projects');
