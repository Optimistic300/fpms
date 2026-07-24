<?php

namespace App\Enums;

enum ProjectMemberRole: string
{
    case LEAD = 'LEAD';
    case COLLABORATOR = 'COLLABORATOR';
}
