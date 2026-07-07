<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case PROPOSED = 'PROPOSED';
    case ACTIVE = 'ACTIVE';
    case COMPLETED = 'COMPLETED';
    case ARCHIVED = 'ARCHIVED';
}
