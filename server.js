const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FHEVM Auction Platform',
    version: '1.0.0'
  });
});

// 配置信息
app.get('/config.json', (req, res) => {
  res.json({
    networkName: process.env.NETWORK_NAME || 'sepolia',
    rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: process.env.CHAIN_ID || 11155111,
    contractAddress: process.env.AUCTION_CONTRACT_ADDRESS || '0x00a0c4c5a6c83578dd19db328b3d8381519221fe',
    features: {
      auction: true,
      bidding: true,
      privacy: true,
      marketplace: true
    },
    auctionConfig: {
      defaultDuration: process.env.DEFAULT_AUCTION_DURATION || 86400,
      minBidIncrement: process.env.MIN_BID_INCREMENT || '1000000000000000',
      maxDuration: process.env.MAX_AUCTION_DURATION || 2592000,
      feePercentage: process.env.AUCTION_FEE_PERCENTAGE || 250
    }
  });
});

// 部署信息
app.get('/api/deployments', (req, res) => {
  try {
    const deployments = require('./deployments.json');
    res.json(deployments);
  } catch (error) {
    res.json({ contracts: {} });
  }
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🏛️  FHEVM拍卖平台服务器运行在 http://localhost:${PORT}`);
  console.log(`📱 可用页面:`);
  console.log(`   - 拍卖平台: http://localhost:${PORT}/`);
  console.log(`🔧 API端点:`);
  console.log(`   - 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`   - 配置信息: http://localhost:${PORT}/config.json`);
  console.log(`   - 部署信息: http://localhost:${PORT}/api/deployments`);
  console.log(`📍 当前合约地址: ${process.env.AUCTION_CONTRACT_ADDRESS || '0x00a0c4c5a6c83578dd19db328b3d8381519221fe'}`);
});

module.exports = app;