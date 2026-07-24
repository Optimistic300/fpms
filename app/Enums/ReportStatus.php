<?php

namespace App\Enums;

enum ReportStatus: string
{
    case DRAFT = 'DRAFT';
    case PENDING = 'PENDING';
    case RETURNED = 'RETURNED';
    case APPROVED = 'APPROVED';
    case ESCALATED = 'ESCALATED';
}
