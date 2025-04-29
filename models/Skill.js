const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    name: { type: String, required: true },
    usageCount: { type: Number, default: 1 },
    source: { type: String, enum: ['OpenAPI', 'User'], default: 'User' }
}, { timestamps: true });

SkillSchema.index({ roleId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Skill', SkillSchema);