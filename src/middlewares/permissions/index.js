const { rule, shield, allow, deny } = require('graphql-shield')
const { getUserId } = require('../../utils')

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    const userId = getUserId(context)
    return Boolean(userId)
  }),
  isBookAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.book
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isChapterAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.chapter
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isCommentAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.comment
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isReviewAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.review
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isTagAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.tag
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isGenreAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.genre
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isLikeAuthor: rule()(async (parent, args, context) => {
    const id = args.where.id
    const userId = getUserId(context)
    const author = await context.prisma.like
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isGetMeRequest: rule()(async (parent, { id }, context, info) => {
    const userId = getUserId(context)
    return parent && parent.id === userId
  }),
}

const permissions = shield(
  {
    Query: {
      me: rules.isAuthenticatedUser,
      // users: rules.isAuthenticatedUser,
    },
    Mutation: {
      updateOneUser: rules.isAuthenticatedUser,
      deleteOneUser: rules.isAuthenticatedUser,

      createOneBook: rules.isAuthenticatedUser,
      updateOneBook: rules.isBookAuthor,
      deleteOneBook: rules.isBookAuthor,

      createOneChapter: rules.isAuthenticatedUser,
      updateOneChapter: rules.isChapterAuthor,
      deleteOneChapter: rules.isChapterAuthor,

      createOneComment: rules.isAuthenticatedUser,
      updateOneComment: rules.isCommentAuthor,
      deleteOneComment: rules.isCommentAuthor,

      createOneReview: rules.isAuthenticatedUser,
      updateOneReview: rules.isReviewAuthor,
      upsertOneReview: rules.isReviewAuthor,
      deleteOneReview: rules.isReviewAuthor,

      createOneTag: rules.isAuthenticatedUser,
      updateOneTag: rules.isTagAuthor,
      deleteOneTag: rules.isTagAuthor,

      createOneGenre: rules.isAuthenticatedUser,
      updateOneGenre: rules.isGenreAuthor,
      deleteOneGenre: rules.isGenreAuthor,

      createOneLike: rules.isAuthenticatedUser,
      updateOneLike: rules.isLikeAuthor,
      deleteOneLike: rules.isLikeAuthor,
    },
    User: {
      email: rules.isGetMeRequest,
    },
  },
  {
    fallbackRule: allow,
  },
)

module.exports = {
  permissions,
}
