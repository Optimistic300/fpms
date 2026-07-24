<?php

namespace App\Enums;

enum DocumentType: string
{
    case DATA_SHEET = 'DATA_SHEET';
    case PHOTO = 'PHOTO';
    case MAP = 'MAP';
    case RECEIPT = 'RECEIPT';
    case REPORT = 'REPORT';
    case MANUSCRIPT = 'MANUSCRIPT';
    case OTHER = 'OTHER';
}
