const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  roleName: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true 
  },
  associationTag: { 
    type: String, 
    required: true 
  },   // Common identifier to group related roles
  source: { 
    type: String, 
    enum: ['AI', 'Manual'], 
    default: 'AI' 
  },   // Indicates if role was AI-generated or manually added
  usageCount: { 
    type: Number, 
    default: 0 
  },   // Tracks how often this role is fetched/used
  flagged: { 
    type: Boolean, 
    default: false 
  }    // Marks irrelevant or incorrect roles
}, { 
  timestamps: true   // Adds createdAt and updatedAt fields
});

// Indexing for faster group queries
RoleSchema.index({ associationTag: 1 });

module.exports = mongoose.model('Role', RoleSchema);
