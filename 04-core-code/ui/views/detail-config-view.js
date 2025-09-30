// File: 04-core-code/ui/views/dual-chain-view.js

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the Dual/Chain tab.
 */
export class DualChainView {
    constructor({ quoteService, uiService, calculationService, eventAggregator, publishStateChangeCallback }) {
        this.quoteService = quoteService;
        this.uiService = uiService;
        this.calculationService = calculationService;
        this.eventAggregator = eventAggregator;
        this.publish = publishStateChangeCallback;
        console.log("DualChainView Initialized.");
    }

    /**
     * Handles the toggling of modes (dual, chain).
     */
    handleModeChange({ mode }) {
        const currentMode = this.uiService.getState().dualChainMode;
        const newMode = currentMode === mode ? null : mode;

        // When exiting a mode, perform final calculations.
        if (currentMode === 'dual') {
            this.recalculateDualPrice(); // Recalculate sale price
        }
        
        this.uiService.setDualChainMode(newMode);

        if (newMode === 'dual') {
            // [LOGIC FIX] Clear the dual price when entering the mode, so it can be recalculated on exit.
            this.uiService.setDualPrice(null);
        }
        
        if (!newMode) {
            this.uiService.setTargetCell(null);
            this.uiService.clearDualChainInputValue();
        }

        this.publish();
    }

    /**
     * Calculates the price for Dual brackets and updates the UI service.
     */
    recalculateDualPrice() {
        const items = this.quoteService.getItems();
        const productType = this.quoteService.getCurrentProductType();
        const dualCount = items.filter(item => item.dual === 'D').length;

        if (dualCount % 2 !== 0) {
            this.eventAggregator.publish('showNotification', {
                message: '雙層支架(D)的總數必須為偶數，請修正後再退出。',
                type: 'error'
            });
            return false; // Indicate failure
        }
        
        const price = this.calculationService.calculateAccessoryPrice(productType, 'dual', { items });
        // This correctly sets the dualPrice in uiState, which F2 will use.
        this.uiService.setDualPrice(price);
        this._updateSummaryAccessoriesTotal();
        return true; // Indicate success
    }

    /**
     * Handles the Enter key press in the chain input box.
     */
    handleChainEnterPressed({ value }) {
        const { targetCell: currentTarget } = this.uiService.getState();
        if (!currentTarget) return;

        const valueAsNumber = Number(value);
        if (value !== '' && (!Number.isInteger(valueAsNumber) || valueAsNumber <= 0)) {
            this.eventAggregator.publish('showNotification', {
                message: '僅能輸入正整數。',
                type: 'error'
            });
            return;
        }

        const valueToSave = value === '' ? null : valueAsNumber;
        this.quoteService.updateItemProperty(currentTarget.rowIndex, currentTarget.column, valueToSave);
        
        this.uiService.setTargetCell(null);
        this.uiService.clearDualChainInputValue();
        this.publish();
    }

    /**
     * Handles clicks on table cells when a mode is active.
     */
    handleTableCellClick({ rowIndex, column }) {
        const { dualChainMode } = this.uiService.getState();
        const item = this.quoteService.getItems()[rowIndex];
        if (!item) return;

        if (dualChainMode === 'dual' && column === 'dual') {
            const newValue = item.dual === 'D' ? '' : 'D';
            this.quoteService.updateItemProperty(rowIndex, 'dual', newValue);
            this.publish();
        }

        if (dualChainMode === 'chain' && column === 'chain') {
            this.uiService.setTargetCell({ rowIndex, column: 'chain' });
            this.uiService.setDualChainInputValue(item.chain || '');
            this.publish();

            setTimeout(() => {
                const inputBox = document.getElementById('k4-input-display');
                inputBox?.focus();
                inputBox?.select();
            }, 50); 
        }
    }
    
    /**
     * This method is called by the main DetailConfigView when the K5 tab becomes active.
     */
    activate() {
        this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location', 'dual', 'chain']);
        
        // [REFACTORED] Removed redundant price copying logic.
        // The source of truth for these summary prices is now drive-accessories-view.js,
        // which writes directly to the correct state properties. This view is now just a consumer.
        
        this._updateSummaryAccessoriesTotal();
    }

    /**
     * Calculates the total of all accessories displayed on the K5 summary tab.
     */
    _updateSummaryAccessoriesTotal() {
        const state = this.uiService.getState();
        
        // [HOTFIX] Changed the data source to be consistent with the new data flow.
        // It now reads from the generic summary...Price properties, which are the single source of truth for F2 and K5.
        const dualPrice = state.dualPrice || 0;
        const winderPrice = state.summaryWinderPrice || 0;
        const motorPrice = state.summaryMotorPrice || 0;
        const remotePrice = state.summaryRemotePrice || 0;
        const chargerPrice = state.summaryChargerPrice || 0;
        const cordPrice = state.summaryCordPrice || 0;

        const total = dualPrice + winderPrice + motorPrice + remotePrice + chargerPrice + cordPrice;
        
        this.uiService.setSummaryAccessoriesTotal(total);
    }
}