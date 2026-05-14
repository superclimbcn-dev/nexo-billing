-- CreateTable: blog_posts and blog_comments (public, no tenant_id — global content)
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "video_url" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Equipo Nexo',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "blog_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "post_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_published_created_at_idx" ON "blog_posts"("published", "created_at");
CREATE INDEX IF NOT EXISTS "blog_posts_category_published_idx" ON "blog_posts"("category", "published");
CREATE INDEX IF NOT EXISTS "blog_posts_featured_published_idx" ON "blog_posts"("featured", "published");
CREATE INDEX IF NOT EXISTS "blog_comments_post_id_approved_created_at_idx" ON "blog_comments"("post_id", "approved", "created_at");

-- AddForeignKey
ALTER TABLE "blog_comments"
    ADD CONSTRAINT "blog_comments_post_id_fkey"
    FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON "blog_posts"
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();
