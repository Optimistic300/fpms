<?php

namespace App\Actions\Admin;

use App\Models\Division;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteDivisionAction
{
    public function execute(Division $division): void
    {
        if ($division->users()->exists()) {
            throw new HttpException(409, 'Division has associated users and cannot be deleted.');
        }

        if ($division->projects()->exists()) {
            throw new HttpException(409, 'Division has associated projects and cannot be deleted.');
        }

        $division->delete();
    }
}
