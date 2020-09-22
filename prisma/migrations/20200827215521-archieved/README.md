# Migration `20200827215521-archieved`

This migration has been generated at 8/27/2020, 9:55:21 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
PRAGMA foreign_keys=OFF;

ALTER TABLE "Book" ADD COLUMN "archived" BOOLEAN  DEFAULT false;

PRAGMA foreign_key_check;

PRAGMA foreign_keys=ON;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200827184607-user-password..20200827215521-archieved
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
@@ -39,8 +39,9 @@
   id             Int        @default(autoincrement()) @id
   name           String
   description    String
   image          String?
+  archived       Boolean?   @default(false)
   createdAt      DateTime   @default(now())
   author         User?      @relation("UserBookAuthor", fields: [authorId], references: [id])
   authorId       Int?
   readers        User[]     @relation("UserBookReader")
```


