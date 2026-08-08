import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client.ts'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const demoPassword = 'calmpaper'

const authors = [
  {
    id: 'seed-user-mary',
    username: 'mary-shelley',
    email: 'demo@calmpaper.com',
    fullname: 'Mary Shelley',
    years: '1797 — 1851',
    location: 'London · Romantic era',
    bio: 'Novelist, editor, and keeper of bright questions about creation, responsibility, and belonging.',
    accent: '#d96b43',
    legacyFollowers: 18420,
  },
  {
    id: 'seed-user-jane',
    username: 'jane-austen',
    email: 'jane.austen@example.com',
    fullname: 'Jane Austen',
    years: '1775 — 1817',
    location: 'Hampshire · Georgian era',
    bio: 'An exact observer of rooms, manners, money, and the surprising distance between pride and affection.',
    accent: '#a95e7a',
    legacyFollowers: 22704,
  },
  {
    id: 'seed-user-homer',
    username: 'homer',
    email: 'homer@example.com',
    fullname: 'Homer',
    years: 'c. 8th century BCE',
    location: 'Ionia · Archaic Greece',
    bio: 'An itinerant voice for difficult journeys, unreliable seas, and the long human work of returning home.',
    accent: '#2f7772',
    legacyFollowers: 31028,
  },
  {
    id: 'seed-user-dante',
    username: 'dante-alighieri',
    email: 'dante.alighieri@example.com',
    fullname: 'Dante Alighieri',
    years: 'c. 1265 — 1321',
    location: 'Florence · Late Middle Ages',
    bio: 'Poet, exile, and meticulous cartographer of the moral imagination.',
    accent: '#9e3d32',
    legacyFollowers: 15330,
  },
  {
    id: 'seed-user-shakespeare',
    username: 'william-shakespeare',
    email: 'william.shakespeare@example.com',
    fullname: 'William Shakespeare',
    years: '1564 — 1616',
    location: 'Stratford · English Renaissance',
    bio: 'Playwright and poet, currently typing, deleting, and typing the same fourteen lines again.',
    accent: '#7a5aa6',
    legacyFollowers: 28991,
  },
  {
    id: 'seed-user-whitman',
    username: 'walt-whitman',
    email: 'walt.whitman@example.com',
    fullname: 'Walt Whitman',
    years: '1819 — 1892',
    location: 'New York · American Renaissance',
    bio: 'Poet, printer, nurse, and enthusiastic correspondent with the multitudes.',
    accent: '#50764a',
    legacyFollowers: 12406,
  },
]

const books = [
  {
    id: 'seed-book-frankenstein',
    slug: 'frankenstein',
    name: 'Frankenstein',
    author: 'mary-shelley',
    year: '1818',
    kicker: 'A creator. A creature. A debt neither can escape.',
    description:
      'A frame of letters opens onto an experiment in life—and the loneliness that follows when invention outruns care.',
    genres: ['Gothic', 'Science fiction', 'Letters'],
    coverFrom: '#e6b86a',
    coverTo: '#b85f3b',
    coverInk: '#25160f',
    coverMark: '⚡',
    legacyLikes: 4920,
    legacyReaders: 18400,
    createdAt: '2026-07-18T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-frankenstein-1',
        slug: 'letters-from-the-north',
        title: 'Letters from the north',
        dek: 'A ship is caught in ice. A stranger approaches across the white.',
        excerpt:
          'The horizon had become a single pale thought. Then, against it, we saw a figure moving where no road could possibly be.',
        content:
          'The horizon had become a single pale thought. Then, against it, we saw a figure moving where no road could possibly be. The crew watched in silence as the distance between our two stories narrowed.',
        readTime: '8 min',
        legacyLikes: 864,
        createdAt: '2026-07-18T09:00:00.000Z',
      },
      {
        id: 'seed-chapter-frankenstein-2',
        slug: 'the-work-begins',
        title: 'The work begins',
        dek: 'Ambition narrows the world to one locked room.',
        excerpt:
          'I mistook attention for devotion. Each solved question made the unanswered one louder, until I could hear nothing else.',
        content:
          'I mistook attention for devotion. Each solved question made the unanswered one louder, until I could hear nothing else. The room grew smaller while my ambition claimed to make the world larger.',
        readTime: '11 min',
        legacyLikes: 712,
        createdAt: '2026-07-19T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-book-pride',
    slug: 'pride-and-prejudice',
    name: 'Pride and Prejudice',
    author: 'jane-austen',
    year: '1813',
    kicker: 'First impressions are only the opening draft.',
    description:
      'A bright social comedy about judgment, class, family, and the courage required to revise an opinion.',
    genres: ['Comedy', 'Romance', 'Society'],
    coverFrom: '#edc9cc',
    coverTo: '#9e5973',
    coverInk: '#351522',
    coverMark: '✦',
    legacyLikes: 6112,
    legacyReaders: 22109,
    createdAt: '2026-07-16T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-pride-1',
        slug: 'a-new-neighbour',
        title: 'A new neighbour',
        dek: 'News travels faster than introductions.',
        excerpt:
          'By breakfast, the entire neighbourhood had furnished the stranger with an income, a temperament, and several intentions.',
        content:
          'By breakfast, the entire neighbourhood had furnished the stranger with an income, a temperament, and several intentions. None of these details required the inconvenience of meeting him.',
        readTime: '7 min',
        legacyLikes: 1092,
        createdAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'seed-chapter-pride-2',
        slug: 'the-assembly',
        title: 'The assembly',
        dek: 'A dance arranges every prejudice in the room.',
        excerpt:
          'He declined the dance with such economy that Elizabeth decided to spend her amusement elsewhere—and mostly at his expense.',
        content:
          'He declined the dance with such economy that Elizabeth decided to spend her amusement elsewhere—and mostly at his expense. The room noticed, as rooms devoted to amusement always do.',
        readTime: '9 min',
        legacyLikes: 948,
        createdAt: '2026-07-21T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-book-odyssey',
    slug: 'the-odyssey',
    name: 'The Odyssey',
    author: 'homer',
    year: 'c. 8th century BCE',
    kicker: 'Every road home invents another detour.',
    description:
      'A sea-borne epic of wit, endurance, hospitality, monsters, memory, and a household waiting through twenty years.',
    genres: ['Epic', 'Adventure', 'Myth'],
    coverFrom: '#8ec2bd',
    coverTo: '#276a71',
    coverInk: '#092a2d',
    coverMark: '≈',
    legacyLikes: 5780,
    legacyReaders: 19645,
    createdAt: '2026-07-15T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-odyssey-1',
        slug: 'the-absent-king',
        title: 'The absent king',
        dek: 'A son grows up among unwanted guests.',
        excerpt:
          'They ate his father’s bread and called the waiting foolish. Telemachus counted the empty chairs and learned another arithmetic.',
        content:
          'They ate his father’s bread and called the waiting foolish. Telemachus counted the empty chairs and learned another arithmetic: how absence multiplies when a house is full.',
        readTime: '12 min',
        legacyLikes: 883,
        createdAt: '2026-07-17T12:00:00.000Z',
      },
      {
        id: 'seed-chapter-odyssey-2',
        slug: 'the-island-of-names',
        title: 'The island of names',
        dek: 'A clever answer becomes a dangerous boast.',
        excerpt:
          'To escape, he made himself Nobody. To be remembered, he shouted his name back at the dark mouth of the cave.',
        content:
          'To escape, he made himself Nobody. To be remembered, he shouted his name back at the dark mouth of the cave. Pride is a sail that catches every wind, including the one blowing homeward.',
        readTime: '14 min',
        legacyLikes: 791,
        createdAt: '2026-07-22T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-book-comedy',
    slug: 'the-divine-comedy',
    name: 'The Divine Comedy',
    author: 'dante-alighieri',
    year: '1321',
    kicker: 'A wrong turn, three realms, one patient guide.',
    description:
      'An exile walks through the architecture of consequence, learning what must be released before he can see the stars.',
    genres: ['Epic', 'Poetry', 'Allegory'],
    coverFrom: '#d98d68',
    coverTo: '#78312d',
    coverInk: '#2d0c09',
    coverMark: '●',
    legacyLikes: 4211,
    legacyReaders: 14775,
    createdAt: '2026-07-14T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-comedy-1',
        slug: 'the-dark-wood',
        title: 'The dark wood',
        dek: 'The straight road disappears.',
        excerpt:
          'At the middle of the story I had planned, I found myself in another story entirely, with no path that admitted it was a path.',
        content:
          'At the middle of the story I had planned, I found myself in another story entirely, with no path that admitted it was a path. The trees kept their counsel.',
        readTime: '10 min',
        legacyLikes: 644,
        createdAt: '2026-07-19T14:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-book-sonnets',
    slug: 'the-sonnets',
    name: 'The Sonnets',
    author: 'william-shakespeare',
    year: '1609',
    kicker: 'Fourteen lines against time.',
    description:
      'A sequence of compact arguments with beauty, desire, betrayal, memory, and the unruly future reader.',
    genres: ['Poetry', 'Love', 'Time'],
    coverFrom: '#c7b0dc',
    coverTo: '#6a4a85',
    coverInk: '#25142f',
    coverMark: '14',
    legacyLikes: 3872,
    legacyReaders: 13611,
    createdAt: '2026-07-13T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-sonnets-1',
        slug: 'against-the-clock',
        title: 'Against the clock',
        dek: 'The poem tries to keep what the hour takes.',
        excerpt:
          'Time edits without asking. I answer in ink, preserving not the face itself but the attention once given to it.',
        content:
          'Time edits without asking. I answer in ink, preserving not the face itself but the attention once given to it. Fourteen lines make a little room where an hour may hesitate.',
        readTime: '4 min',
        legacyLikes: 708,
        createdAt: '2026-07-23T06:00:00.000Z',
      },
    ],
  },
  {
    id: 'seed-book-leaves',
    slug: 'leaves-of-grass',
    name: 'Leaves of Grass',
    author: 'walt-whitman',
    year: '1855',
    kicker: 'A book broad enough to contradict itself.',
    description:
      'An expanding democratic song of bodies, work, streets, fields, grief, comradeship, and the self among multitudes.',
    genres: ['Poetry', 'Nature', 'Self'],
    coverFrom: '#b9cf9b',
    coverTo: '#52704a',
    coverInk: '#162811',
    coverMark: '❧',
    legacyLikes: 2994,
    legacyReaders: 11028,
    createdAt: '2026-07-12T08:00:00.000Z',
    chapters: [
      {
        id: 'seed-chapter-leaves-1',
        slug: 'song-of-the-open-page',
        title: 'Song of the open page',
        dek: 'The reader is invited to stand nearby.',
        excerpt:
          'Bring the dust from your road. I have no velvet rope for this poem; only enough grass for both of us to sit.',
        content:
          'Bring the dust from your road. I have no velvet rope for this poem; only enough grass for both of us to sit. The page is not complete until your weather enters it.',
        readTime: '6 min',
        legacyLikes: 526,
        createdAt: '2026-07-22T15:00:00.000Z',
      },
    ],
  },
]

const follows = [
  ['mary-shelley', 'jane-austen'],
  ['mary-shelley', 'homer'],
  ['mary-shelley', 'dante-alighieri'],
  ['jane-austen', 'mary-shelley'],
  ['jane-austen', 'william-shakespeare'],
  ['homer', 'dante-alighieri'],
  ['homer', 'walt-whitman'],
  ['dante-alighieri', 'homer'],
  ['william-shakespeare', 'jane-austen'],
  ['william-shakespeare', 'homer'],
  ['walt-whitman', 'mary-shelley'],
]

const comments = [
  {
    id: 'seed-comment-jane-frankenstein',
    author: 'jane-austen',
    book: 'frankenstein',
    body: 'The creature observes a room more carefully than most eligible gentlemen. The tragedy is that nobody permits him a proper introduction.',
    legacyLikes: 482,
    createdAt: '2026-07-23T08:42:00.000Z',
    replies: [
      {
        id: 'seed-reply-mary-jane',
        author: 'mary-shelley',
        body: 'Exactly. He enters society with no letter of recommendation.',
        legacyLikes: 219,
        createdAt: '2026-07-23T08:48:00.000Z',
      },
    ],
  },
  {
    id: 'seed-comment-homer-frankenstein',
    author: 'homer',
    book: 'frankenstein',
    body: 'A maker who refuses the duties of hospitality creates his own monster long before the lightning does.',
    legacyLikes: 367,
    createdAt: '2026-07-23T08:17:00.000Z',
    replies: [
      {
        id: 'seed-reply-dante-homer',
        author: 'dante-alighieri',
        body: 'I have a circle in mind, but perhaps that is editorial overreach.',
        legacyLikes: 188,
        createdAt: '2026-07-23T08:29:00.000Z',
      },
    ],
  },
  {
    id: 'seed-comment-shakespeare-pride',
    author: 'william-shakespeare',
    book: 'pride-and-prejudice',
    body: 'Five acts would have made this courtship faster, though certainly not wiser.',
    legacyLikes: 295,
    createdAt: '2026-07-23T07:59:00.000Z',
    replies: [],
  },
  {
    id: 'seed-comment-mary-odyssey',
    author: 'mary-shelley',
    book: 'the-odyssey',
    body: 'The most frightening creature here may be the version of oneself that survives every island and still expects to be recognised.',
    legacyLikes: 401,
    createdAt: '2026-07-23T06:43:00.000Z',
    replies: [],
  },
]

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 12)
  const usersBySlug = new Map()

  for (const author of authors) {
    const user = await prisma.user.upsert({
      where: { username: author.username },
      create: { ...author, passwordHash },
      update: { ...author, passwordHash },
    })
    usersBySlug.set(user.username, user)
  }

  const genres = new Map()
  for (const label of [...new Set(books.flatMap((book) => book.genres))]) {
    const genre = await prisma.genre.upsert({
      where: { label },
      create: { label },
      update: {},
    })
    genres.set(label, genre)
  }

  const booksBySlug = new Map()
  for (const sample of books) {
    const { author, chapters, genres: labels, createdAt, ...bookData } = sample
    const commonRelationData = {
      authorId: usersBySlug.get(author).id,
      createdAt: new Date(createdAt),
    }
    const connectedGenres = labels.map((label) => ({ id: genres.get(label).id }))
    const book = await prisma.book.upsert({
      where: { slug: sample.slug },
      create: {
        ...bookData,
        ...commonRelationData,
        genres: { connect: connectedGenres },
      },
      update: {
        ...bookData,
        ...commonRelationData,
        genres: { set: connectedGenres },
      },
    })
    booksBySlug.set(book.slug, book)

    for (const chapter of chapters) {
      await prisma.chapter.upsert({
        where: { slug: chapter.slug },
        create: {
          ...chapter,
          createdAt: new Date(chapter.createdAt),
          authorId: usersBySlug.get(author).id,
          bookId: book.id,
        },
        update: {
          ...chapter,
          createdAt: new Date(chapter.createdAt),
          authorId: usersBySlug.get(author).id,
          bookId: book.id,
        },
      })
    }
  }

  for (const [followerSlug, followingSlug] of follows) {
    const followerId = usersBySlug.get(followerSlug).id
    const followingId = usersBySlug.get(followingSlug).id
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    })
  }

  for (const sample of comments) {
    const bookId = booksBySlug.get(sample.book).id
    const comment = await prisma.comment.upsert({
      where: { id: sample.id },
      create: {
        id: sample.id,
        body: sample.body,
        legacyLikes: sample.legacyLikes,
        createdAt: new Date(sample.createdAt),
        authorId: usersBySlug.get(sample.author).id,
        bookId,
      },
      update: {
        body: sample.body,
        legacyLikes: sample.legacyLikes,
        createdAt: new Date(sample.createdAt),
        authorId: usersBySlug.get(sample.author).id,
        bookId,
      },
    })
    for (const reply of sample.replies) {
      await prisma.comment.upsert({
        where: { id: reply.id },
        create: {
          id: reply.id,
          body: reply.body,
          legacyLikes: reply.legacyLikes,
          createdAt: new Date(reply.createdAt),
          authorId: usersBySlug.get(reply.author).id,
          bookId,
          parentId: comment.id,
        },
        update: {
          body: reply.body,
          legacyLikes: reply.legacyLikes,
          createdAt: new Date(reply.createdAt),
          authorId: usersBySlug.get(reply.author).id,
          bookId,
          parentId: comment.id,
        },
      })
    }
  }

  const mary = usersBySlug.get('mary-shelley')
  for (const slug of ['pride-and-prejudice', 'the-odyssey']) {
    const book = booksBySlug.get(slug)
    await prisma.libraryEntry.upsert({
      where: { userId_bookId: { userId: mary.id, bookId: book.id } },
      create: { userId: mary.id, bookId: book.id },
      update: {},
    })
  }

  console.log(`Seeded ${authors.length} writers, ${books.length} books, and sample discussions.`)
  console.log(`Demo login: demo@calmpaper.com / ${demoPassword}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
