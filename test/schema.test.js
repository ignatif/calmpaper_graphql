import { describe, expect, test } from 'bun:test'
import { graphql } from 'graphql'
import { schema } from '../src/schema.js'

describe('GraphQL schema', () => {
  test('exposes a health query without database access', async () => {
    const result = await graphql({
      schema,
      source: '{ health }',
      contextValue: {},
    })

    expect(result).toEqual({ data: { health: 'ok' } })
  })

  test('requires authentication for protected mutations', async () => {
    const result = await graphql({
      schema,
      source: 'mutation { followUser(username: "mary-shelley") { id } }',
      contextValue: { userId: null, prisma: {} },
    })

    expect(result.errors?.[0].message).toBe('You need to sign in first')
  })
})
