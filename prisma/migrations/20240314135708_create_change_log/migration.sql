-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "release_date" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "bugs" TEXT NOT NULL,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);
