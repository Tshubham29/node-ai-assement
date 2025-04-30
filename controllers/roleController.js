const Role = require('../models/Role');
const { fetchFromOpenAI } = require('../services/openaiService');
const { v4: uuidv4 } = require('uuid');


exports.getRoles = async (req, res, next) => {
  try {
    let { jobRole } = req.query;
    if (!jobRole) return res.status(400).json({ error: 'Job role is required.' });

    jobRole = jobRole.trim();

    // Step 1: Check if searched role exists
    const existing = await Role.findOne({
      roleName: new RegExp(`^${jobRole}$`, 'i'),
      flagged: false
    });

    if (existing) {
      const related = await Role.find({
        associationTag: existing.associationTag,
        flagged: false
      }).sort({ usageCount: -1 }).limit(10);
      return res.json(related);
    }

    // Step 2: Create new associationTag for the searched role ONLY
    const inputTag = `grp_${uuidv4()}`;

    // Step 3: Insert searched role independently
    const insertedInput = await Role.create({
      roleName: jobRole,
      associationTag: inputTag
    });

    // Step 4: Fetch related roles from OpenAI
    const prompt = `Suggest 10 specific job roles related to "${jobRole}". Do not include generic titles.`;
    const aiResponse = await fetchFromOpenAI(prompt);

    if (!Array.isArray(aiResponse) || aiResponse.length === 0) {
      return res.status(502).json({ error: 'OpenAI did not return valid roles.' });
    }

    // Step 5: Insert OpenAI roles separately (not linked to the input role)
    const aiRoles = aiResponse
      .map(role => role.trim())
      .filter(role => role.toLowerCase() !== jobRole.toLowerCase());

    const aiInsert = aiRoles.map(role => ({
      roleName: role,
      associationTag: `grp_${uuidv4()}` // insert each with their own tag
    }));

    if (aiInsert.length > 0) {
      await Role.insertMany(aiInsert);
    }

    // Step 6: Return only the searched role's group (just the input role)
    const result = await Role.find({
      associationTag: inputTag,
      flagged: false
    });

    return res.json(result);
  } catch (err) {
    console.error('getRoles error:', err);
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

