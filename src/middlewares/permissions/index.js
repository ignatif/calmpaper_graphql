const { rule, shield, allow, deny, or } = require('graphql-shield')
const { getUserId } = require('../../utils')

const rules = {
  any: rule()((parent, args, context) => {
    return true
  }),
  isAuthenticatedUser: rule()((parent, args, context) => {
    const userId = getUserId(context)
    return Boolean(userId)
  }),
  isAdmin: rule()(async (parent, args, context) => {
    const userId = getUserId(context)
    const user = await context.prisma.user.findOne({
      where: { id: userId },
    })
    const isAdmin = user.isAdmin
    console.log('isAdmin')
    console.log('isAdmin')
    return Boolean(user.isAdmin)
  }),
  isBookAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.book
      .findOne({
        where: { id: parseInt(id) },
      })
      .author()
    return userId === author.id
  }),
  isChapterAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.chapter
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isCommentAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.comment
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isCommentBookAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const bookAuthor = await context.prisma.comment
      .findOne({ where: { id: Number(id) } })
      .book()
      .author()
    return bookAuthor.id === userId
  }),
  isCommentChapterAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const chapterAuthor = await context.prisma.comment
      .findOne({ where: { id: Number(id) } })
      .chapter()
      .author()
    console.log('isCommentChapterAuthor')
    console.log(chapterAuthor.id === userId)
    return chapterAuthor.id === userId
  }),
  isReviewAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.review
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isTagAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.tag
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isGenreAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.genre
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isLikeAuthor: rule()(async (parent, { where: { id } }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.like
      .findOne({ where: { id: Number(id) } })
      .author()
    return userId === author.id
  }),
  isGetMeRequest: rule()(async (parent, { where: { id } }, context, info) => {
    const userId = getUserId(context)
    return parent && parent.id === userId
  }),
}

const permissions = shield(
  {
    Query: {
      me: rules.isAuthenticatedUser,
      users: rules.isAuthenticatedUser,
    },
    Mutation: {
      updateOneUser: rules.isAuthenticatedUser,
      // deleteOneUser: rules.isAuthenticatedUser,

      createBook: rules.isAuthenticatedUser,
      createOneBook: rules.isAuthenticatedUser,
      updateOneBook: rules.isBookAuthor,
      deleteOneBook: or(rules.isBookAuthor, rules.isAdmin),

      createOneChapter: rules.isAuthenticatedUser,
      updateOneChapter: rules.isChapterAuthor,
      deleteOneChapter: or(rules.isChapterAuthor, rules.isAdmin),

      createOneComment: rules.isAuthenticatedUser,
      updateOneComment: rules.isCommentAuthor,
      deleteOneComment: or(
        rules.isCommentBookAuthor,
        rules.isCommentChapterAuthor,
        rules.isCommentAuthor,
        rules.isAdmin,
      ),

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

      followUser: rules.any,
      unfollowUser: rules.any,
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
