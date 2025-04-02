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
  // 判断是否使用模拟模式
  const isMockMode = process.env.MOCK_DB === 'true' || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (isMockMode) {
    console.log('使用模拟Supabase客户端...');
    // 返回模拟客户端
    return {
      storage: {
        from: (bucket: string) => ({
          upload: () => ({
            data: { path: `mock-path-${Date.now()}` },
            error: null
          }),
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://mock-storage.example.com/${bucket}/${path}` }
          })
        })
      }
    };
  } else {
    // 创建真实的Supabase客户端
    try {
      const { createClient } = require('@supabase/supabase-js');
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
    } catch (err) {
      console.error('Supabase客户端创建失败:', err);
      return null;
    }
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
 * 保存文件到Supabase存储
 */
async function saveFileToSupabase(file: File, fileName: string, requestId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase客户端创建失败');
    }
    
    console.log(`[${requestId}] 上传文件到Supabase存储...`);
    
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
    
    // 解析multipart表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
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
    const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
                         process.env.MOCK_DB !== 'true';
    const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';
    
    let fileUrl = null;
    let warning = null;
    
    // 优先尝试Supabase存储
    if (useSupabase) {
      console.log(`[${requestId}] 使用Supabase存储`);
      fileUrl = await saveFileToSupabase(file, fileName, requestId);
    }
    
    // 如果Supabase存储失败或未配置，尝试本地存储
    if (!fileUrl && useLocalStorage) {
      console.log(`[${requestId}] 使用本地存储`);
      fileUrl = await saveFileToLocalStorage(file, fileName);
      warning = '使用本地存储，仅供开发环境使用';
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
      ...(warning ? { warning } : {})
    });
    
  } catch (err) {
    console.error('图片上传处理错误:', err);
    return NextResponse.json({ 
      error: '服务器处理上传失败' 
    }, { status: 500 });
  }
} 