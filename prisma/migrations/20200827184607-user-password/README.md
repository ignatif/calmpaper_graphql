# Migration `20200827184607-user-password`

This migration has been generated at 8/27/2020, 6:46:07 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
PRAGMA foreign_keys=OFF;

ALTER TABLE "User" ADD COLUMN "password" TEXT ;

PRAGMA foreign_key_check;

PRAGMA foreign_keys=ON;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200814155649-donations..20200827184607-user-password
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
@@ -16,8 +16,9 @@
   givenname      String?
   fullname       String?
   email          String?    @unique
   avatar         String?
+  password       String?
   books          Book[]     @relation("UserBookAuthor")
   favoriteBooks  Book[]     @relation("UserBookReader")
   chapters       Chapter[]
   reviews        Review[]
```


