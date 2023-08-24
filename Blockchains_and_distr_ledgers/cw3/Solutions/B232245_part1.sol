// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract B32245_part1 {
    
    //====================================================================
    // Errors
    //====================================================================

    error NotOwner();
    error ZeroAddress();
    error LowBalance();
    error LowMint();

    //====================================================================
    // Data Structures
    //====================================================================

    address payable public owner; 

    mapping(address => uint256) private balances;

    uint256 private _supply;

    string private  _tokenName;
    string private _tokenSymbol;

    uint128 constant private PRICE = 600;

    //====================================================================
    // Events
    //====================================================================

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Sell(address indexed from, uint256 value);

    //====================================================================
    // Functions
    //====================================================================

    function totalSupply() public view returns (uint256 amount) {
        return _supply;
    }

    function balanceOf(address _account) public view returns (uint256 amount) {
        return balances[_account];
    }

    function getName() public view returns (string memory  name) {
        return _tokenName;
    }

    function getSymbol() public view returns (string memory symbol) {
        return _tokenSymbol;
    }

    function getPrice() public view returns (uint128 price) {
        return PRICE;
    }

    function transfer(
        address to,
        uint256 value
    ) public returns (bool succesfullTransfer) {
        if(to == address(0)){
            revert ZeroAddress();
        }
        uint256 senderBalance = balances[msg.sender];
        if(senderBalance < value){
            revert LowBalance();
        }
        balances[msg.sender] = senderBalance - value;
        balances[to] = balances[to] + value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function mint(
        address to,
        uint256 value
    ) public onlyOwner returns (bool succesfullMint) {
        if(to == address(0)){
            revert ZeroAddress();
        }
        if(address(this).balance - _supply * PRICE < value * PRICE) {
            revert LowMint();
        }
        _supply += value;
        balances[to] += value;
        emit Mint(to, value);
        return true;
    }

    function sell(uint256 value) public returns (bool succesfullSell) {
        uint256 senderBalance = balances[msg.sender];
        if(senderBalance < value){
            revert LowBalance();
        }
        balances[msg.sender] = senderBalance - value;
        _supply -= value;
        emit Sell(msg.sender, value);
        payable(msg.sender).transfer(value * PRICE);
        return true;
    }

    function close() public onlyOwner {
        selfdestruct(payable(owner));
    }

    receive() external payable {}

    //====================================================================
    // Constructor
    //====================================================================

    constructor(string memory name, string memory symbol) {
        owner = payable(msg.sender);
        _tokenName = name;
        _tokenSymbol = symbol;
    }

    //====================================================================
    // Modifier
    //====================================================================

    modifier onlyOwner() {
        if(msg.sender != owner){
            revert NotOwner();
        }
        _;
    }
}
