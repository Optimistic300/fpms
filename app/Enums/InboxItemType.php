<?php

namespace App\Enums;

enum InboxItemType: string
{
    case DOCUMENT = 'DOCUMENT';
    case REPORT_UPDATE = 'REPORT_UPDATE';
    case SYSTEM = 'SYSTEM';
}
