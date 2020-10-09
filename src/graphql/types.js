const { objectType } = require('@nexus/schema')

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
}
