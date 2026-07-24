<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('reports:calculate-overdue')->dailyAt('00:00');
Schedule::command('alerts:generate-deadline')->dailyAt('06:00');
