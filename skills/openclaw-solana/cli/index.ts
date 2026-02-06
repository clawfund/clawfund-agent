#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AgentWallet } from '../src/wallet/AgentWallet';
import { AgentIndexClient } from '../src/agent-index/Client';

const program = new Command();

program
  .name('openclaw-solana')
  .description('CLI for OpenClaw Solana agent toolkit')
  .version('0.1.0');

// Wallet commands
const walletCmd = program.command('wallet')
  .description('Wallet management commands');

walletCmd.command('create')
  .description('Create a new agent wallet')
  .option('-n, --name <name>', 'Environment variable name', 'AGENT_SOLANA_KEY')
  .option('-e, --env <file>', 'Environment file path', '.env')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Creating new Solana wallet...'));
      
      const wallet = await AgentWallet.create({
        storage: 'env',
        keyName: options.name,
        envFile: options.env
      });

      console.log(chalk.green('✓ Wallet created successfully'));
      console.log(chalk.yellow('Address:'), wallet.address);
      console.log(chalk.gray(`Saved to ${options.env} as ${options.name}`));
      console.log(chalk.red('\n⚠️  IMPORTANT: Fund this wallet with SOL and AINDX before onboarding'));
      console.log(chalk.gray('  - SOL: ~0.05 for transaction fees'));
      console.log(chalk.gray('  - AINDX: 250+ for governance access'));
      
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

walletCmd.command('balance')
  .description('Check wallet balance')
  .option('-e, --env <file>', 'Environment file', '.env')
  .option('-k, --key <key>', 'Environment variable name', 'AGENT_SOLANA_KEY')
  .action(async (options) => {
    try {
      const wallet = await AgentWallet.fromEnv(options.key, options.env);

      console.log(chalk.blue('Checking balances...'));
      const balances = await wallet.getBalances();

      console.log(chalk.green('\nBalances:'));
      console.log('  SOL:  ', chalk.yellow(balances.sol.toFixed(4)));
      console.log('  AINDX:', chalk.yellow((balances.aindx || 0).toFixed(2)));
      console.log('  USDC: ', chalk.yellow((balances.usdc || 0).toFixed(2)));
      console.log('  USDT: ', chalk.yellow((balances.usdt || 0).toFixed(2)));

      const ready = await wallet.isReadyForAgentIndex();
      if (ready.ready) {
        console.log(chalk.green('\n✓ Wallet is ready for Agent Index'));
      } else {
        console.log(chalk.red('\n✗ Wallet not ready:'));
        ready.reasons.forEach(r => console.log('  -', r));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Agent Index commands
const agentIndexCmd = program.command('agent-index')
  .alias('ai')
  .description('Agent Index integration commands');

agentIndexCmd.command('onboard')
  .description('Onboard to Agent Index')
  .option('-e, --env <file>', 'Environment file', '.env')
  .option('-k, --key <key>', 'Environment variable name', 'AGENT_SOLANA_KEY')
  .option('-t, --twitter <handle>', 'Twitter handle')
  .action(async (options) => {
    try {
      const wallet = await AgentWallet.fromEnv(options.key, options.env);
      
      console.log(chalk.blue('Starting Agent Index onboarding...'));
      console.log(chalk.gray('Wallet:'), wallet.address);

      // Check readiness
      const ready = await wallet.isReadyForAgentIndex();
      if (!ready.ready) {
        console.log(chalk.red('\n✗ Wallet not ready:'));
        ready.reasons.forEach(r => console.log('  -', r));
        process.exit(1);
      }

      const client = new AgentIndexClient({ wallet });

      // Get Twitter handle if not provided
      let twitterHandle = options.twitter;
      if (!twitterHandle) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'handle',
          message: 'Your Twitter handle (without @):',
          validate: (input: string) => input.length > 0 || 'Twitter handle is required'
        }]);
        twitterHandle = answer.handle;
      }

      // Step 1: Start onboarding
      console.log(chalk.blue('\nStep 1: Starting onboarding...'));
      const start = await client.startOnboarding(twitterHandle);
      console.log(chalk.green('✓ Onboarding started'));

      // Step 2: Sign challenge
      console.log(chalk.blue('\nStep 2: Verifying wallet ownership...'));
      await client.verifyWallet(start.walletVerification.challenge);
      console.log(chalk.green('✓ Wallet verified'));

      // Step 3: Tweet
      console.log(chalk.yellow('\n⚠️  ACTION REQUIRED:'));
      console.log('Post this exact tweet from @' + twitterHandle + ':');
      console.log(chalk.cyan('\n  ' + start.tweetVerification.text + '\n'));

      const { tweetUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'tweetUrl',
        message: 'Enter the tweet URL after posting:',
        validate: (input: string) => input.includes('twitter.com') || input.includes('x.com') || 'Please enter a valid tweet URL'
      }]);

      // Step 4: Verify tweet
      console.log(chalk.blue('\nStep 4: Verifying tweet...'));
      const complete = await client.verifyTweet(tweetUrl);
      
      console.log(chalk.green('\n✓ Onboarding complete!'));
      console.log(chalk.yellow('\nYOUR API KEY:'));
      console.log(chalk.cyan(complete.apiKey));
      console.log(chalk.red('\n⚠️  SAVE THIS KEY - IT WILL NOT BE SHOWN AGAIN'));

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

agentIndexCmd.command('proposals')
  .description('List top proposals')
  .action(async () => {
    try {
      const client = new AgentIndexClient({ wallet: {} as any });
      const { proposals } = await client.getTopProposals();

      console.log(chalk.blue('Top Proposals:\n'));
      
      if (proposals.length === 0) {
        console.log(chalk.gray('No active proposals'));
        return;
      }

      proposals.forEach((p: any, i: number) => {
        console.log(`${i + 1}. ${chalk.yellow(p.ticker)} - ${chalk.cyan(p.decision)}`);
        console.log();
      });

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();
