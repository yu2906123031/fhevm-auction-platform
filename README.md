# FHEVM Auction Platform 🏛️

基于FHEVM的机密拍卖平台，提供完全加密的竞价过程，防止恶意竞争和价格操纵。

## ✨ 核心特性

### 🔐 隐私保护
- **加密竞价**: 所有出价都经过FHEVM加密，竞拍过程中无人知晓具体金额
- **防止狙击**: 竞价信息在拍卖结束前完全保密
- **公平竞争**: 避免恶意竞争和价格操纵

### 🏛️ 拍卖功能
- **多种拍卖类型**: 支持英式拍卖、荷兰式拍卖等
- **自动结算**: 拍卖结束后自动执行资金转移
- **保证金机制**: 确保竞拍者的诚信参与
- **手续费管理**: 灵活的平台手续费配置

### 🛡️ 安全保障
- **资金托管**: 智能合约自动托管拍卖资金
- **防作弊机制**: 多重验证确保拍卖公正性
- **紧急暂停**: 管理员可在异常情况下暂停拍卖

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Hardhat 开发环境
- FHEVM 兼容网络

### 安装依赖
```bash
npm install
```

### 环境配置
```bash
cp .env.example .env
# 编辑 .env 文件，配置网络和密钥信息
```

### 编译合约
```bash
npm run compile
```

### 运行测试
```bash
npm test
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看拍卖平台界面。

## 📁 项目结构

```
auction-platform/
├── contracts/              # 智能合约
│   └── AuctionPlatform.sol # 拍卖平台主合约
├── scripts/                # 部署脚本
│   └── deploy.js          # 合约部署脚本
├── test/                   # 测试文件
│   └── AuctionPlatform.test.js # 合约测试
├── public/                 # 前端文件
│   └── index.html         # 拍卖界面
├── .env.example           # 环境变量模板
├── hardhat.config.js      # Hardhat配置
├── package.json           # 项目配置
├── server.js              # Express服务器
└── README.md              # 项目文档
```

## 🎯 核心功能

### 拍卖管理
- **创建拍卖**: 卖家可以创建新的拍卖项目
- **设置参数**: 配置起拍价、保证金、拍卖时长等
- **拍卖监控**: 实时查看拍卖状态和参与情况

### 竞价系统
- **加密出价**: 使用FHEVM加密技术保护出价隐私
- **自动验证**: 智能合约自动验证出价有效性
- **实时更新**: 拍卖状态实时同步

### 结算机制
- **自动结算**: 拍卖结束后自动执行资金转移
- **退款处理**: 未中标者自动退还保证金
- **手续费扣除**: 平台手续费自动计算和扣除

## 📡 API 文档

### 智能合约接口

#### 创建拍卖
```solidity
function createAuction(
    string memory itemName,
    string memory description,
    euint64 startingPrice,
    euint64 reservePrice,
    uint256 duration,
    euint64 bidDeposit
) external returns (uint256 auctionId)
```

#### 参与竞价
```solidity
function placeBid(uint256 auctionId, bytes calldata encryptedBid) external payable
```

#### 结算拍卖
```solidity
function settleAuction(uint256 auctionId) external
```

### REST API

#### 健康检查
```
GET /api/health
```

#### 获取配置
```
GET /api/config
```

#### 部署信息
```
GET /api/deployments
```

## 🧪 测试

### 运行所有测试
```bash
npm test
```

### 测试覆盖率
```bash
npm run coverage
```

### Gas 使用报告
```bash
npm run gas
```

## 🚀 部署

### 本地部署
```bash
npm run deploy:local
```

### 测试网部署
```bash
npm run deploy:sepolia
```

### 主网部署
```bash
npm run deploy:mainnet
```

## ⚙️ 配置说明

### 拍卖参数
- `DEFAULT_AUCTION_DURATION`: 默认拍卖时长（秒）
- `MAX_AUCTION_DURATION`: 最大拍卖时长（秒）
- `MIN_BID_INCREMENT`: 最小加价幅度
- `AUCTION_FEE_PERCENTAGE`: 拍卖手续费百分比
- `MIN_RESERVE_PRICE`: 最小保留价

### 安全设置
- `JWT_SECRET`: JWT密钥
- `ENCRYPTION_KEY`: 加密密钥
- `PRIVATE_KEY`: 部署私钥

## 🔒 安全考虑

1. **私钥管理**: 确保私钥安全存储，不要提交到版本控制
2. **网络安全**: 使用HTTPS和安全的RPC端点
3. **合约审计**: 部署前进行充分的安全审计
4. **权限控制**: 合理设置管理员权限
5. **资金安全**: 使用多重签名钱包管理大额资金

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [FHEVM](https://github.com/zama-ai/fhevm) - 全同态加密虚拟机
- [Hardhat](https://hardhat.org/) - 以太坊开发环境
- [OpenZeppelin](https://openzeppelin.com/) - 安全的智能合约库

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-org/auction-platform)
- 问题反馈: [Issues](https://github.com/your-org/auction-platform/issues)
- 邮箱: contact@your-org.com

---

**注意**: 这是一个演示项目，请在生产环境使用前进行充分的安全审计和测试。