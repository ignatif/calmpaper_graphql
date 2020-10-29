const { objectType, enumType } = require('@nexus/schema')

const { getUserId } = require('../utils')

const AuthPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.string('token')
    t.field('user', { type: 'User' })
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.username()
    t.model.firstname()
    t.model.givenname()
    t.model.fullname()
    t.model.bio()
    t.model.password()
    t.model.email()
    t.model.avatar()
    t.model.books({ pagination: false })
    t.model.favoriteBooks({ pagination: false })
    t.model.chapters({ pagination: false })
    t.model.reviews({ pagination: false })
    t.model.likes({ pagination: false })
    t.model.comments({ pagination: true })
    t.model.following({ pagination: false })
    t.model.followers({ pagination: false })
    t.model.inviter()
    t.model.invited({ pagination: false })
    t.model.googleId()
    t.model.getStreamToken()
    t.model.stripeId()
    t.model.isAdmin()
  },
})

const Book = objectType({
  name: 'Book',
  definition(t) {
    t.model.id()
    t.model.slug()
    t.model.name()
    t.model.description()
    t.model.image()
    t.model.createdAt()
    t.model.author()
    t.model.archived()
    t.model.views()
    t.model.readers({ pagination: false })
    t.model.chapters({ pagination: false, ordering: true })
    t.model.tags({ pagination: false })
    t.model.genres({ pagination: false })
    t.model.likes({ pagination: false })
    t.model.reviews({ pagination: false })
    t.model.donations({ pagination: false })
    t.model.comments({
      pagination: true,
      ordering: true,
      // filtering: true,
    })
    t.int('likesCount', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.like.count({ where: { bookId: id } }),
    })
    t.int('chaptersLikesCount', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.like.count({ where: { chapter: { bookId: id } } }),
    })
    t.int('rank', {
      resolve: async ({ id }, _, ctx) => {
        const {
          avg: { rating: myRating },
        } = await ctx.prisma.chapter.aggregate({
          where: {
            bookId: id,
          },
          avg: {
            rating: true,
          },
        })
        const bookRatings = await ctx.prisma.$queryRaw(`
        SELECT AVG(rating) as rating
        FROM Chapter  
        GROUP BY bookId;
        `)
        //console.log(bookRatings, myRating)

        return myRating
          ? bookRatings.reduce(
              (sum, { rating }) => (rating > myRating ? sum + 1 : sum),
              1,
            )
          : null

        //console.log(rank)
      },
    })
    t.int('rating', {
      resolve: async ({ id }, _, ctx) => {
        const {
          avg: { rating },
        } = await ctx.prisma.chapter.aggregate({
          where: {
            bookId: id,
          },
          avg: {
            rating: true,
          },
        })
        return rating
      },
    })
  },
})

const Chapter = objectType({
  name: 'Chapter',
  definition(t) {
    t.model.id()
    t.model.slug()
    t.model.title()
    t.model.content()
    t.model.image()
    t.model.createdAt()
    t.model.author()
    t.model.book()
    t.model.views()
    t.model.likes({ pagination: false })
    t.model.reviews({ pagination: false })
    t.model.donations({ pagination: false })
    t.model.comments({
      pagination: true,
      ordering: true,
      // filtering: true,
    })
    t.model.rating()
    t.field('poll', {
      type: 'Poll',
      resolve: async ({ id }, _, ctx) =>
        (await ctx.prisma.poll.findOne({ where: { chapterId: id } })) ||
        (await ctx.prisma.poll.create({
          data: {
            chapter: { connect: { id } },
            expires: new Date(Date.now() + 3600000 * 24),
          },
        })),
    })
    t.int('superSecretMakeRating', {
      resolve: async ({ id }, _, ctx) => {
        const opt1Count = await ctx.prisma.vote.count({
          where: {
            AND: [{ poll: { chapterId: id } }, { option: { equals: 'opt1' } }],
          },
        })

        const totalVotes = await ctx.prisma.vote.count({
          where: {
            AND: [
              { poll: { chapterId: id } },
              {
                OR: [
                  { option: 'opt1' },
                  { option: 'opt2' },
                  { option: 'opt3' },
                ],
              },
            ],
          },
        })

        //console.log('opt1Count = ', opt1Count)
        //console.log('totalVotes = ', totalVotes)

        const rating =
          totalVotes > 7 && (opt1Count / totalVotes).toFixed(2) * 100

        //console.log('rating = ', rating)

        /* const chch = */ typeof rating === 'number' &&
          (await ctx.prisma.chapter.update({
            where: {
              id,
            },
            data: {
              rating,
            },
          }))

        return rating
      },
    })
  },
})

const Tag = objectType({
  name: 'Tag',
  definition(t) {
    t.model.id()
    t.model.label()
    t.model.books({ pagination: false })
  },
})

const Genre = objectType({
  name: 'Genre',
  definition(t) {
    t.model.id()
    t.model.label()
    t.model.books({ pagination: false })
  },
})

const Comment = objectType({
  name: 'Comment',
  definition(t) {
    t.model.id()
    t.model.body()
    t.model.author()
    t.model.createdAt()
    t.model.book()
    t.model.chapter()
    t.model.parent()
    t.model.isChild()
    t.model.likes({ pagination: false })
    t.model.replies({
      pagination: false,
      ordering: true,
    })
  },
})

const Review = objectType({
  name: 'Review',
  definition(t) {
    t.model.id()
    t.model.stars()
    t.model.message()
    t.model.createdAt()
    t.model.author()
    t.model.book()
    t.model.chapter()
    t.model.likes({ pagination: false })
  },
})

const Like = objectType({
  name: 'Like',
  definition(t) {
    t.model.id()
    t.model.createdAt()
    t.model.author()
    t.model.book()
    t.model.chapter()
    t.model.comment()
    t.model.review()
  },
})

const Notification = objectType({
  name: 'Notification',
  definition(t) {
    t.model.id()
    t.model.author()
    t.model.book()
    t.model.chapter()
    t.model.review()
  },
})

const Donation = objectType({
  name: 'Donation',
  definition(t) {
    t.model.id()
    t.model.amount()
    t.model.currency()
    t.model.message()
    t.model.paymentId()
    t.model.book()
    t.model.chapter()
    t.model.payer()
    t.model.recipient()
    t.model.paymentRequestSecret()
    t.model.createdAt()
  },
})

const Poll = objectType({
  name: 'Poll',
  definition(t) {
    t.model.id()
    t.model.chapter()
    t.model.chapterId()
    t.model.expires()
    t.int('totalVotes', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [
              { pollId: id },
              {
                OR: [
                  { option: 'opt1' },
                  { option: 'opt2' },
                  { option: 'opt3' },
                ],
              },
            ],
          },
        }),
    })
    t.int('opt1', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [{ pollId: id }, { option: 'opt1' }],
          },
        }),
    })
    t.int('opt2', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [{ pollId: id }, { option: 'opt2' }],
          },
        }),
    })
    t.int('opt3', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [{ pollId: id }, { option: 'opt3' }],
          },
        }),
    })
    t.int('opt4', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [{ pollId: id }, { option: 'opt4' }],
          },
        }),
    })
    /*  t.int('opt5', {
      resolve: ({ id }, _, ctx) =>
        ctx.prisma.vote.count({
          where: {
            AND: [{ pollId: id }, { option: 'opt5' }],
          },
        }),
    }) */
    t.model.votes()
    t.field('myVote', {
      type: 'MyVote',
      resolve: async ({ id }, _, ctx) => {
        const userId = ctx.request.get('Authorization') && getUserId(ctx)
        const myVote =
          userId &&
          (await ctx.prisma.vote.findOne({
            where: {
              userId_pollId_vote_key: {
                userId,
                pollId: id,
              },
            },
            select: {
              option: true,
            },
          }))
        return myVote?.option || 'none'
      },
    })
  },
})

const VoteOption = enumType({
  name: 'VoteOption',
  members: ['opt1', 'opt2', 'opt3', 'opt4' /* , 'opt5' */],
})

const MyVote = enumType({
  name: 'MyVote',
  members: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5', 'none'],
})

const Vote = objectType({
  name: 'Vote',
  definition(t) {
    t.model.id()
    t.model.user()
    t.model.userId()
    t.model.poll()
    t.model.pollId()
    t.model.option()
  },
})

module.exports = {
  User,
  Book,
  Chapter,
  Tag,
  Genre,
  Comment,
  Review,
  Like,
  Notification,
  Donation,
  AuthPayload,
  Poll,
  Vote,
  VoteOption,
  MyVote,
}
