-- Migration: Threaded Comments (Contraditório System)
-- Enables nested replies for debate and discussion threads

-- Add parent_comment_id for threading
ALTER TABLE issue_comments_852 ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES issue_comments_852(id) ON DELETE CASCADE;
ALTER TABLE issue_comments_852 ADD COLUMN IF NOT EXISTS depth INT DEFAULT 0;
ALTER TABLE issue_comments_852 ADD COLUMN IF NOT EXISTS author_id UUID;

-- Add index for efficient thread fetching
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent ON issue_comments_852 (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_thread ON issue_comments_852 (issue_id, depth, created_at);

-- Create function to get full comment thread for an issue
CREATE OR REPLACE FUNCTION get_comment_thread(issue_uuid UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  issue_id UUID,
  body TEXT,
  is_ai BOOLEAN,
  parent_comment_id UUID,
  depth INT,
  author_id UUID,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments
    SELECT 
      c.id,
      c.created_at,
      c.issue_id,
      c.body,
      c.is_ai,
      c.parent_comment_id,
      c.depth,
      c.author_id,
      c.id::TEXT as path
    FROM issue_comments_852 c
    WHERE c.issue_id = issue_uuid AND c.parent_comment_id IS NULL
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
      c.id,
      c.created_at,
      c.issue_id,
      c.body,
      c.is_ai,
      c.parent_comment_id,
      c.depth,
      c.author_id,
      ct.path || ',' || c.id::TEXT
    FROM issue_comments_852 c
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
  )
  SELECT * FROM comment_tree
  ORDER BY path, created_at;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policy for comment replies
CREATE POLICY "issue_comments_reply_own" ON issue_comments_852
  FOR UPDATE USING (author_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Add notification trigger for replies
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply (has parent), queue notification
  IF NEW.parent_comment_id IS NOT NULL THEN
    INSERT INTO notification_queue_852 (type, payload, created_at)
    VALUES (
      'comment_reply',
      jsonb_build_object(
        'issue_id', NEW.issue_id,
        'comment_id', NEW.id,
        'parent_comment_id', NEW.parent_comment_id,
        'reply_body', substring(NEW.body, 1, 200)
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_reply ON issue_comments_852;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON issue_comments_852
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- Add depth calculation trigger
CREATE OR REPLACE FUNCTION calculate_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    NEW.depth := 0;
  ELSE
    SELECT COALESCE(depth + 1, 0) INTO NEW.depth
    FROM issue_comments_852
    WHERE id = NEW.parent_comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_calculate_depth ON issue_comments_852;
CREATE TRIGGER auto_calculate_depth
  BEFORE INSERT ON issue_comments_852
  FOR EACH ROW
  EXECUTE FUNCTION calculate_comment_depth();
