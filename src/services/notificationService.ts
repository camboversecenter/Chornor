// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import * as storage from './storageService';
import { AppNotification, LendingTransaction, Transaction, SavingTransaction } from '../types';
import { CURRENCY_USD, CURRENCY_KHR } from '../constants';

export const checkNotifications = (): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const now = new Date();
    // Set time to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // --- 0. EXTERNAL REQUESTS ---
    const pendingRequests = storage.getTransactionRequests();
    if (pendingRequests.length > 0) {
        // Group by App
        const sources = Array.from(new Set(pendingRequests.map(p => p.sourceAppName)));
        notifications.push({
            id: 'external_requests_group',
            type: 'EXTERNAL_REQUEST',
            title: 'សំណើពីខាងក្រៅ (App Requests)',
            message: `You have ${pendingRequests.length} pending transactions from ${sources.join(', ')}.`,
            date: new Date().toISOString(),
            isOverdue: true, // Urgent
            linkId: undefined,
            data: pendingRequests
        });
    }

    // --- 1. LENDING ALERTS ---
    // Check for unpaid installments that are Due or Overdue
    const lendings = storage.getLendings();
    const lendingTx = storage.getLendingTransactions();
    
    // Group transactions by lending to get titles
    const lendingMap = new Map(lendings.map(l => [l._id, l]));

    lendingTx.forEach(tx => {
        if (!tx.isPaid) {
            const dueDate = new Date(tx.dueDate);
            const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            if (dueDay <= threeDaysFromNow) {
                const loan = lendingMap.get(tx.lendingId);
                if (loan && !loan.isComplete) {
                    const isOverdue = dueDay < today;
                    const amountStr = tx.amountDollar > 0 
                        ? `$${tx.amountDollar.toFixed(2)}` 
                        : `${tx.amountRiel.toLocaleString()}៛`;

                    notifications.push({
                        id: `loan_${tx._id}`,
                        type: 'LENDING',
                        title: isOverdue ? 'បង់កម្ចីហួសកំណត់ (Overdue Loan)' : 'ដល់ថ្ងៃបង់កម្ចី (Loan Due)',
                        message: `${loan.title} - Month ${tx.month}: ${amountStr}`,
                        date: tx.dueDate,
                        isOverdue,
                        linkId: tx.lendingId
                    });
                }
            }
        }
    });

    // --- 2. TRANSACTION REMINDERS (Recurring) ---
    // Logic: Find transactions with Reminder set. 
    // Check if a similar transaction (same category + similar amount) exists in the CURRENT period.
    // If not, and we are past the "day of month" of the original transaction, alert.
    
    const transactions = storage.getTransactions();
    const recurringTxs = transactions.filter(t => t.reminder && t.reminder !== 'NONE');

    // To avoid duplicates (e.g. multiple past receipts for the same bill), we group by description + amount
    // And only check the LATEST one.
    const distinctRecurring: Record<string, Transaction> = {};
    recurringTxs.forEach(t => {
        const key = `${t.description}-${t.amount}-${t.categoryId}`;
        if (!distinctRecurring[key] || new Date(t.date) > new Date(distinctRecurring[key].date)) {
            distinctRecurring[key] = t;
        }
    });

    Object.values(distinctRecurring).forEach(t => {
        const txDate = new Date(t.date);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let expectedDate: Date;
        let isDue = false;

        if (t.reminder === 'MONTHLY') {
            // Expected date is this month, on the same day
            expectedDate = new Date(currentYear, currentMonth, txDate.getDate());
            
            // If expected date is in future > 3 days, ignore. 
            // If expected date is in past or near future, check if Paid.
            if (expectedDate <= threeDaysFromNow) {
                isDue = true;
            }
        } else if (t.reminder === 'YEARLY') {
            expectedDate = new Date(currentYear, txDate.getMonth(), txDate.getDate());
            if (expectedDate <= threeDaysFromNow) {
                isDue = true;
            }
        } else {
            expectedDate = new Date(); // Should not happen
        }

        if (isDue) {
            // CHECK IF PAID in the current period
            // Look for any transaction with same categoryId and amount (+- 5%) created/dated within 5 days of expected date
            const margin = t.amount * 0.05;
            const startWindow = new Date(expectedDate); startWindow.setDate(expectedDate.getDate() - 5);
            const endWindow = new Date(expectedDate); endWindow.setDate(expectedDate.getDate() + 5);

            const hasPaid = transactions.some(checkTx => {
                const checkDate = new Date(checkTx.date);
                return checkTx.categoryId === t.categoryId &&
                       checkTx.amount >= t.amount - margin &&
                       checkTx.amount <= t.amount + margin &&
                       checkDate >= startWindow && checkDate <= endWindow &&
                       checkTx._id !== t._id; // Don't match self if self is old
            });

            // Special case: If the "Recurring" transaction ITSELF is in this window, it counts as paid
            // (e.g. user just created it today)
            const selfIsCurrent = new Date(t.date) >= startWindow && new Date(t.date) <= endWindow;

            if (!hasPaid && !selfIsCurrent) {
                const isOverdue = expectedDate < today;
                notifications.push({
                    id: `recurring_${t._id}`,
                    type: 'TRANSACTION',
                    title: isOverdue ? 'ភ្លេចបង់វិក្កយបត្រ? (Overdue Bill?)' : 'ដល់ថ្ងៃបង់ (Bill Reminder)',
                    message: `${t.description} (${t.currency === 'USD' ? '$' : '៛'}${t.amount})`,
                    date: expectedDate.toISOString(),
                    isOverdue,
                    linkId: undefined // Just go to transaction list
                });
            }
        }
    });

    // --- 3. SAVING REMINDERS ---
    // Logic: Find Savings that have at least one transaction with 'alert' set.
    // If no deposit has been made in the current period (Month/Year), alert.
    
    const savings = storage.getSavings();
    const savingTx = storage.getSavingTransactions();

    savings.forEach(s => {
        // Get transactions for this saving
        const sTxs = savingTx.filter(tx => tx.savingId === s._id);
        
        // Find if any had an alert setting (Latest one preference)
        const lastAlertTx = [...sTxs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).find(tx => tx.alert);
        
        if (lastAlertTx && lastAlertTx.alert) {
            const lastDate = new Date(lastAlertTx.createdAt);
            const alertType = lastAlertTx.alert; // 1=Monthly, 2=Yearly
            
            let expectedDate: Date;
            if (alertType === 1) { // Monthly
                 expectedDate = new Date(lastDate);
                 expectedDate.setMonth(today.getMonth());
                 expectedDate.setFullYear(today.getFullYear());
                 // If lastDate was Jan 31, and now Feb, setDate might overflow, but JS handles it (Mar 3)
            } else { // Yearly
                 expectedDate = new Date(lastDate);
                 expectedDate.setFullYear(today.getFullYear());
            }

            // If we haven't reached the "anniversary" of the deposit day yet, maybe alert 3 days before?
            // Simplified: If we are in the same month (for monthly) and no deposit yet, alert if we are past the day.
            
            // Check if any deposit made in this Current Period
            const hasDepositThisPeriod = sTxs.some(tx => {
                const d = new Date(tx.createdAt);
                if (alertType === 1) {
                    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                } else {
                    return d.getFullYear() === today.getFullYear();
                }
            });

            if (!hasDepositThisPeriod) {
                 // Check if we are past the day of month of the last deposit
                 if (today.getDate() >= lastDate.getDate()) {
                     notifications.push({
                         id: `save_${s._id}`,
                         type: 'SAVING',
                         title: 'រំលឹកការសន្សំ (Saving Reminder)',
                         message: `កុំភ្លេចដាក់លុយសន្សំសម្រាប់ "${s.title}"`,
                         date: today.toISOString(),
                         isOverdue: true,
                         linkId: s._id
                     });
                 }
            }
        }
    });

    // Sort by Date (oldest first/most overdue)
    return notifications.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
