const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    questionText: { type: String, required: true },
    usageCount: { type: Number, default: 1 },
    regenerationCount: { type: Number, default: 0 }
}, { timestamps: true });

QuestionSchema.index({ skillId: 1, questionText: 1 }, { unique: true });

module.exports = mongoose.model('Question', QuestionSchema);
