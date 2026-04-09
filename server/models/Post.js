const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isActivity: {
    type: Boolean,
    default: false,
  },
  activityType: {
    type: String,
    enum: ['follow', 'share', 'message', 'none'],
    default: 'none',
  },
  image: {
    type: String,
  },
  video: {
    type: String,
  },
  postType: {
    type: String,
    enum: ['post', 'article', 'event', 'code'],
    default: 'post',
  },
  articleTitle: {
    type: String,
  },
  eventTitle: {
    type: String,
  },
  eventDate: {
    type: Date,
  },
  codeSnippet: {
    type: String,
  },
  codeLanguage: {
    type: String,
  },
  codeTitle: {
    type: String,
  },
  codeFileName: {
    type: String,
  },
  codeDifficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', ''],
    default: '',
  },
  codeReadTime: {
    type: Number,
    min: 0,
    default: 0,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    likes: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      default: [],
    },
    replies: {
      type: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        likes: {
          type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          }],
          default: [],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }],
      default: [],
    }
  }],
  isRepost: {
    type: Boolean,
    default: false,
  },
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Post', postSchema);
