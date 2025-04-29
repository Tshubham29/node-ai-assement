const Role = require('../models/Role');
const { fetchFromOpenAI } = require('../services/openaiService');
const { v4: uuidv4 } = require('uuid');

exports.getRoles = async (req, res, next) => {
  try {
    let { jobRole } = req.query;

    if (!jobRole) {
      return res.status(400).json({ error: 'Job role is required.' });
    }

    jobRole = jobRole.trim();

    // Step 1: Check if role already exists in DB
    const role = await Role.findOne({
      roleName: new RegExp(`^${jobRole}$`, 'i'),
      flagged: false
    });

    if (role) {
      const relatedRoles = await Role.find({
        associationTag: role.associationTag,
        flagged: false
      }).sort({ usageCount: -1 }).limit(10);

      return res.json(relatedRoles);
    }

    // Step 2: Fetch from OpenAI
    const prompt = `Suggest 10 possible job roles related to ${jobRole}. Include the given role itself in the list. Return only the role names.`;
    const aiResponse = await fetchFromOpenAI(prompt);

    if (!Array.isArray(aiResponse) || aiResponse.length === 0) {
      return res.status(502).json({ error: "AI did not return valid roles. Please try again later." });
    }

    // Step 3: Insert new roles
    const newTag = `grp_${uuidv4()}`;

    const rolesToInsert = aiResponse.map(roleName => ({
      roleName: roleName.trim(),
      associationTag: newTag
    }));


    await Role.insertMany(rolesToInsert);

    // Step 4: Fetch and return
    const finalRoles = await Role.find({
      associationTag: newTag,
      flagged: false
    }).sort({ usageCount: -1 }).limit(10);

    return res.json(finalRoles);

  } catch (err) {
    next(err);
  }
};


exports.roleFeedback = async (req, res) => {
  try {
    const { roleId, action } = req.body;

    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    if (action === 'selected') {
      role.usageCount++;
    } else if (action === 'flag') {
      role.flagged = true;
    }

    await role.save();
    res.json({ message: 'Feedback recorded successfully' });

  } catch (err) {
    next(err);
  }
};


exports.getRoleSuggestions = async (req, res) => {
  try {
    const { search = '', limit = 10 } = req.query;

    const roles = await Role.find({ 
      roleName: { $regex: search, $options: 'i' }, 
      flagged: false 
    })
    .sort({ usageCount: -1 })
    .limit(parseInt(limit));

    res.json(roles);

  } catch (err) {
   next(err)
  }
};

