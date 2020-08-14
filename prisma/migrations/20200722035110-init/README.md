# Migration `20200722035110-init`

This migration has been generated at 7/22/2020, 3:51:10 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
PRAGMA foreign_keys=OFF;

CREATE TABLE "User" (
"avatar" TEXT ,
"email" TEXT ,
"firstname" TEXT ,
"fullname" TEXT ,
"getStreamToken" TEXT ,
"givenname" TEXT ,
"googleId" TEXT ,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"username" TEXT )

CREATE TABLE "Book" (
"authorId" INTEGER ,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"description" TEXT NOT NULL,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"image" TEXT ,
"name" TEXT NOT NULL,
"views" INTEGER NOT NULL DEFAULT 0,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Chapter" (
"authorId" INTEGER ,
"bookId" INTEGER ,
"content" TEXT NOT NULL,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"image" TEXT ,
"title" TEXT ,
"views" INTEGER NOT NULL DEFAULT 0,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Tag" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"label" TEXT NOT NULL)

CREATE TABLE "Genre" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"label" TEXT NOT NULL)

CREATE TABLE "Comment" (
"authorId" INTEGER ,
"body" TEXT NOT NULL,
"bookId" INTEGER ,
"chapterId" INTEGER ,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"isChild" BOOLEAN NOT NULL DEFAULT false,
"parentId" INTEGER ,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Review" (
"authorId" INTEGER ,
"bookId" INTEGER ,
"chapterId" INTEGER ,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"message" TEXT ,
"stars" INTEGER NOT NULL,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Like" (
"authorId" INTEGER ,
"bookId" INTEGER ,
"chapterId" INTEGER ,
"commentId" INTEGER ,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"reviewId" INTEGER ,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Notification" (
"authorId" INTEGER ,
"bookId" INTEGER ,
"chapterId" INTEGER ,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"reviewId" INTEGER ,FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("reviewId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "_UserBookReader" (
"A" INTEGER NOT NULL,
"B" INTEGER NOT NULL,FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)

CREATE TABLE "_UserFollowers" (
"A" INTEGER NOT NULL,
"B" INTEGER NOT NULL,FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)

CREATE TABLE "_BookToTag" (
"A" INTEGER NOT NULL,
"B" INTEGER NOT NULL,FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE)

CREATE TABLE "_BookToGenre" (
"A" INTEGER NOT NULL,
"B" INTEGER NOT NULL,FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE)

CREATE UNIQUE INDEX "User.username" ON "User"("username")

CREATE UNIQUE INDEX "User.email" ON "User"("email")

CREATE UNIQUE INDEX "User.googleId" ON "User"("googleId")

CREATE UNIQUE INDEX "User.getStreamToken" ON "User"("getStreamToken")

CREATE UNIQUE INDEX "_UserBookReader_AB_unique" ON "_UserBookReader"("A","B")

CREATE  INDEX "_UserBookReader_B_index" ON "_UserBookReader"("B")

CREATE UNIQUE INDEX "_UserFollowers_AB_unique" ON "_UserFollowers"("A","B")

CREATE  INDEX "_UserFollowers_B_index" ON "_UserFollowers"("B")

CREATE UNIQUE INDEX "_BookToTag_AB_unique" ON "_BookToTag"("A","B")

CREATE  INDEX "_BookToTag_B_index" ON "_BookToTag"("B")

CREATE UNIQUE INDEX "_BookToGenre_AB_unique" ON "_BookToGenre"("A","B")

CREATE  INDEX "_BookToGenre_B_index" ON "_BookToGenre"("B")

PRAGMA foreign_key_check;

PRAGMA foreign_keys=ON;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200715061657-sdfdsfin2it..20200722035110-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,11 +1,12 @@
 generator client {
   provider = "prisma-client-js"
+  binaryTargets = ["native", "debian-openssl-1.1.x"]
 }
 datasource sqlite {
-  provider = "sqlite"
-  url = "***"
+  provider = ["sqlite", "postgres"]
+  url = "***"
 }
 model User {
```


