<?php

namespace App\Enums;

enum FundingType: string
{
    case DONOR = 'DONOR';
    case GOVERNMENT = 'GOVERNMENT';
    case INTERNAL = 'INTERNAL';
}
