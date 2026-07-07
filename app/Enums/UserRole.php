<?php

namespace App\Enums;

enum UserRole: string
{
    case RESEARCHER = 'RESEARCHER';
    case STUDENT = 'STUDENT';
    case SECRETARY = 'SECRETARY';
    case DIVISION_HEAD = 'DIVISION_HEAD';
    case MANAGEMENT = 'MANAGEMENT';
    case ADMIN = 'ADMIN';
}
