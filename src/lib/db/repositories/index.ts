/**
 * 数据库仓库入口
 * 聚合所有仓库导出
 */
import articleRepository from './articleRepository';
import templatesRepository from './templatesRepository';
import aiTaskRepository from './aiTaskRepository';
import hotTopicsRepository from './hotTopicsRepository';
import embeddingsRepository from './embeddingsRepository';

// 通过统一的入口导出所有仓库
const repositories = {
  articles: articleRepository,
  templates: templatesRepository,
  aiTasks: aiTaskRepository,
  hotTopics: hotTopicsRepository,
  embeddings: embeddingsRepository
};

export default repositories; 