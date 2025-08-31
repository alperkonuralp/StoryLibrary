-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- CreateIndex
CREATE INDEX "Author_createdAt_idx" ON "Author"("createdAt");

-- CreateIndex
CREATE INDEX "Story_averageRating_idx" ON "Story"("averageRating");

-- CreateIndex
CREATE INDEX "Story_ratingCount_idx" ON "Story"("ratingCount");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Story_status_averageRating_idx" ON "Story"("status", "averageRating");

-- CreateIndex
CREATE INDEX "Story_status_createdAt_idx" ON "Story"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Story_createdBy_idx" ON "Story"("createdBy");

-- CreateIndex
CREATE INDEX "StoryAuthor_authorId_idx" ON "StoryAuthor"("authorId");

-- CreateIndex
CREATE INDEX "StoryAuthor_storyId_idx" ON "StoryAuthor"("storyId");

-- CreateIndex
CREATE INDEX "StoryAuthor_role_idx" ON "StoryAuthor"("role");

-- CreateIndex
CREATE INDEX "StoryCategory_categoryId_idx" ON "StoryCategory"("categoryId");

-- CreateIndex
CREATE INDEX "StoryCategory_storyId_idx" ON "StoryCategory"("storyId");

-- CreateIndex
CREATE INDEX "StorySeries_seriesId_idx" ON "StorySeries"("seriesId");

-- CreateIndex
CREATE INDEX "StorySeries_storyId_idx" ON "StorySeries"("storyId");

-- CreateIndex
CREATE INDEX "StorySeries_orderInSeries_idx" ON "StorySeries"("orderInSeries");

-- CreateIndex
CREATE INDEX "StoryTag_tagId_idx" ON "StoryTag"("tagId");

-- CreateIndex
CREATE INDEX "StoryTag_storyId_idx" ON "StoryTag"("storyId");

-- CreateIndex
CREATE INDEX "UserStoryRating_userId_idx" ON "UserStoryRating"("userId");

-- CreateIndex
CREATE INDEX "UserStoryRating_rating_idx" ON "UserStoryRating"("rating");

-- CreateIndex
CREATE INDEX "UserStoryRating_createdAt_idx" ON "UserStoryRating"("createdAt");

-- CreateIndex
CREATE INDEX "UserStoryRating_storyId_rating_idx" ON "UserStoryRating"("storyId", "rating");
