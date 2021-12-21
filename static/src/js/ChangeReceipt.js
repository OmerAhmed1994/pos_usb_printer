odoo.define('pos_usb_printer.ChangeReceipt', function (require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class ChangeReceipt extends PosComponent {
        constructor() {
            super(...arguments);
            
        }
        get currentOrder() {
            return this.props.currentOrder
        }
        // get printer() {
        //     return this.props.printer
        // }
        get changes() {
            let changes = this.props.changes
            // changes.backend_sequence = this.currentOrder.backend_sequence
            // changes.printer = this.printer.config.name
            return changes
        }
    }
    ChangeReceipt.template = 'ChangeReceipt';

    Registries.Component.add(ChangeReceipt);

    return ChangeReceipt;
});
