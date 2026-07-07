<?php

namespace App\Enums;

enum PublicationType: string
{
    case PAPER = 'PAPER';
    case THESIS = 'THESIS';
    case REPORT = 'REPORT';
    case STUDENT = 'STUDENT';
}
