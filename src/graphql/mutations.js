const { mutationType, intArg, stringArg, arg } = require('@nexus/schema')
const { getUserId } = require('../utils')
const fetch = require('isomorphic-unfetch')
const slugify = require('slugify')
const stripe = require('../stripe')

const { compare, hash } = require('bcryptjs')
const { sign } = require('jsonwebtoken')

const stream = require('getstream')
const getStreamClient = stream.connect(
  process.env.GETSTREAM_KEY,
  process.env.GETSTREAM_SECRET,
)

const APP_SECRET = 'appsecret321'

const Mutation = mutationType({
  definition(t) {
    t.crud.createOneUser()
    t.crud.updateOneUser()
    t.crud.deleteOneUser()

    t.crud.createOneBook()
    t.crud.updateOneBook()
    t.crud.updateManyBook()
    t.crud.deleteOneBook()
    t.crud.deleteManyBook()

    t.crud.createOneChapter()
    t.crud.updateOneChapter()
    t.crud.updateManyChapter()
    t.crud.deleteOneChapter()
    t.crud.deleteManyChapter()

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

    t.crud.createOnePoll({ alias: 'createPoll' })
    t.crud.deleteOnePoll()

    t.field('createBook', {
      type: 'Book',
      args: {
        name: stringArg(),
        description: stringArg(),
        image: stringArg({ nullable: true }),
        tags: intArg({ list: true, nullable: true }),
        genres: intArg({ list: true, nullable: true }),
      },
      resolve: async (
        parent,
        { name, description, image, tags, genres },
        ctx,
      ) => {
        const userId = getUserId(ctx)

        // 1) Create slug based on name
        const slug = slugify(name, { lower: true }).replace(/\./g, '')

        // 2) Check if current slug exists
        const existing = await ctx.prisma.book.findOne({ where: { slug } })

        if (!existing) {
          // 3) If doesn't exist - create a book with current slug -> done
          return ctx.prisma.book.create({
            data: {
              name,
              slug,
              description,
              image,
              author: {
                connect: {
                  id: userId,
                },
              },
              tags: {
                connect: tags.map((i) => ({ id: i })),
              },
              genres: {
                connect: genres.map((i) => ({ id: i })),
              },
            },
            include: {
              author: true,
            },
          })
        } else {
          // 4) If exists - create a book without slug.
          const book = await ctx.prisma.book.create({
            data: {
              name,
              description,
              image,
              author: {
                connect: {
                  id: userId,
                },
              },
              tags: {
                connect: tags,
              },
              genres: {
                connect: genres,
              },
            },
            include: {
              author: true,
            },
          })

          // 5) Update with a slug ending with id
          return ctx.prisma.book.update({
            where: {
              id: book.id,
            },
            data: {
              slug: `${slug}-${book.id}`,
            },
            include: {
              author: true,
            },
          })
        }
      },
    }),
      t.field('createChapter', {
        type: 'Chapter',
        args: {
          title: stringArg(),
          content: stringArg(),
          bookSlug: stringArg({ nullable: true }),
          bookId: intArg({ nullable: true }),
          userId: intArg(),
        },
        resolve: async (
          parent,
          { title, content, bookSlug, bookId, userId },
          ctx,
        ) => {
          const result = await ctx.prisma.chapter.create({
            data: {
              title,
              content,
              author: { connect: { id: userId } },
              book: { connect: { id: bookId, slug: bookSlug } },
            },
            include: {
              author: true,
              book: {
                select: {
                  slug: true,
                  chapters: true,
                },
              },
            },
          })

          return result
        },
      }),
      t.field('createReview', {
        type: 'Review',
        args: {
          stars: intArg(),
          message: stringArg(),
          bookId: intArg({ nullable: true }),
          bookSlug: intArg({ nullable: true }),
          authorId: intArg(),
        },
        resolve: async (
          parent,
          { stars, message, authorId, bookId, bookSlug },
          ctx,
        ) => {
          let result
          if (bookId) {
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
          } else if (bookSlug) {
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
                    slug: bookSlug,
                  },
                },
              },
              include: { book: true },
            })
          }

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
          bookId: intArg({ nullable: true }),
          bookSlug: stringArg({ nullable: true }),
        },
        resolve: async (
          parent,
          { bookId = undefined, bookSlug = undefined },
          ctx,
        ) => {
          const book = await ctx.prisma.book.findOne({
            where: {
              id: bookId,
              slug: bookSlug,
            },
          })

          return ctx.prisma.book.update({
            data: { views: book.views + 1 },
            where: {
              id: bookId,
              slug: bookSlug,
            },
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

          return like
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
              userId: authorId,
              bookId: like.chapter.bookId,
              chapterId: like.chapter.id,
              actor: getStreamClient.user(authorId),
              // foreignId: `user:${userId}-comment:${bookId}`,
            })
          }

          return user
        },
      })
    t.field('setChapterLikee', {
      type: 'Chapter',
      args: {
        userId: intArg(),
        chapterId: intArg(),
      },
      resolve: async (parent, { userId, chapterId }, ctx) => {
        const chapter = await ctx.prisma.chapter.update({
          where: {
            id: chapterId,
          },
          data: {
            likes: { create: { author: { connect: { id: userId } } } },
          },
        })

        const chapterAuthorFeed = getStreamClient.feed('all', chapter.authorId)

        if (userId !== chapter.authorId) {
          chapterAuthorFeed.addActivity({
            verb: 'like',
            to: [`notifications:${chapter.authorId}`],
            object: `chapter:${chapter.id}`,
            userId: userId,
            bookId: chapter.bookId,
            chapterId: chapter.id,
            actor: getStreamClient.user(userId),
            // foreignId: `user:${userId}-comment:${bookId}`,
          })
        }

        return chapter
      },
    })

    t.field('removeChapterLikee', {
      type: 'Chapter',
      args: {
        chapterId: intArg(),
        likeId: intArg(),
      },
      resolve: async (parent, { chapterId, likeId }, ctx) => {
        const chapter = await ctx.prisma.chapter.update({
          where: {
            id: chapterId,
          },
          data: { likes: { delete: { id: likeId } } },
        })
        return chapter
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
      }),
      t.field('newChapterDonation', {
        type: 'Donation',
        args: {
          chapterId: intArg(),
          amount: intArg(),
          message: stringArg({ nullable: true }),
        },
        resolve: async (parent, { chapterId, amount, message }, ctx) => {
          const userId = getUserId(ctx)

          const chapter = await ctx.prisma.chapter.findOne({
            where: { id: chapterId },
            include: { author: true },
          })
          const author = chapter.author
          const authorStripeId = author.stripeId

          let payParams = {
            payment_method_types: ['card'],
            amount: amount,
            currency: 'usd',
            // on_behalf_of: authorStripeId,
            // transfer_data: {
            //   destination: authorStripeId,
            //   amount,
            // },
          }

          const capability = await ctx.stripe.accounts.updateCapability(
            authorStripeId,
            'transfers',
            { requested: true },
          )

          const paymentIntent = await ctx.stripe.paymentIntents.create(
            payParams,
            {
              stripe_account: authorStripeId,
            },
          )
          //console.log('paymentIntent')
          //console.log(paymentIntent)
          //console.log('authorStripeId')
          //console.log(authorStripeId)

          const donation = await ctx.prisma.donation.create({
            data: {
              chapter: {
                connect: {
                  id: chapterId,
                },
              },
              payer: {
                connect: {
                  id: userId,
                },
              },
              recipient: {
                connect: {
                  id: author.id,
                },
              },
              amount,
              currency: 'usd',
              message,
              paymentId: paymentIntent.id,
            },
          })

          const response = {
            ...donation,
            paymentRequestSecret: paymentIntent.client_secret,
          }

          return response
        },
      })

    t.field('newBookDonation', {
      type: 'Donation',
      args: {
        bookId: intArg(),
        amount: intArg(),
        message: stringArg({ nullable: true }),
      },

      resolve: async (parent, { bookId, amount, message }, ctx) => {
        const userId = getUserId(ctx)

        const book = await ctx.prisma.book.findOne({
          where: { id: bookId },
          include: { author: true },
        })
        const author = book.author
        const authorStripeId = author.stripeId

        let payParams = {
          payment_method_types: ['card'],
          amount: amount,
          currency: 'usd',
          // on_behalf_of: authorStripeId,
          // transfer_data: {
          //   destination: authorStripeId,
          //   amount,
          // },
        }

        const paymentIntent = await ctx.stripe.paymentIntents.create(
          payParams,
          {
            stripe_account: authorStripeId,
          },
        )

        const donation = await ctx.prisma.donation.create({
          data: {
            book: {
              connect: {
                id: bookId,
              },
            },
            payer: {
              connect: {
                id: userId,
              },
            },
            recipient: {
              connect: {
                id: author.id,
              },
            },
            amount,
            currency: 'usd',
            message,
            paymentId: paymentIntent.id,
          },
        })

        const response = {
          ...donation,
          paymentRequestSecret: paymentIntent.client_secret,
        }

        return response
      },
    }),
      t.field('setupStripe', {
        type: 'Donation',
        args: {
          stripeCode: stringArg(),
        },
        resolve: async (parent, { stripeCode }, ctx) => {
          const userId = getUserId(ctx)

          const stripeConnectRequest = await makeStripeConnectRequest(
            stripeCode,
          )
          const stripeUserId = stripeConnectRequest.stripe_user_id

          if (!stripeUserId) {
            //console.log('Connect request to Stripe failed')
          }

          const user = await ctx.prisma.user.update({
            where: { id: userId },
            data: {
              stripeId: stripeUserId,
            },
          })

          return user
        },
      })

    t.field('signup', {
      type: 'AuthPayload',
      args: {
        username: stringArg({ nullable: true }),
        email: stringArg(),
        password: stringArg(),
      },
      resolve: async (parent, { username, email, password }, ctx) => {
        const hashedPassword = await hash(password, 10)
        const user = await ctx.prisma.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
          },
        })
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: stringArg(),
        password: stringArg(),
      },
      resolve: async (parent, { email, password }, context) => {
        const user = await context.prisma.user.findOne({
          where: {
            email,
          },
        })
        if (!user) {
          throw new Error(`No user found for email: ${email}`)
        }
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
          throw new Error('Invalid password')
        }
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('followUser', {
      type: 'User',
      args: {
        followerId: intArg(),
        followingId: intArg(),
      },
      resolve: async (parent, { followerId, followingId }, ctx) => {
        //console.log('start')
        const user = await ctx.prisma.user.update({
          where: { id: followerId },
          data: { following: { connect: { id: followingId } } },
        })
        //console.log('after')

        // const user = await ctx.prisma.user.update({
        //   where: { id: followingId },
        //   data: { followers: { connect: { id: followerId } } },
        // })

        // const folloingNotificationFeed = getStreamClient.feed(
        //   'notification',
        //   followingId,
        // )

        // const folloingUserFeed = getStreamClient.feed('user', followingId)

        // folloingNotificationFeed.addActivity({
        //   actor: getStreamClient.user(followerId),
        //   verb: 'follow',
        //   object: `follow:${followingUserId}`,
        //   followerId,
        // })

        // folloingUserFeed.addActivity({
        //   actor: getStreamClient.user(followerId),
        //   verb: 'follow',
        //   object: `follow:${followingUserId}`,
        //   followerId,
        // })
        //console.log('finish')

        return user
      },
    })

    t.field('unfollowUser', {
      type: 'User',
      args: {
        followerId: intArg(),
        followingId: intArg(),
      },
      resolve: async (parent, { followerId, followingId }, ctx) => {
        const user = await ctx.prisma.user.update({
          where: { id: followerId },
          data: { following: { disconnect: { id: followingId } } },
        })

        const folloingNotificationFeed = getStreamClient.feed(
          'notifications',
          followingId,
        )

        // folloingNotificationFeed.addActivity({
        //   actor: getStreamClient.user(followerId),
        //   verb: 'follow',
        //   object: `follow:${followingUserId}`,
        //   followerId,
        // })

        return user
      },
    })

    t.field('vote', {
      type: 'Vote',
      args: {
        pollId: intArg(),
        chapterId: intArg(),
        option: arg({ type: 'VoteOption' }),
      },
      resolve: async (parent, { chapterId, pollId, option }, ctx) => {
        const userId = getUserId(ctx)

        const vote = await ctx.prisma.vote.findOne({
          where: {
            userId_pollId_vote_key: {
              userId,
              pollId,
            },
          },
          select: { id: true },
        })

        if (vote) throw new Error(`You've already voted.`)
        
        const myVote = await ctx.prisma.vote.create({
          data: {
            user: { connect: { id: userId } },
            poll: { connect: { id: pollId } },
            option,
          },
        })

        const opt1Count = await ctx.prisma.vote.count({
          where: {
            AND: [
              { pollId },
              { option: { equals: 'opt1' } },
            ],
          },
        })

        const totalVotes = await ctx.prisma.vote.count({
          where: {
            AND:[
              { pollId },
              {
                OR: [
                  { option: 'opt1' },
                  { option: 'opt2' },
                  { option: 'opt3' },
                ],
              },
            ]
          },
        })
        
        ////console.log('opt1Count = ', opt1Count)
        ////console.log('totalVotes = ', totalVotes)

        const rating = totalVotes > 7 && (opt1Count / totalVotes).toFixed(2) * 100

        ////console.log('rating = ', rating)

        /* const chch = */ typeof rating === 'number' && await ctx.prisma.chapter.update({
          where: {
            id: chapterId,
          },
          data: {
            rating
          }
        })

        ////console.log(chch)

        return myVote        
      },
    })
  },
})

let makeStripeConnectRequest = async (code) => {
  let clientId = process.env.STRIPE_CLIENT_ID
  let secretKey = process.env.STRIPE_SECRET_KEY

  let params = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: secretKey,
    code: code,
    requested_capabilities: ['legacy_payments', 'transfers'],
    suggested_capabilities: ['legacy_payments', 'transfers'],
    assert_capabilities: ['transfers'],
  }

  let url = 'https://connect.stripe.com/oauth/token'

  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => res.json())
    .catch((err) => {
      // logger.log('StripeSetup.makeStripeConnectRequest.error', err);
    })
}

module.exports = {
  Mutation,
}
