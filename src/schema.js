import { makeExecutableSchema } from '@graphql-tools/schema'
import { createToken, hashPassword, requireUser, verifyPassword } from './auth.js'
import { uniqueSlug } from './slug.js'

export const typeDefs = /* GraphQL */ `
  enum BookSort {
    TOP
    NEW
  }

  enum LikeTarget {
    BOOK
    CHAPTER
    COMMENT
  }

  type Query {
    health: String!
    me: User
    users: [User!]!
    user(slug: String!): User
    books(sort: BookSort = TOP, limit: Int = 24): [Book!]!
    book(slug: String!): Book
    chapter(bookSlug: String!, slug: String!): Chapter
    feed(limit: Int = 30): [Activity!]!
    likeState(target: LikeTarget!, id: ID!): LikeResult!
    libraryState(bookId: ID!): LibraryResult!
  }

  type Mutation {
    signup(email: String!, username: String!, fullname: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    followUser(username: String!): User!
    unfollowUser(username: String!): User!
    toggleLike(target: LikeTarget!, id: ID!): LikeResult!
    toggleLibrary(bookId: ID!): LibraryResult!
    addComment(bookId: ID, chapterId: ID, parentId: ID, body: String!): Comment!
    createBook(input: CreateBookInput!): Book!
    createChapter(input: CreateChapterInput!): Chapter!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type User {
    id: ID!
    username: String!
    slug: String!
    email: String
    name: String!
    fullname: String!
    initials: String!
    bio: String!
    years: String!
    location: String!
    avatar: String
    accent: String!
    books: [Book!]!
    booksCount: Int!
    followersCount: Int!
    followingSlugs: [String!]!
    isFollowing: Boolean!
  }

  type Book {
    id: ID!
    slug: String!
    name: String!
    title: String!
    description: String!
    kicker: String!
    year: String!
    image: String
    cover: Cover!
    author: User!
    authorSlug: String!
    chapters: [Chapter!]!
    genres: [String!]!
    likes: Int!
    readers: Int!
    commentsCount: Int!
    comments: [Comment!]!
    likedByMe: Boolean!
    inLibrary: Boolean!
    createdAt: String!
  }

  type Cover {
    from: String!
    to: String!
    ink: String!
    mark: String!
  }

  type Chapter {
    id: ID!
    slug: String!
    title: String!
    dek: String!
    excerpt: String!
    content: String!
    readTime: String!
    author: User!
    book: Book!
    likes: Int!
    likedByMe: Boolean!
    comments: [Comment!]!
    createdAt: String!
  }

  type Comment {
    id: ID!
    body: String!
    author: User!
    book: Book
    chapter: Chapter
    parentId: ID
    replies: [Comment!]!
    likes: Int!
    likedByMe: Boolean!
    createdAt: String!
  }

  type Activity {
    id: ID!
    actor: User!
    action: String!
    target: String!
    targetHref: String!
    body: String
    createdAt: String!
    likes: Int!
    comments: Int!
  }

  type LikeResult {
    active: Boolean!
    count: Int!
  }

  type LibraryResult {
    active: Boolean!
    readers: Int!
  }

  input CreateBookInput {
    title: String!
    description: String!
    kicker: String
    year: String
    genres: [String!]
    coverFrom: String
    coverTo: String
    coverInk: String
    coverMark: String
  }

  input CreateChapterInput {
    bookId: ID!
    title: String!
    dek: String
    excerpt: String
    content: String!
    readTime: String
  }
`

const publicUser = {
  id: true,
  username: true,
  fullname: true,
  bio: true,
  years: true,
  location: true,
  avatar: true,
  accent: true,
  legacyFollowers: true,
  createdAt: true,
}

const clean = (value, label, max = 10000) => {
  const result = value?.trim()
  if (!result) throw new Error(`${label} is required`)
  if (result.length > max) throw new Error(`${label} is too long`)
  return result
}

const targetWhere = (target, id) => {
  if (target === 'BOOK') return { bookId: id }
  if (target === 'CHAPTER') return { chapterId: id }
  if (target === 'COMMENT') return { commentId: id }
  throw new Error('Unknown like target')
}

const targetModel = (prisma, target) => {
  if (target === 'BOOK') return prisma.book
  if (target === 'CHAPTER') return prisma.chapter
  if (target === 'COMMENT') return prisma.comment
  throw new Error('Unknown like target')
}

const legacyLikesFor = (record) => record?.legacyLikes || 0

export const resolvers = {
  Query: {
    health: () => 'ok',
    me: (_root, _args, { prisma, userId }) =>
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { ...publicUser, email: true },
          })
        : null,
    users: (_root, _args, { prisma }) =>
      prisma.user.findMany({
        select: publicUser,
        orderBy: { legacyFollowers: 'desc' },
      }),
    user: (_root, { slug }, { prisma }) =>
      prisma.user.findUnique({
        where: { username: slug.toLowerCase() },
        select: publicUser,
      }),
    books: (_root, { sort, limit }, { prisma }) =>
      prisma.book.findMany({
        where: { archived: false },
        orderBy: sort === 'NEW' ? { createdAt: 'desc' } : { legacyLikes: 'desc' },
        take: Math.min(Math.max(limit, 1), 100),
      }),
    book: (_root, { slug }, { prisma }) =>
      prisma.book.findUnique({ where: { slug } }),
    chapter: (_root, { bookSlug, slug }, { prisma }) =>
      prisma.chapter.findFirst({
        where: {
          slug,
          book: {
            slug: bookSlug,
            archived: false,
          },
        },
      }),
    feed: async (_root, { limit }, { prisma, userId }) => {
      let authorIds
      if (userId) {
        const follows = await prisma.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        })
        authorIds = [userId, ...follows.map(({ followingId }) => followingId)]
      }

      const chapters = await prisma.chapter.findMany({
        where: authorIds ? { authorId: { in: authorIds } } : undefined,
        include: { author: { select: publicUser }, book: true },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 50),
      })
      const comments = await prisma.comment.findMany({
        where: {
          parentId: null,
          ...(authorIds ? { authorId: { in: authorIds } } : {}),
        },
        include: {
          author: { select: publicUser },
          book: true,
          chapter: { include: { book: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(limit, 1), 50),
      })

      return [
        ...chapters.map((chapter) => ({
          id: `chapter:${chapter.id}`,
          actor: chapter.author,
          action: 'published a new page in',
          target: chapter.book.name,
          targetHref: `/books/${chapter.book.slug}`,
          body: chapter.excerpt,
          createdAt: chapter.createdAt,
          likes: chapter.legacyLikes,
          comments: 0,
        })),
        ...comments.map((comment) => {
          const book = comment.book || comment.chapter?.book
          return {
            id: `comment:${comment.id}`,
            actor: comment.author,
            action: 'commented on',
            target: book?.name || 'a page',
            targetHref: book ? `/books/${book.slug}` : '/',
            body: comment.body,
            createdAt: comment.createdAt,
            likes: comment.legacyLikes,
            comments: 0,
          }
        }),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, Math.min(Math.max(limit, 1), 50))
    },
    likeState: async (_root, { target, id }, { prisma, userId }) => {
      const where = targetWhere(target, id)
      const record = await targetModel(prisma, target).findUnique({ where: { id } })
      if (!record) throw new Error('Item not found')
      const count = legacyLikesFor(record) + (await prisma.like.count({ where }))
      if (!userId) return { active: false, count }
      const active = Boolean(
        await prisma.like.findFirst({ where: { authorId: userId, ...where } }),
      )
      return { active, count }
    },
    libraryState: async (_root, { bookId }, { prisma, userId }) => {
      const book = await prisma.book.findUnique({ where: { id: bookId } })
      if (!book) throw new Error('Book not found')
      const readers =
        book.legacyReaders +
        (await prisma.libraryEntry.count({ where: { bookId } }))
      if (!userId) return { active: false, readers }
      const active = Boolean(
        await prisma.libraryEntry.findUnique({
          where: { userId_bookId: { userId, bookId } },
        }),
      )
      return { active, readers }
    },
  },
  Mutation: {
    signup: async (_root, { email, username, fullname, password }, { prisma }) => {
      const normalizedEmail = clean(email, 'Email', 320).toLowerCase()
      const normalizedUsername = clean(username, 'Username', 40)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      if (normalizedUsername.length < 2) throw new Error('Username is too short')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
        select: { id: true },
      })
      if (existing) throw new Error('Email or username is already in use')

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
          fullname: clean(fullname, 'Name', 100),
          passwordHash: await hashPassword(password),
        },
        select: { ...publicUser, email: true },
      })
      return { token: createToken(user.id), user: { ...user, __private: true } }
    },
    login: async (_root, { email, password }, { prisma }) => {
      const userWithPassword = await prisma.user.findUnique({
        where: { email: clean(email, 'Email', 320).toLowerCase() },
      })
      if (
        !userWithPassword ||
        !(await verifyPassword(password, userWithPassword.passwordHash))
      ) {
        throw new Error('Invalid email or password')
      }
      const { passwordHash: _passwordHash, ...user } = userWithPassword
      return {
        token: createToken(user.id),
        user: { ...user, __private: true },
      }
    },
    followUser: async (_root, { username }, context) => {
      const userId = requireUser(context)
      const following = await context.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })
      if (!following) throw new Error('Writer not found')
      if (following.id === userId) throw new Error('You cannot follow yourself')
      await context.prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId: userId, followingId: following.id },
        },
        create: { followerId: userId, followingId: following.id },
        update: {},
      })
      return context.prisma.user.findUnique({
        where: { id: following.id },
        select: publicUser,
      })
    },
    unfollowUser: async (_root, { username }, context) => {
      const userId = requireUser(context)
      const following = await context.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })
      if (!following) throw new Error('Writer not found')
      await context.prisma.follow.deleteMany({
        where: { followerId: userId, followingId: following.id },
      })
      return context.prisma.user.findUnique({
        where: { id: following.id },
        select: publicUser,
      })
    },
    toggleLike: async (_root, { target, id }, context) => {
      const authorId = requireUser(context)
      const where = targetWhere(target, id)
      const model = targetModel(context.prisma, target)
      const targetRecord = await model.findUnique({ where: { id } })
      if (!targetRecord) throw new Error('Item not found')
      const existing = await context.prisma.like.findFirst({
        where: { authorId, ...where },
      })
      let active
      if (existing) {
        await context.prisma.like.delete({ where: { id: existing.id } })
        active = false
      } else {
        await context.prisma.like.create({ data: { authorId, ...where } })
        active = true
      }
      const realLikes = await context.prisma.like.count({ where })
      return { active, count: legacyLikesFor(targetRecord) + realLikes }
    },
    toggleLibrary: async (_root, { bookId }, context) => {
      const userId = requireUser(context)
      const book = await context.prisma.book.findUnique({ where: { id: bookId } })
      if (!book) throw new Error('Book not found')
      const key = { userId_bookId: { userId, bookId } }
      const existing = await context.prisma.libraryEntry.findUnique({ where: key })
      let active
      if (existing) {
        await context.prisma.libraryEntry.delete({ where: key })
        active = false
      } else {
        await context.prisma.libraryEntry.create({ data: { userId, bookId } })
        active = true
      }
      const readers = await context.prisma.libraryEntry.count({ where: { bookId } })
      return { active, readers: book.legacyReaders + readers }
    },
    addComment: async (
      _root,
      { bookId, chapterId, parentId, body },
      context,
    ) => {
      const authorId = requireUser(context)
      const targets = [bookId, chapterId, parentId].filter(Boolean)
      if (targets.length !== 1) throw new Error('Choose exactly one comment target')

      const data = { authorId, body: clean(body, 'Comment', 4000) }
      if (parentId) {
        const parent = await context.prisma.comment.findUnique({
          where: { id: parentId },
          select: { id: true, bookId: true, chapterId: true },
        })
        if (!parent) throw new Error('Parent comment not found')
        Object.assign(data, {
          parentId,
          bookId: parent.bookId,
          chapterId: parent.chapterId,
        })
      } else if (bookId) {
        data.bookId = bookId
      } else {
        data.chapterId = chapterId
      }
      return context.prisma.comment.create({ data })
    },
    createBook: async (_root, { input }, context) => {
      const authorId = requireUser(context)
      const title = clean(input.title, 'Title', 180)
      const genres = [...new Set((input.genres || []).map((genre) => genre.trim()).filter(Boolean))]
      return context.prisma.book.create({
        data: {
          authorId,
          slug: await uniqueSlug(context.prisma.book, title),
          name: title,
          description: clean(input.description, 'Description', 10000),
          kicker: input.kicker?.trim() || '',
          year: input.year?.trim() || String(new Date().getFullYear()),
          coverFrom: input.coverFrom || '#d8d3ff',
          coverTo: input.coverTo || '#6c5ce7',
          coverInk: input.coverInk || '#17142b',
          coverMark: input.coverMark || '✦',
          genres: {
            connectOrCreate: genres.map((label) => ({
              where: { label },
              create: { label },
            })),
          },
        },
      })
    },
    createChapter: async (_root, { input }, context) => {
      const authorId = requireUser(context)
      const book = await context.prisma.book.findUnique({
        where: { id: input.bookId },
        select: { id: true, authorId: true },
      })
      if (!book) throw new Error('Book not found')
      if (book.authorId !== authorId) throw new Error('Only the author can add a page')
      const title = clean(input.title, 'Title', 180)
      return context.prisma.chapter.create({
        data: {
          authorId,
          bookId: book.id,
          slug: await uniqueSlug(context.prisma.chapter, title),
          title,
          dek: input.dek?.trim() || '',
          excerpt: input.excerpt?.trim() || input.content.slice(0, 220),
          content: clean(input.content, 'Page', 100000),
          readTime: input.readTime?.trim() || '5 min',
        },
      })
    },
  },
  User: {
    slug: (user) => user.username,
    name: (user) => user.fullname,
    initials: (user) =>
      user.fullname
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
    email: (user, _args, { userId }) =>
      user.id === userId || user.__private ? user.email : null,
    books: (user, _args, { prisma }) =>
      prisma.book.findMany({
        where: { authorId: user.id, archived: false },
        orderBy: { createdAt: 'desc' },
      }),
    booksCount: (user, _args, { prisma }) =>
      prisma.book.count({ where: { authorId: user.id, archived: false } }),
    followersCount: async (user, _args, { prisma }) =>
      (user.legacyFollowers || 0) +
      (await prisma.follow.count({ where: { followingId: user.id } })),
    followingSlugs: async (user, _args, { prisma }) => {
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        include: { following: { select: { username: true } } },
      })
      return follows.map(({ following }) => following.username)
    },
    isFollowing: async (user, _args, { prisma, userId }) =>
      Boolean(
        userId &&
          (await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: userId,
                followingId: user.id,
              },
            },
          })),
      ),
  },
  Book: {
    title: (book) => book.name,
    cover: (book) => ({
      from: book.coverFrom,
      to: book.coverTo,
      ink: book.coverInk,
      mark: book.coverMark,
    }),
    author: (book, _args, { prisma }) =>
      prisma.user.findUnique({ where: { id: book.authorId }, select: publicUser }),
    authorSlug: async (book, _args, { prisma }) =>
      (
        await prisma.user.findUnique({
          where: { id: book.authorId },
          select: { username: true },
        })
      ).username,
    chapters: (book, _args, { prisma }) =>
      prisma.chapter.findMany({
        where: { bookId: book.id },
        orderBy: { createdAt: 'asc' },
      }),
    genres: async (book, _args, { prisma }) =>
      (
        await prisma.book.findUnique({
          where: { id: book.id },
          include: { genres: { select: { label: true } } },
        })
      ).genres.map(({ label }) => label),
    likes: async (book, _args, { prisma }) =>
      book.legacyLikes + (await prisma.like.count({ where: { bookId: book.id } })),
    readers: async (book, _args, { prisma }) =>
      book.legacyReaders +
      (await prisma.libraryEntry.count({ where: { bookId: book.id } })),
    commentsCount: (book, _args, { prisma }) =>
      prisma.comment.count({ where: { bookId: book.id } }),
    comments: (book, _args, { prisma }) =>
      prisma.comment.findMany({
        where: { bookId: book.id, parentId: null },
        orderBy: { createdAt: 'desc' },
      }),
    likedByMe: async (book, _args, { prisma, userId }) =>
      Boolean(
        userId &&
          (await prisma.like.findFirst({ where: { authorId: userId, bookId: book.id } })),
      ),
    inLibrary: async (book, _args, { prisma, userId }) =>
      Boolean(
        userId &&
          (await prisma.libraryEntry.findUnique({
            where: { userId_bookId: { userId, bookId: book.id } },
          })),
      ),
    createdAt: (book) => book.createdAt.toISOString(),
  },
  Chapter: {
    author: (chapter, _args, { prisma }) =>
      prisma.user.findUnique({
        where: { id: chapter.authorId },
        select: publicUser,
      }),
    book: (chapter, _args, { prisma }) =>
      prisma.book.findUnique({ where: { id: chapter.bookId } }),
    likes: async (chapter, _args, { prisma }) =>
      chapter.legacyLikes +
      (await prisma.like.count({ where: { chapterId: chapter.id } })),
    likedByMe: async (chapter, _args, { prisma, userId }) =>
      Boolean(
        userId &&
          (await prisma.like.findFirst({
            where: { authorId: userId, chapterId: chapter.id },
          })),
      ),
    comments: (chapter, _args, { prisma }) =>
      prisma.comment.findMany({
        where: { chapterId: chapter.id, parentId: null },
        orderBy: { createdAt: 'asc' },
      }),
    createdAt: (chapter) => chapter.createdAt.toISOString(),
  },
  Comment: {
    author: (comment, _args, { prisma }) =>
      prisma.user.findUnique({
        where: { id: comment.authorId },
        select: publicUser,
      }),
    book: (comment, _args, { prisma }) =>
      comment.bookId
        ? prisma.book.findUnique({ where: { id: comment.bookId } })
        : null,
    chapter: (comment, _args, { prisma }) =>
      comment.chapterId
        ? prisma.chapter.findUnique({ where: { id: comment.chapterId } })
        : null,
    replies: (comment, _args, { prisma }) =>
      prisma.comment.findMany({
        where: { parentId: comment.id },
        orderBy: { createdAt: 'asc' },
      }),
    likes: async (comment, _args, { prisma }) =>
      comment.legacyLikes +
      (await prisma.like.count({ where: { commentId: comment.id } })),
    likedByMe: async (comment, _args, { prisma, userId }) =>
      Boolean(
        userId &&
          (await prisma.like.findFirst({
            where: { authorId: userId, commentId: comment.id },
          })),
      ),
    createdAt: (comment) => comment.createdAt.toISOString(),
  },
  Activity: {
    createdAt: (activity) => activity.createdAt.toISOString(),
  },
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })
