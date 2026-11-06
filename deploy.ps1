$rootFile = ".acco_root"

$sshAlias = "acc"
$remoteHome = "/home/accountsoftprogr"
$pythonVersion = "3.13"
$backendPort = 8001

$retryDelaySeconds = 2
$retryTimeoutSeconds = 60


$dir = Get-Item (Get-Location)

while ($dir -and -not (Test-Path (Join-Path $dir.FullName $rootFile))) {
    $dir = $dir.Parent
}

if (-not $dir) {
    throw "Could not find $rootFile"
}

$root = $dir.FullName


function Invoke-WithRetry {
    param (
        [string]$Name,
        [scriptblock]$Action,
        [int]$TimeoutSeconds = $retryTimeoutSeconds
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $attempt = 0

    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        $attempt++

        Write-Host ""
        Write-Host "========================================"
        Write-Host "$Name - Attempt $attempt"
        Write-Host "========================================"

        try {
            & $Action

            Write-Host "$Name succeeded." -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "$Name failed: $_" -ForegroundColor Yellow
        }

        if ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
            Start-Sleep -Seconds $retryDelaySeconds
        }
    }

    Write-Host "$Name failed after $TimeoutSeconds seconds." -ForegroundColor Red
    return $false
}


function Deploy-Backend {

    Set-Location $root

    # Create archive
    git archive HEAD backend -o backend.zip
    if ($LASTEXITCODE -ne 0) {
        throw "Git archive failed"
    }

    # Upload archive
    if (-not (Invoke-WithRetry "Upload backend" {
        scp backend.zip "${sshAlias}:${remoteHome}/"
        if ($LASTEXITCODE -ne 0) { throw "SCP failed" }
    })) {
        return $false
    }

    # Extract archive
    if (-not (Invoke-WithRetry "Extract backend" {
        ssh $sshAlias "cd $remoteHome && unzip -o backend.zip && rm backend.zip"
        if ($LASTEXITCODE -ne 0) { throw "Remote unzip failed" }
    })) {
        return $false
    }

    # Run migrations
    if (-not (Invoke-WithRetry "Backend migrations" {
        ssh $sshAlias "source $remoteHome/virtualenv/backend/$pythonVersion/bin/activate && cd $remoteHome/backend && python manage.py migrate"
        if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
    })) {
        return $false
    }

    Remove-Item backend.zip -ErrorAction SilentlyContinue

    Write-Host "Backend deployment completed successfully." -ForegroundColor Green
    return $true
}


function Deploy-Frontend {

    Set-Location "$root/frontend"

    # Build
    if (-not (Invoke-WithRetry "Frontend build" {
        npm run build -- --mode prod
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    })) {
        return $false
    }

    # Remove old assets
    if (-not (Invoke-WithRetry "Remove remote assets" {
        ssh $sshAlias "rm -rf $remoteHome/public_html/assets"
        if ($LASTEXITCODE -ne 0) { throw "Assets removal failed" }
    })) {
        return $false
    }

    # Upload frontend
    if (-not (Invoke-WithRetry "Upload frontend" {
        scp -r .\dist\* "${sshAlias}:$remoteHome/public_html/"
        if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
    })) {
        return $false
    }

    # Upload .htaccess
    if (-not (Invoke-WithRetry "Upload .htaccess" {
        scp .\dist\.htaccess "${sshAlias}:$remoteHome/public_html/"
        if ($LASTEXITCODE -ne 0) { throw ".htaccess upload failed" }
    })) {
        return $false
    }

    # Permissions
    if (-not (Invoke-WithRetry "Update permissions" {
        ssh $sshAlias "chmod -R 755 $remoteHome/public_html/assets && chmod 755 $remoteHome/public_html/v1"
        if ($LASTEXITCODE -ne 0) { throw "Permission update failed" }
    })) {
        return $false
    }

    Write-Host "Frontend deployment completed successfully." -ForegroundColor Green
    return $true
}



function Run-Backend {
    Set-Location "$root/backend"

    $env:ENV = "dev"

    & ".\venv\Scripts\python.exe" manage.py runserver $backendPort
}


function Run-Frontend {
    Set-Location "$root/frontend"

    npm run dev
}


switch ($args[0]) {

    "backend" {
        if (-not (Deploy-Backend)) {
            exit 1
        }
    }

    "frontend" {
        if (-not (Deploy-Frontend)) {
            exit 1
        }
    }

    "full" {
        Write-Host "`nStarting full deployment..." -ForegroundColor Cyan

        $backendSuccess = Deploy-Backend

        if (-not $backendSuccess) {
            Write-Host "Backend deployment failed. Frontend deployment skipped." -ForegroundColor Red
            exit 1
        }

        $frontendSuccess = Deploy-Frontend

        if (-not $frontendSuccess) {
            Write-Host "Frontend deployment failed." -ForegroundColor Red
            exit 1
        }

        Write-Host "Full deployment completed successfully." -ForegroundColor Green
    }

    # "full" {
    #     if (-not (Deploy-Backend)) {
    #         Write-Host "Backend failed. Frontend will NOT be deployed." -ForegroundColor Red
    #         exit 1
    #     }

    #     if (-not (Deploy-Frontend)) {
    #         Write-Host "Frontend failed." -ForegroundColor Red
    #         exit 1
    #     }

    #     Write-Host "Full deployment succeeded." -ForegroundColor Green
    # }

    "run-backend" {
        Run-Backend
    }

    "run-frontend" {
        Run-Frontend
    }

    default {
        Write-Host "Usage:"
        Write-Host "  .\deploy.ps1 backend"
        Write-Host "  .\deploy.ps1 frontend"
        Write-Host "  .\deploy.ps1 full"
        Write-Host "  .\deploy.ps1 run-backend"
        Write-Host "  .\deploy.ps1 run-frontend"
        exit 1
    }
}

