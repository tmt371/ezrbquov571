/**
 * @fileoverview A dedicated component for managing and rendering the Right Panel UI.
 */
export class RightPanelComponent {
    constructor(panelElement, eventAggregator, calculationService) {
        if (!panelElement) {
            throw new Error("Panel element is required for RightPanelComponent.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.calculationService = calculationService; // [NEW] Receive service

        this.tabContainer = this.panelElement.querySelector('.tab-container');
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        this.f1Prices = {}; // [NEW] Object to store calculated F1 prices

        this._cacheF1Elements();
        this._cacheF2Elements();
        this.initialize();
        console.log("RightPanelComponent Initialized.");
    }

    initialize() {
        // --- Global Tab Click Handler ---
        if (this.tabContainer) {
            this.tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this._setActiveTab(target);
                }
            });
        }

        // --- Initialize Listeners for Both Panels ---
        this._initializeF1ButtonListeners();
        this._initializeF1InputListeners();
        this._initializeF2Listeners();

        this.eventAggregator.subscribe('focusElement', ({ elementId }) => {
            const element = this.panelElement.querySelector(`#${elementId}`);
            if (element) {
                element.focus();
                element.select();
            }
        });
    }

    // --- NEW: F1 Panel Methods ---

    _initializeF1ButtonListeners() {
        const buttonEventMap = {
            'f1-key-insert': 'userRequestedInsertRow',
            'f1-key-delete': 'userRequestedDeleteRow',
            'f1-key-save': 'userRequestedSave',
            'f1-key-load': 'userRequestedLoad',
            'f1-key-export': 'userRequestedExportCSV',
            'f1-key-m-sel': 'userToggledMultiSelectMode',
            'f1-key-t-set': 'userRequestedMultiTypeSet',
            'f1-key-reset': 'userRequestedReset'
        };

        for (const [id, eventName] of Object.entries(buttonEventMap)) {
            const button = this.f1.buttons[id];
            if (button) {
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(eventName);
                });
            }
        }
    }

    _initializeF1InputListeners() {
        for (const key in this.f1.inputs) {
            const inputElement = this.f1.inputs[key];
            if (inputElement) {
                inputElement.addEventListener('input', (event) => {
                    this._handleF1InputChange(key, event.target.value);
                });
            }
        }
    }

    _handleF1InputChange(componentKey, value) {
        const quantity = value === '' ? 0 : parseInt(value, 10);

        if (isNaN(quantity) || quantity < 0) {
            return;
        }

        const price = this.calculationService.calculateF1ComponentPrice(componentKey, quantity);
        this.f1Prices[componentKey] = price;

        const priceElement = this.f1.prices[componentKey];
        if (priceElement) {
            priceElement.textContent = price > 0 ? `$${price.toFixed(2)}` : '';
        }

        this._updateF1Total();
    }

    _updateF1Total() {
        const dualPrice = (this.f1Prices['dual-combo'] || 0) + (this.f1Prices['slim'] || 0);
        if (this.f1.prices['dual']) {
            this.f1.prices['dual'].textContent = dualPrice > 0 ? `$${dualPrice.toFixed(2)}` : '';
        }

        const total = Object.values(this.f1Prices).reduce((sum, price) => sum + price, 0);
        if (this.f1.total) {
            this.f1.total.textContent = total > 0 ? `$${total.toFixed(2)}` : '';
        }
    }

    _cacheF1Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f1 = {
            buttons: {
                'f1-key-insert': query('#f1-key-insert'),
                'f1-key-delete': query('#f1-key-delete'),
                'f1-key-save': query('#f1-key-save'),
                'f1-key-load': query('#f1-key-load'),
                'f1-key-export': query('#f1-key-export'),
                'f1-key-m-sel': query('#f1-key-m-sel'),
                'f1-key-t-set': query('#f1-key-t-set'),
                'f1-key-reset': query('#f1-key-reset'),
            },
            inputs: {
                'winder': query('#f1-qty-winder'),
                'motor': query('#f1-qty-motor'),
                'remote-1ch': query('#f1-qty-remote-1ch'),
                'remote-16ch': query('#f1-qty-remote-16ch'),
                'charger': query('#f1-qty-charger'),
                '3m-cord': query('#f1-qty-3m-cord'),
                'dual-combo': query('#f1-qty-dual-combo'),
                'slim': query('#f1-qty-slim'),
            },
            prices: {
                'winder': query('#f1-price-winder'),
                'motor': query('#f1-price-motor'),
                'remote-1ch': query('#f1-price-remote-1ch'),
                'remote-16ch': query('#f1-price-remote-16ch'),
                'charger': query('#f1-price-charger'),
                '3m-cord': query('#f1-price-3m-cord'),
                'dual': query('#f1-price-dual'),
                'dual-combo': query('#f1-price-dual-combo'),
                'slim': query('#f1-price-slim'),
            },
            total: query('#f1-price-total')
        };
    }

    // --- End of F1 Methods ---

    // --- F2 Panel Methods ---

    _initializeF2Listeners() {
        const setupF2InputListener = (inputElement) => {
            if (inputElement) {
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

        const f2Inputs = [
            this.f2.b10_wifiQty, this.f2.b13_deliveryQty, this.f2.b14_installQty,
            this.f2.b15_removalQty, this.f2.b17_mulTimes, this.f2.b18_discount
        ];
        f2Inputs.forEach(input => setupF2InputListener(input));

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
        // F1 is self-contained and doesn't need data from the global state.
        this._renderF2Tab(uiState);
    }

    _renderF2Tab(uiState) {
        if (!uiState || !uiState.f2 || !this.f2.b2_winderPrice) return;
        
        const f2State = uiState.f2;
        const formatIntegerCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(0)}` : '$';
        const formatDecimalCurrency = (value) => (typeof value === 'number') ? `$${value.toFixed(2)}` : '$';
        const formatValue = (value) => (value !== null && value !== undefined) ? value : '';

        this.f2.b2_winderPrice.textContent = formatIntegerCurrency(uiState.summaryWinderPrice);
        this.f2.b3_dualPrice.textContent = formatIntegerCurrency(uiState.dualPrice);
        this.f2.b6_motorPrice.textContent = formatIntegerCurrency(uiState.summaryMotorPrice);
        this.f2.b7_remotePrice.textContent = formatIntegerCurrency(uiState.summaryRemotePrice);
        this.f2.b8_chargerPrice.textContent = formatIntegerCurrency(uiState.summaryChargerPrice);
        this.f2.b9_cordPrice.textContent = formatIntegerCurrency(uiState.summaryCordPrice);

        this.f2.b4_acceSum.textContent = formatIntegerCurrency(f2State.acceSum);
        this.f2.c10_wifiSum.textContent = formatIntegerCurrency(f2State.wifiSum);
        this.f2.b11_eAcceSum.textContent = formatIntegerCurrency(f2State.eAcceSum);
        this.f2.c13_deliveryFee.textContent = formatIntegerCurrency(f2State.deliveryFee);
        this.f2.c14_installFee.textContent = formatIntegerCurrency(f2State.installFee);
        this.f2.c15_removalFee.textContent = formatIntegerCurrency(f2State.removalFee);
        this.f2.b16_surchargeFee.textContent = formatIntegerCurrency(f2State.surchargeFee);
        
        this.f2.a17_totalSum.textContent = formatValue(f2State.totalSumForRbTime);
        this.f2.c17_1stRbPrice.textContent = formatDecimalCurrency(f2State.firstRbPrice);
        this.f2.b19_disRbPrice.textContent = formatDecimalCurrency(f2State.disRbPrice);
        this.f2.b20_singleprofit.textContent = formatDecimalCurrency(f2State.singleprofit);
        this.f2.b21_rbProfit.textContent = formatDecimalCurrency(f2State.rbProfit);
        this.f2.b22_sumprice.textContent = formatDecimalCurrency(f2State.sumPrice);
        this.f2.b23_sumprofit.textContent = formatDecimalCurrency(f2State.sumProfit);
        this.f2.b24_gst.textContent = formatDecimalCurrency(f2State.gst);
        this.f2.b25_netprofit.textContent = formatDecimalCurrency(f2State.netProfit);

        if (document.activeElement !== this.f2.b10_wifiQty) this.f2.b10_wifiQty.value = formatValue(f2State.wifiQty);
        if (document.activeElement !== this.f2.b13_deliveryQty) this.f2.b13_deliveryQty.value = formatValue(f2State.deliveryQty);
        if (document.activeElement !== this.f2.b14_installQty) this.f2.b14_installQty.value = formatValue(f2State.installQty);
        if (document.activeElement !== this.f2.b15_removalQty) this.f2.b15_removalQty.value = formatValue(f2State.removalQty);
        if (document.activeElement !== this.f2.b17_mulTimes) this.f2.b17_mulTimes.value = formatValue(f2State.mulTimes);
        if (document.activeElement !== this.f2.b18_discount) this.f2.b18_discount.value = formatValue(f2State.discount);

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