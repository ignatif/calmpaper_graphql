const stream = require('getstream').default
const getStreamClient = stream.connect(
  process.env.GETSTREAM_KEY,
  process.env.GETSTREAM_SECRET,
)
const { getUserId } = require('../../utils')

const notifications = async (resolve, root, args, context, info) => {
  const result = await resolve(root, args, context, info)

  // Book
  if (info.fieldName === 'createOneBook') {
    const userId = getUserId(context)
    const userFeed = getStreamClient.feed('user', userId)

    userFeed.addActivity({
      actor: getStreamClient.user(userId),
      verb: 'add',
      object: `book:${result.id}`,
      bookId: result.id,
      foreignId: `book:${result.id}`,
      userId,
    })
  }

  if (info.fieldName === 'deleteOneBook') {
    const userId = getUserId(context)
    const userFeed = getStreamClient.feed('user', userId)

    userFeed.removeActivity({ foreignId: `book:${result.id}` })
  }

  // Chapter
  if (info.fieldName === 'createOneChapter') {
    const userId = getUserId(context)
    const userFeed = getStreamClient.feed('user', userId)

    userFeed.addActivity({
      actor: getStreamClient.user(userId),
      to: [`book:${result.bookId}`],
      verb: 'add',
      object: `chapter:${result.id}`,
      bookId: result.bookId,
      chapterId: result.id,
      userId,
    })
  }

  // User follows
  if (info.fieldName === 'followUser') {
    const userId = getUserId(context)
    const followingUserId = args.followingId
    console.log('followingUserId')
    console.log(followingUserId)
    const userFeed = getStreamClient.feed('notifications', followingUserId)

    userFeed.addActivity({
      actor: getStreamClient.user(userId),
      // to: [`user:${followingUserId}`],
      verb: 'follow',
      object: `follow:${followingUserId}`,
      userId,
      followerId: userId,
    })
  }
  // if (info.fieldName === 'deleteOneChapter') {
  //   console.log('after Result:')
  //   console.log(info.fieldName)
  //   console.log(result)
  // }

  // Comment
  // if (info.fieldName === 'createOneComment') {
  //   const userId = getUserId(context)
  //   const userFeed = getStreamClient.feed('all', userId)

  //   userFeed.addActivity({
  //     actor: getStreamClient.user(userId),
  //     verb: 'comment',
  //     to: [`notifications:${comment.book.authorId}`],
  //     object: `book:${comment.id}`,
  //     user,
  //     bookId,
  //   })
  // }
  // if (info.fieldName === 'deleteOneComment') {
  //   console.log('after Result:')
  //   console.log(info.fieldName)
  //   console.log(result)
  // }

  // Review
  // if (info.fieldName === 'createOneReview') {
  //   const userId = getUserId(context)
  //   const userFeed = getStreamClient.feed('all', userId)
  //   console.log('args')
  //   console.log(args)

  //   console.log(result)
  //   userFeed.addActivity({
  //     actor: getStreamClient.user(userId),
  //     to: [`notifications:${res.book.authorId}`],
  //     verb: 'review',
  //     object: `book:${bookId}`,
  //     bookId: bookId,
  //     userId,
  //     reviewId: result.id,
  //   })
  // }
  // userFeed.addActivity({
  //   actor: getStreamClient.user(userId),
  //   verb: 'comment',
  //   to: [`notifications:${comment.book.authorId}`],
  //   object: `book:${comment.id}`,
  //   user,
  //   bookId,
  // })
  // if (info.fieldName === 'deleteOneReview') {
  //   console.log('after Result:')
  //   console.log(info.fieldName)
  //   console.log(result)
  // }

  // Like
  // if (info.fieldName === 'createOneLike') {
  //   const userId = getUserId(context)
  //   const userFeed = getStreamClient.feed('all', userId)

  //   userFeed.addActivity({
  //     actor: getStreamClient.user(userId),
  //     verb: 'comment',
  //     to: [`notifications:${comment.book.authorId}`],
  //     object: `book:${comment.id}`,
  //     user,
  //     bookId,
  //   })
  // }
  // if (info.fieldName === 'deleteOneLike') {
  //   console.log('after Result:')
  //   console.log(info.fieldName)
  //   console.log(result)
  // }

  return result
}

module.exports = {
  notifications,
}
