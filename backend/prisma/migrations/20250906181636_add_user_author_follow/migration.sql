-- CreateTable
CREATE TABLE "UserAuthorFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAuthorFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAuthorFollow_userId_idx" ON "UserAuthorFollow"("userId");

-- CreateIndex
CREATE INDEX "UserAuthorFollow_authorId_idx" ON "UserAuthorFollow"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuthorFollow_userId_authorId_key" ON "UserAuthorFollow"("userId", "authorId");

-- AddForeignKey
ALTER TABLE "UserAuthorFollow" ADD CONSTRAINT "UserAuthorFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuthorFollow" ADD CONSTRAINT "UserAuthorFollow_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
