odoo.define('pos_usb_printer', function (require) {
"use strict";

    var models = require('point_of_sale.models');
    var core = require('web.core');
    var QWeb = core.qweb;
    
    models.load_fields('pos.config', ['is_order_usb_printer']);
    models.load_models([{
            model: 'usb.printer',
            fields: [],
            loaded: function (self, printers) {
                self.usb_printers = printers;
            },
        }
    ]);

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        getKeyByData: function (note, price) {
            let list = [note, price]
            return list.join("|");
        },
        getListByKey: function (key) {
            return key.split("|");
        },
        build_line_resume: function () {
            var resume = {};
            const self = this
            this.orderlines.each(function (line) {
                if (line.mp_skip) {
                    return;
                }
                var qty = Number(line.get_quantity());
                var note = line.get_note();
                var price = line.get_unit_price();
                var key = self.getKeyByData(note, price)
                var product_id = line.get_product().id;
                var product_resume = product_id in resume ? resume[product_id] : {
                    product_name_wrapped: line.generate_wrapped_product_name(),
                    qties: {},
                };
                if (key in product_resume['qties']) product_resume['qties'][key] += qty;
                else product_resume['qties'][key] = qty;
                resume[product_id] = product_resume;
            });
            return resume;
        },
        computeChanges: function (categories) {
            var current_res = this.build_line_resume();
            var old_res = this.saved_resume || {};
            var json = this.export_as_JSON();
            var add = [];
            var rem = [];
            var pid, key;
            const self = this
            for (pid in current_res) {
                for (key in current_res[pid]['qties']) {
                    var curr = current_res[pid];
                    var old = old_res[pid] || {};
                    var found = pid in old_res && key in old_res[pid]['qties'];

                    var note = self.getListByKey(key)[0]
                    var price = self.getListByKey(key)[1]

                    if (!found) {
                        add.push({
                            'id': pid,
                            'name': this.pos.db.get_product_by_id(pid).display_name,
                            'name_wrapped': curr.product_name_wrapped,
                            'note': note,
                            'price': price,
                            'qty': curr['qties'][key],
                        });
                    } else if (old['qties'][key] < curr['qties'][key]) {
                        add.push({
                            'id': pid,
                            'name': this.pos.db.get_product_by_id(pid).display_name,
                            'name_wrapped': curr.product_name_wrapped,
                            'note': note,
                            'price': price,
                            'qty': curr['qties'][key] - old['qties'][key],
                        });
                    } else if (old['qties'][key] > curr['qties'][key]) {
                        rem.push({
                            'id': pid,
                            'name': this.pos.db.get_product_by_id(pid).display_name,
                            'name_wrapped': curr.product_name_wrapped,
                            'note': note,
                            'price': price,
                            'qty': old['qties'][key] - curr['qties'][key],
                        });
                    }
                }
            }

            for (pid in old_res) {
                for (key in old_res[pid]['qties']) {
                    var found = pid in current_res && key in current_res[pid]['qties'];
                    var note = self.getListByKey(key)[0]
                    var price = self.getListByKey(key)[1]

                    if (!found) {
                        var old = old_res[pid];
                        rem.push({
                            'id': pid,
                            'name': this.pos.db.get_product_by_id(pid).display_name,
                            'name_wrapped': old.product_name_wrapped,
                            'note': note,
                            'price': price,
                            'qty': old['qties'][key],
                        });
                    }
                }
            }

            if (categories && categories.length > 0) {
                // filter the added and removed orders to only contains
                // products that belong to one of the categories supplied as a parameter
                var _add = [];
                var _rem = [];

                for (var i = 0; i < add.length; i++) {
                    if (self.pos.db.is_product_in_category(categories, add[i].id)) {
                        _add.push(add[i]);
                    }
                }
                add = _add;

                for (var i = 0; i < rem.length; i++) {
                    if (self.pos.db.is_product_in_category(categories, rem[i].id)) {
                        _rem.push(rem[i]);
                    }
                }
                rem = _rem;
            }

            var d = new Date();
            var hours = '' + d.getHours();
            hours = hours.length < 2 ? ('0' + hours) : hours;
            var minutes = '' + d.getMinutes();
            minutes = minutes.length < 2 ? ('0' + minutes) : minutes;

            return {
                'new': add,
                'cancelled': rem,
                'table': json.table || false,
                'floor': json.floor || false,
                'name': json.name || 'unknown order',
                'time': {
                    'hours': hours,
                    'minutes': minutes,
                },
            };

        },
        getChanges: async function () {
            let printers = this.pos.usb_printers;
            let printers_changes = []
            let changes = {}
            for (var i = 0; i < printers.length; i++) {
                changes = this.computeChanges(printers[i].product_categories_ids);
                changes.printer = printers[i].name
                if (changes['new'].length > 0 || changes['cancelled'].length > 0) {
                    printers_changes.push(changes)
                }
            }
            return printers_changes
        },
        printChanges: async function () {
            var printers = this.pos.printers;
            let isPrintSuccessful = true;
            for (var i = 0; i < printers.length; i++) {
                var changes = this.computeChanges(printers[i].config.product_categories_ids);
                changes.printer = printers[i].config.name
                if (changes['new'].length > 0 || changes['cancelled'].length > 0) {
                    var receipt = QWeb.render('OrderChangeReceipt', { changes: changes, widget: this });
                    const result = await printers[i].print_receipt(receipt);
                    if (!result.successful) {
                        isPrintSuccessful = false;
                    }
                }
            }
            return isPrintSuccessful;
        },
    });
});

