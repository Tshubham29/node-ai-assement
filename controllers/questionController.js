const Question = require('../models/Question');
const Skill = require('../models/Skill');
const { fetchFromOpenAI ,fetchQuestionsFromOpenAI} = require('../services/openaiService');
const { formatQuestionsResponse } = require('../utils');



exports.getQuestions = async (req, res, next) => {
  const { skills, jobRole,experience } = req.body;
  try {
    let allQuestions = [];

    for (let skillName of skills) {
      // 1. Find the skill from DB
      let skill = await Skill.findOne({ name: skillName });

      if (!skill) {
        continue;
      }

      // 2. Check if questions already exist for this skill
      const existingQuestions = await Question.find({ skillId: skill._id }).sort({ usageCount: -1 }).limit(3);

      if (existingQuestions.length > 0) {
        await Question.updateMany({ skillId: skill._id }, { $inc: { usageCount: 1 } });
        allQuestions.push({ category: skillName, questions: existingQuestions });
        continue;
      }

      // 3. No questions found — fetch from OpenAI
      const prompt = `I want to hire a ${jobRole}. 
                      Give me only 3 questions for the category: ${skillName} with ${experience} of experience. 
                      Return strictly in JSON format like:
                      { "category": "${skillName}", "questions": ["Q1", "Q2", "Q3"] }`;

      const aiResponse = await fetchQuestionsFromOpenAI(prompt);

      const questionsArray = aiResponse.questions || [];

      // 4. Insert AI questions directly into DB
      if (questionsArray.length > 0) {
        const newQuestionDocs = questionsArray.map(q => ({
          skillId: skill._id,
          questionText: q
        }));

        await Question.insertMany(newQuestionDocs);
        await Question.updateMany({ skillId: skill._id }, { $inc: { usageCount: 1 } });
        allQuestions.push({ category: skillName, questions: newQuestionDocs });
      }
    }

    return res.json({ data: allQuestions });

  } catch (err) {
    next(err);
  }
};


exports.regenerateQuestion = async (req, res, next) => {
  const { category, questionIds = [] } = req.body;

  try {
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    // 1. Find the Skill
    const skill = await Skill.findOne({ name: category });

    if (!skill) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // 2. Find another question in DB (excluding already sent questions)
    const anotherQuestion = await Question.findOne({
      skillId: skill._id,
      _id: { $nin: questionIds }
    }).sort({ usageCount: -1 });

    if (anotherQuestion) {
      // 3. Increment usageCount
      anotherQuestion.usageCount++;
      await anotherQuestion.save();

      return res.json({ newQuestion: anotherQuestion });
    }

    // 4. No question found → Fetch new from OpenAI
    const prompt = `I want to hire for the ${category} role.
Give me 1 new interview question related to this category.
Return strictly in JSON format like: { "question": "Your Question Here" }.
`;

    const aiResponse = await fetchQuestionsFromOpenAI(prompt);

    const newQuestionText = aiResponse.question || aiResponse.questions?.[0];

    if (!newQuestionText) {
      return res.status(502).json({ error: 'OpenAI did not return a valid question.' });
    }

    // 5. Insert new question into DB
    const newQuestion = new Question({
      skillId: skill._id,
      questionText: newQuestionText,
      usageCount: 1
    });

    await newQuestion.save();

    return res.json({ newQuestion: newQuestion });

  } catch (err) {
    next(err);
  }
};
