import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface WalletConfig {
  storage: 'env' | 'file';
  keyName?: string;
  envFile?: string;
  filePath?: string;
  password?: string;
}

export interface WalletBalance {
  sol: number;
  usdc?: number;
  usdt?: number;
  spxai?: number;
  [token: string]: number | undefined;
}

export class AgentWallet {
  private keypair: Keypair;
  private connection: Connection;
  private config: WalletConfig;

  constructor(keypair: Keypair, config: WalletConfig) {
    this.keypair = keypair;
    this.config = config;
    
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  get address(): string {
    return this.keypair.publicKey.toBase58();
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  static async create(config: WalletConfig): Promise<AgentWallet> {
    const keypair = Keypair.generate();
    const wallet = new AgentWallet(keypair, config);
    await wallet.save();
    return wallet;
  }

  static async fromPrivateKey(privateKey: string | Uint8Array, config: WalletConfig): Promise<AgentWallet> {
    let secretKey: Uint8Array;
    
    if (typeof privateKey === 'string') {
      try {
        secretKey = bs58.decode(privateKey);
      } catch {
        try {
          secretKey = Buffer.from(privateKey, 'base64');
        } catch {
          throw new Error('Invalid private key format. Expected base58 or base64.');
        }
      }
    } else {
      secretKey = privateKey;
    }

    if (secretKey.length !== 64) {
      throw new Error(`Invalid private key length: ${secretKey.length}. Expected 64 bytes.`);
    }

    const keypair = Keypair.fromSecretKey(secretKey);
    const wallet = new AgentWallet(keypair, config);
    await wallet.save();
    return wallet;
  }

  static async fromEnv(keyName: string = 'SOLANA_PRIVATE_KEY', envFile?: string): Promise<AgentWallet> {
    if (envFile) {
      require('dotenv').config({ path: envFile });
    }

    const privateKey = process.env[keyName];
    if (!privateKey) {
      throw new Error(`Environment variable ${keyName} not found`);
    }

    return AgentWallet.fromPrivateKey(privateKey, {
      storage: 'env',
      keyName
    });
  }

  private async save(): Promise<void> {
    const privateKey = bs58.encode(this.keypair.secretKey);

    switch (this.config.storage) {
      case 'env':
        await this.saveToEnv(privateKey);
        break;
      case 'file':
        await this.saveToFile(privateKey);
        break;
      default:
        throw new Error(`Unknown storage type: ${this.config.storage}`);
    }
  }

  private async saveToEnv(privateKey: string): Promise<void> {
    const keyName = this.config.keyName || 'SOLANA_PRIVATE_KEY';
    const envFile = this.config.envFile || '.env';
    
    let envContent = '';
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
    }

    const lines = envContent.split('\n');
    const filtered = lines.filter(line => !line.startsWith(`${keyName}=`));
    
    filtered.push(`${keyName}=${privateKey}`);
    filtered.push(`${keyName}_ADDRESS=${this.address}`);
    
    fs.writeFileSync(envFile, filtered.join('\n') + '\n');
  }

  private async saveToFile(privateKey: string): Promise<void> {
    const filePath = this.config.filePath || './wallet.key';
    
    if (this.config.password) {
      const cipher = crypto.createCipher('aes-256-gcm', this.config.password);
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      
      const data = JSON.stringify({
        encrypted,
        authTag,
        address: this.address
      });
      
      fs.writeFileSync(filePath, data);
    } else {
      fs.writeFileSync(filePath, privateKey);
    }
  }

  signMessage(message: string | Uint8Array): string {
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message)
      : message;
    
    const signature = nacl.sign.detached(messageBytes, this.keypair.secretKey);
    return bs58.encode(signature);
  }

  async getSolBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getTokenBalance(mintAddress: string): Promise<number> {
    try {
      const mint = new PublicKey(mintAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        this.keypair.publicKey
      );
      
      const account = await getAccount(this.connection, tokenAccount);
      return Number(account.amount) / Math.pow(10, 6);
    } catch {
      return 0;
    }
  }

  async getBalances(): Promise<WalletBalance> {
    const spxaiMint = process.env.AINDX_MINT_ADDRESS;
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const usdtMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

    const balances: WalletBalance = {
      sol: await this.getSolBalance()
    };

    if (spxaiMint) {
      balances.spxai = await this.getTokenBalance(spxaiMint);
    }
    balances.usdc = await this.getTokenBalance(usdcMint);
    balances.usdt = await this.getTokenBalance(usdtMint);

    return balances;
  }

  async isReadyForAgentIndex(): Promise<{ ready: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    const balances = await this.getBalances();

    if (balances.sol < 0.01) {
      reasons.push(`Insufficient SOL: ${balances.sol.toFixed(4)} (need > 0.01)`);
    }

    const spxaiMin = Number(process.env.AINDX_MIN_BALANCE || 250);
    if ((balances.spxai || 0) < spxaiMin) {
      reasons.push(`Insufficient AINDX: ${balances.aindx || 0} (need ${aindxMin})`);
    }

    return {
      ready: reasons.length === 0,
      reasons
    };
  }
}
