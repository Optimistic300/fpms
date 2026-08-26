<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title><?php echo e(config('app.name', 'FPMS')); ?></title>

        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.jsx']); ?>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
<?php /**PATH /home/the-goated-mufasa/laravel_projects/fpms/resources/views/welcome.blade.php ENDPATH**/ ?>