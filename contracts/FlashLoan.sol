


// SPDX-License-Identifier: UNLICENSED
//FlashLoan contract that creates swaps between pancakeswapv3 and pancakeSwap v2
/**
 * 1. we get the address of the pool contract by declaring the address of the token and 
 *      placing it in a constructor that calls a getPool functions
 */

pragma solidity ^0.8.10; 


import "hardhat/console.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import { IUniswapV3Pool } from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { TransferHelper } from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract FlashLoan {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IUniswapV2Router02 constant pancakeswapV2 = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

    ISwapRouter constant pancakeswapV3 = ISwapRouter(0x1b81D678ffb9C0263b24A97847620C99d213eB14);

     

    IERC20 private immutable token0;
    IERC20 private immutable token1;
    IUniswapV3Pool private immutable pool;

    address private constant deployer = 0x41ff9AA7e16B8B1a8a8dc4f0eFacd93D02d071c9;
    // IUniswapV2Router02 private immutable _router;
    // ISwapRouter private immutable _swapRouter;
    // TransferHelper private immutable _transferHelper;
    // SafeERC20 private _safeERC20;


    //we decalare a struct for the flashloan
    struct FlashCallbackData {
        uint amount0;
        uint amount1;
        address caller;
        address[2] path; // [WBNB, BUSD]// the tokens we want to swap
        uint8[3] exchRoute; // [0, 1, 0]=[token0, token1, token0]
        uint24 fee;

    }
    
    //we pass in the token to call the pool in the constructor
    constructor(address _token0, address _token1, uint24 _fee) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        pool = IUniswapV3Pool(getPool(_token0, _token1, _fee));
        // console.log(address(pool));

    }


    //then we perform a flashloan request
    function flashLoanRequest(address[2] memory _path, uint256 _amount0, uint256 _amount1, uint24 _fee, uint8[3] memory _exchRoute) external {
        //so we encode the data
        bytes memory data = abi.encode(FlashCallbackData(
            {
                amount0:_amount0,
                amount1: _amount1,
                caller: msg.sender,
                path: _path,
                exchRoute: _exchRoute,
                fee: _fee
            }
        ));
        console.log("");
        console.log("FlashLoan Pool address \t:", address(pool));
        //now we can call the flash from the pool
        IUniswapV3Pool(pool).flash(address(this), _amount0, _amount1, data);
    }

    //this looks for a callback that is the pancakev3FlashCallback

    function pancakeV3FlashCallback(uint fee0, uint fee1, bytes calldata data) external{
        //because its the poolContract that is calling the pancakaV3FlashCallback
        //so the msg.sender should be the address of the pool
        require(msg.sender == address(pool), "not authorized");

        //then we decode the data passed in bytes
        FlashCallbackData memory decoded = abi.decode(data, (FlashCallbackData));


        //Initialize token
        IERC20 baseToken = (fee0 > 0) ? token0 : token1; //token we want to borrow
        uint256 acquiredAmount = (fee0 > 0) ? decoded.amount0 : decoded.amount1;
        //lets check
        console.log("fee0 \t:", fee0);
        console.log("fee1 \t:", fee1);
        console.log("acquiredAmount \t:", acquiredAmount);
        console.log("baseToken \t:", address(baseToken));

    }


    function _place_swap(uint256 _amountIn, address[2] memory _tokenPath, uint8 _routing, uint24 _v3_fee) private returns (uint256){

        //initialize

        uint deadline = block.timestamp + 30;
        uint256 swap_amount_out = 0;

        address[] memory path = new address[](2);
        path[0] = _tokenPath[0];
        path[1] = _tokenPath[1];

        // Handle for pancakewap v2
        if (_routing == 0){
            TransferHelper.safeApprove(_tokenPath[0], address(pancakeswapV2), _amountIn);
            swap_amount_out = pancakeswapV2.swapExactTokensForTokens({
                amountIn: _amountIn,
                amountOutMin: 0,
                path: path,
                to: address(this),
                deadline: deadline
            })[1]; //outmout out is the second number in the array
        } else if (_routing == 1) {
            TransferHelper.safeApprove(_tokenPath[0], address(pancakeswapV3), _amountIn);
            uint256 amountOutMinimum  = 0;
            uint160 sqrtPriceLimitX96 = 0;
            //we perform the swap
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenPath[0],
                tokenOut: _tokenPath[1],
                fee: _v3_fee,
                recipient: address(this),
                deadline: deadline,
                amountIn: _amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            });
            swap_amount_out = pancakeswapV3.exactInputSingle(params);

        }
        return swap_amount_out;


    }

    function getPool(address _token0, address _token1, uint24 _fee) public pure returns(address) {
        PoolAddress.PoolKey memory poolkey = PoolAddress.getPoolKey(_token0, _token1, _fee);
        return PoolAddress.computeAddress(deployer, poolkey);

    }
}


// this poolAddress is gotten from the swaprouter of the uniswap and the check the getpool or compute address
library PoolAddress {
    bytes32 internal constant POOL_INIT_CODE_HASH = 0x6ce8eb472fa82df5469c6ab6d485f17c3ad13c8cd7af59b3d4a8026c5ce0f7e2;

    struct PoolKey {
        address token0;
        address token1;
        uint24 fee;
    }

    function getPoolKey(
        address tokenA,
        address tokenB,
        uint24 fee
    ) internal pure returns (PoolKey memory){
        //we need to make sure that the ordering is correct
        if(tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);

        return PoolKey({token0: tokenA, token1: tokenB, fee: fee});
        

    }

    function computeAddress(address deployer, PoolKey memory key) internal pure returns (address pool){
        require(key.token0 < key.token1);
        pool = address(
            uint160(
                uint256(
                keccak256(
                    abi.encodePacked(
                        hex'ff',
                        deployer,
                        keccak256(abi.encode(key.token0, key.token1, key.fee)),
                        POOL_INIT_CODE_HASH
                    )
                )
            ))
            
        );
    }
}