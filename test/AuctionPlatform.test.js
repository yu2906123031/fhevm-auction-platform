const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionPlatform", function () {
    let auctionPlatform;
    let owner, seller, bidder1, bidder2, bidder3;

    before(async function () {
        // 获取测试账户
        [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();
    });

    beforeEach(async function () {
        // 部署合约
        const AuctionPlatform = await ethers.getContractFactory("AuctionPlatform");
        auctionPlatform = await AuctionPlatform.deploy();
        await auctionPlatform.deployed();
    });

    describe("部署", function () {
        it("应该正确设置合约所有者", async function () {
            expect(await auctionPlatform.owner()).to.equal(owner.address);
        });

        it("应该初始化为未暂停状态", async function () {
            expect(await auctionPlatform.paused()).to.be.false;
        });

        it("应该设置默认平台费率", async function () {
            expect(await auctionPlatform.platformFeePercentage()).to.equal(250); // 2.5%
        });
    });

    describe("拍卖创建", function () {
        it("应该能够创建拍卖", async function () {
            const encryptedReservePrice = ethers.utils.formatBytes32String("1000000000000000000"); // 1 ETH
            const inputProof = "0x";
            const duration = 86400; // 1天
            
            await expect(
                auctionPlatform.connect(seller).createAuction(
                    "测试拍卖品",
                    "这是一个测试拍卖品",
                    encryptedReservePrice,
                    inputProof,
                    duration
                )
            ).to.emit(auctionPlatform, "AuctionCreated");
        });

        it("应该拒绝空标题的拍卖", async function () {
            const encryptedReservePrice = ethers.utils.formatBytes32String("1000000000000000000");
            const inputProof = "0x";
            
            await expect(
                auctionPlatform.connect(seller).createAuction(
                    "",
                    "描述",
                    encryptedReservePrice,
                    inputProof,
                    86400
                )
            ).to.be.revertedWith("Title cannot be empty");
        });
    });

    describe("竞拍功能", function () {
        let auctionId;
        
        beforeEach(async function () {
            // 创建拍卖
            const encryptedReservePrice = ethers.utils.formatBytes32String("1000000000000000000");
            const inputProof = "0x";
            await auctionPlatform.connect(seller).createAuction(
                "测试拍卖品",
                "描述",
                encryptedReservePrice,
                inputProof,
                86400
            );
            auctionId = 0;
        });

        it("应该能够进行竞拍", async function () {
            const encryptedBidAmount = ethers.utils.formatBytes32String("2000000000000000000"); // 2 ETH
            const inputProof = "0x";
            const value = ethers.utils.parseEther("2");
            
            await expect(
                auctionPlatform.connect(bidder1).placeBid(auctionId, encryptedBidAmount, inputProof, { value })
            ).to.emit(auctionPlatform, "BidPlaced");
        });

        it("卖家不应该能够对自己的拍卖竞拍", async function () {
            const encryptedBidAmount = ethers.utils.formatBytes32String("2000000000000000000");
            const inputProof = "0x";
            const value = ethers.utils.parseEther("2");
            
            await expect(
                auctionPlatform.connect(seller).placeBid(auctionId, encryptedBidAmount, inputProof, { value })
            ).to.be.revertedWith("Seller cannot bid");
        });
    });

    describe("平台管理", function () {
        it("所有者应该能够设置平台费率", async function () {
            const newFeePercentage = 500; // 5%
            
            await auctionPlatform.setPlatformFee(newFeePercentage);
            expect(await auctionPlatform.platformFeePercentage()).to.equal(newFeePercentage);
        });

        it("应该拒绝过高的平台费率", async function () {
            const invalidFeePercentage = 1001; // 10.01%
            
            await expect(
                auctionPlatform.setPlatformFee(invalidFeePercentage)
            ).to.be.revertedWith("Fee too high");
        });

        it("所有者应该能够暂停合约", async function () {
            await auctionPlatform.pause();
            expect(await auctionPlatform.paused()).to.be.true;
        });

        it("所有者应该能够恢复合约", async function () {
            await auctionPlatform.pause();
            await auctionPlatform.unpause();
            expect(await auctionPlatform.paused()).to.be.false;
        });
    });

    describe("查询功能", function () {
        beforeEach(async function () {
            const encryptedReservePrice = ethers.utils.formatBytes32String("1000000000000000000");
            const inputProof = "0x";
            await auctionPlatform.connect(seller).createAuction(
                "测试拍卖品", "描述", encryptedReservePrice, inputProof, 86400
            );
        });

        it("应该能够获取拍卖信息", async function () {
            const auction = await auctionPlatform.getAuction(0);
            expect(auction.seller).to.equal(seller.address);
            expect(auction.itemName).to.equal("测试拍卖品");
            expect(auction.isActive).to.be.true;
        });

        it("应该能够获取竞拍数量", async function () {
            const count = await auctionPlatform.getBidCount(0);
            expect(count).to.equal(0);
        });
    });
});