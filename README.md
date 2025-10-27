# PushFund

A universal crowdfunding platform built on Push Chain that enables campaign creators to accept contributions from any blockchain.

## The Problem

Traditional crowdfunding platforms are limited to single blockchains, forcing creators to choose one network and alienating potential backers on other chains. This creates fragmentation and reduces funding opportunities.

## The Solution

PushFund leverages Push Chain's Universal Execution Account (UEA) to enable:
- Launch campaigns on Push Chain testnet
- Accept contributions from Ethereum, Arbitrum, Base, and Solana
- Automatic cross-chain origin tracking for every contribution
- Unified campaign management across all chains

## Key Features

### For Campaign Creators
- Create campaigns with title, description, funding goal, and deadline
- Withdraw funds automatically when campaign succeeds
- Built-in platform fee mechanism (2.5%)
- Anti-fraud protections (creation cooldowns, campaign limits)

### For Contributors
- Contribute from any supported blockchain
- Automatic refunds if campaign fails
- Transparent tracking of contributions by chain origin
- View contribution history across all campaigns

### Cross-Chain Capabilities
- Automatic chain detection (eip155, solana, push)
- Track total contributions per blockchain
- Support for multiple chain namespaces
- Seamless bridging via Push Chain UEA

## Architecture

### Smart Contracts

**CampaignFactory.sol**
- Deploys individual campaign contracts
- Maintains registry of all campaigns
- Manages platform fees and recipient
- Enforces anti-fraud rules (7-day minimum duration, creation cooldowns)

**Campaign.sol**
- Individual campaign logic
- Contribution handling with chain origin tracking
- Time-based campaign lifecycle (active/ended)
- Goal-based outcomes (successful/failed)
- Secure withdrawal and refund mechanisms

**Key Contract Features:**
- Immutable campaign parameters (goal, deadline, creator)
- Checks-Effects-Interactions pattern for security
- Access control on critical functions
- 100% test coverage (62/62 tests passing)

### Frontend

**Tech Stack:**
- Next.js 15.5 with React 19
- Push Chain SDK (@pushchain/core, @pushchain/ui-kit)
- ethers.js and viem for blockchain interactions
- TailwindCSS + shadcn/ui for components
- TypeScript for type safety

**Pages:**
- Campaign discovery and browsing
- Campaign creation flow
- Individual campaign details
- User dashboard for created/backed campaigns

## Platform Details

**Network:** Push Chain Donut Testnet

**Contract Addresses:**
- UEA Factory: `0x00000000000000000000000000000000000000eA`
- CampaignFactory: Deployed on testnet

**Platform Fee:** 2.5% (250 basis points)

**Campaign Rules:**
- Minimum duration: 7 days
- Creation cooldown: 1 day between campaigns
- Maximum campaigns per creator: 10

## How It Works

1. **Create Campaign:** Creator sets title, goal, deadline, and description
2. **Accept Contributions:** Contributors send funds from any supported chain
3. **Track Origins:** Campaign automatically tracks which chain each contribution came from
4. **Campaign Ends:**
   - If goal reached: Creator withdraws funds (minus 2.5% fee)
   - If goal not reached: Contributors claim refunds
5. **Cross-Chain Data:** All contribution data aggregated on Push Chain

## Security

- Reentrancy protection
- Input validation on all parameters
- Access control (creator vs contributor permissions)
- Secure fund withdrawal patterns
- Comprehensive test coverage
- Integer overflow protection (Solidity 0.8+)
