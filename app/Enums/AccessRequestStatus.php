<?php

namespace App\Enums;

enum AccessRequestStatus: string
{
    case PENDING = 'PENDING';
    case GRANTED = 'GRANTED';
    case DENIED = 'DENIED';
}
