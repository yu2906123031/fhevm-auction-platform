// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// TFHE库的基本类型定义
type ebool is uint256;
type euint8 is uint256;
type euint16 is uint256;
type euint32 is uint256;
type euint64 is uint256;
type eaddress is uint256;
type einput is bytes32;

/**
 * @title TFHE
 * @dev FHEVM加密操作库
 */
library TFHE {
    // 错误定义
    error InvalidCiphertext();
    error InvalidProof();
    
    // 将输入转换为加密的uint64
    function asEuint64(einput input, bytes calldata proof) internal pure returns (euint64) {
        // 在实际FHEVM环境中，这里会进行真正的加密操作
        // 这里提供一个简化的实现用于测试
        
        // 验证 proof 不为空（基本验证）
        require(proof.length > 0, "Invalid proof");
        
        // 使用assembly来安全地转换类型
        uint256 value;
        assembly {
            value := input
        }
        
        // 确保值在合理范围内（防止溢出）
        require(value <= type(uint64).max, "Value too large for uint64");
        
        return euint64.wrap(value);
    }
    
    // 将普通uint64转换为加密的uint64
    function asEuint64(uint64 value) internal pure returns (euint64) {
        return euint64.wrap(uint256(value));
    }
    
    // 加密加法
    function add(euint64 a, euint64 b) internal pure returns (euint64) {
        return euint64.wrap(euint64.unwrap(a) + euint64.unwrap(b));
    }
    
    // 加密减法
    function sub(euint64 a, euint64 b) internal pure returns (euint64) {
        return euint64.wrap(euint64.unwrap(a) - euint64.unwrap(b));
    }
    
    // 加密比较 (大于等于)
    function gte(euint64 a, euint64 b) internal pure returns (ebool) {
        return ebool.wrap(euint64.unwrap(a) >= euint64.unwrap(b) ? 1 : 0);
    }
    
    // 加密比较 (大于)
    function gt(euint64 a, euint64 b) internal pure returns (ebool) {
        return ebool.wrap(euint64.unwrap(a) > euint64.unwrap(b) ? 1 : 0);
    }
    
    // 加密比较 (等于)
    function eq(euint64 a, euint64 b) internal pure returns (ebool) {
        return ebool.wrap(euint64.unwrap(a) == euint64.unwrap(b) ? 1 : 0);
    }
    
    // 解密布尔值
    function decrypt(ebool value) internal pure returns (bool) {
        return ebool.unwrap(value) == 1;
    }
    
    // 解密uint64值
    function decrypt(euint64 value) internal pure returns (uint64) {
        return uint64(euint64.unwrap(value));
    }
    
    // 条件选择
    function select(ebool condition, euint64 a, euint64 b) internal pure returns (euint64) {
        return ebool.unwrap(condition) == 1 ? a : b;
    }
}