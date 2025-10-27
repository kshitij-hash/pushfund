// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/CampaignFactory.sol";

/**
 * @title Deploy
 * @notice Deployment script for pushfund contracts on Push Chain
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast --private-key <KEY>
 */
contract Deploy is Script {
    function run() external {
        // Get platform fee recipient from environment or use deployer address
        address platformFeeRecipient = vm.envOr("PLATFORM_FEE_RECIPIENT", msg.sender);

        console.log("==============================================");
        console.log("pushfund Deployment Script");
        console.log("==============================================");
        console.log("Deployer:", msg.sender);
        console.log("Platform Fee Recipient:", platformFeeRecipient);
        console.log("Network:", block.chainid);
        console.log("==============================================");

        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy CampaignFactory
        console.log("\nDeploying CampaignFactory...");
        CampaignFactory factory = new CampaignFactory(platformFeeRecipient);
        console.log("CampaignFactory deployed at:", address(factory));

        // Verify deployment
        console.log("\nVerifying deployment...");
        console.log("Platform Fee Percentage:", factory.platformFeePercentage(), "basis points");
        console.log("Platform Fee Recipient:", factory.platformFeeRecipient());
        console.log("UEA Factory Address:", factory.UEA_FACTORY());
        console.log("Campaign Count:", factory.getCampaignCount());
        console.log("Min Campaign Duration:", factory.MIN_CAMPAIGN_DURATION() / 1 days, "days");
        console.log("Campaign Creation Cooldown:", factory.CAMPAIGN_CREATION_COOLDOWN() / 1 days, "days");
        console.log("Max Campaigns Per Creator:", factory.MAX_CAMPAIGNS_PER_CREATOR());

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("Deployment Complete!");
        console.log("==============================================");
        console.log("\nNext Steps:");
        console.log("1. Update frontend .env.local with:");
        console.log("   NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=", address(factory));
        console.log("\n2. Verify on block explorer:");
        console.log("   https://donut.push.network/address/", address(factory));
        console.log("\n3. Test campaign creation:");
        console.log("   cast send", address(factory));
        console.log('   "createCampaign(string,string,uint256,uint256,string)"');
        console.log('   "Test Campaign" "Description" 1000000000000000000 7 "https://example.com/image.jpg"');
        console.log("   --rpc-url <RPC_URL> --private-key <KEY>");
        console.log("==============================================\n");
    }
}
