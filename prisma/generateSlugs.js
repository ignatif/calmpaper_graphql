const { PrismaClient } = require('@prisma/client')
const slugify = require('slugify')

const prisma = new PrismaClient()

async function main() {
  console.log('start')
  const existingBooks = await prisma.book.findMany().then((r) => r)
  existingBooks.map(async (book) => {
    const slug = slugify(book.name, { lower: true })
    const existing = await prisma.book.findOne({ where: { id: book.id } })

    if (!existing) {
      // 3) If doesn't exist - create a book with current slug -> done
      console.log(`creating a book with slug ${slug}`)
      await prisma.book.update({ where: { id: book.id }, data: { slug } })
      console.log('created')
    } else {
      // 4) If exists - create a book without slug.
      console.log(`creating a book with slug ${slug}-${book.id}`)
      await prisma.book.update({
        where: {
          id: book.id,
        },
        data: {
          slug: `${slug}-${book.id}`,
        },
      })
      console.log('created')
    }
  })
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.disconnect()
  })
