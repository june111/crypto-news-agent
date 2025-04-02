/**
 * 数据仓库导出
 */
import * as articles from './articleRepository';
import * as templates from './templatesRepository';
import * as aiTasks from './aiTaskRepository';
import * as hotTopics from './hotTopicsRepository';
import * as images from './imageRepository';
import * as embeddings from './embeddingsRepository';

// 导出所有仓库
const repositories = {
  articles,
  templates,
  aiTasks,
  hotTopics,
  images,
  embeddings
};

export default repositories; 