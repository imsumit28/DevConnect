const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');

dotenv.config();

const dummyUsers = [
  {
    username: 'dev_alex',
    name: 'Alex Johnson',
    email: 'alex@test.com',
    password: 'password123',
    bio: 'Frontend Specialist | React & Tailwind Enthusiast',
    skills: ['React', 'Tailwind', 'JavaScript', 'TypeScript'],
    profilePic: '/avatars/avatar_1.png',
  },
  {
    username: 'backend_bob',
    name: 'Bob Miller',
    email: 'bob@test.com',
    password: 'password123',
    bio: 'Node.js Expert | Architecture & Scalability',
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    profilePic: '/avatars/avatar_2.png',
  },
  {
    username: 'clara_codes',
    name: 'Clara Davis',
    email: 'clara@test.com',
    password: 'password123',
    bio: 'Full Stack Developer | Building with MERN',
    skills: ['MongoDB', 'Express', 'React', 'Node.js'],
    profilePic: '/avatars/avatar_4.png',
  },
  {
    username: 'daniel_dev',
    name: 'Daniel Smith',
    email: 'daniel@test.com',
    password: 'password123',
    bio: 'Pythonista & Web Developer',
    skills: ['Python', 'Django', 'React', 'PostgreSQL'],
    profilePic: '/avatars/avatar_3.png',
  },
  {
    username: 'evie_tech',
    name: 'Evie Brown',
    email: 'evie@test.com',
    password: 'password123',
    bio: 'UX Engineer | Design & Code',
    skills: ['Figma', 'React', 'CSS', 'Animation'],
    profilePic: '/avatars/avatar_2.png',
  },
  {
    username: 'frank_fullstack',
    name: 'Frank Wilson',
    email: 'frank@test.com',
    password: 'password123',
    bio: 'Helping startups grow with tech',
    skills: ['Next.js', 'Vercel', 'AWS', 'Serverless'],
    profilePic: '/avatars/avatar_1.png',
  },
  {
    username: 'grace_hopper_fan',
    name: 'Grace Taylor',
    email: 'grace@test.com',
    password: 'password123',
    bio: 'Lover of clean code and legacy systems',
    skills: ['Java', 'Spring Boot', 'SQL', 'Kubernetes'],
    profilePic: '/avatars/avatar_4.png',
  },
  {
    username: 'hank_hardware',
    name: 'Hank Moore',
    email: 'hank@test.com',
    password: 'password123',
    bio: 'IoT Developer | Bridging Hardware and Software',
    skills: ['C++', 'Arduino', 'Raspberry Pi', 'Embedded Systems'],
    profilePic: '/avatars/avatar_3.png',
  },
  {
    username: 'iris_web',
    name: 'Iris Clark',
    email: 'iris@test.com',
    password: 'password123',
    bio: 'Open Source Contributor | JS Native',
    skills: ['JavaScript', 'Web Performance', 'Git', 'HTML5'],
    profilePic: '/avatars/avatar_2.png',
  },
  {
    username: 'jack_of_all_trades',
    name: 'Jack Lewis',
    email: 'jack@test.com',
    password: 'password123',
    bio: 'Versatile dev for any project',
    skills: ['React Native', 'PHP', 'Laravel', 'Rust'],
    profilePic: '/avatars/avatar_1.png',
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clean up
    await User.deleteMany({ username: { $in: dummyUsers.map(u => u.username) } });
    console.log('Cleared existing dummy users');

    const createdUsers = [];
    for (const userData of dummyUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      createdUsers.push(user);
    }
    console.log('Dummy users created');

    // Create random followers
    for (const user of createdUsers) {
      const otherUsers = createdUsers.filter(u => u._id !== user._id);
      const randomFollowers = otherUsers.sort(() => 0.5 - Math.random()).slice(0, 3);
      user.followers = randomFollowers.map(u => u._id);
      user.following = otherUsers.sort(() => 0.5 - Math.random()).slice(0, 2).map(u => u._id);
      await user.save();
    }
    console.log('Connections established');

    // Create dummy posts
    const postContents = [
      'Just pushed my first Docker container! 🐳 #DevOps',
      'React vs Vue - which one are you picking in 2026? ⚛️',
      'Loving the new Tailwind v4 features! Clean AF. ✨',
      'Anyone hiring MERN developers? My DMs are open! 💼',
      'The best way to learn is to build. Keep coding. 🚀',
      'Microservices are cool until you have to debug them. 💀',
      'Just finished a deep dive into Rust. Memory safety is wild. 🦀',
      'Don’t forget to drink water and stretch today, devs! 💧',
    ];

    for (const user of createdUsers) {
      for (let i = 0; i < 2; i++) {
        await Post.create({
          userId: user._id,
          content: postContents[Math.floor(Math.random() * postContents.length)],
          likes: createdUsers.slice(0, 3).map(u => u._id),
          comments: [
            { userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id, text: 'Great point!' }
          ]
        });
      }
    }
    console.log('Dummy posts created');

    mongoose.connection.close();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
