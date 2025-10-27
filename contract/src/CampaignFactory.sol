// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./Campaign.sol";
import "./interfaces/IUEAFactory.sol";

/**
 * @title CampaignFactory
 * @notice Factory contract for creating and managing crowdfunding campaigns
 * @dev Deploys new Campaign contracts and maintains a registry
 */
contract CampaignFactory {
    // ══════════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ══════════════════════════════════════════════════════════════════════════════

    address public immutable UEA_FACTORY = 0x00000000000000000000000000000000000000eA;

    Campaign[] public campaigns;
    mapping(address => Campaign[]) public campaignsByCreator;
    mapping(address => mapping(uint256 => bool)) public userContributions; // user => campaignId => hasContributed

    uint256 public totalCampaignsCreated;
    uint256 public totalFundsRaised;
    uint256 public platformFeePercentage = 250; // 2.5% (in basis points)
    address public platformFeeRecipient;

    // Anti-fraud mechanisms
    mapping(address => uint256) public campaignCreationTimestamps; // Last campaign creation time
    mapping(address => uint256) public campaignsCreatedByCreator; // Total campaigns per creator
    uint256 public constant MIN_CAMPAIGN_DURATION = 7 days;
    uint256 public constant CAMPAIGN_CREATION_COOLDOWN = 1 days;
    uint256 public constant MAX_CAMPAIGNS_PER_CREATOR = 10;

    // ══════════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════════════════════

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline,
        uint256 campaignId
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ══════════════════════════════════════════════════════════════════════════════
    // STRUCTS
    // ══════════════════════════════════════════════════════════════════════════════

    struct CampaignInfo {
        address campaignAddress;
        address creator;
        string title;
        uint256 goalAmount;
        uint256 deadline;
        uint256 totalRaised;
        bool isActive;
        bool goalReached;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ══════════════════════════════════════════════════════════════════════════════

    constructor(address _platformFeeRecipient) {
        require(_platformFeeRecipient != address(0), "Invalid fee recipient");
        platformFeeRecipient = _platformFeeRecipient;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // EXTERNAL FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _goalAmount Funding goal in wei
     * @param _durationInDays Campaign duration in days
     * @param _imageUrl Campaign image URL
     * @return campaignAddress Address of the newly created campaign
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goalAmount,
        uint256 _durationInDays,
        string calldata _imageUrl
    ) external returns (address campaignAddress) {
        require(_goalAmount > 0, "Goal must be > 0");
        require(bytes(_title).length > 0 && bytes(_title).length <= 100, "Invalid title");

        // Anti-fraud checks
        require(_durationInDays >= 7 && _durationInDays <= 90, "Duration must be 7-90 days");
        require(
            campaignsCreatedByCreator[msg.sender] < MAX_CAMPAIGNS_PER_CREATOR,
            "Max campaigns limit reached"
        );

        // Cooldown check (skip for first campaign)
        if (campaignCreationTimestamps[msg.sender] > 0) {
            require(
                block.timestamp >= campaignCreationTimestamps[msg.sender] + CAMPAIGN_CREATION_COOLDOWN,
                "Campaign creation cooldown active"
            );
        }

        uint256 deadline = block.timestamp + (_durationInDays * 1 days);

        Campaign newCampaign = new Campaign(
            msg.sender,
            _title,
            _description,
            _goalAmount,
            deadline,
            _imageUrl,
            platformFeePercentage,
            platformFeeRecipient,
            UEA_FACTORY
        );

        campaigns.push(newCampaign);
        campaignsByCreator[msg.sender].push(newCampaign);

        // Update anti-fraud tracking
        campaignCreationTimestamps[msg.sender] = block.timestamp;
        campaignsCreatedByCreator[msg.sender]++;

        totalCampaignsCreated++;

        emit CampaignCreated(
            address(newCampaign),
            msg.sender,
            _title,
            _goalAmount,
            deadline,
            totalCampaignsCreated - 1
        );

        return address(newCampaign);
    }

    /**
     * @notice Get all campaigns
     * @return Array of campaign information
     */
    function getAllCampaigns() external view returns (CampaignInfo[] memory) {
        CampaignInfo[] memory allCampaigns = new CampaignInfo[](campaigns.length);

        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = campaigns[i];
            allCampaigns[i] = CampaignInfo({
                campaignAddress: address(campaign),
                creator: campaign.creator(),
                title: campaign.title(),
                goalAmount: campaign.goalAmount(),
                deadline: campaign.deadline(),
                totalRaised: campaign.totalRaised(),
                isActive: campaign.isActive(),
                goalReached: campaign.goalReached()
            });
        }

        return allCampaigns;
    }

    /**
     * @notice Get campaigns created by a specific address
     */
    function getCampaignsByCreator(address _creator)
        external
        view
        returns (CampaignInfo[] memory)
    {
        Campaign[] memory creatorCampaigns = campaignsByCreator[_creator];
        CampaignInfo[] memory result = new CampaignInfo[](creatorCampaigns.length);

        for (uint256 i = 0; i < creatorCampaigns.length; i++) {
            Campaign campaign = creatorCampaigns[i];
            result[i] = CampaignInfo({
                campaignAddress: address(campaign),
                creator: campaign.creator(),
                title: campaign.title(),
                goalAmount: campaign.goalAmount(),
                deadline: campaign.deadline(),
                totalRaised: campaign.totalRaised(),
                isActive: campaign.isActive(),
                goalReached: campaign.goalReached()
            });
        }

        return result;
    }

    /**
     * @notice Get active campaigns
     */
    function getActiveCampaigns() external view returns (CampaignInfo[] memory) {
        // First, count active campaigns
        uint256 activeCount = 0;
        for (uint256 i = 0; i < campaigns.length; i++) {
            if (campaigns[i].isActive()) {
                activeCount++;
            }
        }

        // Create array of correct size
        CampaignInfo[] memory activeCampaigns = new CampaignInfo[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = campaigns[i];
            if (campaign.isActive()) {
                activeCampaigns[currentIndex] = CampaignInfo({
                    campaignAddress: address(campaign),
                    creator: campaign.creator(),
                    title: campaign.title(),
                    goalAmount: campaign.goalAmount(),
                    deadline: campaign.deadline(),
                    totalRaised: campaign.totalRaised(),
                    isActive: true,
                    goalReached: campaign.goalReached()
                });
                currentIndex++;
            }
        }

        return activeCampaigns;
    }

    /**
     * @notice Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFeePercentage) external {
        require(msg.sender == platformFeeRecipient, "Only fee recipient");
        require(_newFeePercentage <= 500, "Max 5%"); // Max 5%

        emit PlatformFeeUpdated(platformFeePercentage, _newFeePercentage);
        platformFeePercentage = _newFeePercentage;
    }

    /**
     * @notice Get campaign count
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // ANTI-FRAUD HELPER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get total campaigns created by an address
     */
    function getCreatorCampaignCount(address creator) external view returns (uint256) {
        return campaignsCreatedByCreator[creator];
    }

    /**
     * @notice Get time since last campaign creation
     */
    function getTimeSinceLastCampaign(address creator) external view returns (uint256) {
        if (campaignCreationTimestamps[creator] == 0) {
            return type(uint256).max; // No campaigns created yet
        }
        return block.timestamp - campaignCreationTimestamps[creator];
    }

    /**
     * @notice Check if creator can create a new campaign
     * @return canCreate Whether creator can create campaign
     * @return reason Human-readable reason if cannot create
     */
    function canCreateCampaign(address creator) external view returns (bool canCreate, string memory reason) {
        // Check max campaigns limit
        if (campaignsCreatedByCreator[creator] >= MAX_CAMPAIGNS_PER_CREATOR) {
            return (false, "Maximum campaigns limit reached");
        }

        // Check cooldown (skip for first campaign)
        if (campaignCreationTimestamps[creator] > 0) {
            if (block.timestamp < campaignCreationTimestamps[creator] + CAMPAIGN_CREATION_COOLDOWN) {
                return (false, "Campaign creation cooldown active");
            }
        }

        return (true, "Can create campaign");
    }
}
