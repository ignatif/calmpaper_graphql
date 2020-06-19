const { objectType } = require('@nexus/schema')

const User = objectType({
  name: 'User',
  definition(t) {
    t.model.id()
    t.model.username()
    t.model.email()
    t.model.avatar()
    t.model.books({ pagination: false })
    t.model.chapters({ pagination: false })
    t.model.voices({ pagination: false })
    t.model.ratings({ pagination: false })
  },
})

const Book = objectType({
  name: 'Book',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.description()
    t.model.image()
    t.model.author()
    t.model.chapters({ pagination: false })
    t.model.voices({ pagination: false })
    t.model.ratings({ pagination: false })
  },
})

const Chapter = objectType({
  name: 'Chapter',
  definition(t) {
    t.model.id()
    t.model.title()
    t.model.content()
    t.model.image()
    t.model.author()
    t.model.book()
    t.model.voices({ pagination: false })
    t.model.ratings({ pagination: false })
  },
})

const Voice = objectType({
  name: 'Voice',
  definition(t) {
    t.model.id()
    t.model.url()
    t.model.author()
    t.model.book()
    t.model.chapter()
    t.model.ratings({ pagination: false })
  },
})

const Rating = objectType({
  name: 'Rating',
  definition(t) {
    t.model.id()
    t.model.stars()
    t.model.author()
    t.model.user()
    t.model.book()
    t.model.chapter()
    t.model.voice()
  },
})

module.exports = {
  User,
  Book,
  Chapter,
  Voice,
  Rating,
}
