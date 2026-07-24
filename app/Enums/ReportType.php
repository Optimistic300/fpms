<?php

namespace App\Enums;

enum ReportType: string
{
    case QUARTERLY = 'QUARTERLY';
    case MID_YEAR = 'MID_YEAR';
    case ANNUAL = 'ANNUAL';
}
