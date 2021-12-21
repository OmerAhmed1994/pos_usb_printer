# -*- coding: utf-8 -*-
{
    'name': 'Pos USB Printer',
    'version': '14.0.0.1',
    'author': 'Sonod',
    'company': "Dev. Omer Ahmed",
    'website': 'https://github.com/OmerAhmed1994',
    'license': 'LGPL-3',
    'category': 'POS',
    'summary': "Pos USB Printer",
    'description': "Pos USB Printer module",
    'depends': ['pos_restaurant'],
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/usb_printer.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True,
    'auto_install': False,
}
