# -*- coding: utf-8 -*-
import logging
from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools import float_is_zero, float_compare

from itertools import groupby
_logger = logging.getLogger(__name__)


class UsbPrinter(models.Model):
    _name = 'usb.printer'
    _description = 'Usb Printer'
    
    name = fields.Char('Printer Name', required=True, default='Printer',
                       help='An internal identification of the printer')
    product_categories_ids = fields.Many2many(
        'pos.category', string='Printed Product Categories')

class PosConfig(models.Model):
    _inherit = 'pos.config'
    _description = 'Pos Config'

    is_order_usb_printer = fields.Boolean('Order Usb Printer')
    printer_usb_ids = fields.Many2many('usb.printer', string='Order Printers')
