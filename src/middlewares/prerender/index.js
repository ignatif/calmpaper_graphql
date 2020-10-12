const fetch = require('node-fetch')
const PRERENDER_TOKEN = 'q5JyQikCsiyQrPGPXy5Z'

const prerender = async (resolve, root, args, context, info) => {
  const result = await resolve(root, args, context, info)

  // Book
  if (info.fieldName === 'createBook') {
    const body = {
      prerenderToken: PRERENDER_TOKEN,
      url: `http://ec2-34-224-154-199.compute-1.amazonaws.com/@${
        result.author.username || `user${result.author.id}`
      }/${result.slug}`,
    }

    const response = await fetch('https://api.prerender.io/recache', {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    console.log('prerender response')
    console.log(response)
  }

  // Chapter
  if (info.fieldName === 'createChapter') {
    console.log('result')
    console.log(result)
    const body = {
      prerenderToken: PRERENDER_TOKEN,
      url: `http://ec2-34-224-154-199.compute-1.amazonaws.com/@${
        result.author.username || `user${result.author.id}`
      }/${result.book.slug}/${result.book.chapters.length + 1}`,
    }

    const response = await fetch('https://api.prerender.io/recache', {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    console.log('prerender response')
    console.log(response)
  }

  return result
}

module.exports = {
  prerender,
}
