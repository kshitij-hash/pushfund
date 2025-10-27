// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
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

contract CampaignTest is Test {
    Campaign public campaign;
    MockUEAFactory public mockUEAFactory;

    address public creator = address(1);
    address public platformFeeRecipient = address(2);
    address public contributor1 = address(3);
    address public contributor2 = address(4);
    address public contributor3 = address(5);

    uint256 public constant GOAL_AMOUNT = 10 ether;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
    uint256 public deadline;

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

    function setUp() public {
        // Deploy mock UEA factory
        mockUEAFactory = new MockUEAFactory();

        // Set deadline to 30 days from now
        deadline = block.timestamp + 30 days;

        // Deploy campaign as creator
        vm.prank(creator);
        campaign = new Campaign(
            creator,
            "Test Campaign",
            "A test crowdfunding campaign",
            GOAL_AMOUNT,
            deadline,
            "https://example.com/image.png",
            PLATFORM_FEE_PERCENTAGE,
            platformFeeRecipient,
            address(mockUEAFactory)
        );

        // Setup mock origins for contributors
        // Contributor 1 from Ethereum (eip155)
        mockUEAFactory.setMockOrigin(
            contributor1,
            "eip155",
            "11155111", // Sepolia
            abi.encode(contributor1),
            true
        );

        // Contributor 2 from Solana
        mockUEAFactory.setMockOrigin(
            contributor2,
            "solana",
            "devnet",
            abi.encode(contributor2),
            true
        );

        // Contributor 3 is native Push Chain user (not UEA)
        mockUEAFactory.setMockOrigin(
            contributor3,
            "",
            "",
            "",
            false
        );

        // Fund contributors
        vm.deal(contributor1, 100 ether);
        vm.deal(contributor2, 100 ether);
        vm.deal(contributor3, 100 ether);
        vm.deal(creator, 100 ether);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(campaign.creator(), creator);
        assertEq(campaign.title(), "Test Campaign");
        assertEq(campaign.description(), "A test crowdfunding campaign");
        assertEq(campaign.goalAmount(), GOAL_AMOUNT);
        assertEq(campaign.deadline(), deadline);
        assertEq(campaign.imageUrl(), "https://example.com/image.png");
        assertEq(campaign.platformFeePercentage(), PLATFORM_FEE_PERCENTAGE);
        assertEq(campaign.platformFeeRecipient(), platformFeeRecipient);
        assertEq(campaign.totalRaised(), 0);
        assertFalse(campaign.fundsWithdrawn());
    }

    // ============ Contribution Tests ============

    function test_Contribute_SuccessfulContribution() public {
        uint256 contributionAmount = 1 ether;

        vm.expectEmit(true, false, false, true);
        emit ContributionReceived(contributor1, contributionAmount, "eip155", contributionAmount);

        vm.prank(contributor1);
        campaign.contribute{value: contributionAmount}();

        assertEq(campaign.totalRaised(), contributionAmount);
        assertEq(campaign.contributions(contributor1), contributionAmount);
        assertEq(campaign.getContributorCount(), 1);
        assertTrue(campaign.hasContributed(contributor1));
        assertEq(campaign.contributorOriginChain(contributor1), "eip155");
        assertEq(campaign.getChainContributions("eip155"), contributionAmount);
    }

    function test_Contribute_MultipleContributionsFromSameUser() public {
        vm.startPrank(contributor1);
        campaign.contribute{value: 1 ether}();
        campaign.contribute{value: 2 ether}();
        vm.stopPrank();

        assertEq(campaign.contributions(contributor1), 3 ether);
        assertEq(campaign.totalRaised(), 3 ether);
        assertEq(campaign.getContributorCount(), 1); // Still only 1 unique contributor
    }

    function test_Contribute_MultipleContributorsFromDifferentChains() public {
        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        vm.prank(contributor2);
        campaign.contribute{value: 3 ether}();

        vm.prank(contributor3);
        campaign.contribute{value: 1 ether}();

        assertEq(campaign.totalRaised(), 6 ether);
        assertEq(campaign.getContributorCount(), 3);
        assertEq(campaign.getChainContributions("eip155"), 2 ether);
        assertEq(campaign.getChainContributions("solana"), 3 ether);
        assertEq(campaign.getChainContributions("push"), 1 ether);
    }

    function test_Contribute_RevertsIfNoFundsSent() public {
        vm.prank(contributor1);
        vm.expectRevert("Must send funds");
        campaign.contribute{value: 0}();
    }

    function test_Contribute_RevertsIfCreatorTries() public {
        vm.prank(creator);
        vm.expectRevert("Creator cannot contribute");
        campaign.contribute{value: 1 ether}();
    }

    function test_Contribute_RevertsIfCampaignEnded() public {
        // Fast forward past deadline
        vm.warp(deadline + 1);

        vm.prank(contributor1);
        vm.expectRevert("Campaign not active");
        campaign.contribute{value: 1 ether}();
    }

    function test_Contribute_RevertsIfFundsWithdrawn() public {
        // Reach goal
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        // Fast forward past deadline
        vm.warp(deadline + 1);

        // Withdraw funds
        vm.prank(creator);
        campaign.withdrawFunds();

        // Try to contribute (should fail)
        vm.prank(contributor2);
        vm.expectRevert("Campaign not active");
        campaign.contribute{value: 1 ether}();
    }

    // ============ Withdraw Tests ============

    function test_WithdrawFunds_SuccessfulWithdrawal() public {
        // Contribute to reach goal
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        // Fast forward past deadline
        vm.warp(deadline + 1);

        uint256 platformFee = (GOAL_AMOUNT * PLATFORM_FEE_PERCENTAGE) / 10000;
        uint256 creatorAmount = GOAL_AMOUNT - platformFee;

        uint256 creatorBalanceBefore = creator.balance;
        uint256 platformBalanceBefore = platformFeeRecipient.balance;

        vm.expectEmit(true, false, false, true);
        emit FundsWithdrawn(creator, creatorAmount, platformFee);

        vm.prank(creator);
        campaign.withdrawFunds();

        assertEq(creator.balance, creatorBalanceBefore + creatorAmount);
        assertEq(platformFeeRecipient.balance, platformBalanceBefore + platformFee);
        assertTrue(campaign.fundsWithdrawn());
    }

    function test_WithdrawFunds_CalculatesPlatformFeeCorrectly() public {
        vm.prank(contributor1);
        campaign.contribute{value: 10 ether}();

        vm.warp(deadline + 1);

        uint256 expectedPlatformFee = (10 ether * 250) / 10000; // 2.5% = 0.25 ether
        uint256 expectedCreatorAmount = 10 ether - expectedPlatformFee; // 9.75 ether

        vm.prank(creator);
        campaign.withdrawFunds();

        assertEq(platformFeeRecipient.balance, expectedPlatformFee);
        assertEq(creator.balance, 100 ether + expectedCreatorAmount);
    }

    function test_WithdrawFunds_RevertsIfNotCreator() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        vm.warp(deadline + 1);

        vm.prank(contributor1);
        vm.expectRevert("Only creator");
        campaign.withdrawFunds();
    }

    function test_WithdrawFunds_RevertsIfCampaignStillActive() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        vm.prank(creator);
        vm.expectRevert("Campaign still active");
        campaign.withdrawFunds();
    }

    function test_WithdrawFunds_RevertsIfGoalNotReached() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT - 1 ether}();

        vm.warp(deadline + 1);

        vm.prank(creator);
        vm.expectRevert("Goal not reached");
        campaign.withdrawFunds();
    }

    function test_WithdrawFunds_RevertsIfAlreadyWithdrawn() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        vm.warp(deadline + 1);

        vm.prank(creator);
        campaign.withdrawFunds();

        vm.prank(creator);
        vm.expectRevert("Already withdrawn");
        campaign.withdrawFunds();
    }

    // ============ Refund Tests ============

    function test_ClaimRefund_SuccessfulRefund() public {
        uint256 contributionAmount = 5 ether;

        vm.prank(contributor1);
        campaign.contribute{value: contributionAmount}();

        // Fast forward past deadline
        vm.warp(deadline + 1);

        uint256 balanceBefore = contributor1.balance;

        vm.expectEmit(true, false, false, true);
        emit RefundClaimed(contributor1, contributionAmount);

        vm.prank(contributor1);
        campaign.claimRefund();

        assertEq(contributor1.balance, balanceBefore + contributionAmount);
        assertEq(campaign.contributions(contributor1), 0);
    }

    function test_ClaimRefund_MultipleContributorsCanRefund() public {
        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        vm.prank(contributor2);
        campaign.contribute{value: 3 ether}();

        vm.warp(deadline + 1);

        uint256 balance1Before = contributor1.balance;
        uint256 balance2Before = contributor2.balance;

        vm.prank(contributor1);
        campaign.claimRefund();

        vm.prank(contributor2);
        campaign.claimRefund();

        assertEq(contributor1.balance, balance1Before + 2 ether);
        assertEq(contributor2.balance, balance2Before + 3 ether);
    }

    function test_ClaimRefund_RevertsIfCampaignStillActive() public {
        vm.prank(contributor1);
        campaign.contribute{value: 1 ether}();

        vm.prank(contributor1);
        vm.expectRevert("Campaign still active");
        campaign.claimRefund();
    }

    function test_ClaimRefund_RevertsIfGoalReached() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        vm.warp(deadline + 1);

        vm.prank(contributor1);
        vm.expectRevert("Goal was reached");
        campaign.claimRefund();
    }

    function test_ClaimRefund_RevertsIfNoContribution() public {
        vm.warp(deadline + 1);

        vm.prank(contributor1);
        vm.expectRevert("No contribution");
        campaign.claimRefund();
    }

    // ============ View Function Tests ============

    function test_IsActive_TrueWhenCampaignActive() public view {
        assertTrue(campaign.isActive());
    }

    function test_IsActive_FalseWhenPastDeadline() public {
        vm.warp(deadline + 1);
        assertFalse(campaign.isActive());
    }

    function test_IsActive_FalseWhenFundsWithdrawn() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        vm.warp(deadline + 1);

        vm.prank(creator);
        campaign.withdrawFunds();

        assertFalse(campaign.isActive());
    }

    function test_GoalReached_FalseWhenBelowGoal() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT - 1 ether}();

        assertFalse(campaign.goalReached());
    }

    function test_GoalReached_TrueWhenGoalMet() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT}();

        assertTrue(campaign.goalReached());
    }

    function test_GoalReached_TrueWhenGoalExceeded() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT + 5 ether}();

        assertTrue(campaign.goalReached());
    }

    function test_GetTimeRemaining_ReturnsCorrectTime() public {
        uint256 timeRemaining = campaign.getTimeRemaining();
        assertEq(timeRemaining, 30 days);

        vm.warp(block.timestamp + 10 days);
        timeRemaining = campaign.getTimeRemaining();
        assertEq(timeRemaining, 20 days);
    }

    function test_GetTimeRemaining_ReturnsZeroAfterDeadline() public {
        vm.warp(deadline + 1);
        assertEq(campaign.getTimeRemaining(), 0);
    }

    function test_GetProgress_ReturnsCorrectPercentage() public {
        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        assertEq(campaign.getProgress(), 50); // 50%

        vm.prank(contributor2);
        campaign.contribute{value: 2.5 ether}();

        assertEq(campaign.getProgress(), 75); // 75%
    }

    function test_GetProgress_ReturnsZeroWhenNoContributions() public view {
        assertEq(campaign.getProgress(), 0);
    }

    function test_GetCampaignDetails_ReturnsCorrectData() public {
        vm.prank(contributor1);
        campaign.contribute{value: 3 ether}();

        (
            address _creator,
            string memory _title,
            string memory _description,
            uint256 _goalAmount,
            uint256 _deadline,
            uint256 _totalRaised,
            bool _isActive,
            bool _goalReached,
            uint256 _contributorCount
        ) = campaign.getCampaignDetails();

        assertEq(_creator, creator);
        assertEq(_title, "Test Campaign");
        assertEq(_description, "A test crowdfunding campaign");
        assertEq(_goalAmount, GOAL_AMOUNT);
        assertEq(_deadline, deadline);
        assertEq(_totalRaised, 3 ether);
        assertTrue(_isActive);
        assertFalse(_goalReached);
        assertEq(_contributorCount, 1);
    }

    function test_GetContributors_ReturnsAllContributors() public {
        vm.prank(contributor1);
        campaign.contribute{value: 1 ether}();

        vm.prank(contributor2);
        campaign.contribute{value: 2 ether}();

        vm.prank(contributor3);
        campaign.contribute{value: 3 ether}();

        address[] memory contributors = campaign.getContributors();
        assertEq(contributors.length, 3);
        assertEq(contributors[0], contributor1);
        assertEq(contributors[1], contributor2);
        assertEq(contributors[2], contributor3);
    }

    // ============ Edge Case Tests ============

    function testFuzz_Contribute_AcceptsAnyValidAmount(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(contributor1, amount);

        vm.prank(contributor1);
        campaign.contribute{value: amount}();

        assertEq(campaign.totalRaised(), amount);
    }

    function test_Contribute_ExceedingGoalIsAllowed() public {
        vm.prank(contributor1);
        campaign.contribute{value: GOAL_AMOUNT + 10 ether}();

        assertEq(campaign.totalRaised(), GOAL_AMOUNT + 10 ether);
        assertTrue(campaign.goalReached());
    }
}
