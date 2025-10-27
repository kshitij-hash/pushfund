// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/CampaignFactory.sol";
import "../src/Campaign.sol";
import "../src/interfaces/IUEAFactory.sol";

contract MockUEAFactory is IUEAFactory {
    mapping(address => UniversalAccountId) public mockOrigins;
    mapping(address => bool) public mockIsUEA;

    function setMockOrigin(
        address addr,
        string memory chainNamespace,
        string memory chainId,
        bytes memory owner,
        bool isUEA
    ) external {
        mockOrigins[addr] = UniversalAccountId(chainNamespace, chainId, owner);
        mockIsUEA[addr] = isUEA;
    }

    function getOriginForUEA(address addr)
        external
        view
        returns (UniversalAccountId memory account, bool isUEA)
    {
        return (mockOrigins[addr], mockIsUEA[addr]);
    }
}

contract CampaignFactoryTest is Test {
    CampaignFactory public factory;
    MockUEAFactory public mockUEAFactory;

    address public platformFeeRecipient = address(1);
    address public creator1 = address(2);
    address public creator2 = address(3);

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline,
        uint256 campaignId
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    function setUp() public {
        // Deploy mock UEA factory at the expected address
        mockUEAFactory = new MockUEAFactory();

        // Use vm.etch to place the mock at the hardcoded address
        vm.etch(0x00000000000000000000000000000000000000eA, address(mockUEAFactory).code);

        factory = new CampaignFactory(platformFeeRecipient);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(factory.platformFeeRecipient(), platformFeeRecipient);
        assertEq(factory.platformFeePercentage(), 250); // Default 2.5%
        assertEq(factory.totalCampaignsCreated(), 0);
        assertEq(factory.UEA_FACTORY(), 0x00000000000000000000000000000000000000eA);
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert("Invalid fee recipient");
        new CampaignFactory(address(0));
    }

    // ============ Create Campaign Tests ============

    function test_CreateCampaign_SuccessfulCreation() public {
        string memory title = "Test Campaign";
        string memory description = "A test campaign";
        uint256 goalAmount = 10 ether;
        uint256 durationInDays = 30;
        string memory imageUrl = "https://example.com/image.png";

        uint256 expectedDeadline = block.timestamp + (durationInDays * 1 days);

        vm.expectEmit(false, true, false, false);
        emit CampaignCreated(address(0), creator1, title, goalAmount, expectedDeadline, 0);

        vm.prank(creator1);
        address campaignAddress = factory.createCampaign(
            title,
            description,
            goalAmount,
            durationInDays,
            imageUrl
        );

        // Verify campaign was created
        assertTrue(campaignAddress != address(0));
        assertEq(factory.totalCampaignsCreated(), 1);
        assertEq(factory.getCampaignCount(), 1);

        // Verify campaign details
        Campaign campaign = Campaign(campaignAddress);
        assertEq(campaign.creator(), creator1);
        assertEq(campaign.title(), title);
        assertEq(campaign.description(), description);
        assertEq(campaign.goalAmount(), goalAmount);
        assertEq(campaign.imageUrl(), imageUrl);
        assertEq(campaign.platformFeePercentage(), 250);
        assertEq(campaign.platformFeeRecipient(), platformFeeRecipient);
    }

    function test_CreateCampaign_MultipleCreators() public {
        vm.prank(creator1);
        address campaign1 = factory.createCampaign(
            "Campaign 1",
            "Description 1",
            5 ether,
            15,
            "image1.png"
        );

        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            "Campaign 2",
            "Description 2",
            8 ether,
            20,
            "image2.png"
        );

        assertEq(factory.totalCampaignsCreated(), 2);
        assertTrue(campaign1 != campaign2);
    }

    function test_CreateCampaign_SameCreatorMultipleCampaigns() public {
        vm.startPrank(creator1);

        address campaign1 = factory.createCampaign(
            "Campaign 1",
            "Description 1",
            5 ether,
            15,
            "image1.png"
        );

        // Wait for cooldown period (1 day + 1 second)
        vm.warp(block.timestamp + 1 days + 1);

        address campaign2 = factory.createCampaign(
            "Campaign 2",
            "Description 2",
            8 ether,
            20,
            "image2.png"
        );

        vm.stopPrank();

        assertEq(factory.totalCampaignsCreated(), 2);

        CampaignFactory.CampaignInfo[] memory creatorCampaigns =
            factory.getCampaignsByCreator(creator1);

        assertEq(creatorCampaigns.length, 2);
        assertEq(creatorCampaigns[0].campaignAddress, campaign1);
        assertEq(creatorCampaigns[1].campaignAddress, campaign2);
    }

    function test_CreateCampaign_RevertsOnZeroGoal() public {
        vm.prank(creator1);
        vm.expectRevert("Goal must be > 0");
        factory.createCampaign(
            "Test",
            "Description",
            0, // Invalid goal
            30,
            "image.png"
        );
    }

    function test_CreateCampaign_RevertsOnZeroDuration() public {
        vm.prank(creator1);
        vm.expectRevert("Duration must be 7-90 days");
        factory.createCampaign(
            "Test",
            "Description",
            10 ether,
            0, // Invalid duration
            "image.png"
        );
    }

    function test_CreateCampaign_RevertsOnExcessiveDuration() public {
        vm.prank(creator1);
        vm.expectRevert("Duration must be 7-90 days");
        factory.createCampaign(
            "Test",
            "Description",
            10 ether,
            91, // Too long
            "image.png"
        );
    }

    function test_CreateCampaign_RevertsOnEmptyTitle() public {
        vm.prank(creator1);
        vm.expectRevert("Invalid title");
        factory.createCampaign(
            "", // Empty title
            "Description",
            10 ether,
            30,
            "image.png"
        );
    }

    function test_CreateCampaign_RevertsOnTitleTooLong() public {
        // Create a title longer than 100 characters
        string memory longTitle = "This is a very long title that exceeds the maximum allowed length of one hundred characters for campaign titles";

        vm.prank(creator1);
        vm.expectRevert("Invalid title");
        factory.createCampaign(
            longTitle,
            "Description",
            10 ether,
            30,
            "image.png"
        );
    }

    function test_CreateCampaign_AcceptsMaxDuration() public {
        vm.prank(creator1);
        address campaign = factory.createCampaign(
            "Test",
            "Description",
            10 ether,
            90, // Max allowed
            "image.png"
        );

        assertTrue(campaign != address(0));
    }

    function test_CreateCampaign_AcceptsMinDuration() public {
        vm.prank(creator1);
        address campaign = factory.createCampaign(
            "Test",
            "Description",
            10 ether,
            7, // Min allowed (updated from 1 to 7)
            "image.png"
        );

        assertTrue(campaign != address(0));
    }

    // ============ Get Campaigns Tests ============

    function test_GetAllCampaigns_ReturnsEmptyWhenNoCampaigns() public view {
        CampaignFactory.CampaignInfo[] memory campaigns = factory.getAllCampaigns();
        assertEq(campaigns.length, 0);
    }

    function test_GetAllCampaigns_ReturnsAllCampaigns() public {
        // Create 3 campaigns
        vm.prank(creator1);
        factory.createCampaign("Campaign 1", "Desc 1", 5 ether, 15, "img1.png");

        vm.prank(creator2);
        factory.createCampaign("Campaign 2", "Desc 2", 8 ether, 20, "img2.png");

        // Wait for cooldown before creator1 creates another campaign
        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(creator1);
        factory.createCampaign("Campaign 3", "Desc 3", 12 ether, 25, "img3.png");

        CampaignFactory.CampaignInfo[] memory campaigns = factory.getAllCampaigns();

        assertEq(campaigns.length, 3);
        assertEq(campaigns[0].title, "Campaign 1");
        assertEq(campaigns[1].title, "Campaign 2");
        assertEq(campaigns[2].title, "Campaign 3");
        assertEq(campaigns[0].creator, creator1);
        assertEq(campaigns[1].creator, creator2);
        assertEq(campaigns[2].creator, creator1);
    }

    function test_GetCampaignsByCreator_ReturnsEmptyForNewCreator() public view {
        CampaignFactory.CampaignInfo[] memory campaigns =
            factory.getCampaignsByCreator(creator1);

        assertEq(campaigns.length, 0);
    }

    function test_GetCampaignsByCreator_ReturnsOnlyCreatorsCampaigns() public {
        // Creator1 creates 2 campaigns
        vm.startPrank(creator1);
        factory.createCampaign("Campaign 1", "Desc 1", 5 ether, 15, "img1.png");

        // Wait for cooldown
        vm.warp(block.timestamp + 1 days + 1);

        factory.createCampaign("Campaign 2", "Desc 2", 8 ether, 20, "img2.png");
        vm.stopPrank();

        // Creator2 creates 1 campaign
        vm.prank(creator2);
        factory.createCampaign("Campaign 3", "Desc 3", 12 ether, 25, "img3.png");

        // Check creator1's campaigns
        CampaignFactory.CampaignInfo[] memory creator1Campaigns =
            factory.getCampaignsByCreator(creator1);

        assertEq(creator1Campaigns.length, 2);
        assertEq(creator1Campaigns[0].title, "Campaign 1");
        assertEq(creator1Campaigns[1].title, "Campaign 2");

        // Check creator2's campaigns
        CampaignFactory.CampaignInfo[] memory creator2Campaigns =
            factory.getCampaignsByCreator(creator2);

        assertEq(creator2Campaigns.length, 1);
        assertEq(creator2Campaigns[0].title, "Campaign 3");
    }

    function test_GetActiveCampaigns_ReturnsOnlyActiveCampaigns() public {
        // Create active campaign
        vm.prank(creator1);
        factory.createCampaign("Active Campaign", "Active", 10 ether, 30, "img1.png");

        // Create campaign that will expire (minimum 7 days now)
        vm.prank(creator2);
        factory.createCampaign(
            "Expired Campaign",
            "Expired",
            10 ether,
            7, // 7 days (minimum)
            "img2.png"
        );

        // Fast forward past the second campaign's deadline
        vm.warp(block.timestamp + 8 days);

        CampaignFactory.CampaignInfo[] memory activeCampaigns =
            factory.getActiveCampaigns();

        // Only the 30-day campaign should be active
        assertEq(activeCampaigns.length, 1);
        assertEq(activeCampaigns[0].title, "Active Campaign");
        assertTrue(activeCampaigns[0].isActive);
    }

    function test_GetActiveCampaigns_ReturnsEmptyWhenAllExpired() public {
        vm.prank(creator1);
        factory.createCampaign("Campaign 1", "Desc", 10 ether, 7, "img.png");

        // Fast forward past deadline (7 days + 1)
        vm.warp(block.timestamp + 8 days);

        CampaignFactory.CampaignInfo[] memory activeCampaigns =
            factory.getActiveCampaigns();

        assertEq(activeCampaigns.length, 0);
    }

    // ============ Platform Fee Tests ============

    function test_UpdatePlatformFee_SuccessfulUpdate() public {
        uint256 newFee = 300; // 3%

        vm.expectEmit(false, false, false, true);
        emit PlatformFeeUpdated(250, newFee);

        vm.prank(platformFeeRecipient);
        factory.updatePlatformFee(newFee);

        assertEq(factory.platformFeePercentage(), newFee);
    }

    function test_UpdatePlatformFee_RevertsIfNotFeeRecipient() public {
        vm.prank(creator1);
        vm.expectRevert("Only fee recipient");
        factory.updatePlatformFee(300);
    }

    function test_UpdatePlatformFee_RevertsIfExceedsMaximum() public {
        vm.prank(platformFeeRecipient);
        vm.expectRevert("Max 5%");
        factory.updatePlatformFee(501); // > 5%
    }

    function test_UpdatePlatformFee_AcceptsMaximumFee() public {
        vm.prank(platformFeeRecipient);
        factory.updatePlatformFee(500); // Exactly 5%

        assertEq(factory.platformFeePercentage(), 500);
    }

    function test_UpdatePlatformFee_AcceptsZeroFee() public {
        vm.prank(platformFeeRecipient);
        factory.updatePlatformFee(0);

        assertEq(factory.platformFeePercentage(), 0);
    }

    function test_UpdatePlatformFee_NewCampaignsUseNewFee() public {
        // Update fee
        vm.prank(platformFeeRecipient);
        factory.updatePlatformFee(400); // 4%

        // Create new campaign
        vm.prank(creator1);
        address campaignAddress = factory.createCampaign(
            "Test",
            "Desc",
            10 ether,
            30,
            "img.png"
        );

        Campaign campaign = Campaign(campaignAddress);
        assertEq(campaign.platformFeePercentage(), 400);
    }

    // ============ Campaign Info Tests ============

    function test_CampaignInfo_ReflectsCurrentState() public {
        vm.prank(creator1);
        address campaignAddress = factory.createCampaign(
            "Test Campaign",
            "Description",
            10 ether,
            30,
            "image.png"
        );

        // Setup mock origin for creator2
        MockUEAFactory(0x00000000000000000000000000000000000000eA).setMockOrigin(
            creator2,
            "eip155",
            "11155111",
            abi.encode(creator2),
            true
        );

        // Contribute to the campaign
        Campaign campaign = Campaign(campaignAddress);
        vm.deal(creator2, 5 ether);
        vm.prank(creator2);
        campaign.contribute{value: 5 ether}();

        CampaignFactory.CampaignInfo[] memory campaigns = factory.getAllCampaigns();

        assertEq(campaigns[0].totalRaised, 5 ether);
        assertFalse(campaigns[0].goalReached);
        assertTrue(campaigns[0].isActive);
    }

    function test_CampaignInfo_ShowsGoalReached() public {
        vm.prank(creator1);
        address campaignAddress = factory.createCampaign(
            "Test Campaign",
            "Description",
            10 ether,
            30,
            "image.png"
        );

        // Setup mock origin for creator2
        MockUEAFactory(0x00000000000000000000000000000000000000eA).setMockOrigin(
            creator2,
            "eip155",
            "11155111",
            abi.encode(creator2),
            true
        );

        // Contribute to reach goal
        Campaign campaign = Campaign(campaignAddress);
        vm.deal(creator2, 10 ether);
        vm.prank(creator2);
        campaign.contribute{value: 10 ether}();

        CampaignFactory.CampaignInfo[] memory campaigns = factory.getAllCampaigns();

        assertTrue(campaigns[0].goalReached);
        assertEq(campaigns[0].totalRaised, 10 ether);
    }

    // ============ Edge Cases ============

    function testFuzz_CreateCampaign_ValidDuration(uint8 days_) public {
        uint256 duration = bound(days_, 7, 90); // Updated from 1 to 7

        vm.prank(creator1);
        address campaign = factory.createCampaign(
            "Test",
            "Desc",
            10 ether,
            duration,
            "img.png"
        );

        assertTrue(campaign != address(0));
    }

    function testFuzz_CreateCampaign_ValidGoalAmount(uint128 amount) public {
        vm.assume(amount > 0);

        vm.prank(creator1);
        address campaign = factory.createCampaign(
            "Test",
            "Desc",
            amount,
            30,
            "img.png"
        );

        assertTrue(campaign != address(0));
        assertEq(Campaign(campaign).goalAmount(), amount);
    }

    function test_GetCampaignCount_IncrementsCorrectly() public {
        assertEq(factory.getCampaignCount(), 0);

        vm.prank(creator1);
        factory.createCampaign("Campaign 1", "Desc", 10 ether, 30, "img.png");
        assertEq(factory.getCampaignCount(), 1);

        // Wait for cooldown
        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(creator1);
        factory.createCampaign("Campaign 2", "Desc", 10 ether, 30, "img.png");
        assertEq(factory.getCampaignCount(), 2);

        vm.prank(creator2);
        factory.createCampaign("Campaign 3", "Desc", 10 ether, 30, "img.png");
        assertEq(factory.getCampaignCount(), 3);
    }
}
