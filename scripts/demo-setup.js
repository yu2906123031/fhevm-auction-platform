#!/usr/bin/env node

/**
 * FHEVM拍卖平台演示数据准备脚本
 * 自动创建演示用的拍卖数据
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// 演示数据配置
const DEMO_AUCTIONS = [
    {
        title: "限量版艺术品NFT",
        description: "知名艺术家创作的限量版数字艺术品，全球仅发行100份",
        startingPrice: ethers.parseEther("0.1"), // 0.1 ETH
        duration: 3600, // 1小时
        category: "艺术品"
    },
    {
        title: "稀有游戏道具",
        description: "传奇级游戏装备，属性极佳，收藏价值很高",
        startingPrice: ethers.parseEther("0.05"), // 0.05 ETH
        duration: 7200, // 2小时
        category: "游戏道具"
    },
    {
        title: "古董收藏品",
        description: "19世纪欧洲古董钟表，保存完好，具有很高的收藏价值",
        startingPrice: ethers.parseEther("0.2"), // 0.2 ETH
        duration: 5400, // 1.5小时
        category: "古董"
    },
    {
        title: "限量版运动鞋",
        description: "知名品牌限量版运动鞋，全球限量发售1000双",
        startingPrice: ethers.parseEther("0.08"), // 0.08 ETH
        duration: 2700, // 45分钟
        category: "时尚"
    },
    {
        title: "数字音乐专辑",
        description: "独立音乐人发行的数字专辑NFT，包含独家内容",
        startingPrice: ethers.parseEther("0.03"), // 0.03 ETH
        duration: 1800, // 30分钟
        category: "音乐"
    }
];

// 演示竞价数据
const DEMO_BIDS = [
    { auctionIndex: 0, amount: ethers.parseEther("0.12") },
    { auctionIndex: 0, amount: ethers.parseEther("0.15") },
    { auctionIndex: 1, amount: ethers.parseEther("0.06") },
    { auctionIndex: 2, amount: ethers.parseEther("0.25") },
    { auctionIndex: 3, amount: ethers.parseEther("0.09") }
];

async function main() {
    console.log("🎬 开始准备FHEVM拍卖平台演示数据...");
    
    try {
        // 获取合约实例
        const contractAddress = await getContractAddress();
        if (!contractAddress) {
            throw new Error("未找到合约地址，请先部署合约");
        }
        
        console.log(`📋 使用合约地址: ${contractAddress}`);
        
        const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
        const auction = AuctionPlatform.attach(contractAddress);
        
        // 获取签名者
        const [deployer, bidder1, bidder2, bidder3] = await ethers.getSigners();
        console.log(`👤 部署者地址: ${deployer.address}`);
        console.log(`👤 竞价者1地址: ${bidder1.address}`);
        console.log(`👤 竞价者2地址: ${bidder2.address}`);
        console.log(`👤 竞价者3地址: ${bidder3.address}`);
        
        // 检查账户余额
        await checkBalances([deployer, bidder1, bidder2, bidder3]);
        
        // 创建演示拍卖
        console.log("\n🏗️  创建演示拍卖...");
        for (let i = 0; i < DEMO_AUCTIONS.length; i++) {
            const auctionData = DEMO_AUCTIONS[i];
            console.log(`创建拍卖 ${i + 1}: ${auctionData.title}`);
            
            try {
                const tx = await auction.createAuction(
                    auctionData.startingPrice,
                    auctionData.duration,
                    { gasLimit: 500000 }
                );
                await tx.wait();
                console.log(`✅ 拍卖 ${i + 1} 创建成功`);
                
                // 等待一秒避免交易冲突
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.log(`❌ 拍卖 ${i + 1} 创建失败: ${error.message}`);
            }
        }
        
        // 等待所有拍卖创建完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 添加一些演示竞价
        console.log("\n💰 添加演示竞价...");
        for (const bidData of DEMO_BIDS) {
            try {
                // 随机选择竞价者
                const bidders = [bidder1, bidder2, bidder3];
                const randomBidder = bidders[Math.floor(Math.random() * bidders.length)];
                
                console.log(`竞价者 ${randomBidder.address.slice(0, 8)}... 对拍卖 ${bidData.auctionIndex + 1} 出价 ${ethers.formatEther(bidData.amount)} ETH`);
                
                const auctionWithBidder = auction.connect(randomBidder);
                const tx = await auctionWithBidder.placeBid(
                    bidData.auctionIndex,
                    { 
                        value: bidData.amount,
                        gasLimit: 300000
                    }
                );
                await tx.wait();
                console.log(`✅ 竞价成功`);
                
                // 等待避免交易冲突
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                console.log(`❌ 竞价失败: ${error.message}`);
            }
        }
        
        // 生成演示数据报告
        await generateDemoReport(auction);
        
        console.log("\n🎉 演示数据准备完成！");
        console.log("\n📋 演示建议:");
        console.log("1. 打开浏览器访问 http://localhost:3001");
        console.log("2. 查看拍卖列表中的演示数据");
        console.log("3. 尝试创建新拍卖和参与竞价");
        console.log("4. 开始录制您的演示视频");
        
    } catch (error) {
        console.error("❌ 演示数据准备失败:", error.message);
        process.exit(1);
    }
}

// 获取合约地址
async function getContractAddress() {
    try {
        // 从配置文件读取
        const configPath = path.join(__dirname, '../public/config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return config.contractAddress;
        }
        
        // 从部署文件读取
        const deploymentPath = path.join(__dirname, '../deployments.json');
        if (fs.existsSync(deploymentPath)) {
            const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
            return deployments.localhost?.AuctionPlatform;
        }
        
        return null;
    } catch (error) {
        console.error("读取合约地址失败:", error.message);
        return null;
    }
}

// 检查账户余额
async function checkBalances(signers) {
    console.log("\n💰 检查账户余额:");
    for (let i = 0; i < signers.length; i++) {
        const balance = await ethers.provider.getBalance(signers[i].address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`账户 ${i + 1}: ${balanceEth} ETH`);
        
        if (parseFloat(balanceEth) < 1) {
            console.log(`⚠️  警告: 账户 ${i + 1} 余额较低，可能影响演示`);
        }
    }
}

// 生成演示数据报告
async function generateDemoReport(auction) {
    try {
        console.log("\n📊 生成演示数据报告...");
        
        const reportData = {
            timestamp: new Date().toISOString(),
            auctions: [],
            summary: {
                totalAuctions: 0,
                totalBids: 0,
                totalValue: "0"
            }
        };
        
        // 获取拍卖数量
        const auctionCount = await auction.getAuctionCount();
        reportData.summary.totalAuctions = Number(auctionCount);
        
        // 获取每个拍卖的详细信息
        for (let i = 0; i < Math.min(Number(auctionCount), DEMO_AUCTIONS.length); i++) {
            try {
                const auctionInfo = await auction.getAuction(i);
                const demoData = DEMO_AUCTIONS[i];
                
                reportData.auctions.push({
                    id: i,
                    title: demoData.title,
                    description: demoData.description,
                    category: demoData.category,
                    startingPrice: ethers.formatEther(auctionInfo.startingPrice),
                    currentHighestBid: ethers.formatEther(auctionInfo.highestBid),
                    bidCount: Number(auctionInfo.bidCount),
                    isActive: auctionInfo.isActive,
                    endTime: new Date(Number(auctionInfo.endTime) * 1000).toISOString()
                });
                
                reportData.summary.totalBids += Number(auctionInfo.bidCount);
            } catch (error) {
                console.log(`获取拍卖 ${i} 信息失败: ${error.message}`);
            }
        }
        
        // 保存报告
        const reportPath = path.join(__dirname, '../demo-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`✅ 演示数据报告已保存到: ${reportPath}`);
        
    } catch (error) {
        console.error("生成演示数据报告失败:", error.message);
    }
}

// 错误处理
process.on('unhandledRejection', (error) => {
    console.error('未处理的Promise拒绝:', error);
    process.exit(1);
});

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main, DEMO_AUCTIONS, DEMO_BIDS };