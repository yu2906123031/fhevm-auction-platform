// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TFHE.sol";

/**
 * @title AuctionPlatform
 * @dev 基于FHEVM的机密拍卖平台
 * @notice 支持完全加密的竞价过程，防止恶意竞争
 */
contract AuctionPlatform {
    using TFHE for euint64;
    using TFHE for ebool;

    // 拍卖状态枚举
    enum AuctionStatus { ACTIVE, ENDED, CANCELLED }

    // 拍卖结构
    struct Auction {
        uint256 id;
        string title;
        string description;
        address seller;
        uint256 startTime;
        uint256 endTime;
        euint64 reservePrice;    // 加密的保留价格
        euint64 highestBid;      // 加密的最高出价
        address highestBidder;
        AuctionStatus status;
        uint256 bidCount;
        bool settled;
    }

    // 状态变量
    address public owner;
    uint256 public auctionCount;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant MIN_BID_INCREMENT = 0.001 ether;
    bool public paused = false;
    
    // 存储拍卖
    mapping(uint256 => Auction) public auctions;
    
    // 用户出价记录
    mapping(uint256 => mapping(address => euint64)) public bids;
    mapping(uint256 => mapping(address => bool)) public hasBid;
    
    // 用户余额
    mapping(address => uint256) public bidderFunds;
    
    // 平台收益
    uint256 public platformRevenue;
    
    // 事件
    event AuctionCreated(
        uint256 indexed auctionId,
        string title,
        address indexed seller,
        uint256 startTime,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 timestamp
    );
    
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 timestamp
    );
    
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );
    
    event FundsDeposited(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier auctionExists(uint256 auctionId) {
        require(auctionId < auctionCount, "Auction does not exist");
        _;
    }
    
    modifier auctionActive(uint256 auctionId) {
        require(
            auctions[auctionId].status == AuctionStatus.ACTIVE &&
            block.timestamp >= auctions[auctionId].startTime &&
            block.timestamp <= auctions[auctionId].endTime,
            "Auction not active"
        );
        _;
    }

    /**
     * @dev 构造函数
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev 创建新拍卖
     */
    function createAuction(
        string memory title,
        string memory description,
        einput encryptedReservePrice,
        bytes calldata inputProof,
        uint256 duration
    ) external whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(
            duration >= MIN_AUCTION_DURATION && duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );
        
        uint256 auctionId = auctionCount++;
        Auction storage newAuction = auctions[auctionId];
        
        newAuction.id = auctionId;
        newAuction.title = title;
        newAuction.description = description;
        newAuction.seller = msg.sender;
        newAuction.startTime = block.timestamp;
        newAuction.endTime = block.timestamp + duration;
        newAuction.reservePrice = TFHE.asEuint64(encryptedReservePrice, inputProof);
        newAuction.highestBid = TFHE.asEuint64(0);
        newAuction.highestBidder = address(0);
        newAuction.status = AuctionStatus.ACTIVE;
        newAuction.bidCount = 0;
        newAuction.settled = false;
        
        emit AuctionCreated(
            auctionId,
            title,
            msg.sender,
            newAuction.startTime,
            newAuction.endTime
        );
        
        return auctionId;
    }

    /**
     * @dev 提交竞价
     */
    function placeBid(
        uint256 auctionId,
        einput encryptedBidAmount,
        bytes calldata inputProof
    ) external payable whenNotPaused auctionExists(auctionId) auctionActive(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value > 0, "Must send ETH with bid");
        
        euint64 bidAmount = TFHE.asEuint64(encryptedBidAmount, inputProof);
        
        // 存储用户的出价
        bids[auctionId][msg.sender] = bidAmount;
        hasBid[auctionId][msg.sender] = true;
        
        // 存储用户资金
        bidderFunds[msg.sender] += msg.value;
        
        auction.bidCount++;
        
        emit BidPlaced(auctionId, msg.sender, block.timestamp);
    }

    /**
     * @dev 获取拍卖信息
     */
    function getAuction(uint256 auctionId) external view auctionExists(auctionId) returns (
        uint256 id,
        string memory itemName,
        string memory itemDescription,
        address seller,
        uint256 creationTime,
        uint256 endTime,
        bool isActive,
        bool isSettled
    ) {
        Auction storage auction = auctions[auctionId];
        return (
            auction.id,
            auction.title,
            auction.description,
            auction.seller,
            auction.startTime,
            auction.endTime,
            auction.status == AuctionStatus.ACTIVE,
            auction.settled
        );
    }

    /**
     * @dev 获取竞拍数量
     */
    function getBidCount(uint256 auctionId) external view auctionExists(auctionId) returns (uint256) {
        return auctions[auctionId].bidCount;
    }

    /**
     * @dev 检查用户是否已出价
     */
    function hasUserBid(uint256 auctionId, address bidder) external view returns (bool) {
        return hasBid[auctionId][bidder];
    }

    /**
     * @dev 紧急停止拍卖
     */
    function emergencyStopAuction(uint256 auctionId) external onlyOwner auctionExists(auctionId) {
        auctions[auctionId].status = AuctionStatus.CANCELLED;
    }

    /**
     * @dev 提取资金
     */
    function withdrawFunds() external {
        uint256 amount = bidderFunds[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        bidderFunds[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev 设置平台费率
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // 最大10%
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        paused = true;
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @dev 检查拍卖是否可以结算
     */
    function canSettleAuction(uint256 auctionId) external view auctionExists(auctionId) returns (bool) {
        Auction storage auction = auctions[auctionId];
        return block.timestamp > auction.endTime && auction.status == AuctionStatus.ACTIVE;
    }
}