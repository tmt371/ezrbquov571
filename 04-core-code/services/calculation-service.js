// /04-core-code/services/calculation-service.js

/**
 * @fileoverview Service for handling all price and sum calculations.
 * Acts as a generic executor that delegates product-specific logic to a strategy.
 */
export class CalculationService {
    constructor({ productFactory, configManager }) {
        this.productFactory = productFactory;
        this.configManager = configManager;
        console.log("CalculationService Initialized.");
    }

    /**
     * Calculates line prices for all valid items and the total sum using a provided product strategy.
     */
    calculateAndSum(quoteData, productStrategy) {
        if (!productStrategy) {
            console.error("CalculationService: productStrategy is required for calculateAndSum.");
            return { quoteData, firstError: { message: "Product strategy not provided." } };
        }

        const updatedQuoteData = JSON.parse(JSON.stringify(quoteData));
        const items = updatedQuoteData.rollerBlindItems; 
        let firstError = null;

        items.forEach((item, index) => {
            item.linePrice = null;
            if (item.width && item.height && item.fabricType) {
                const priceMatrix = this.configManager.getPriceMatrix(item.fabricType);
                const result = productStrategy.calculatePrice(item, priceMatrix);
                
                if (result.price !== null) {
                    item.linePrice = result.price;
                } else if (result.error && !firstError) {
                    const errorColumn = result.error.toLowerCase().includes('width') ? 'width' : 'height';
                    firstError = {
                        message: `Row ${index + 1}: ${result.error}`,
                        rowIndex: index,
                        column: errorColumn
                    };
                }
            }
        });

        const itemsTotal = items.reduce((sum, item) => sum + (item.linePrice || 0), 0);
        
        let accessoriesTotal = 0;
        if (updatedQuoteData.summary && updatedQuoteData.summary.accessories) {
            const acc = updatedQuoteData.summary.accessories;
            accessoriesTotal += acc.winder?.price || 0;
            accessoriesTotal += acc.motor?.price || 0;
            accessoriesTotal += acc.remote?.price || 0;
            accessoriesTotal += acc.charger?.price || 0;
            accessoriesTotal += acc.cord3m?.price || 0;
        }

        updatedQuoteData.summary.totalSum = itemsTotal + accessoriesTotal;

        return { updatedQuoteData, firstError };
    }

    /**
     * [MODIFIED] Generic bridge method to calculate accessory prices OR costs.
     * It now checks if a specific 'costKey' is passed in the data object.
     * If so, it calculates cost. Otherwise, it calculates the sale price.
     * @param {string} productType - The product type (e.g., 'rollerBlind').
     * @param {string} accessoryName - The generic name of the accessory (e.g., 'remote').
     * @param {object} data - Data needed for calculation (e.g., { items }, { count, costKey }).
     * @returns {number} The calculated price or cost.
     */
    calculateAccessoryPrice(productType, accessoryName, data) {
        const productStrategy = this.productFactory.getProductStrategy(productType);
        if (!productStrategy) return 0;

        let priceKey;

        // Check if a specific cost key is passed for cost calculation
        if (data && data.costKey) {
            priceKey = data.costKey;
        } else {
            // Otherwise, use the standard sale price mapping
            const priceKeyMap = {
                'dual': 'comboBracket',
                'winder': 'winderHD',
                'motor': 'motorStandard',
                'remote': 'remoteStandard', // This remains the default SALE price
                'charger': 'chargerStandard',
                'cord': 'cord3m'
            };
            priceKey = priceKeyMap[accessoryName];
        }
        
        if (!priceKey) {
            console.error(`No price key found for accessory: ${accessoryName}`);
            return 0;
        }

        const pricePerUnit = this.configManager.getAccessoryPrice(priceKey);
        if (pricePerUnit === null) return 0;

        const methodNameMap = {
            'dual': 'calculateDualPrice',
            'winder': 'calculateWinderPrice',
            'motor': 'calculateMotorPrice',
            'remote': 'calculateRemotePrice',
            'charger': 'calculateChargerPrice',
            'cord': 'calculateCordPrice'
        };
        const methodName = methodNameMap[accessoryName];
        
        if (productStrategy[methodName]) {
            const args = (data.items) ? [data.items, pricePerUnit] : [data.count, pricePerUnit];
            return productStrategy[methodName](...args);
        }

        return 0;
    }
}