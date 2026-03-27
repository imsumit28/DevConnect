const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config();

const PROFESSIONAL_POSTS = [
  'Built a scalable MERN app with real-time chat and optimized Socket.IO rooms for faster delivery.',
  'Deployed a full-stack app with Docker plus AWS EC2 and learned practical CI/CD rollback strategies.',
  'Reduced API latency by 42% by indexing MongoDB collections and caching hot endpoints with Redis.',
  'Implemented secure JWT auth with refresh token rotation and device-aware session invalidation.',
  'Shipped a role-based access system (admin, recruiter, candidate) with clean permission boundaries.',
  'Set up GitHub Actions for lint, test, and build so every pull request gets automated quality checks.',
  'Designed a reusable React component system that cut feature delivery time by nearly 30%.',
  'Built an analytics dashboard using aggregation pipelines to track active users and retention trends.',
  'Improved Lighthouse performance from 71 to 95 by code-splitting, image optimization, and lazy loading.',
  'Containerized backend workers and introduced queue-based processing for reliable async jobs.',
  'Migrated legacy REST endpoints to cleaner service layers and improved test coverage across critical flows.',
  'Built a recruiter search experience with indexed filters, pagination, and relevance-based sorting.',
  'Implemented resilient error handling with centralized logging and alerting for production visibility.',
  'Added WebSocket presence and typing indicators to improve real-time collaboration UX.',
  'Hardened deployment with environment-based configs, secrets management, and safer release checklists.',
  'Built profile completion nudges that increased completed profiles and improved recruiter response rates.',
  'Introduced optimistic UI updates with rollback logic to keep feeds responsive under network jitter.',
  'Created media upload pipelines with validation, compression, and cloud storage cleanup routines.',
  'Implemented feed ranking logic combining recency and engagement to improve session depth.',
  'Wrote onboarding docs and architecture notes so new developers can contribute in under a day.'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seedProfessionalPosts() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment variables.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({}, '_id username').lean();
  if (users.length === 0) {
    console.log('No users found. Create users first, then rerun this script.');
    return;
  }

  const targetCount = randomInt(10, 15);
  const selectedContents = shuffle(PROFESSIONAL_POSTS).slice(0, targetCount);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < selectedContents.length; i++) {
    const content = selectedContents[i];
    const randomizedUsers = shuffle(users);
    let insertedForContent = false;

    for (const author of randomizedUsers) {
      const existing = await Post.findOne({ userId: author._id, content }).lean();
      if (existing) {
        continue;
      }

      const otherUsers = users.filter((u) => String(u._id) !== String(author._id));
      const likePool = shuffle(otherUsers).slice(0, Math.min(otherUsers.length, randomInt(1, 4)));
      const commentPool = shuffle(otherUsers).slice(0, Math.min(otherUsers.length, randomInt(0, 2)));
      const commentTemplates = [
        'Great execution. Love the engineering detail.',
        'Solid outcome and clear impact metrics.',
        'This is the kind of build depth recruiters notice.',
        'Nice work on turning implementation into measurable results.',
        'Very practical approach. Thanks for sharing the process.'
      ];

      const daysAgo = randomInt(0, 21);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randomInt(0, 8) * 60 * 60 * 1000);

      await Post.create({
        userId: author._id,
        content,
        likes: likePool.map((u) => u._id),
        comments: commentPool.map((u) => ({
          userId: u._id,
          text: commentTemplates[randomInt(0, commentTemplates.length - 1)]
        })),
        createdAt,
        updatedAt: createdAt
      });

      inserted += 1;
      insertedForContent = true;
      break;
    }

    if (!insertedForContent) {
      skipped += 1;
    }
  }

  console.log(`Inserted ${inserted} professional posts.`);
  console.log(`Skipped ${skipped} posts because matching user/content pairs already exist.`);
}

seedProfessionalPosts()
  .catch((error) => {
    console.error('Professional post seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  });
