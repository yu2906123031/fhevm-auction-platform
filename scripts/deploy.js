const { ethers } = require("hardhat");

/**
 * 部署拍卖平台合约
 */
async function main() {
    console.log("\n🏛️  开始部署拍卖平台...");
    console.log("=".repeat(50));

    // 获取部署账户
    const [deployer, seller, bidder1, bidder2] = await ethers.getSigners();
    console.log(`📋 部署账户: ${deployer.address}`);
    console.log(`🏪 卖家账户: ${seller.address}`);
    console.log(`🙋 竞拍者1: ${bidder1.address}`);
    console.log(`🙋 竞拍者2: ${bidder2.address}`);
    
    // 获取账户余额
    const balance = await deployer.getBalance();
    console.log(`💰 部署者余额: ${ethers.utils.formatEther(balance)} ETH`);

    try {
        // 部署拍卖平台合约
        console.log("\n📦 正在部署 AuctionPlatform 合约...");
        const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
        const auctionPlatform = await AuctionPlatform.deploy();
        await auctionPlatform.deployed();
        
        console.log(`✅ AuctionPlatform 部署成功!`);
        console.log(`📍 合约地址: ${auctionPlatform.address}`);
        console.log(`🔗 交易哈希: ${auctionPlatform.deployTransaction.hash}`);
        
        // 等待几个区块确认
        console.log("\n⏳ 等待区块确认...");
        await auctionPlatform.deployTransaction.wait(2);
        console.log("✅ 区块确认完成");

        // 验证合约部署
        console.log("\n🔍 验证合约部署...");
        const owner = await auctionPlatform.owner();
        const auctionCount = await auctionPlatform.auctionCount();
        const platformFee = await auctionPlatform.platformFeePercentage();
        
        console.log(`👤 合约所有者: ${owner}`);
        console.log(`📊 拍卖数量: ${auctionCount}`);
        console.log(`💸 平台费率: ${platformFee}%`);
        
        // 演示基本功能
        console.log("\n🎯 演示基本功能...");
        console.log("-".repeat(30));
        
        // 使用简化的加密方法（模拟FHEVM）
        const simpleEncrypt = (value) => {
            const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value.toString()));
            return {
                handles: [hash],
                inputProof: '0x01' // 非空的 proof
            };
        };
        
        // 1. 创建拍卖
        console.log("\n1️⃣ 创建拍卖...");
        const itemName = "稀有数字艺术品 #001";
        const itemDescription = "独一无二的数字艺术作品，由知名艺术家创作";
        const startingPrice = ethers.utils.parseEther("0.1"); // 0.1 ETH
        const reservePrice = ethers.utils.parseEther("0.5");  // 0.5 ETH
        const auctionDuration = 24 * 60 * 60; // 24小时
        
        console.log(`   物品名称: ${itemName}`);
        console.log(`   起拍价格: ${ethers.utils.formatEther(startingPrice)} ETH`);
        console.log(`   保留价格: ${ethers.utils.formatEther(reservePrice)} ETH`);
        console.log(`   拍卖时长: ${auctionDuration / (60 * 60)} 小时`);
        
        // 加密保留价格
        const encryptedReservePrice = simpleEncrypt(reservePrice.toString());
        
        const createTx = await auctionPlatform.connect(seller).createAuction(
            itemName,
            itemDescription,
            encryptedReservePrice.handles[0],
            encryptedReservePrice.inputProof,
            auctionDuration
        );
        await createTx.wait();
        
        const newAuctionCount = await auctionPlatform.auctionCount();
        const auctionId = newAuctionCount - 1;
        console.log(`   ✅ 拍卖创建成功，拍卖ID: ${auctionId}`);
        
        // 2. 获取拍卖信息
        console.log("\n2️⃣ 获取拍卖信息...");
        const auction = await auctionPlatform.getAuction(auctionId);
        console.log(`   拍卖ID: ${auction.id}`);
        console.log(`   物品名称: ${auction.itemName}`);
        console.log(`   物品描述: ${auction.itemDescription}`);
        console.log(`   卖家: ${auction.seller}`);
        console.log(`   起拍价格: ${ethers.utils.formatEther(auction.startingPrice)} ETH`);
        console.log(`   创建时间: ${new Date(auction.creationTime * 1000).toLocaleString()}`);
        console.log(`   结束时间: ${new Date(auction.endTime * 1000).toLocaleString()}`);
        console.log(`   是否活跃: ${auction.isActive}`);
        console.log(`   是否已结算: ${auction.isSettled}`);
        
        // 3. 竞拍演示
        console.log("\n3️⃣ 竞拍演示...");
        
        // 竞拍者1出价
        const bid1Amount = ethers.utils.parseEther("0.2"); // 0.2 ETH
        const encryptedBid1 = simpleEncrypt(bid1Amount.toString());
        
        console.log(`   竞拍者1出价: ${ethers.utils.formatEther(bid1Amount)} ETH`);
        const bidTx1 = await auctionPlatform.connect(bidder1).placeBid(
            auctionId,
            encryptedBid1.handles[0],
            encryptedBid1.inputProof,
            { value: bid1Amount }
        );
        await bidTx1.wait();
        console.log(`   ✅ 竞拍者1出价成功`);
        
        // 竞拍者2出价（更高价格）
        const bid2Amount = ethers.utils.parseEther("0.3"); // 0.3 ETH
        const encryptedBid2 = simpleEncrypt(bid2Amount.toString());
        
        console.log(`   竞拍者2出价: ${ethers.utils.formatEther(bid2Amount)} ETH`);
        const bidTx2 = await auctionPlatform.connect(bidder2).placeBid(
            auctionId,
            encryptedBid2.handles[0],
            encryptedBid2.inputProof,
            { value: bid2Amount }
        );
        await bidTx2.wait();
        console.log(`   ✅ 竞拍者2出价成功`);
        
        // 4. 检查竞拍状态
        console.log("\n4️⃣ 检查竞拍状态...");
        const bidCount = await auctionPlatform.getBidCount(auctionId);
        console.log(`   总竞拍次数: ${bidCount}`);
        
        const hasBid1 = await auctionPlatform.hasBid(auctionId, bidder1.address);
        const hasBid2 = await auctionPlatform.hasBid(auctionId, bidder2.address);
        console.log(`   竞拍者1是否已出价: ${hasBid1}`);
        console.log(`   竞拍者2是否已出价: ${hasBid2}`);
        
        // 5. 获取竞拍者资金
        console.log("\n5️⃣ 检查竞拍者资金...");
        const bidder1Funds = await auctionPlatform.bidderFunds(bidder1.address);
        const bidder2Funds = await auctionPlatform.bidderFunds(bidder2.address);
        console.log(`   竞拍者1锁定资金: ${ethers.utils.formatEther(bidder1Funds)} ETH`);
        console.log(`   竞拍者2锁定资金: ${ethers.utils.formatEther(bidder2Funds)} ETH`);
        
        // 6. 模拟拍卖结束（在实际场景中需要等待时间）
        console.log("\n6️⃣ 拍卖管理功能演示...");
        
        // 检查是否可以结算
        try {
            const canSettle = await auctionPlatform.canSettleAuction(auctionId);
            console.log(`   拍卖是否可以结算: ${canSettle}`);
        } catch (error) {
            console.log(`   ⚠️  拍卖尚未结束，无法结算`);
        }
        
        // 7. 紧急停止功能演示
        console.log("\n7️⃣ 紧急停止功能演示...");
        console.log(`   停止拍卖 ${auctionId}...`);
        const stopTx = await auctionPlatform.connect(deployer).emergencyStopAuction(auctionId);
        await stopTx.wait();
        console.log(`   ✅ 拍卖已紧急停止`);
        
        // 检查拍卖状态
        const updatedAuction = await auctionPlatform.getAuction(auctionId);
        console.log(`   拍卖是否活跃: ${updatedAuction.isActive}`);
        
        // 8. 资金提取演示
        console.log("\n8️⃣ 资金提取演示...");
        
        // 竞拍者提取资金
        console.log(`   竞拍者1提取资金...`);
        const withdrawTx1 = await auctionPlatform.connect(bidder1).withdrawFunds();
        await withdrawTx1.wait();
        console.log(`   ✅ 竞拍者1资金提取成功`);
        
        console.log(`   竞拍者2提取资金...`);
        const withdrawTx2 = await auctionPlatform.connect(bidder2).withdrawFunds();
        await withdrawTx2.wait();
        console.log(`   ✅ 竞拍者2资金提取成功`);
        
        // 检查提取后的资金
        const finalBidder1Funds = await auctionPlatform.bidderFunds(bidder1.address);
        const finalBidder2Funds = await auctionPlatform.bidderFunds(bidder2.address);
        console.log(`   竞拍者1剩余锁定资金: ${ethers.utils.formatEther(finalBidder1Funds)} ETH`);
        console.log(`   竞拍者2剩余锁定资金: ${ethers.utils.formatEther(finalBidder2Funds)} ETH`);
        
        // 9. 平台管理功能演示
        console.log("\n9️⃣ 平台管理功能演示...");
        
        // 设置新的平台费率
        const newFeePercentage = 3; // 3%
        console.log(`   设置新的平台费率: ${newFeePercentage}%`);
        const setFeeTx = await auctionPlatform.connect(deployer).setPlatformFee(newFeePercentage);
        await setFeeTx.wait();
        
        const updatedFee = await auctionPlatform.platformFeePercentage();
        console.log(`   ✅ 平台费率已更新为: ${updatedFee}%`);
        
        // 获取平台统计
        const totalAuctions = await auctionPlatform.auctionCount();
        console.log(`   平台总拍卖数: ${totalAuctions}`);
        
        // 部署总结
        console.log("\n" + "=".repeat(50));
        console.log("🎉 拍卖平台部署完成!");
        console.log("=".repeat(50));
        
        console.log("\n📋 部署信息:");
        console.log(`   合约地址: ${auctionPlatform.address}`);
        console.log(`   网络: ${network.name}`);
        console.log(`   部署者: ${deployer.address}`);
        console.log(`   Gas 使用: ${auctionPlatform.deployTransaction.gasLimit}`);
        
        console.log("\n🔧 合约功能:");
        console.log(`   ✅ 机密竞拍 (使用FHEVM加密)`);
        console.log(`   ✅ 拍卖管理`);
        console.log(`   ✅ 资金托管`);
        console.log(`   ✅ 自动结算`);
        console.log(`   ✅ 平台费用管理`);
        console.log(`   ✅ 紧急停止机制`);
        
        console.log("\n🎯 演示结果:");
        console.log(`   📊 创建拍卖数量: 1`);
        console.log(`   🙋 参与竞拍人数: 2`);
        console.log(`   💰 总竞拍金额: ${ethers.utils.formatEther(bid1Amount.add(bid2Amount))} ETH`);
        console.log(`   🛑 紧急停止测试: 成功`);
        console.log(`   💸 资金提取测试: 成功`);
        
        console.log("\n🎯 下一步操作:");
        console.log(`   1. 在前端连接合约地址: ${auctionPlatform.address}`);
        console.log(`   2. 创建更多拍卖物品`);
        console.log(`   3. 测试完整的拍卖流程`);
        console.log(`   4. 集成支付网关`);
        
        // 保存部署信息到文件
        const deploymentInfo = {
            contractName: "AuctionPlatform",
            address: auctionPlatform.address,
            network: network.name,
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            transactionHash: auctionPlatform.deployTransaction.hash,
            blockNumber: auctionPlatform.deployTransaction.blockNumber,
            demoResults: {
                auctionsCreated: 1,
                biddersParticipated: 2,
                totalBidAmount: ethers.utils.formatEther(bid1Amount.add(bid2Amount)),
                emergencyStopTested: true,
                fundsWithdrawalTested: true
            }
        };
        
        const fs = require('fs');
        const path = require('path');
        
        // 确保deployments目录存在
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        // 保存部署信息
        const deploymentFile = path.join(deploymentsDir, `auction-${network.name}.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 部署信息已保存到: ${deploymentFile}`);
        
        return {
            auctionPlatform: auctionPlatform.address,
            deployer: deployer.address,
            network: network.name,
            demoResults: deploymentInfo.demoResults
        };
        
    } catch (error) {
        console.error("\n❌ 部署失败:");
        console.error(error.message);
        
        if (error.transaction) {
            console.error(`交易哈希: ${error.transaction.hash}`);
        }
        
        process.exit(1);
    }
}

// 错误处理
process.on('unhandledRejection', (error) => {
    console.error('未处理的Promise拒绝:', error);
    process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✅ 脚本执行完成");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ 脚本执行失败:", error);
            process.exit(1);
        });
}

module.exports = main;