const { rule, shield } = require('graphql-shield')
const { getUserId } = require('../../utils')

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    const userId = getUserId(context)
    return Boolean(userId)
  }),
  isBookAuthor: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.book
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isChapterAuthor: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.chapter
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isCommentAuthor: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.comment
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isReviewAuthor: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.review
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
}

const permissions = shield({
  Query: {
    me: rules.isAuthenticatedUser,
  },
  Mutation: {
    // createOneUser: rules.isAuthenticatedUser,
    // updateOneUser: rules.isAuthenticatedUser,
    // deleteOneUser: rules.isAuthenticatedUser,
    //
    // Yes:
    // createOneBook: rules.isAuthenticatedUser,
    // updateOneBook: rules.isBookAuthor,
    // deleteOneBook: rules.isBookAuthor,
    // createOneChapter: rules.isAuthenticatedUser,
    // updateOneChapter: rules.isChapterAuthor,
    // deleteOneChapter: rules.isChapterAuthor,
    // createOneComment: rules.isAuthenticatedUser,
    // updateOneComment: rules.isCommentAuthor,
    // deleteOneComment: rules.isCommentAuthor,
    // createOneReview: rules.isAuthenticatedUser,
    // updateOneReview: rules.isReviewAuthor,
    // upsertOneReview: rules.isReviewAuthor,
    // deleteOneReview: rules.isReviewAuthor,
    //
    // createOneTag: rules.isAuthenticatedUser,
    // updateOneTag: rules.isAuthenticatedUser,
    // deleteOneTag: rules.isAuthenticatedUser,
    // createOneGenre: rules.isAuthenticatedUser,
    // updateOneGenre: rules.isAuthenticatedUser,
    // deleteOneGenre: rules.isAuthenticatedUser,
    // createOneLike: rules.isAuthenticatedUser,
    // updateOneLike: rules.isAuthenticatedUser,
    // deleteOneLike: rules.isAuthenticatedUser,
  },
})

module.exports = {
  permissions,
}
