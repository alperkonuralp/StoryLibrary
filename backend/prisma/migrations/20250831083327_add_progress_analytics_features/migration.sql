-- AlterTable
ALTER TABLE "UserReadingProgress" ADD COLUMN     "completionPercentage" DECIMAL(5,2),
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastReadAt" TIMESTAMP(3),
ADD COLUMN     "readingTimeSeconds" INTEGER,
ADD COLUMN     "totalParagraphs" INTEGER,
ADD COLUMN     "wordsRead" INTEGER;

-- CreateTable
CREATE TABLE "StoryAnalytics" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueReadersCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DECIMAL(5,2),
    "averageReadingTime" INTEGER,
    "averageRating" DECIMAL(3,2),
    "popularLanguage" TEXT,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readingMode" TEXT NOT NULL DEFAULT 'bilingual',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "autoSaveProgress" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryAnalytics_viewsCount_idx" ON "StoryAnalytics"("viewsCount");

-- CreateIndex
CREATE INDEX "StoryAnalytics_completionRate_idx" ON "StoryAnalytics"("completionRate");

-- CreateIndex
CREATE UNIQUE INDEX "StoryAnalytics_storyId_key" ON "StoryAnalytics"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserReadingProgress_status_idx" ON "UserReadingProgress"("status");

-- CreateIndex
CREATE INDEX "UserReadingProgress_lastReadAt_idx" ON "UserReadingProgress"("lastReadAt");

-- AddForeignKey
ALTER TABLE "StoryAnalytics" ADD CONSTRAINT "StoryAnalytics_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
