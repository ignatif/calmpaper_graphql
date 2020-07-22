const { objectType, intArg, stringArg } = require('@nexus/schema')
const { getUserId } = require('../utils')

const stream = require('getstream').default
const getStreamClient = stream.connect(
  'c2u3fw52wm4t',
  'grdr5z6ras7ugc33ezbqswq6k6pggrad4armpg3xjskpgp7gwttmqjgyfg86pn8z',
)

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.createOneUser()
    t.crud.updateOneUser()
    t.crud.deleteOneUser()

    t.crud.createOneBook()
    t.crud.updateOneBook()
    t.crud.deleteOneBook()

    t.crud.createOneChapter()
    t.crud.updateOneChapter()
    t.crud.deleteOneChapter()

    t.crud.createOneComment()
    t.crud.updateOneComment()
    t.crud.deleteOneComment()

    t.crud.createOneReview()
    t.crud.updateOneReview()
    t.crud.upsertOneReview()
    t.crud.deleteOneReview()

    t.crud.createOneTag()
    t.crud.updateOneTag()
    t.crud.deleteOneTag()

    t.crud.createOneGenre()
    t.crud.updateOneGenre()
    t.crud.deleteOneGenre()

    t.crud.createOneLike()
    t.crud.updateOneLike()
    t.crud.deleteOneLike()

    t.field('createReview', {
      type: 'Review',
      args: {
        stars: intArg(),
        message: stringArg(),
        bookId: intArg(),
        authorId: intArg(),
      },
      resolve: async (parent, { stars, message, authorId, bookId }, ctx) => {
        const result = await ctx.prisma.review.create({
          data: {
            stars,
            message,
            author: {
              connect: {
                id: authorId,
              },
            },
            book: {
              connect: {
                id: bookId,
              },
            },
          },
          include: { book: true },
        })

        const userId = getUserId(ctx)
        const userFeed = getStreamClient.feed('all', userId)

        userFeed.addActivity({
          actor: getStreamClient.user(userId),
          to: [`notifications:${result.book.authorId}`],
          verb: 'review',
          object: `book:${bookId}`,
          bookId: bookId,
          userId,
          reviewId: result.id,
        })
        return result
      },
    }),
      t.field('setReview', {
        type: 'Review',
        args: {
          id: intArg({ nullable: true }),
          stars: intArg(),
          authorUsername: stringArg(),
          bookId: intArg(),
        },
        resolve: (parent, { id, stars, authorUsername, bookId }, ctx) => {
          if (id) {
            return ctx.prisma.review.update({
              data: { stars },
              where: { id },
            })
          } else {
            let connect

            return ctx.prisma.review.create({
              data: {
                stars,
                author: {
                  connect: {
                    username: authorUsername,
                  },
                },
                book: { connect: { id: bookId } },
              },
            })
          }
        },
      }),
      t.field('incrementBookViews', {
        type: 'Book',
        args: {
          bookId: intArg(),
        },
        resolve: async (parent, { bookId }, ctx) => {
          const book = await ctx.prisma.book.findOne({
            where: { id: bookId },
          })

          return ctx.prisma.book.update({
            data: { views: book.views + 1 },
            where: { id: bookId },
          })
        },
      }),
      t.field('incrementChapterViews', {
        type: 'Chapter',
        args: {
          chapterId: intArg({ nullable: true }),
        },
        resolve: async (parent, { chapterId }, ctx) => {
          const chapter = await ctx.prisma.chapter.findOne({
            where: { id: chapterId },
          })

          return ctx.prisma.chapter.update({
            data: { views: chapter.views + 1 },
            where: { id: chapterId },
          })
        },
      })

    t.field('addBookToFavorites', {
      type: 'User',
      args: {
        userId: intArg(),
        bookId: intArg(),
      },
      resolve: async (parent, { title, content, userId, bookId }, ctx) => {
        const user = await ctx.prisma.user.update({
          where: { id: userId },
          data: { favoriteBooks: { connect: { id: bookId } } },
        })

        const book = await ctx.prisma.book.findOne({
          where: { id: bookId },
          include: { author: true },
        })

        const userFeed = getStreamClient.feed('all', userId)

        const authorId = book.author.id
        if (userId !== authorId) {
          userFeed.addActivity({
            verb: 'follow',
            to: [`notifications:${book.author.id}`],
            object: `book:${book.id}`,
            userId,
            bookId: book.id,
            actor: getStreamClient.user(userId),
            foreignId: `user:${userId}-follow-book:${bookId}`,
          })
        }

        return user
      },
    })

    t.field('removeBookFromFavorites', {
      type: 'User',
      args: {
        userId: intArg(),
        bookId: intArg(),
      },
      resolve: async (parent, { title, content, userId, bookId }, ctx) => {
        const user = await ctx.prisma.user.update({
          where: { id: userId },
          data: { favoriteBooks: { disconnect: { id: bookId } } },
        })

        const book = await ctx.prisma.book.findOne({
          where: { id: bookId },
          include: { author: true },
        })

        const userFeed = getStreamClient.feed('all', userId)

        userFeed.removeActivity({
          foreignId: `user:${userId}-follow-book:${bookId}`,
        })

        return user
      },
    }),
      t.field('setCommentLike', {
        type: 'Like',
        args: {
          authorId: intArg(),
          commentId: intArg(),
        },
        resolve: async (parent, { authorId, commentId }, ctx) => {
          const like = await ctx.prisma.like.create({
            data: {
              author: { connect: { id: authorId } },
              comment: { connect: { id: commentId } },
            },
            include: {
              comment: {
                select: {
                  bookId: true,
                  authorId: true,
                  id: true,
                  chapter: true,
                  parent: true,
                },
              },
              author: true,
            },
          })
          const user = await ctx.prisma.user.findOne({
            where: { id: authorId },
          })

          const userId = getUserId(ctx)
          const userFeed = getStreamClient.feed('all', userId)

          if (authorId !== like.comment.authorId) {
            userFeed.addActivity({
              verb: 'like',
              to: [`notifications:${like.comment.authorId}`],
              object: `comment:${like.comment.id}`,
              userId,
              bookId: like.comment.parent
                ? like.comment.parent.bookId
                : like.comment.bookId || like.comment.chapter.bookId,
              chapterId: like.comment.chapterId,
              actor: getStreamClient.user(authorId),
              foreignId: `user:${userId}-like-comment:${like.id}`,
            })
          }

          return user
        },
      }),
      t.field('setChapterLike', {
        type: 'Like',
        args: {
          authorId: intArg(),
          chapterId: intArg(),
        },
        resolve: async (parent, { authorId, chapterId }, ctx) => {
          const like = await ctx.prisma.like.create({
            data: {
              author: { connect: { id: authorId } },
              chapter: { connect: { id: chapterId } },
            },
            include: {
              chapter: true,
              author: true,
            },
          })
          const user = await ctx.prisma.user.findOne({
            where: { id: authorId },
          })

          const userFeed = getStreamClient.feed('all', authorId)

          if (authorId !== like.chapter.authorId) {
            userFeed.addActivity({
              verb: 'like',
              to: [`notifications:${like.chapter.authorId}`],
              object: `chapter:${like.chapter.id}`,
              userId,
              bookId: like.chapter.bookId,
              chapterId: like.chapter.id,
              actor: getStreamClient.user(authorId),
              // foreignId: `user:${userId}-comment:${bookId}`,
            })
          }

          return user
        },
      })
    t.field('replyToComment', {
      type: 'Comment',
      args: {
        body: stringArg(),
        userId: intArg(),
        commentId: intArg(),
      },
      resolve: async (parent, { body, userId, commentId }, ctx) => {
        const comment = await ctx.prisma.comment.update({
          where: { id: commentId },
          data: {
            replies: {
              create: {
                body: body,
                isChild: true,
                author: { connect: { id: userId } },
              },
            },
          },
          include: { chapter: true },
        })

        const user = await ctx.prisma.user.findOne({
          where: { id: userId },
        })

        const userFeed = getStreamClient.feed('all', userId)

        const authorId = comment.authorId
        if (userId !== authorId) {
          userFeed.addActivity({
            actor: getStreamClient.user(userId),
            verb: 'reply',
            to: [`notifications:${comment.authorId}`],
            object: `comment:${comment.id}`,
            userId,
            bookId: comment.bookId || comment.chapter.bookId, // chapter comments only receive chapter object
            chapterId: comment.chapterId,
          })
        }

        return comment
      },
    }),
      t.field('sendBookComment', {
        type: 'Comment',
        args: {
          body: stringArg(),
          userId: intArg(),
          bookId: intArg(),
        },
        resolve: async (parent, { body, userId, bookId }, ctx) => {
          const comment = await ctx.prisma.comment.create({
            data: {
              body: body,
              author: { connect: { id: userId } },
              book: { connect: { id: bookId } },
            },
            include: { book: true },
          })

          const user = await ctx.prisma.user.findOne({
            where: { id: userId },
          })

          const userFeed = getStreamClient.feed('all', userId)

          const authorId = comment.book.authorId
          if (userId !== authorId) {
            userFeed.addActivity({
              actor: getStreamClient.user(userId),
              verb: 'comment',
              to: [`notifications:${comment.book.authorId}`],
              object: `book:${comment.id}`,
              userId,
              bookId,
              commentId: comment.id,
            })
          }

          return comment
        },
      }),
      t.field('sendChapterComment', {
        type: 'Comment',
        args: {
          body: stringArg(),
          userId: intArg(),
          chapterId: intArg(),
        },
        resolve: async (parent, { body, userId, chapterId }, ctx) => {
          const comment = await ctx.prisma.comment.create({
            data: {
              body: body,
              author: { connect: { id: userId } },
              chapter: { connect: { id: chapterId } },
            },
            include: { chapter: true },
          })

          const user = await ctx.prisma.user.findOne({
            where: { id: userId },
          })

          const userFeed = getStreamClient.feed('all', userId)

          const authorId = comment.chapter.authorId
          if (userId !== authorId) {
            userFeed.addActivity({
              actor: getStreamClient.user(userId),
              verb: 'comment',
              to: [`notifications:${comment.chapter.authorId}`],
              object: `chapter:${comment.id}`,
              userId,
              bookId: comment.chapter.bookId,
              chapterId,
              commentId: comment.id,
            })
          }

          return comment
        },
      })
  },
})

module.exports = {
  Mutation,
}
