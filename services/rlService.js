const Question = require('../models/Question');

async function updateUsage(questionId, action) {
  const question = await Question.findById(questionId);
  if (!question) return;

  if (action === 'used') question.usageCount++;
  if (action === 'regenerated') question.regeneratedCount++;
  if (action === 'like') question.likes = (question.likes || 0) + 1;
  if (action === 'dislike') question.dislikes = (question.dislikes || 0) + 1;

  question.score = (question.usageCount * 1) + ((question.likes || 0) * 2) - (question.regeneratedCount * 1.5) - ((question.dislikes || 0) * 2);
  await question.save();
}

module.exports = { updateUsage };
