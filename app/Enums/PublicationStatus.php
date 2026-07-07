<?php

namespace App\Enums;

enum PublicationStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case IN_REVISION = 'IN_REVISION';
    case PUBLISHED = 'PUBLISHED';
}
