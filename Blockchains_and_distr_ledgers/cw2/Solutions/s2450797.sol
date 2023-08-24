// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;


contract s2450797 {

    //====================================================================
    // Errors
    //====================================================================

    string internal constant ERR_COMMIT_NOT_ACTIVE = "Both players have already committed";
    string internal constant ERR_REVEAL_NOT_ACTIVE = "Reveal phase is not active";
    string internal constant ERR_ALREADY_COMMITED = "You have already committed";
    string internal constant ERR_ALREADY_REVEALED = "You have already revealed";
    string internal constant ERR_NO_MATCH_TRANSACTION_VALUE = "The value of the transaction is not 3 ETH";
    string internal constant ERR_NO_MATCH_HASH = "Hash does not match";
    string internal constant ERR_NOT_FINNISHED = "Finish period is not active";
    string internal constant ERR_NOT_ELIGIBLE = "You are not eligible to finish the roll";
    string internal constant ERR_NO_WITHDRAW = "Withdraw for the roll is not yet available";
    string internal constant ERR_NOT_REVEALED = "None of the players have revealed their value";
    string internal constant ERR_ALREADY_FINISHED = "Roll has been already finished";

    //====================================================================
    // Data Structures
    //====================================================================

    struct Player {
        bytes32 valueHash;
        uint256 value;
        uint256 prize;
    } 

    struct Roll{
        address[] revealedPlayers; 
        mapping(address => Player) players;
        uint256 active; 
        uint256 finishStartDate; 
        uint256 finishEndDate; 
    }

   mapping(uint256 => Roll) public rolls;

    //====================================================================
    // Events
    //====================================================================

    event Commited(address _player, uint256 _id, uint256 _finnishStartDate, uint256 _finnishEndDate);
    event Revealed(address _player, uint256 _id, uint256 _value);
    event Finished(address _player, uint256 _id);
    event Withdrawn(address _player, uint256 _id, uint256 _price);

    //====================================================================
    // Functions
    //====================================================================

    /**
     * @notice Committs player's hash
     * @param _valueHash                  Hash of the player's value combined with salt and his address
     * @param _rollId                     Id of the roll
     */
    function commitRoll(bytes32 _valueHash, uint256 _rollId) external payable {
        require(rolls[_rollId].active <= 1, ERR_COMMIT_NOT_ACTIVE); 
        require(rolls[_rollId].players[msg.sender].valueHash == bytes32(0), ERR_ALREADY_COMMITED);
        require(msg.value == 3 ether, ERR_NO_MATCH_TRANSACTION_VALUE);
        rolls[_rollId].players[msg.sender].valueHash = _valueHash;
        if(rolls[_rollId].active == 1) {
        rolls[_rollId].finishStartDate = block.timestamp + 1 minutes; //this would be bigger in the real contract
        rolls[_rollId].finishEndDate = block.timestamp + 2 minutes;  //this would be bigger in the real contract
        }
        rolls[_rollId].active += 1; 
        emit Commited(msg.sender, _rollId, rolls[_rollId].finishStartDate, rolls[_rollId].finishEndDate);
    }

    /**
     * @notice Reveals player's hash
     * @param _value                     Player's value
     * @param _salt                      Salt he used 
     * @param _rollId                    Id of the roll
     */
    function revealRoll(uint256 _value, uint256 _salt, uint256 _rollId) external {
        require(block.timestamp <= rolls[_rollId].finishStartDate , ERR_REVEAL_NOT_ACTIVE);
        require(rolls[_rollId].active == 2 || rolls[_rollId].active == 3, ERR_REVEAL_NOT_ACTIVE);
        require(rolls[_rollId].players[msg.sender].value == 0, ERR_ALREADY_REVEALED);
        bytes32 hashedValue = rolls[_rollId].players[msg.sender].valueHash;
        require(keccak256(abi.encodePacked(_value, _salt, msg.sender)) == hashedValue, ERR_NO_MATCH_HASH);
        rolls[_rollId].players[msg.sender]= Player (0,_value, 0);
        rolls[_rollId].revealedPlayers.push(msg.sender);
        rolls[_rollId].active += 1; 
        emit Revealed(msg.sender, _rollId, _value);
    }

    /**
     * @notice Finishes the roll (sets the prizes)
     * @param _rollId                    Id of the roll
     */
    function finishRoll(uint256 _rollId) external {
        require(
            block.timestamp >= rolls[_rollId].finishStartDate &&
            block.timestamp <= rolls[_rollId].finishEndDate,
            ERR_NOT_FINNISHED 
            );
        require(rolls[_rollId].active == 3 || rolls[_rollId].active == 4, ERR_ALREADY_FINISHED);
        if(rolls[_rollId].active == 4) { //case when both players have revealed
            address[] memory _revealedPlayers = rolls[_rollId].revealedPlayers;
            uint256 n = xorRandom(
                rolls[_rollId].players[_revealedPlayers[0]].value, 
                rolls[_rollId].players[_revealedPlayers[1]].value
            );
            n += 1;
            if(n < 4) {
               rolls[_rollId].players[_revealedPlayers[0]].prize = 3 + n;
               rolls[_rollId].players[_revealedPlayers[1]].prize = 3 - n;
            }
            else {
               rolls[_rollId].players[_revealedPlayers[1]].prize = n;
               rolls[_rollId].players[_revealedPlayers[0]].prize = 6 - n;
            }
            rolls[_rollId].active += 1;
        }
        if(rolls[_rollId].active == 3) { //case when only one of the players has revealed
            require(
                rolls[_rollId].revealedPlayers[0] == msg.sender &&
                rolls[_rollId].revealedPlayers.length == 1,
                ERR_NOT_ELIGIBLE
                );
            rolls[_rollId].players[msg.sender].prize = 6;
            rolls[_rollId].active += 2;
        }
        emit Finished(msg.sender, _rollId);
    }

    /**
     * @notice Withdraws player's ether
     * @param _rollId                  Id of the roll
     */
    function withdraw(uint256 _rollId) external {
        require(block.timestamp >= rolls[_rollId].finishEndDate, ERR_NO_WITHDRAW);
        require(rolls[_rollId].active == 5, ERR_NOT_REVEALED);
        uint256 withdrawal = rolls[_rollId].players[msg.sender].prize;
        rolls[_rollId].players[msg.sender].prize = 0;
        emit Withdrawn(msg.sender, _rollId, withdrawal);
        payable(msg.sender).transfer(withdrawal*(10**18));
    }

    /**
     * @notice Computes xor of a and b, returns the result
     */
    function xorRandom(uint256 a, uint256 b) public pure returns(uint256) {
        uint256 n = (a ^ b) % 6;
        return n;
    }
}
