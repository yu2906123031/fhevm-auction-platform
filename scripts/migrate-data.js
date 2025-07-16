const { ethers } = require("hardhat");
const fs = require('fs');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateData() {
  console.log("\n🔄 拍卖平台数据迁移工具");
  console.log("=" * 30);
  
  try {
    // 1. 选择导出文件
    console.log("\n📁 查找导出文件...");
    const exportFiles = fs.readdirSync('.').filter(f => f.startsWith('auction-export-') && f.endsWith('.json'));
    
    if (exportFiles.length === 0) {
      console.log("❌ 未找到导出文件");
      console.log("💡 请先运行 'npm run export-data' 导出现有合约数据");
      rl.close();
      return;
    }
    
    console.log("\n📋 可用的导出文件:");
    exportFiles.forEach((file, index) => {
      const stats = fs.statSync(file);
      console.log(`${index + 1}. ${file} (${stats.size} bytes, ${stats.mtime.toLocaleString()})`);
    });
    
    const fileIndex = await askQuestion(`\n请选择导出文件 (1-${exportFiles.length}): `);
    const selectedFile = exportFiles[parseInt(fileIndex) - 1];
    
    if (!selectedFile) {
      console.log("❌ 无效的文件选择");
      rl.close();
      return;
    }
    
    console.log("✅ 选择文件:", selectedFile);
    
    // 2. 加载导出数据
    const exportData = JSON.parse(fs.readFileSync(selectedFile, 'utf8'));
    console.log("📊 导出数据概览:");
    console.log(`   - 原合约地址: ${exportData.metadata.contractAddress}`);
    console.log(`   - 导出时间: ${exportData.metadata.exportTime}`);
    console.log(`   - 网络: ${exportData.metadata.network}`);
    
    // 3. 部署新的FHEVM合约或使用现有合约
    const useExisting = await askQuestion("\n是否使用现有的FHEVM合约? (y/n): ");
    
    let newContract;
    let contractAddress;
    
    if (useExisting.toLowerCase() === 'y') {
      contractAddress = await askQuestion("请输入FHEVM拍卖合约地址: ");
      if (!ethers.utils.isAddress(contractAddress)) {
        console.log("❌ 无效的合约地址");
        rl.close();
        return;
      }
      
      // 连接到现有合约
      const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
      newContract = AuctionPlatform.attach(contractAddress);
      console.log("✅ 连接到现有合约:", contractAddress);
    } else {
      // 部署新合约
      console.log("\n🚀 部署新的FHEVM拍卖合约...");
      const [deployer] = await ethers.getSigners();
      console.log("部署者地址:", deployer.address);
      
      const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
      newContract = await AuctionPlatform.deploy();
      await newContract.deployed();
      
      contractAddress = newContract.address;
      console.log("✅ 新合约部署成功:", contractAddress);
    }
    
    // 4. 开始数据迁移
    console.log("\n🔄 开始数据迁移...");
    
    const migrationResults = {
      startTime: new Date().toISOString(),
      oldContract: exportData.metadata.contractAddress,
      newContract: contractAddress,
      migratedData: {},
      errors: [],
      transactions: []
    };
    
    // 4.1 迁移拍卖物品数据
    if (exportData.data.auctions && exportData.data.auctions.length > 0) {
      console.log("\n🏺 迁移拍卖物品数据...");
      
      for (const auction of exportData.data.auctions) {
        try {
          console.log(`📦 迁移拍卖 ${auction.id}: ${auction.title}`);
          
          // 检查合约是否有createAuction方法
          try {
            const tx = await newContract.createAuction(
              auction.title,
              auction.description || "",
              auction.startingPrice || ethers.utils.parseEther("0.01"),
              auction.duration || 86400 // 默认24小时
            );
            await tx.wait();
            
            migrationResults.transactions.push({
              type: 'createAuction',
              auctionId: auction.id,
              txHash: tx.hash
            });
            
            console.log(`✅ 拍卖 ${auction.id} 迁移成功 (tx: ${tx.hash})`);
            
            // 添加延迟避免网络拥堵
            await delay(1000);
            
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`⚠️  拍卖 ${auction.id} 已存在，跳过`);
            } else {
              throw error;
            }
          }
          
        } catch (error) {
          const errorMsg = `拍卖 ${auction.id} 迁移失败: ${error.message}`;
          migrationResults.errors.push(errorMsg);
          console.log(`❌ ${errorMsg}`);
        }
      }
      
      migrationResults.migratedData.auctions = exportData.data.auctions.length;
    }
    
    // 4.2 迁移出价事件
    if (exportData.events.BidPlaced && exportData.events.BidPlaced.length > 0) {
      console.log("\n💰 迁移出价数据...");
      
      const bidEvents = exportData.events.BidPlaced;
      console.log(`发现 ${bidEvents.length} 个出价事件`);
      
      // 检查合约是否支持管理员迁移出价
      try {
        for (let i = 0; i < Math.min(bidEvents.length, 20); i++) { // 限制迁移数量
          const bid = bidEvents[i];
          
          try {
            // 假设合约有migrateBid函数
            if (newContract.migrateBid) {
              const tx = await newContract.migrateBid(
                bid.args.auctionId,
                bid.args.bidder,
                bid.args.amount
              );
              await tx.wait();
              
              migrationResults.transactions.push({
                type: 'migrateBid',
                bidder: bid.args.bidder,
                txHash: tx.hash
              });
              
              console.log(`✅ 出价迁移成功: ${bid.args.bidder} -> 拍卖 ${bid.args.auctionId}`);
              await delay(1000);
            } else {
              console.log(`⚠️  合约不支持出价迁移，跳过出价数据`);
              break;
            }
          } catch (error) {
            const errorMsg = `出价迁移失败 (${bid.args.bidder}): ${error.message}`;
            migrationResults.errors.push(errorMsg);
            console.log(`❌ ${errorMsg}`);
          }
        }
        
        migrationResults.migratedData.bids = Math.min(bidEvents.length, 20);
        
      } catch (error) {
        console.log(`⚠️  出价数据迁移不支持: ${error.message}`);
        migrationResults.errors.push(`出价迁移不支持: ${error.message}`);
      }
    }
    
    // 4.3 设置平台参数
    if (exportData.data.platformFee || exportData.data.minBidIncrement) {
      console.log("\n⚙️  设置平台参数...");
      
      try {
        if (exportData.data.platformFee && newContract.setPlatformFee) {
          const tx = await newContract.setPlatformFee(exportData.data.platformFee);
          await tx.wait();
          
          migrationResults.transactions.push({
            type: 'setPlatformFee',
            txHash: tx.hash
          });
          
          console.log(`✅ 平台费用设置成功 (tx: ${tx.hash})`);
        }
        
        if (exportData.data.minBidIncrement && newContract.setMinBidIncrement) {
          const tx = await newContract.setMinBidIncrement(exportData.data.minBidIncrement);
          await tx.wait();
          
          migrationResults.transactions.push({
            type: 'setMinBidIncrement',
            txHash: tx.hash
          });
          
          console.log(`✅ 最小出价增量设置成功 (tx: ${tx.hash})`);
        }
      } catch (error) {
        const errorMsg = `平台参数设置失败: ${error.message}`;
        migrationResults.errors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      }
    }
    
    // 5. 保存迁移结果
    migrationResults.endTime = new Date().toISOString();
    migrationResults.duration = new Date(migrationResults.endTime) - new Date(migrationResults.startTime);
    
    const migrationFile = `auction-migration-result-${Date.now()}.json`;
    fs.writeFileSync(migrationFile, JSON.stringify(migrationResults, null, 2));
    
    // 6. 显示迁移结果
    console.log("\n🎉 拍卖平台数据迁移完成!");
    console.log("=" * 35);
    console.log(`📁 迁移结果文件: ${migrationFile}`);
    console.log(`🏠 新合约地址: ${contractAddress}`);
    console.log(`⏱️  迁移耗时: ${Math.round(migrationResults.duration / 1000)} 秒`);
    console.log(`📊 迁移统计:`);
    
    Object.entries(migrationResults.migratedData).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    console.log(`💸 交易数量: ${migrationResults.transactions.length}`);
    console.log(`❌ 错误数量: ${migrationResults.errors.length}`);
    
    if (migrationResults.errors.length > 0) {
      console.log("\n⚠️  迁移过程中的错误:");
      migrationResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log("\n💡 下一步:");
    console.log("1. 验证新合约的拍卖数据完整性");
    console.log("2. 更新前端应用的合约地址");
    console.log("3. 通知用户切换到新拍卖平台");
    console.log("4. 处理进行中的拍卖转移");
    console.log("5. 在确认无误后暂停旧合约");
    
    // 7. 验证迁移结果
    const shouldVerify = await askQuestion("\n是否立即验证迁移结果? (y/n): ");
    if (shouldVerify.toLowerCase() === 'y') {
      console.log("\n🔍 验证迁移结果...");
      
      try {
        // 检查拍卖数量
        if (newContract.getAuctionCount) {
          const auctionCount = await newContract.getAuctionCount();
          console.log(`✅ 新合约拍卖数量: ${auctionCount}`);
          
          if (exportData.data.auctions) {
            const expectedCount = exportData.data.auctions.length;
            if (auctionCount.toString() === expectedCount.toString()) {
              console.log(`✅ 拍卖数量匹配 (${expectedCount})`);
            } else {
              console.log(`⚠️  拍卖数量不匹配: 期望 ${expectedCount}, 实际 ${auctionCount}`);
            }
          }
        }
        
        // 检查第一个拍卖
        if (exportData.data.auctions && exportData.data.auctions.length > 0) {
          try {
            const firstAuction = await newContract.getAuction(0);
            const expectedTitle = exportData.data.auctions[0].title;
            
            if (firstAuction[0] === expectedTitle || firstAuction.title === expectedTitle) {
              console.log(`✅ 第一个拍卖标题匹配`);
            } else {
              console.log(`⚠️  第一个拍卖标题不匹配`);
            }
          } catch (error) {
            console.log(`⚠️  无法验证拍卖内容: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ 验证失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ 迁移失败:", error.message);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateData };