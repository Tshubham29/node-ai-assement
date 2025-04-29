const Skill = require('../models/Skill');
const { fetchFromOpenAI } = require('../services/openaiService');

exports.getSkills = async (req, res, next) => {
    const { roleId, roleName } = req.params;
    try {
        let skills = await Skill.find({ roleId }).sort({ usageCount: -1 });

        if (skills.length > 0) {
            await Skill.updateMany({ roleId }, { $inc: { usageCount: 1 } });
            return res.json({ skills });
        }

        // Step 3: Fetch suggestions from OpenAI
        const prompt = `Suggest 3 possible skills ${roleName} only provide title not titles description`;
        const aiResponse = await fetchFromOpenAI(prompt);

        // Ensure aiResponse is an array of roles
        if (!Array.isArray(aiResponse) && aiResponse.length === 0) {
            return res.status(502).json({ error: "AI did not return valid roles. Please try again later." });
        }
        const skillDocs = aiResponse.map(skill => ({ roleId, name: skill, source: 'OpenAPI' }));
        await Skill.insertMany(skillDocs);
        return res.json({ skills: skillDocs });
    } catch (err) {
        next(err)
    }
};

exports.addSkills = async (req, res, next) => {
    const { roleId } = req.params;
    const { skills } = req.body;

    try {
        // 1. Fetch existing skills for the role
        const existingSkills = await Skill.find({ 
            roleId, 
            name: { $in: skills } 
        }).select('name');

        const existingSkillNames = existingSkills.map(skill => skill.name);

        // 2. Filter out duplicates
        const newSkills = skills.filter(skill => !existingSkillNames.includes(skill));

        if (newSkills.length === 0) {
            return res.status(200).json({ message: 'All skills already exist.', addedSkills: [] });
        }

        // 3. Prepare documents for insertion
        const skillDocs = newSkills.map(skill => ({ roleId, name: skill, source: 'User' }));

        await Skill.insertMany(skillDocs);

        res.json({ message: 'Skills added successfully.', addedSkills: newSkills });
    } catch (err) {
        next(err);
    }
};