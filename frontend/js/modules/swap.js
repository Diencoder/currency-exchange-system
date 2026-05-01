/**
 * Swap Module - Handles instant currency exchange logic
 */
import { apiFetch } from './api.js';
import { auth } from './auth.js';
import { wallet } from './wallet.js';
import { market } from './market.js';
import { showToast, toggleSpinner } from './ui.js';

/**
 * Calculates the output amount and updates the swap UI labels.
 */
export const calculateSwap = () => {
    const from = document.getElementById('from-select')?.value;
    const to = document.getElementById('to-select')?.value;
    const amt = parseFloat(document.getElementById('swap-input')?.value) || 0;
    
    // 1. Update the balance label using the WalletManager's current state
    const currentBalance = wallet.getBalance(from);
    const balanceLabel = document.getElementById('from-balance-label');
    if (balanceLabel) {
        balanceLabel.textContent = `Balance: ${currentBalance.toLocaleString()} ${from}`;
    }

    if (!from || !to) return;
    
    // 2. Perform calculation based on market rates
    const rates = market.currentRates;
    if (!rates || Object.keys(rates).length === 0) {
        return;
    }

    // Rates are relative to USD (USD = 1.0)
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    
    // Calculation: (amt / fromRate) converts to USD, then * toRate converts to 'to' currency
    const conversionRate = toRate / fromRate;
    const result = amt * conversionRate;

    // 3. Update the UI fields
    const outputEl = document.getElementById('swap-output');
    if (outputEl) {
        outputEl.value = result > 0 ? result.toFixed(6) : "0";
    }

    const rateDisplay = document.getElementById('rate-display');
    if (rateDisplay) {
        rateDisplay.textContent = `1 ${from} = ${conversionRate.toFixed(4)} ${to}`;
    }
};

/**
 * Executes the swap transaction via the API.
 */
export const executeSwap = async () => {
    const from = document.getElementById('from-select')?.value;
    const to = document.getElementById('to-select')?.value;
    const amountIn = parseFloat(document.getElementById('swap-input')?.value);

    // Validation
    if (!amountIn || amountIn <= 0) {
        return showToast('Invalid Amount', 'Enter a valid amount.', 'danger');
    }
    if (from === to) {
        return showToast('Invalid Pair', 'Cannot swap same currency.', 'warning');
    }
    
    const currentBalance = wallet.getBalance(from);
    if (currentBalance < amountIn) {
        return showToast('Insufficient Funds', `You don't have enough ${from}`, 'danger');
    }

    toggleSpinner('swap-spinner', true);
    try {
        await apiFetch('/transactions', {
            method: 'POST',
            body: JSON.stringify({
                userId: auth.currentUser.id,
                type: 'EXCHANGE',
                fromCurrency: from, 
                toCurrency: to,
                amountIn: amountIn,
                idempotencyKey: `swap-${auth.currentUser.id}-${Date.now()}`
            })
        });

        showToast('Success', 'Swap completed!');
        
        // Reset inputs
        const inputEl = document.getElementById('swap-input');
        if (inputEl) inputEl.value = '';
        const outputEl = document.getElementById('swap-output');
        if (outputEl) outputEl.value = '0';
        
        // Refresh all wallet data
        await wallet.fetchBalances();
        await wallet.fetchTransactions();
    } catch (e) {
        showToast('Swap Failed', e.message, 'danger');
    } finally {
        toggleSpinner('swap-spinner', false);
    }
};
