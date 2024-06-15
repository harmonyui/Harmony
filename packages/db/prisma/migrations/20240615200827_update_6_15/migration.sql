-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

INSERT INTO
    "User"
VALUES
    ('bradofrado@gmail.com', 'harmony-admin'),
    ('braydon.jones28@gmail.com', 'harmony-admin'),
    ('jacobwyliehansen@gmail.com', 'harmony-admin'),
    ('wyattthacker12@gmail.com', 'harmony-admin'),
    ('tannerhelms01@gmail.com', 'harmony-admin'),
    ('tannerhelmsllc@gmail.com', 'harmony-admin'),
    ('szujan.lin@gmail.com', 'harmony-admin');