const { queryType, intArg, stringArg } = require('@nexus/schema')
const { getUserId } = require('../utils')

const stream = require('getstream')
const getStreamClient = stream.connect(
  process.env.GETSTREAM_KEY,
  process.env.GETSTREAM_SECRET,
)

const Query = queryType({
  definition(t) {
    t.crud.user()
    t.crud.users()
    t.crud.book()
    t.crud.books({ ordering: true, filtering: true })
    t.crud.chapter()
    t.crud.chapters({ ordering: true, filtering: true, pagination: true })
    t.crud.tags()
    t.crud.genres()
    t.crud.comment()
    t.crud.comments({ ordering: true, filtering: true, pagination: true })
    t.crud.review()
    t.crud.reviews()
    t.crud.likes()
    t.crud.donation()
    t.crud.donations()

    t.int('booksCount', (_, __, ctx) =>
      ctx.prisma.book
        .findMany({ where: { archived: { not: { equals: true } } } })
        .then((r) => r.length),
    )
    // t.int('chaptersCount', (_, __, ctx) => ctx.prisma.chapter.count())
    t.int('chaptersCount', (_, __, ctx) =>
      ctx.prisma.chapter
        .findMany({ where: { bookId: { not: { equals: null } } } })
        .then((r) => r.length),
    )
    t.int('commentsCount', (_, __, ctx) => ctx.prisma.comment.count())

    t.field('me', {
      type: 'User',
      nullable: true,
      resolve: async (parent, args, ctx) => {
        const userId = getUserId(ctx)

        const getStreamToken = await getStreamClient.createUserToken(
          userId.toString(),
        )

        const user = await ctx.prisma.user.findOne({
          where: {
            id: userId,
          },
        })

        return {
          ...user,
          token: getStreamToken,
          getStreamToken,
        }
      },
    })

    t.list.field('chapterByBook', {
      type: 'Chapter',
      args: {
        bookId: intArg({ nullable: true }),
        bookSlug: stringArg({ nullable: true }),
        skip: intArg({ nullable: true }),
      },
      resolve: (_, { bookId, bookSlug, skip }, ctx) => {
        if (bookId) {
          return ctx.prisma.chapter.findMany({
            take: 1,
            skip,
            where: {
              book: {
                id: { equals: bookId },
              },
            },
            include: {
              reviews: true,
              comments: true,
            },
          })
        } else if (bookSlug) {
          return ctx.prisma.chapter.findMany({
            take: 1,
            skip,
            where: {
              book: {
                slug: { equals: bookSlug },
              },
            },
            include: {
              reviews: true,
              comments: true,
            },
          })
        }
      },
    })

    t.list.field('chaptersFeed', {
      type: 'Chapter',
      args: {
        skip: intArg({ nullable: true }),
        take: intArg({ nullable: true }),
        userId: intArg(),
      },
      resolve: (_, { skip = 0, take = 5, userId }, ctx) => {
        return ctx.prisma.chapter.findMany({
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          // select: {
          //   comments: {
          //     orderBy: { createdAt: 'asc' },
          //     skip: 0,
          //     take: 2,
          //   },
          // },
          where: {
            AND: [
              { book: { not: undefined } },
              { book: { archived: { not: true } } },
              {
                OR: [
                  {
                    book: {
                      readers: {
                        some: {
                          id: { equals: userId },
                        },
                      },
                    },
                  },
                  {
                    author: { followers: { some: { id: { equals: userId } } } },
                  },
                  {
                    author: { id: { equals: userId } },
                  },
                ],
              },
            ],
          },
        })
      },
    })

    t.int('chaptersFeedCount', {
      args: {
        userId: intArg(),
      },
      resolve: (_, { userId }, ctx) => {
        return ctx.prisma.chapter
          .findMany({
            where: {
              AND: [
                { book: { not: undefined } },
                { book: { archived: { not: true } } },
                {
                  OR: [
                    {
                      book: {
                        readers: {
                          some: {
                            id: { equals: userId },
                          },
                        },
                      },
                    },
                    {
                      author: {
                        followers: { some: { id: { equals: userId } } },
                      },
                    },
                    {
                      author: { id: { equals: userId } },
                    },
                  ],
                },
              ],
            },
          })
          .then((r) => r.length)
      },
    })

    t.list.field('chaptersFeedByAuthor', {
      type: 'Chapter',
      args: {
        skip: intArg({ nullable: true }),
        authorId: intArg(),
      },
      resolve: (_, { skip = 0, authorId }, ctx) => {
        return ctx.prisma.chapter.findMany({
          take: 3,
          skip,
          orderBy: { createdAt: 'desc' },
          where: {
            // book: {
            //   not: undefined,
            // },
            AND: [
              { book: { not: undefined } },
              { book: { archived: { not: true } } },
              { author: { id: authorId } },
            ],
          },
        })
      },
    })

    t.int('chaptersFeedByAuthorCount', {
      args: {
        authorId: intArg(),
      },
      resolve: (_, { authorId }, ctx) => {
        return ctx.prisma.chapter
          .findMany({
            where: {
              AND: [
                { book: { not: undefined } },
                { book: { archived: { not: true } } },
                { author: { id: authorId } },
              ],
            },
          })
          .then((r) => r.length)
      },
    })

    t.list.field('commentsByChapter', {
      type: 'Comment',
      args: {
        skip: intArg({ nullable: true }),
        take: intArg({ nullable: true }),
        chapterId: intArg(),
      },
      resolve: (_, { skip = 0, take = 5, chapterId }, ctx) => {
        return ctx.prisma.comment.findMany({
          take,
          skip,

          where: { chapter: { id: { equals: chapterId } } },
          orderBy: { createdAt: 'desc' },
          
        })
      },
    })

    t.list.field('likesByChapter', {
      type: 'Like',
      args: {
        skip: intArg({ nullable: true }),
        take: intArg({ nullable: true }),
        chapterId: intArg(),
      },
      resolve: (_, { skip = 0, take = 5, chapterId }, ctx) => {
        return ctx.prisma.like.findMany({
          take,
          skip,

          where: { chapter: { id: { equals: chapterId } } },
          orderBy: { createdAt: 'desc' },
        })
      },
    })

    t.field('poll', {
      type: 'Poll',
      args: {
        chapterId: intArg(),
      },
      resolve: async (parent, { chapterId }, ctx) =>
        (await ctx.prisma.poll.findOne({ where: { chapterId } })) ||
        (await ctx.prisma.poll.create({
          data: {
            chapter: { connect: { id: chapterId } },
            expires: new Date(Date.now() + 3600000 * 24),
          },
        })),
    })

    t.list.field('topRatedBooks', {
      type: 'Book',
      args: {
        take: intArg(),
        skip: intArg(),
      },
      resolve: (parent, { take, skip }, ctx) =>
        ctx.prisma.$queryRaw(`
        SELECT Book.* 
        FROM Book 
        WHERE archived = FALSE                             
        ORDER BY 
        (SELECT AVG(rating) FROM Chapter WHERE bookId = Book.id AND rating >= 40) *
        (SELECT COUNT(*) FROM Chapter WHERE bookId = Book.id AND rating >= 40) DESC,
        (SELECT COUNT(*) FROM _UserBookReader WHERE A = Book.id) DESC        
        LIMIT ${take || 100}
        OFFSET ${skip || 0};                      
      `),
    })
  },
})

module.exports = {
  Query,
}
