const express = require('express');
const router = express.Router();
const roleController = require('./controllers/roleController');
const skillController = require('./controllers/skillController');
const questionController = require('./controllers/questionController');

// Role APIs
router.get('/roles', roleController.getRoles);
router.post('/roles/feedback', roleController.roleFeedback);
router.get('/roles/suggestions', roleController.getRoleSuggestions);

router.get('/roles/:roleId/:roleName/skills', skillController.getSkills);
router.post('/roles/:roleId/skills', skillController.addSkills);


router.post('/questions', questionController.getQuestions);
router.post('/questions/regenerate', questionController.regenerateQuestion);

module.exports = router;
