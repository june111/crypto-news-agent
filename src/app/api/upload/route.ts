'use server';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
// 最大文件大小 (5MB)
const MAX_SIZE = 5 * 1024 * 1024;
// 存储桶名称
const BUCKET_NAME = 'article-images';
// 本地存储路径（如果启用本地存储）
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public', 'uploads');

/**
 * 获取Supabase客户端
 */
const getSupabase = () => {
  // 不再使用模拟模式检查，直接使用真实客户端
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    // 获取环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase配置缺失: URL或Key未设置');
      return null;
    }
    
    console.log(`使用Supabase配置: URL=${supabaseUrl}`);
    console.log(`使用密钥类型: ${supabaseKey === process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY'}`);
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Supabase客户端创建失败:', err);
    return null;
  }
};

/**
 * 确保本地存储目录存在
 */
async function ensureLocalStorageDirectory() {
  try {
    await fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
    return true;
  } catch (err) {
    console.error('创建本地存储目录失败:', err);
    return false;
  }
}

/**
 * 保存文件到本地存储
 */
async function saveFileToLocalStorage(file: File, fileName: string) {
  try {
    // 确保目录存在
    await ensureLocalStorageDirectory();
    
    // 保存文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(LOCAL_STORAGE_PATH, fileName);
    await fs.writeFile(filePath, buffer);
    
    // 返回文件的URL路径
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('保存文件到本地存储失败:', err);
    return null;
  }
}

/**
 * 确保images表存在
 */
async function ensureImagesTable(supabase: any, requestId: string) {
  try {
    // 检查表是否存在
    const { data, error } = await supabase.from('images').select('*').limit(1);
    
    if (error) {
      // 如果表不存在，尝试创建
      if (error.code === '42P01') { // 表不存在的PostgreSQL错误码
        console.log(`[${requestId}] images表不存在，尝试创建...`);
        
        // 创建表的SQL语句
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS images (
            id UUID PRIMARY KEY,
            file_name TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            url TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            article_id UUID,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          );
        `;
        
        // 执行SQL创建表
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: createTableSQL
        });
        
        if (createError) {
          console.error(`[${requestId}] 创建images表失败:`, createError);
          return false;
        }
        
        console.log(`[${requestId}] images表创建成功`);
        return true;
      }
      
      console.error(`[${requestId}] 检查images表失败:`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`[${requestId}] 检查数据库表时出错:`, err);
    return false;
  }
}

/**
 * 保存图片信息到数据库
 */
async function saveImageToDatabase(supabase: any, imageData: any, requestId: string) {
  try {
    console.log(`[${requestId}] 准备保存图片记录到数据库...`);
    
    // 确认supabase对象有from方法
    if (typeof supabase.from !== 'function') {
      console.error(`[${requestId}] Supabase客户端错误: 'from'方法不存在`);
      return false;
    }
    
    // 确保images表存在
    const tableExists = await ensureImagesTable(supabase, requestId);
    if (!tableExists) {
      console.error(`[${requestId}] images表不可用，跳过数据库保存`);
      return false;
    }
    
    // 插入图片记录到数据库
    const { error: dbError } = await supabase
      .from('images')
      .insert(imageData);
    
    if (dbError) {
      console.error(`[${requestId}] 保存图片记录到数据库失败:`, dbError);
      return false;
    } 
    
    console.log(`[${requestId}] 图片记录已保存到数据库`);
    return true;
  } catch (dbErr) {
    console.error(`[${requestId}] 处理数据库操作时出错:`, dbErr);
    return false;
  }
}

/**
 * 确保存储桶存在
 */
async function ensureStorageBucket(supabase: any, requestId: string) {
  try {
    console.log(`[${requestId}] 检查存储桶 ${BUCKET_NAME} 是否存在...`);
    
    // 获取所有存储桶
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();
    
    if (error) {
      console.error(`[${requestId}] 获取存储桶列表失败:`, error);
      return false;
    }
    
    // 检查目标桶是否存在
    const bucketExists = buckets.some((bucket: any) => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`[${requestId}] 存储桶 ${BUCKET_NAME} 不存在，尝试创建...`);
      
      // 创建存储桶
      const { error: createError } = await supabase
        .storage
        .createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_SIZE
        });
      
      if (createError) {
        console.error(`[${requestId}] 创建存储桶失败:`, createError);
        return false;
      }
      
      console.log(`[${requestId}] 存储桶 ${BUCKET_NAME} 创建成功`);
    } else {
      console.log(`[${requestId}] 存储桶 ${BUCKET_NAME} 已存在`);
    }
    
    return true;
  } catch (err) {
    console.error(`[${requestId}] 检查存储桶时出错:`, err);
    return false;
  }
}

/**
 * 保存文件到Supabase存储
 */
async function saveFileToSupabase(file: File, fileName: string, requestId: string) {
  try {
    // 创建Supabase客户端
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase客户端创建失败，请检查环境变量配置');
    }
    
    console.log(`[${requestId}] 上传文件到Supabase存储...`);
    
    // 确保存储桶存在
    const bucketExists = await ensureStorageBucket(supabase, requestId);
    if (!bucketExists) {
      throw new Error(`存储桶 ${BUCKET_NAME} 不可用，请检查Supabase存储配置和权限`);
    }
    
    // 上传文件
    const buffer = await file.arrayBuffer();
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`[${requestId}] Supabase上传错误:`, error);
      throw error;
    }
    
    // 获取文件的公共URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    // 创建图片记录
    const imageData = {
      id: uuidv4(),
      file_name: fileName,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      url: publicUrl,
      storage_path: data.path,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 保存到数据库
    await saveImageToDatabase(supabase, imageData, requestId);
    
    // 即使数据库保存失败，仍然返回URL
    return publicUrl;
  } catch (err) {
    console.error('上传文件到Supabase失败:', err);
    return null;
  }
}

/**
 * 生成文件的数据URL
 */
async function generateDataUrl(file: File) {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

/**
 * 处理文件上传请求
 */
export async function POST(request: NextRequest) {
  try {
    // 生成请求ID
    const requestId = request.headers.get('x-request-id') || uuidv4();
    console.log(`[${requestId}] 开始处理图片上传请求`);
    
    // 检查Supabase配置
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    // 日志输出配置状态
    if (!supabaseUrl) console.warn(`[${requestId}] 未设置Supabase URL`);
    if (!supabaseKey) console.warn(`[${requestId}] 未设置Supabase Key`);
    
    // 解析multipart表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const articleId = formData.get('articleId') as string | null;
    
    // 验证文件
    if (!file) {
      console.error(`[${requestId}] 未提供文件`);
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`[${requestId}] 不支持的文件类型: ${file.type}`);
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
    }
    
    if (file.size > MAX_SIZE) {
      console.error(`[${requestId}] 文件过大: ${file.size} 字节`);
      return NextResponse.json({ error: '文件过大，最大支持5MB' }, { status: 400 });
    }
    
    // 生成唯一文件名
    const fileName = `${uuidv4()}-${file.name.replace(/\s+/g, '_')}`;
    
    // 确定存储方式
    const useSupabase = (supabaseUrl && supabaseKey && process.env.MOCK_DB !== 'true');
    const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';
    
    let fileUrl = null;
    let warning = null;
    let storagePath = null;
    
    // 优先尝试Supabase存储
    if (useSupabase) {
      console.log(`[${requestId}] 使用Supabase存储`);
      fileUrl = await saveFileToSupabase(file, fileName, requestId);
      if (fileUrl) {
        storagePath = `${BUCKET_NAME}/${fileName}`;
      }
    }
    
    // 如果Supabase存储失败或未配置，尝试本地存储
    if (!fileUrl && useLocalStorage) {
      console.log(`[${requestId}] 使用本地存储`);
      fileUrl = await saveFileToLocalStorage(file, fileName);
      if (fileUrl) {
        storagePath = `local/${fileName}`;
        warning = '使用本地存储，仅供开发环境使用';
      }
    }
    
    // 如果所有存储方式都失败，使用数据URL
    if (!fileUrl) {
      console.log(`[${requestId}] 所有存储方式失败，使用数据URL`);
      fileUrl = await generateDataUrl(file);
      warning = '无法保存到存储服务，使用本地数据URL';
    }
    
    console.log(`[${requestId}] 图片处理完成，URL类型: ${fileUrl?.substring(0, 10)}...`);
    
    return NextResponse.json({
      url: fileUrl,
      fileName,
      size: file.size,
      storagePath,
      articleId: articleId || null,
      status: warning ? 'warning' : 'success',
      ...(warning ? { warning } : {})
    });
    
  } catch (err) {
    console.error('图片上传处理错误:', err);
    return NextResponse.json({ 
      error: '服务器处理上传失败',
      message: err instanceof Error ? err.message : '未知错误',
      status: 'error'
    }, { status: 500 });
  }
} 