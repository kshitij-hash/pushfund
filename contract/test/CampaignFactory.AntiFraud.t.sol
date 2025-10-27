// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/CampaignFactory.sol";
import "../src/Campaign.sol";

/**
 * @title CampaignFactoryAntiFraudTest
 * @notice Tests for anti-fraud mechanisms in CampaignFactory
 */
contract CampaignFactoryAntiFraudTest is Test {
    CampaignFactory public factory;
    address public platformFeeRecipient;
    address public creator1;
    address public creator2;

    function setUp() public {
        platformFeeRecipient = address(this);
        creator1 = address(0x1);
        creator2 = address(0x2);

        factory = new CampaignFactory(platformFeeRecipient);

        // Fund test accounts
        vm.deal(creator1, 100 ether);
        vm.deal(creator2, 100 ether);
    }

    function testMinimumDurationEnforcement() public {
        vm.startPrank(creator1);

        // Try to create campaign with 6 days (should fail)
        vm.expectRevert("Duration must be 7-90 days");
        factory.createCampaign(
            "Test Campaign",
            "Test Description",
            1 ether,
            6, // 6 days - below minimum
            "https://example.com/image.jpg"
        );

        // Try with 7 days (should succeed)
        address campaignAddress = factory.createCampaign(
            "Test Campaign",
            "Test Description",
            1 ether,
            7, // 7 days - minimum
            "https://example.com/image.jpg"
        );

        assertFalse(campaignAddress == address(0), "Campaign should be created");

        vm.stopPrank();
    }

    function testCampaignCreationCooldown() public {
        vm.startPrank(creator1);

        // Create first campaign (should succeed)
        factory.createCampaign(
            "Campaign 1",
            "Description 1",
            1 ether,
            7,
            "https://example.com/image1.jpg"
        );

        // Try to create second campaign immediately (should fail)
        vm.expectRevert("Campaign creation cooldown active");
        factory.createCampaign(
            "Campaign 2",
            "Description 2",
            1 ether,
            7,
            "https://example.com/image2.jpg"
        );

        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);

        // Try again (should succeed)
        address campaign2Address = factory.createCampaign(
            "Campaign 2",
            "Description 2",
            1 ether,
            7,
            "https://example.com/image2.jpg"
        );

        assertFalse(campaign2Address == address(0), "Second campaign should be created after cooldown");

        vm.stopPrank();
    }

    function testMaxCampaignsPerCreator() public {
        vm.startPrank(creator1);

        // Start at a known timestamp
        uint256 currentTime = 1000;
        vm.warp(currentTime);

        // Create 10 campaigns (max limit)
        for (uint256 i = 0; i < 10; i++) {
            factory.createCampaign(
                string(abi.encodePacked("Campaign ", vm.toString(i))),
                string(abi.encodePacked("Description ", vm.toString(i))),
                1 ether,
                7,
                "https://example.com/image.jpg"
            );

            // Fast forward to avoid cooldown for next iteration
            currentTime += 1 days + 1;
            vm.warp(currentTime);
        }

        // Try to create 11th campaign (should fail)
        vm.expectRevert("Max campaigns limit reached");
        factory.createCampaign(
            "Campaign 11",
            "Description 11",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        vm.stopPrank();
    }

    function testGetCreatorCampaignCount() public {
        vm.startPrank(creator1);

        // Initially should be 0
        assertEq(factory.getCreatorCampaignCount(creator1), 0);

        // Create one campaign
        factory.createCampaign(
            "Campaign 1",
            "Description 1",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        // Should be 1
        assertEq(factory.getCreatorCampaignCount(creator1), 1);

        // Fast forward and create another
        vm.warp(block.timestamp + 1 days + 1);
        factory.createCampaign(
            "Campaign 2",
            "Description 2",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        // Should be 2
        assertEq(factory.getCreatorCampaignCount(creator1), 2);

        vm.stopPrank();
    }

    function testGetTimeSinceLastCampaign() public {
        vm.startPrank(creator1);

        // No campaigns yet - should return max uint256
        assertEq(factory.getTimeSinceLastCampaign(creator1), type(uint256).max);

        // Create campaign at timestamp 1
        uint256 startTime = 1;
        vm.warp(startTime);
        factory.createCampaign(
            "Campaign 1",
            "Description 1",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        // Immediately after creation should be 0
        assertEq(factory.getTimeSinceLastCampaign(creator1), 0);

        // Fast forward 12 hours from start
        vm.warp(startTime + 12 hours);
        assertEq(factory.getTimeSinceLastCampaign(creator1), 12 hours);

        // Fast forward to 1 day from start
        vm.warp(startTime + 1 days);
        assertEq(factory.getTimeSinceLastCampaign(creator1), 1 days);

        vm.stopPrank();
    }

    function testCanCreateCampaign() public {
        vm.startPrank(creator1);

        // Initially should be able to create
        (bool canCreate1, string memory reason1) = factory.canCreateCampaign(creator1);
        assertTrue(canCreate1);
        assertEq(reason1, "Can create campaign");

        // Create first campaign
        factory.createCampaign(
            "Campaign 1",
            "Description 1",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        // Should not be able to create immediately (cooldown)
        (bool canCreate2, string memory reason2) = factory.canCreateCampaign(creator1);
        assertFalse(canCreate2);
        assertEq(reason2, "Campaign creation cooldown active");

        // Fast forward past cooldown
        vm.warp(block.timestamp + 1 days + 1);

        // Should be able to create again
        (bool canCreate3, string memory reason3) = factory.canCreateCampaign(creator1);
        assertTrue(canCreate3);
        assertEq(reason3, "Can create campaign");

        vm.stopPrank();
    }

    function testCanCreateCampaignMaxLimit() public {
        vm.startPrank(creator1);

        // Start at a known timestamp
        uint256 currentTime = 1000;
        vm.warp(currentTime);

        // Create 10 campaigns
        for (uint256 i = 0; i < 10; i++) {
            factory.createCampaign(
                string(abi.encodePacked("Campaign ", vm.toString(i))),
                string(abi.encodePacked("Description ", vm.toString(i))),
                1 ether,
                7,
                "https://example.com/image.jpg"
            );
            currentTime += 1 days + 1;
            vm.warp(currentTime);
        }

        // Should not be able to create more (max limit)
        (bool canCreate, string memory reason) = factory.canCreateCampaign(creator1);
        assertFalse(canCreate);
        assertEq(reason, "Maximum campaigns limit reached");

        vm.stopPrank();
    }

    function testDifferentCreatorsIndependentLimits() public {
        // Creator 1 creates campaign
        vm.prank(creator1);
        factory.createCampaign(
            "Creator 1 Campaign",
            "Description",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        // Creator 2 should still be able to create immediately (different cooldown)
        vm.prank(creator2);
        address campaign2 = factory.createCampaign(
            "Creator 2 Campaign",
            "Description",
            1 ether,
            7,
            "https://example.com/image.jpg"
        );

        assertFalse(campaign2 == address(0), "Creator 2 should be able to create");

        // Check counts are independent
        assertEq(factory.getCreatorCampaignCount(creator1), 1);
        assertEq(factory.getCreatorCampaignCount(creator2), 1);
    }

    function testMaxDurationStillEnforced() public {
        vm.startPrank(creator1);

        // Try to create campaign with 91 days (should fail)
        vm.expectRevert("Duration must be 7-90 days");
        factory.createCampaign(
            "Test Campaign",
            "Test Description",
            1 ether,
            91, // Above maximum
            "https://example.com/image.jpg"
        );

        // Try with 90 days (should succeed)
        address campaignAddress = factory.createCampaign(
            "Test Campaign",
            "Test Description",
            1 ether,
            90, // Maximum allowed
            "https://example.com/image.jpg"
        );

        assertFalse(campaignAddress == address(0), "Campaign with 90 days should be created");

        vm.stopPrank();
    }
}
