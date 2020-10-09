# Migration `20200929192004-init`

This migration has been generated at 9/29/2020, 7:20:04 PM.
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
"inviterId" INTEGER ,
"password" TEXT ,
"stripeId" TEXT ,
"username" TEXT ,FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE)

CREATE TABLE "Book" (
"archived" BOOLEAN  DEFAULT false,
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

CREATE TABLE "Donation" (
"amount" INTEGER NOT NULL,
"bookId" INTEGER ,
"chapterId" INTEGER ,
"createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
"currency" TEXT NOT NULL,
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
"message" TEXT ,
"payerId" INTEGER ,
"paymentId" TEXT NOT NULL,
"paymentRequestSecret" TEXT ,
"recipientId" INTEGER ,FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE)

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

CREATE UNIQUE INDEX "User.stripeId" ON "User"("stripeId")

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
migration ..20200929192004-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,154 @@
+generator client {
+  provider = "prisma-client-js"
+  binaryTargets = ["native", "debian-openssl-1.1.x"]
+}
+
+datasource sqlite {
+  provider = ["sqlite", "postgres"]
+  url = "***"
+}
+
+
+model User {
+  id             Int         @default(autoincrement()) @id
+  username       String?     @unique
+  firstname      String?
+  givenname      String?
+  fullname       String?
+  email          String?    @unique
+  avatar         String?
+  password       String?
+  books          Book[]     @relation("UserBookAuthor")
+  favoriteBooks  Book[]     @relation("UserBookReader")
+  chapters       Chapter[]
+  reviews        Review[]
+  likes          Like[]
+  comments       Comment[]
+  following      User[]     @relation("UserFollowers", references: [id])
+  followers      User[]     @relation("UserFollowers", references: [id])
+
+  inviterId      Int?
+  inviter        User?      @relation("UserInvited", references: [id], fields: [inviterId])
+  invited        User[]     @relation("UserInvited")
+
+  googleId       String?     @unique
+  getStreamToken String?     @unique
+  stripeId       String?     @unique
+
+  receivedDonations Donation[]  @relation("DonationReceiver")
+  sentDonations     Donation[]  @relation("DonationPayer")
+}
+
+model Book {
+  id             Int        @default(autoincrement()) @id
+  name           String
+  description    String
+  image          String?
+  archived       Boolean?   @default(false)
+  createdAt      DateTime   @default(now())
+  author         User?      @relation("UserBookAuthor", fields: [authorId], references: [id])
+  authorId       Int?
+  readers        User[]     @relation("UserBookReader")
+  chapters       Chapter[]
+  tags           Tag[]      @relation(references: [id])
+  genres         Genre[]    @relation(references: [id])
+  likes          Like[]
+  views          Int        @default(0)
+  reviews        Review[]
+  comments       Comment[]
+  donations      Donation[]
+}
+
+model Chapter {
+  id             Int        @default(autoincrement()) @id
+  title          String?
+  content        String
+  image          String?
+  createdAt      DateTime   @default(now())
+  author         User?      @relation(fields: [authorId], references: [id])
+  authorId       Int?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  likes          Like[]
+  views          Int        @default(0)
+  reviews        Review[]
+  comments       Comment[]
+  donations      Donation[]
+}
+
+model Tag {
+  id             Int        @default(autoincrement()) @id
+  label          String
+  books          Book[]     @relation(references: [id])
+}
+
+model Genre {
+  id             Int        @default(autoincrement()) @id
+  label          String
+  books          Book[]     @relation(references: [id])
+}
+
+model Comment {
+  id             Int        @default(autoincrement()) @id
+  body           String
+  createdAt      DateTime   @default(now())
+  author         User?      @relation(fields: [authorId], references: [id])
+  authorId       Int?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  likes          Like[]
+  replies        Comment[]  @relation("CommentReplies")
+  parentId       Int?
+  parent         Comment?   @relation("CommentReplies", fields: [parentId], references: [id])
+  isChild        Boolean    @default(false)
+}
+
+model Review {
+  id             Int        @default(autoincrement()) @id
+  stars          Int
+  message        String?
+  createdAt      DateTime   @default(now())
+  author         User?      @relation(fields: [authorId], references: [id])
+  authorId       Int?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  likes          Like[]
+}
+
+model Like {
+  id             Int        @default(autoincrement()) @id
+  createdAt      DateTime   @default(now())
+  author         User?      @relation(fields: [authorId], references: [id])
+  authorId       Int?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  comment        Comment?   @relation(fields: [commentId], references: [id])
+  commentId      Int?
+  review         Review?    @relation(fields: [reviewId], references: [id])
+  reviewId       Int?
+}
+
+model Donation {
+  id             Int        @default(autoincrement()) @id
+  amount         Int
+  currency       String
+  message        String?
+  paymentId      String
+  paymentRequestSecret String?
+  book           Book?      @relation(fields: [bookId], references: [id])
+  bookId         Int?
+  chapter        Chapter?   @relation(fields: [chapterId], references: [id])
+  chapterId      Int?
+  createdAt      DateTime   @default(now())
+
+  payerId        Int?
+  payer          User?      @relation("DonationPayer", fields: [payerId], references: [id])
+  recipientId    Int?
+  recipient      User?      @relation("DonationReceiver", fields: [recipientId], references: [id])
+}
```


