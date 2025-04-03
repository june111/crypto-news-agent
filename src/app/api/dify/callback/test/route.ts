/**
 * Dify回调测试API
 */
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { logger } from '@/lib/logger';

// 模拟回调数据
const mockCallbackData = {
  "content": "在当今快速发展的数字经济中，加密货币和区块链技术正逐渐成为全球金融体系的重要组成部分。孙宇晨，这位年轻的加密先锋，最近登上了英文版《福布斯》杂志的封面，这不仅是对他个人成就的认可，更是对他在全球加密领域领导力和创新叙事的高度评价。\n\n孙宇晨的成功并非偶然。在过去的几年中，他通过建立波场（Tron）和其他相关项目，推动了区块链技术的普及和应用。他的愿景是创造一个去中心化的互联网，让用户能够自主掌控自己的数据和数字资产。这一理念与当今社会对隐私和数据安全日益增长的关注不谋而合，使得他的项目得到了广泛的支持和认可。\n\n在《福布斯》的封面故事中，孙宇晨被描绘为一个具有全球视野的领导者，他不仅在技术创新方面走在前列，还在推动加密货币的合法化和普及方面发挥了重要作用。他积极参与政策讨论，与各国政府和监管机构进行沟通，努力为加密行业创造一个更加友好的环境。这种积极的姿态使他在全球范围内赢得了众多支持者，也为其他加密企业树立了榜样。\n\n然而，孙宇晨的成功并非没有挑战。加密行业的监管环境依然复杂，各国对加密货币的态度不一，市场波动性大也给投资者带来了风险。在这样的背景下，孙宇晨如何保持创新和领导力，成为了一个值得关注的问题。他必须在推动技术发展的同时，确保合规性，并有效应对市场变化。\n\n孙宇晨的故事不仅是个人奋斗的缩影，也是整个加密行业发展的缩影。他的成功证明了在数字经济时代，创新和领导力的重要性。随着越来越多的人开始关注和参与加密货币市场，孙宇晨的角色将愈发重要。他不仅是技术的推动者，更是全球加密行业的引领者。\n\n总的来说，孙宇晨登上《福布斯》封面标志着他在加密领域的影响力和贡献得到了广泛认可。他的故事激励着无数创业者和创新者，提醒我们在追求技术进步的同时，也要关注合规与责任。未来，随着技术的不断演进和市场的成熟，孙宇晨及其团队的努力将继续推动加密行业的发展，塑造一个更加开放和包容的数字经济环境。",
  "describe": "孙宇晨，年轻的加密先锋，近期登上了《福布斯》杂志封面，标志着他在全球加密领域的影响力和创新能力得到了广泛认可。他通过建立波场（Tron）等项目，推动了区块链技术的普及，致力于创造去中心化的互联网，满足社会对隐私和数据安全的需求。孙宇晨在推动加密货币合法化方面也扮演了重要角色，积极与政府和监管机构沟通，努力改善行业环境。然而，他的成功面临监管复杂性和市场波动的挑战。孙宇晨的故事不仅是个人奋斗的体现，更反映了整个加密行业的发展，激励着更多创业者关注合规与责任。",
  "title": "孙宇晨：区块链领军者的全球影响力",
  "image": [
    {
      "dify_model_identity": "__dify__file__",
      "id": null,
      "tenant_id": "cad5ed86-c746-4f93-a611-c64218bb432b",
      "type": "image",
      "transfer_method": "tool_file",
      "remote_url": null,
      "related_id": "9f6c354f-af13-4604-b867-824529bc1e29",
      "filename": "030d127b7b064fe6ae34bc601fe0091b.png",
      "extension": ".png",
      "mime_type": "image/png",
      "size": 2373077,
      "url": "https://upload.dify.ai/files/tools/9f6c354f-af13-4604-b867-824529bc1e29.png?timestamp=1743696207&nonce=cc3e12daa208163f3d167b8023400ca1&sign=RFtLRu9INLmGt5nAUZQ6ZlyKavdoAeXx1hF-iofieFY="
    }
  ],
  "date": "2025-04-03 16:03:27"
};

/**
 * GET处理程序 - 测试Dify回调
 */
export async function GET(req: NextRequest) {
  try {
    logger.info('开始测试Dify回调接口');
    
    // 构建回调URL，使用相对路径，会自动转换为完整URL
    const callbackUrl = new URL('/api/dify/callback', req.url).toString();
    
    logger.info(`发送测试数据到回调接口: ${callbackUrl}`);
    
    // 发送POST请求到回调接口
    const response = await axios.post(callbackUrl, mockCallbackData);
    
    // 返回测试结果
    return NextResponse.json({
      success: true,
      message: '测试完成',
      callbackUrl: callbackUrl,
      result: response.data
    });
    
  } catch (error: any) {
    // 记录错误日志
    logger.error('测试Dify回调失败', { 
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // 返回错误响应
    return NextResponse.json({ 
      success: false, 
      error: error.message || '测试回调失败',
      details: error.response?.data
    }, { status: 500 });
  }
} 