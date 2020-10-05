const { objectType, intArg, stringArg } = require('@nexus/schema')
const { getUserId } = require('../utils')

const stream = require('getstream')
const getStreamClient = stream.connect(
  process.env.GETSTREAM_KEY,
  process.env.GETSTREAM_SECRET,
)

const Query = objectType({
  name: 'Query',
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
    t.crud.comments({ ordering: true, filtering: true })
    t.crud.review()
    t.crud.reviews()
    t.crud.likes()
    t.crud.donation()
    t.crud.donations()

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
        bookId: intArg(),
        skip: intArg({ nullable: true }),
      },
      resolve: (_, { bookId, skip }, ctx) => {
        return ctx.prisma.chapter.findMany({
          take: 1,
          skip,
          where: {
            book: {
              id: bookId,
            },
          },
          include: {
            reviews: true,
            comments: true,
          },
        })
      },
    })

    t.list.field('chaptersFeed', {
      type: 'Chapter',
      args: {
        skip: intArg({ nullable: true }),
        userId: intArg(),
      },
      resolve: (_, { skip = 0, userId }, ctx) => {
        return ctx.prisma.chapter.findMany({
          take: 3,
          skip,
          orderBy: { createdAt: 'desc' },
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
  },
})

module.exports = {
  Query,
}
