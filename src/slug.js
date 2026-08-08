import slugify from 'slugify'

export const makeSlug = (value) =>
  slugify(value, { lower: true, strict: true, trim: true })

export async function uniqueSlug(model, value) {
  const base = makeSlug(value) || 'untitled'
  let slug = base
  let suffix = 2

  while (await model.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}
