# Migration `20200814155649-donations`

This migration has been generated at 8/14/2020, 3:56:49 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
PRAGMA foreign_keys=OFF;

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

ALTER TABLE "User" ADD COLUMN "stripeId" TEXT ;

CREATE UNIQUE INDEX "User.stripeId" ON "User"("stripeId")

PRAGMA foreign_keys=off;
DROP TABLE "Notification";;
PRAGMA foreign_keys=on

PRAGMA foreign_key_check;

PRAGMA foreign_keys=ON;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200722035110-init..20200814155649-donations
--- datamodel.dml
+++ datamodel.dml
@@ -4,9 +4,9 @@
 }
 datasource sqlite {
   provider = ["sqlite", "postgres"]
-  url = "***"
+  url = "***"
 }
 model User {
@@ -27,8 +27,12 @@
   followers      User[]     @relation("UserFollowers", references: [id])
   googleId       String?     @unique
   getStreamToken String?     @unique
+  stripeId       String?     @unique
+
+  receivedDonations Donation[]  @relation("DonationReceiver")
+  sentDonations     Donation[]  @relation("DonationPayer")
 }
 model Book {
   id             Int        @default(autoincrement()) @id
@@ -45,8 +49,9 @@
   likes          Like[]
   views          Int        @default(0)
   reviews        Review[]
   comments       Comment[]
+  donations      Donation[]
 }
 model Chapter {
   id             Int        @default(autoincrement()) @id
@@ -61,8 +66,9 @@
   likes          Like[]
   views          Int        @default(0)
   reviews        Review[]
   comments       Comment[]
+  donations      Donation[]
 }
 model Tag {
   id             Int        @default(autoincrement()) @id
@@ -121,16 +127,22 @@
   review         Review?    @relation(fields: [reviewId], references: [id])
   reviewId       Int?
 }
-
-model Notification {
+model Donation {
   id             Int        @default(autoincrement()) @id
-  author         User?      @relation(fields: [authorId], references: [id])
-  authorId       Int?
+  amount         Int
+  currency       String
+  message        String?
+  paymentId      String
+  paymentRequestSecret String?
   book           Book?      @relation(fields: [bookId], references: [id])
   bookId         Int?
   chapter        Chapter?   @relation(fields: [chapterId], references: [id])
   chapterId      Int?
-  review         Comment?   @relation(fields: [reviewId], references: [id])
-  reviewId       Int?
+  createdAt      DateTime   @default(now())
+
+  payerId        Int?
+  payer          User?      @relation("DonationPayer", fields: [payerId], references: [id])
+  recipientId    Int?
+  recipient      User?      @relation("DonationReceiver", fields: [recipientId], references: [id])
 }
```


