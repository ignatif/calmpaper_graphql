const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const genres = [
  'Cookbook',

  'Comic book',

  'Diary',

  'Coming-of-age',

  'Dictionary',

  'Crime',

  'Encyclopedia',

  'Drama',

  'Guide',

  'Fairytale',

  'Health/fitness',

  'Fantasy',

  'History',

  'Graphic novel',

  'Home and garden',

  'Historical fiction',

  'Humor',

  'Horror',

  'Journal',

  'Mystery',

  'Math',

  'Paranormal romance',

  'Memoir',

  'Picture book',

  'Philosophy',

  'Poetry',

  'Prayer',

  'Political thriller',

  'Religion, spirituality, and new age',

  'Romance',

  'Textbook',

  'Satire',

  'True crime',

  'Science fiction',

  'Review',

  'Short story',

  'Science',

  'Suspense',

  'Self help',

  'Thriller',

  'Sports and leisure',

  'Western',

  'Travel',

  'Young adult',

  'True crime',
  ,
]

async function main() {
  genres.forEach(async (genre) => {
    await prisma.genre.create({
      data: {
        label: genre,
      },
    })
    console.log(genre, 'seed')
  })
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.disconnect()
  })

