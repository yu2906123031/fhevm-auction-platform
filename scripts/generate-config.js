const fs = require('fs');
const path = require('path');

// 生成前端配置文件
function generateConfig() {
  const config = {
    networkName: process.env.NETWORK_NAME || 'sepolia',
    rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: parseInt(process.env.CHAIN_ID) || 11155111,
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
  };

  // 写入配置文件到 public 目录
  const configPath = path.join(__dirname, '..', 'public', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ 配置文件已生成:', configPath);
  console.log('📍 合约地址:', config.contractAddress);
  console.log('🌐 网络:', config.networkName);
}

if (require.main === module) {
  generateConfig();
}

module.exports = generateConfig;