import { PrismaClient, User, Tag, CodeTemplate, BlogPost } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

// Helper function types
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Sample data with type definitions
const programmingLanguages = [
  'javascript', 'python', 'swift', 'java', 'c', 'cpp', 'csharp', 'typescript', 'r', 'kotlin'
];

const tagNames = [
  'frontend', 'backend', 'database', 'api', 'security',
  'testing', 'devops', 'mobile', 'web', 'algorithms'
];

const firstNames = [
  'John', 'Jane', 'Alex', 'Emma', 'Michael',
  'Sarah', 'David', 'Lisa', 'James', 'Emily'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
];

async function main() {
  // Create admin user
  console.log("Creating admin user...");
  await prisma.user.upsert({
    where: { username: 'danidani' },
    update: {},
    create: {
      firstname: 'dani',
      lastname: 'mardani',
      username: 'danidani',
      hashedPassword: await hashPassword('admin'),
      email: 'admin@gmail.com',
      role: "admin",
      phoneNumber: '+1234567890',
    },
  });

  // Create tags
  console.log("Creating tags...");
  const tags = await Promise.all(
    tagNames.map(name =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Create regular users
  console.log("Creating users...");
  const users = [];
  for (let i = 0; i < 30; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
    const user = await prisma.user.create({
      data: {
        firstname: firstName,
        lastname: lastName,
        username: username,
        hashedPassword: await hashPassword('password123'),
        email: `${username}@example.com`,
        phoneNumber: `+1${Math.floor(Math.random() * 10000000000)}`,
        about: `I am ${firstName} ${lastName}, a software developer.`,
      },
    });
    users.push(user);
  }

  // Create code templates
  console.log("Creating code templates...");
  const templates = [];
  for (let i = 0; i < 30; i++) {
    const language = getRandomItem(programmingLanguages);
    const template = await prisma.codeTemplate.create({
      data: {
        title: `${language} Template ${i + 1}`,
        code: `// Example ${language} code\nfunction example${i}() {\n  console.log("Hello World");\n}`,
        language: language,
        explanation: `This is an example ${language} code template that demonstrates basic syntax.`,
        author: { connect: { id: getRandomItem(users).id } },
        tags: {
          connect: Array(getRandomNumber(1, 3))
            .fill(0)
            .map(() => ({ id: getRandomItem(tags).id })),
        },
      },
    });
    templates.push(template);
  }

  // Create blog posts
  console.log("Creating blog posts...");
  const posts = [];
  for (let i = 0; i < 30; i++) {
    const post = await prisma.blogPost.create({
      data: {
        title: `Technical Blog Post ${i + 1}`,
        content: `This is the content of blog post ${i + 1}. It contains technical information about programming.`,
        author: { connect: { id: getRandomItem(users).id } },
        tags: {
          connect: Array(getRandomNumber(1, 4))
            .fill(0)
            .map(() => ({ id: getRandomItem(tags).id })),
        },
        codeTemplates: {
          connect: Array(getRandomNumber(0, 2))
            .fill(0)
            .map(() => ({ id: getRandomItem(templates).id })),
        },
      },
    });
    posts.push(post);
  }

  // Create comments
  console.log("Creating comments...");
  for (let i = 0; i < 30; i++) {
    const post = getRandomItem(posts);
    const parentComment = Math.random() > 0.7 ? getRandomItem(await prisma.comment.findMany()) : null;

    await prisma.comment.create({
      data: {
        content: `This is comment ${i + 1}. ${parentComment ? 'It is a reply to another comment.' : ''}`,
        author: { connect: { id: getRandomItem(users).id } },
        post: { connect: { id: post.id } },
        ...(parentComment && { parent: { connect: { id: parentComment.id } } }),
      },
    });
  }

  // Create ratings and reports
  console.log("Creating ratings and reports...");
  for (const post of posts) {
    const numRatings = getRandomNumber(0, 10);
    for (let i = 0; i < numRatings; i++) {
      await prisma.postRating.create({
        data: {
          value: Math.random() > 0.3 ? 1 : -1,
          user: { connect: { id: getRandomItem(users).id } },
          post: { connect: { id: post.id } },
        },
      });
    }

    if (Math.random() > 0.9) {
      await prisma.postReport.create({
        data: {
          reason: 'Inappropriate content',
          reporter: { connect: { id: getRandomItem(users).id } },
          post: { connect: { id: post.id } },
        },
      });
    }
  }

  const comments = await prisma.comment.findMany();
  for (const comment of comments) {
    const numRatings = getRandomNumber(0, 5);
    for (let i = 0; i < numRatings; i++) {
      await prisma.commentRating.create({
        data: {
          value: Math.random() > 0.3 ? 1 : -1,
          user: { connect: { id: getRandomItem(users).id } },
          comment: { connect: { id: comment.id } },
        },
      });
    }

    if (Math.random() > 0.95) {
      await prisma.commentReport.create({
        data: {
          reason: 'Inappropriate content',
          reporter: { connect: { id: getRandomItem(users).id } },
          comment: { connect: { id: comment.id } },
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });