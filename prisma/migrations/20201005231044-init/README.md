# Migration `20201005231044-init`

This migration has been generated at 10/5/2020, 11:10:44 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql

```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20201005231044-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,77 @@
+generator client {
+  provider = "prisma-client-js"
+}
+
+datasource db {
+  provider = "sqlite"
+  url      = "file:dev.db"
+}
+
+
+model User {
+  id             Int        @default(autoincrement()) @id
+  username       String     @unique
+  email          String?    @unique
+  avatar         String?
+  books          Book[]
+  chapters       Chapter[]
+  voices         Voice[]
+  ratings        Rating[]   @relation("RatingAuthor")
+  settedRetings  Rating[]   @relation("RatingTarget")
+}
+
+model Book {
+  id             Int        @default(autoincrement()) @id
+  name           String
+  description    String
+  image          String?
+
+  author         User?      @relation(fields: [authorUsername], references: [username])
+  authorUsername String?
+  chapters       Chapter[]
+  voices         Voice[]
+  ratings        Rating[]
+}
+
+model Chapter {
+  id             Int        @default(autoincrement()) @id
+  title          String?
+  content        String
+  image          String?
+
+  author         User?      @relation(fields: [authorUsername], references: [username])
+  authorUsername String?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  voices         Voice[]
+  ratings        Rating[]
+}
+
+model Voice {
+  id             Int        @default(autoincrement()) @id
+  url            String
+
+  author         User?      @relation(fields: [authorUsername], references: [username])
+  authorUsername String?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  ratings        Rating[]
+}
+
+model Rating {
+  id             Int        @default(autoincrement()) @id
+  stars          Int
+
+  author         User?      @relation(name: "RatingAuthor", fields: [authorUsername], references: [username])
+  authorUsername String?
+  user           User?      @relation(name: "RatingTarget", fields: [userUsername], references: [username])
+  userUsername   String?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  voice          Voice?     @relation(fields: [voiceId], references: [id])
+  voiceId        Int?
+}
```


