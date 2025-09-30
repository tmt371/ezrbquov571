// File: 04-core-code/ui/right-panel-component.js

/**
 * @fileoverview A dedicated component for managing and rendering the Right Panel UI.
 */
export class RightPanelComponent {
    constructor(panelElement, eventAggregator) {
        if (!panelElement) {
            throw new Error("Panel element is required for RightPanelComponent.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;

        this.tabContainer = this.panelElement.querySelector('.tab-container');
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        this._cacheF2Elements();
        this.initialize();
        console.log("RightPanelComponent Initialized.");
    }

    initialize() {
        if (this.tabContainer) {
            this.tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this._setActiveTab(target);
                }
            });
        }

        // --- Event Listeners for F2 Inputs ---
        const setupInputListener = (inputElement) => {
            if (inputElement) {
                // BUG FIX: Change event type from 'input' to 'change' to prevent cursor jumping
                inputElement.addEventListener('change', (event) => {
                    this.eventAggregator.publish('f2ValueChanged', {
                        id: event.target.id,
                        value: event.target.value
                    });
                });
                
                inputElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        this.eventAggregator.publish('f2InputEnterPressed', { id: event.target.id });
                    }
                });
            }
        };

        const inputs = [
            this.f2.b10_wifiQty, this.f2.b13_deliveryQty, this.f2.b14_installQty,
            this.f2.b15_removalQty, this.f2.b17_mulTimes, this.f2.b18_discount
        ];
        inputs.forEach(input => setupInputListener(input));

        // --- Event Listeners for Clickable Fee Cells ---
        const feeCells = [
            { el: this.f2.c13_deliveryFee, type: 'delivery' },
            { el: this.f2.c14_installFee, type: 'install' },
            { el: this.f2.c15_removalFee, type: 'removal' }
        ];
        feeCells.forEach(({ el, type }) => {
            if (el) {
                el.addEventListener('click', () => {
                    this.eventAggregator.publish('toggleFeeExclusion', { feeType: type });
                });
            }
        });

        this.eventAggregator.subscribe('focusElement', ({ elementId }) => {
            const element = this.panelElement.querySelector(`#${elementId}`);
            if (element) {
                element.focus();
                element.select();
            }
        });
    }

    _cacheF2Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f2 = {
            b2_winderPrice: query('#f2-b2-winder-price'),
            b3_dualPrice: query('#f2-b3-dual-price'),
            b4_acceSum: query('#f2-b4-acce-sum'),
            b6_motorPrice: query('#f2-b6-motor-price'),
            b7_remotePrice: query('#f2-b7-remote-price'),
            b8_chargerPrice: query('#f2-b8-charger-price'),
            b9_cordPrice: query('#f2-b9-cord-price'),
            b10_wifiQty: query('#f2-b10-wifi-qty'),
            c10_wifiSum: query('#f2-c10-wifi-sum'),
            b11_eAcceSum: query('#f2-b11-e-acce-sum'),
            b13_deliveryQty: query('#f2-b13-delivery-qty'),
            c13_deliveryFee: query('#f2-c13-delivery-fee'),
            b14_installQty: query('#f2-b14-install-qty'),
            c14_installFee: query('#f2-c14-install-fee'),
            b15_removalQty: query('#f2-b15-removal-qty'),
            c15_removalFee: query('#f2-c15-removal-fee'),
            b16_surchargeFee: query('#f2-b16-surcharge-fee'),
            a17_totalSum: query('#f2-a17-total-sum'),
            b17_mulTimes: query('#f2-b17-mul-times'),
            c17_1stRbPrice: query('#f2-c17-1st-rb-price'),
            b18_discount: query('#f2-b18-discount'),
            b19_disRbPrice: query('#f2-b19-dis-rb-price'),
            b20_singleprofit: query('#f2-b20-singleprofit'),
            b21_rbProfit: query('#f2-b21-rb-profit'),
            b22_sumprice: query('#f2-b22-sumprice'),
            b23_sumprofit: query('#f2-b23-sumprofit'),
            b24_gst: query('#f2-b24-gst'),
            b25_netprofit: query('#f2-b25-netprofit'),
        };
    }

    render(uiState) {
        this._renderF2Tab(uiState);
    }

    _renderF2Tab(uiState) {
        if (!uiState || !uiState.f2 || !this.f2.b2_winderPrice) return;
        
        const f2State = uiState.f2;
        const formatIntegerCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(0)}` : '$';
        const formatDecimalCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(2)}` : '$';
        const formatValue = (value) => (value !== null && value !== undefined) ? value : '';

        // [HOTFIX] These values now come from the generic summary state properties, which are the new single source of truth.
        this.f2.b2_winderPrice.textContent = formatIntegerCurrency(uiState.summaryWinderPrice);
        this.f2.b3_dualPrice.textContent = formatIntegerCurrency(uiState.dualPrice);
        this.f2.b6_motorPrice.textContent = formatIntegerCurrency(uiState.summaryMotorPrice);
        this.f2.b7_remotePrice.textContent = formatIntegerCurrency(uiState.summaryRemotePrice);
        this.f2.b8_chargerPrice.textContent = formatIntegerCurrency(uiState.summaryChargerPrice);
        this.f2.b9_cordPrice.textContent = formatIntegerCurrency(uiState.summaryCordPrice);

        // Render values from F2-specific state (formatted as integers)
        this.f2.b4_acceSum.textContent = formatIntegerCurrency(f2State.acceSum);
        this.f2.c10_wifiSum.textContent = formatIntegerCurrency(f2State.wifiSum);
        this.f2.b11_eAcceSum.textContent = formatIntegerCurrency(f2State.eAcceSum);
        this.f2.c13_deliveryFee.textContent = formatIntegerCurrency(f2State.deliveryFee);
        this.f2.c14_installFee.textContent = formatIntegerCurrency(f2State.installFee);
        this.f2.c15_removalFee.textContent = formatIntegerCurrency(f2State.removalFee);
        this.f2.b16_surchargeFee.textContent = formatIntegerCurrency(f2State.surchargeFee);
        
        // Render bottom section (mixed formatting)
        this.f2.a17_totalSum.textContent = formatValue(f2State.totalSumForRbTime);
        this.f2.c17_1stRbPrice.textContent = formatDecimalCurrency(f2State.firstRbPrice);
        this.f2.b19_disRbPrice.textContent = formatDecimalCurrency(f2State.disRbPrice);
        this.f2.b20_singleprofit.textContent = formatDecimalCurrency(f2State.singleprofit);
        this.f2.b21_rbProfit.textContent = formatDecimalCurrency(f2State.rbProfit);
        this.f2.b22_sumprice.textContent = formatDecimalCurrency(f2State.sumPrice);
        this.f2.b23_sumprofit.textContent = formatDecimalCurrency(f2State.sumProfit);
        this.f2.b24_gst.textContent = formatDecimalCurrency(f2State.gst);
        this.f2.b25_netprofit.textContent = formatDecimalCurrency(f2State.netProfit);

        // Update input values from state, ensuring not to overwrite during user input.
        if (document.activeElement !== this.f2.b10_wifiQty) this.f2.b10_wifiQty.value = formatValue(f2State.wifiQty);
        if (document.activeElement !== this.f2.b13_deliveryQty) this.f2.b13_deliveryQty.value = formatValue(f2State.deliveryQty);
        if (document.activeElement !== this.f2.b14_installQty) this.f2.b14_installQty.value = formatValue(f2State.installQty);
        if (document.activeElement !== this.f2.b15_removalQty) this.f2.b15_removalQty.value = formatValue(f2State.removalQty);
        if (document.activeElement !== this.f2.b17_mulTimes) this.f2.b17_mulTimes.value = formatValue(f2State.mulTimes);
        if (document.activeElement !== this.f2.b18_discount) this.f2.b18_discount.value = formatValue(f2State.discount);


        // Apply strikethrough class based on state
        this.f2.c13_deliveryFee.classList.toggle('is-excluded', f2State.deliveryFeeExcluded);
        this.f2.c14_installFee.classList.toggle('is-excluded', f2State.installFeeExcluded);
        this.f2.c15_removalFee.classList.toggle('is-excluded', f2State.removalFeeExcluded);
    }

    _setActiveTab(clickedButton) {
        const targetContentId = clickedButton.dataset.tabTarget;

        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button === clickedButton);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', `#${content.id}` === targetContentId);
        });

        if (targetContentId === '#f2-content') {
            this.eventAggregator.publish('f2TabActivated');
        }
    }
}