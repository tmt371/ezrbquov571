// File: 04-core-code/input-handler.js

import { LeftPanelInputHandler } from './left-panel-input-handler.js';

export class InputHandler {
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.leftPanelHandler = new LeftPanelInputHandler(eventAggregator);
        this.longPressTimer = null;
        this.pressThreshold = 500; // 500ms for a long press
        this.isLongPress = false;
    }

    initialize() {
        this._setupNumericKeyboard();
        this._setupTableInteraction();
        this._setupFunctionKeys();
        this._setupPanelToggles();
        this._setupFileLoader();
        this._setupPhysicalKeyboard();
        
        this.leftPanelHandler.initialize();
    }

    _setupPhysicalKeyboard() {
        window.addEventListener('keydown', (event) => {
            if (event.target.matches('input:not([readonly])')) {
                return;
            }
            
            let keyToPublish = null;
            let eventToPublish = 'numericKeyPressed';
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (arrowKeys.includes(event.key)) {
                event.preventDefault();
                const direction = event.key.replace('Arrow', '').toLowerCase();
                this.eventAggregator.publish('userMovedActiveCell', { direction });
                return;
            }
            if (event.key >= '0' && event.key <= '9') {
                keyToPublish = event.key;
            } 
            else {
                switch (event.key.toLowerCase()) {
                    case 'w': keyToPublish = 'W'; break;
                    case 'h': keyToPublish = 'H'; break;
                    case 't': this.eventAggregator.publish('userRequestedCycleType'); return;
                    case '$': this.eventAggregator.publish('userRequestedCalculateAndSum'); return;
                    case 'enter': keyToPublish = 'ENT'; event.preventDefault(); break;
                    case 'backspace': keyToPublish = 'DEL'; event.preventDefault(); break;
                    case 'delete': eventToPublish = 'userRequestedClearRow'; break;
                }
            }
            if (keyToPublish !== null) {
                this.eventAggregator.publish(eventToPublish, { key: keyToPublish });
            } else if (eventToPublish === 'userRequestedClearRow') {
                this.eventAggregator.publish(eventToPublish);
            }
        });
    }

    _setupFileLoader() {
        const fileLoader = document.getElementById('file-loader');
        if (fileLoader) {
            fileLoader.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) { return; }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    this.eventAggregator.publish('fileLoaded', { fileName: file.name, content: content });
                };
                reader.onerror = () => {
                    this.eventAggregator.publish('showNotification', { message: `Error reading file: ${reader.error}`, type: 'error' });
                };
                reader.readAsText(file);
                event.target.value = '';
            });
        }
        this.eventAggregator.subscribe('triggerFileLoad', () => {
            if (fileLoader) {
                fileLoader.click();
            }
        });
    }
    
    _setupPanelToggles() {
        const numericToggle = document.getElementById('panel-toggle');
        if (numericToggle) {
            numericToggle.addEventListener('click', () => {
                this.eventAggregator.publish('userToggledNumericKeyboard');
            });
        }
    }

    _setupFunctionKeys() {
        const setupButton = (id, eventName) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(eventName);
                });
            }
        };

        setupButton('key-insert', 'userRequestedInsertRow');
        setupButton('key-delete', 'userRequestedDeleteRow');
        setupButton('key-save', 'userRequestedSave');
        setupButton('key-export', 'userRequestedExportCSV');
        setupButton('key-reset', 'userRequestedReset');
        setupButton('key-m-sel', 'userToggledMultiSelectMode');
        setupButton('key-t-set', 'userRequestedMultiTypeSet');

        const loadButton = document.getElementById('key-load');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.eventAggregator.publish('userRequestedLoad');
            });
        }
    }
    
    _setupNumericKeyboard() {
        const keyboard = document.getElementById('numeric-keyboard');
        if (!keyboard) return;

        const addLongPressSupport = (button, longPressEventName, clickEventName, data = {}) => {
            const startPress = (e) => {
                e.preventDefault();
                this.isLongPress = false;
                this.longPressTimer = setTimeout(() => {
                    this.isLongPress = true;
                    this.eventAggregator.publish(longPressEventName, data);
                }, this.pressThreshold);
            };

            const endPress = (e) => {
                clearTimeout(this.longPressTimer);
                if (!this.isLongPress && clickEventName) {
                    this.eventAggregator.publish(clickEventName, data);
                }
            };

            button.addEventListener('mousedown', startPress);
            button.addEventListener('touchstart', startPress, { passive: false });
            button.addEventListener('mouseup', endPress);
            button.addEventListener('mouseleave', () => clearTimeout(this.longPressTimer));
            button.addEventListener('touchend', endPress);
        };
        
        const addButtonListener = (id, eventName, data = {}) => {
            const button = document.getElementById(id);
            if(button) {
                if (id === 'key-type') {
                    addLongPressSupport(button, 'typeButtonLongPressed', 'userRequestedCycleType', data);
                } else {
                    button.addEventListener('click', () => {
                        this.eventAggregator.publish(eventName, data);
                    });
                }
            }
        };

        addButtonListener('key-7', 'numericKeyPressed', { key: '7' });
        addButtonListener('key-8', 'numericKeyPressed', { key: '8' });
        addButtonListener('key-9', 'numericKeyPressed', { key: '9' });
        addButtonListener('key-4', 'numericKeyPressed', { key: '4' });
        addButtonListener('key-5', 'numericKeyPressed', { key: '5' });
        addButtonListener('key-6', 'numericKeyPressed', { key: '6' });
        addButtonListener('key-1', 'numericKeyPressed', { key: '1' });
        addButtonListener('key-2', 'numericKeyPressed', { key: '2' });
        addButtonListener('key-3', 'numericKeyPressed', { key: '3' });
        addButtonListener('key-0', 'numericKeyPressed', { key: '0' });
        addButtonListener('key-del', 'numericKeyPressed', { key: 'DEL' });
        addButtonListener('key-enter', 'numericKeyPressed', { key: 'ENT' });
        addButtonListener('key-w', 'numericKeyPressed', { key: 'W' });
        addButtonListener('key-h', 'numericKeyPressed', { key: 'H' });
        addButtonListener('key-type', 'userRequestedCycleType');
        addButtonListener('key-clear', 'userRequestedClearRow');
        addButtonListener('key-price', 'userRequestedCalculateAndSum');
    }

    _setupTableInteraction() {
        const table = document.getElementById('results-table');
        if (table) {
            console.log('--- [診斷] 正在設定表格互動事件監聽器 ---');

            const startPress = (e) => {
                console.log(`%c[診斷] ${e.type} 事件觸發`, 'color: blue', e.target);
                this.isLongPress = false;
                
                const target = e.target;
                if (target.tagName === 'TD' && target.dataset.column === 'TYPE') {
                    this.longPressTimer = setTimeout(() => {
                        console.log('%c[診斷] 長按計時器完成，設定 isLongPress = true', 'color: orange');
                        this.isLongPress = true;
                        const rowIndex = target.parentElement.dataset.rowIndex;
                        this.eventAggregator.publish('typeCellLongPressed', { rowIndex: parseInt(rowIndex, 10) });
                    }, this.pressThreshold);
                }
            };
            
            const endPress = (e) => {
                console.log(`%c[診斷] ${e.type} 事件觸發`, 'color: green', e.target);
                clearTimeout(this.longPressTimer);
            };

            const clickHandler = (e) => {
                console.log(`%c[診斷] ${e.type} 事件觸發，檢查 isLongPress 旗標: ${this.isLongPress}`, 'color: purple', e.target);
                if(this.isLongPress) {
                    console.log('%c[診斷] isLongPress 為 true，攔截 click 事件！', 'color: red; font-weight: bold;');
                    return;
                }
                
                const target = e.target;
                if (target.tagName === 'TD') {
                    const column = target.dataset.column;
                    const rowIndex = target.parentElement.dataset.rowIndex;
                    if (column && rowIndex) {
                        console.log(`[診斷] click 事件有效，準備發布業務事件... (Column: ${column})`);
                        const eventData = { rowIndex: parseInt(rowIndex, 10), column };
                        if (column === 'sequence') {
                            this.eventAggregator.publish('sequenceCellClicked', eventData);
                        } else {
                            this.eventAggregator.publish('tableCellClicked', eventData);
                        }
                    }
                }
            };

            // 為了確保診斷的準確性，我們暫時恢復到 mousedown/mouseup/click 分離的模式
            table.addEventListener('mousedown', startPress);
            table.addEventListener('touchstart', startPress, { passive: true });
            table.addEventListener('mouseup', endPress);
            table.addEventListener('touchend', endPress);
            table.addEventListener('click', clickHandler);
        }
    }
}