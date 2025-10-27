// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./interfaces/IUEAFactory.sol";

/**
 * @title Campaign
 * @notice Individual crowdfunding campaign contract
 * @dev Handles contributions, withdrawals, and refunds with cross-chain origin tracking
 */
contract Campaign {
    // ══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ══════════════════════════════════════════════════════════════════════════════

    address public immutable creator;
    string public title;
    string public description;
    string public imageUrl;
    uint256 public immutable goalAmount;
    uint256 public immutable deadline;
    uint256 public totalRaised;
    bool public fundsWithdrawn;

    uint256 public immutable platformFeePercentage;
    address public immutable platformFeeRecipient;
    address public immutable UEA_FACTORY;

    // Contribution tracking
    mapping(address => uint256) public contributions;
    address[] public contributors;
    mapping(address => bool) public hasContributed;

    // Chain-specific tracking
    mapping(string => uint256) public contributionsByChain; // chainNamespace => total
    mapping(address => string) public contributorOriginChain;

    // ══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════════════════════

    event ContributionReceived(
        address indexed contributor,
        uint256 amount,
        string originChain,
        uint256 totalRaised
    );

    event FundsWithdrawn(
        address indexed creator,
        uint256 amount,
        uint256 platformFee
    );

    event RefundClaimed(
        address indexed contributor,
        uint256 amount
    );

    event CampaignCancelled(address indexed creator);

    // ══════════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ══════════════════════════════════════════════════════════════════════════════

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }

    modifier campaignActive() {
        require(isActive(), "Campaign not active");
        _;
    }

    modifier campaignEnded() {
        require(block.timestamp > deadline, "Campaign still active");
        _;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ══════════════════════════════════════════════════════════════════════════════

    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _deadline,
        string memory _imageUrl,
        uint256 _platformFeePercentage,
        address _platformFeeRecipient,
        address _ueaFactory
    ) {
        creator = _creator;
        title = _title;
        description = _description;
        goalAmount = _goalAmount;
        deadline = _deadline;
        imageUrl = _imageUrl;
        platformFeePercentage = _platformFeePercentage;
        platformFeeRecipient = _platformFeeRecipient;
        UEA_FACTORY = _ueaFactory;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // EXTERNAL FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Contribute to the campaign
     * @dev Automatically detects contributor's origin chain using IUEAFactory
     */
    function contribute() external payable campaignActive {
        require(msg.value > 0, "Must send funds");
        require(msg.sender != creator, "Creator cannot contribute");

        // Detect origin chain
        (IUEAFactory.UniversalAccountId memory origin, bool isUEA) =
            IUEAFactory(UEA_FACTORY).getOriginForUEA(msg.sender);

        string memory originChain = isUEA
            ? origin.chainNamespace
            : "push"; // Direct Push Chain user

        // Track contribution
        if (!hasContributed[msg.sender]) {
            contributors.push(msg.sender);
            hasContributed[msg.sender] = true;
        }

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;
        contributionsByChain[originChain] += msg.value;
        contributorOriginChain[msg.sender] = originChain;

        emit ContributionReceived(msg.sender, msg.value, originChain, totalRaised);
    }

    /**
     * @notice Withdraw funds if goal is reached
     * @dev Only creator can withdraw after deadline if goal is met
     */
    function withdrawFunds() external onlyCreator campaignEnded {
        require(goalReached(), "Goal not reached");
        require(!fundsWithdrawn, "Already withdrawn");

        fundsWithdrawn = true;

        uint256 platformFee = (totalRaised * platformFeePercentage) / 10000;
        uint256 creatorAmount = totalRaised - platformFee;

        // Transfer platform fee
        if (platformFee > 0) {
            (bool feeSuccess, ) = platformFeeRecipient.call{value: platformFee}("");
            require(feeSuccess, "Fee transfer failed");
        }

        // Transfer to creator
        (bool success, ) = creator.call{value: creatorAmount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(creator, creatorAmount, platformFee);
    }

    /**
     * @notice Claim refund if campaign failed
     * @dev Contributors can claim refunds if goal not reached after deadline
     */
    function claimRefund() external campaignEnded {
        require(!goalReached(), "Goal was reached");
        require(contributions[msg.sender] > 0, "No contribution");

        uint256 refundAmount = contributions[msg.sender];
        contributions[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit RefundClaimed(msg.sender, refundAmount);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    function isActive() public view returns (bool) {
        return block.timestamp <= deadline && !fundsWithdrawn;
    }

    function goalReached() public view returns (bool) {
        return totalRaised >= goalAmount;
    }

    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }

    function getContributors() external view returns (address[] memory) {
        return contributors;
    }

    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    function getProgress() external view returns (uint256) {
        if (goalAmount == 0) return 0;
        return (totalRaised * 100) / goalAmount;
    }

    function getChainContributions(string calldata chainNamespace)
        external
        view
        returns (uint256)
    {
        return contributionsByChain[chainNamespace];
    }

    function getCampaignDetails() external view returns (
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _deadline,
        uint256 _totalRaised,
        bool _isActive,
        bool _goalReached,
        uint256 _contributorCount
    ) {
        return (
            creator,
            title,
            description,
            goalAmount,
            deadline,
            totalRaised,
            isActive(),
            goalReached(),
            contributors.length
        );
    }
}
