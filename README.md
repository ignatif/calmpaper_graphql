# Calmpaper GraphQL Server

**GraphQL server with JavaScript (Node.js)** based on [Prisma Client](https://github.com/prisma/prisma2/blob/master/docs/prisma-client-js/api.md) & [graphql-yoga](https://github.com/prisma/graphql-yoga).

## Set up a project

add .env file inside prisma folder with the following:

```
DB_URL=file:dev.db
```


```
1) yarn
2) npx prisma migrate save --name 'init' --experimental && npx prisma migrate up --experimental
3) npx prisma generate
4) yarn dev
```

The project should be up and running on http://localhost:4000


## Next steps

- Explore [Prisma Documentation](https://www.prisma.io/docs/)
