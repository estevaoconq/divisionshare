class WalletManager {
    constructor() {
        this.connection = new solanaWeb3.Connection(
            "https://api.devnet.solana.com",
            "confirmed"
        );
        this.wallet = null;
        this.provider = null;
    }

    // Detecta as wallets disponíveis
    detectWallets() {
        return {
            phantom: window.solana,
            solflare: window.solflare
        };
    }

    async connect() {
        try {
            const wallets = this.detectWallets();
            
            const walletChoice = await this.showWalletModal();
            
            let provider;
            switch (walletChoice) {
                case 'phantom':
                    if (!wallets.phantom?.isPhantom) {
                        window.open("https://phantom.app/", "_blank");
                        throw new Error('Phantom não está instalada');
                    }
                    provider = wallets.phantom;
                    break;
                    
                case 'solflare':
                    if (!window.solflare) {
                        window.open("https://solflare.com/", "_blank");
                        throw new Error('Solflare não está instalada');
                    }
                    try {
                        // Método específico para Solflare
                        await window.solflare.connect();
                        provider = window.solflare;
                    } catch (err) {
                        throw new Error('Usuário rejeitou a conexão com Solflare');
                    }
                    break;
                    
                default:
                    throw new Error('Wallet não selecionada');
            }

            console.log("Conectando à wallet...", walletChoice);
            console.log("Provider:", provider);

            // Para Solflare, já temos a conexão
            if (walletChoice === 'solflare') {
                this.wallet = provider.publicKey;
            } else {
                // Para Phantom e outras wallets
                const response = await provider.connect();
                this.wallet = response.publicKey;
            }

            if (!this.wallet) {
                throw new Error('Falha ao obter chave pública da wallet');
            }

            this.provider = provider;
            this.updateUI();
            await this.getBalance();

        } catch (err) {
            console.error("Erro ao conectar carteira:", err);
            alert(err.message || "Erro ao conectar. Verifique o console para mais detalhes.");
        }
    }

    async disconnect() {
        try {
            if (this.provider) {
                await this.provider.disconnect();
                this.wallet = null;
                this.provider = null;
                this.updateUI();
                document.getElementById('wallet-balance').textContent = '';
            }
        } catch (err) {
            console.error("Erro ao desconectar carteira:", err);
        }
    }

    // Modal para escolher a wallet
    showWalletModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
            modal.innerHTML = `
                <div class="bg-[#151B2B] p-6 rounded-lg space-y-4 max-w-sm w-full mx-4">
                    <h2 class="text-xl font-medium text-white">Escolha sua Wallet</h2>
                    <button class="wallet-option w-full p-3 rounded bg-[#1F2B45] hover:bg-[#2A3447] text-left text-white" data-wallet="phantom">
                        Phantom
                    </button>
                    <button class="wallet-option w-full p-3 rounded bg-[#1F2B45] hover:bg-[#2A3447] text-left text-white" data-wallet="solflare">
                        Solflare
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            const buttons = modal.querySelectorAll('.wallet-option');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const wallet = button.dataset.wallet;
                    document.body.removeChild(modal);
                    resolve(wallet);
                });
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
        });
    }

    async getBalance() {
        try {
            if (!this.wallet) return;

            const balance = await this.connection.getBalance(this.wallet);
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
            
            document.getElementById('wallet-balance').textContent = 
                `${solBalance.toFixed(4)} SOL`;

        } catch (err) {
            console.error("Erro ao buscar saldo:", err);
        }
    }

    updateUI() {
        const connectButton = document.getElementById('connect-wallet');
        const walletAddress = document.getElementById('wallet-address');
        
        if (this.wallet && this.wallet.toString) {
            connectButton.textContent = 'Disconnect';
            connectButton.classList.add('connected');
            connectButton.onclick = () => this.disconnect();
            walletAddress.textContent = `${this.wallet.toString().slice(0, 4)}...${this.wallet.toString().slice(-4)}`;
        } else {
            connectButton.textContent = 'Connect Wallet';
            connectButton.classList.remove('connected');
            connectButton.onclick = () => this.connect();
            walletAddress.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const walletManager = new WalletManager();
    
    document.getElementById('connect-wallet').addEventListener('click', () => {
        if (walletManager.wallet) {
            walletManager.disconnect();
        } else {
            walletManager.connect();
        }
    });
}); 