-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS "vector";

-- 创建模板表
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT '一般',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT DEFAULT '加密货币',
  keywords TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  cover_image TEXT,
  author TEXT DEFAULT 'AI助手',
  template_id UUID REFERENCES templates(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0
);

-- 创建AI任务表
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  article_id UUID REFERENCES articles(id),
  input_data JSONB,
  result_data JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 创建热点话题表
CREATE TABLE IF NOT EXISTS hot_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  volume INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- 创建嵌入向量表（用于RAG）
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL, -- OpenAI嵌入维度
  metadata JSONB,
  article_id UUID REFERENCES articles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS articles_title_idx ON articles(title);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at);

CREATE INDEX IF NOT EXISTS templates_name_idx ON templates(name);
CREATE INDEX IF NOT EXISTS templates_category_idx ON templates(category);

CREATE INDEX IF NOT EXISTS ai_tasks_name_idx ON ai_tasks(name);
CREATE INDEX IF NOT EXISTS ai_tasks_type_idx ON ai_tasks(type);
CREATE INDEX IF NOT EXISTS ai_tasks_status_idx ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS ai_tasks_created_at_idx ON ai_tasks(created_at);
CREATE INDEX IF NOT EXISTS ai_tasks_article_id_idx ON ai_tasks(article_id);

CREATE INDEX IF NOT EXISTS hot_topics_keyword_idx ON hot_topics(keyword);
CREATE INDEX IF NOT EXISTS hot_topics_volume_idx ON hot_topics(volume);
CREATE INDEX IF NOT EXISTS hot_topics_trend_idx ON hot_topics(trend);

CREATE INDEX IF NOT EXISTS embeddings_article_id_idx ON embeddings(article_id);

-- 创建向量索引（使用IVFFlat进行快速ANN搜索）
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING ivfflat (embedding vector_l2_ops)
  WITH (lists = 100);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为表添加更新时间触发器
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hot_topics_updated_at
  BEFORE UPDATE ON hot_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建匹配向量函数（用于相似度搜索）
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  article_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    e.article_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 