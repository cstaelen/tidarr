$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Refresh-Path {
    # Merge the registry PATH with the inherited one, so tools installed after
    # this shell was opened (or PATH entries added by an installer) are visible
    # without dropping anything the current session already has.
    $machine = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $user    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $entries = @($machine -split ';') + @($user -split ';') + @($env:PATH -split ';')
    $entries = $entries | Where-Object { $_ } | Select-Object -Unique
    $env:PATH = $entries -join ';'
}

function Run-Npm {
    param([string]$npmArgs)
    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$root`" && npm $npmArgs" `
        -NoNewWindow -Wait -PassThru
    return $proc.ExitCode
}

Write-Host ""
Write-Host " _____ ___ ____    _    ____  ____"
Write-Host "|_   _|_ _|  _ \  / \  |  _ \|  _ \"
Write-Host "  | |  | || | | |/ _ \ | |_) | |_) |"
Write-Host "  | |  | || |_| / ___ \|  _ <|  _ <"
Write-Host "  |_| |___|____/_/   \_\_| \_\_| \_\"
Write-Host ""
Write-Host " Windows Launcher"
Write-Host "----------------------------------------"

# ── 1. Node.js ──────────────────────────────────────────────────────────────
Write-Host "[1/4] Checking Node.js..."
Refresh-Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing Node.js..."
    winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    Refresh-Path
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "  ERROR: Node.js not found after install." -ForegroundColor Red
        Read-Host "Press Enter to exit"; exit 1
    }
}
Write-Host "  Node.js $(node -v) OK" -ForegroundColor Green

# ── 2. Python + tiddl ───────────────────────────────────────────────────────
# tiddl 3.4.x requires Python >= 3.13. An older "python" on PATH (3.12, 3.11...)
# cannot install it, so the interpreter is resolved by version, not just presence.
Write-Host "[2/4] Checking Python..."

$MinPython     = [version]"3.13"
$TiddlVersion  = "3.4.4"

function Invoke-Py {
    param([string[]]$Python, [string[]]$Arguments)
    $exe = $Python[0]
    $pre = @()
    if ($Python.Count -gt 1) { $pre = $Python[1..($Python.Count - 1)] }
    & $exe @pre @Arguments
}

function Get-PythonVersion {
    param([string[]]$Python)
    try {
        $out = Invoke-Py $Python @("-c", "import sys;print('%d.%d.%d' % sys.version_info[:3])") 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $out) { return $null }
        return [version]("$out".Trim())
    } catch { return $null }
}

function Find-CompatiblePython {
    $candidates = @(
        @("py", "-3.13"),
        @("py", "-3"),
        @("python"),
        @("python3")
    )
    $fallback = Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\python.exe"
    if (Test-Path $fallback) { $candidates += ,@($fallback) }

    foreach ($candidate in $candidates) {
        if ($candidate.Count -eq 1 -and -not (Get-Command $candidate[0] -ErrorAction SilentlyContinue)) { continue }
        $version = Get-PythonVersion $candidate
        if ($version -and $version -ge $MinPython) {
            return @{ Command = $candidate; Version = $version }
        }
    }
    return $null
}

$py = Find-CompatiblePython
if (-not $py) {
    Write-Host "  Python 3.13+ not found. Installing Python 3.13..."
    winget install Python.Python.3.13 --silent --accept-source-agreements --accept-package-agreements
    Refresh-Path
    $py = Find-CompatiblePython
    if (-not $py) {
        Write-Host "  ERROR: Python 3.13+ not found after install." -ForegroundColor Red
        Write-Host "  tiddl $TiddlVersion requires Python 3.13 or newer." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"; exit 1
    }
}
Write-Host "  Python $($py.Version) OK" -ForegroundColor Green

Write-Host "  Checking tiddl..."
$scriptsDir = ""
try {
    $scriptsDir = (Invoke-Py $py.Command @("-c", "import sysconfig;print(sysconfig.get_path('scripts'))") 2>$null | Out-String).Trim()
} catch {}
if (-not $scriptsDir -and $py.Command[0].Contains('\') -and (Test-Path $py.Command[0])) {
    $scriptsDir = Join-Path (Split-Path -Parent $py.Command[0]) "Scripts"
}

$tiddlInstalled = ""
try {
    $tiddlInstalled = (Invoke-Py $py.Command @("-c", "from importlib.metadata import version;print(version('tiddl'))") 2>$null | Out-String).Trim()
} catch {}

$needsTiddl = $true
if ($tiddlInstalled) {
    try { $needsTiddl = ([version]$tiddlInstalled -lt [version]$TiddlVersion) } catch { $needsTiddl = $true }
}

if ($needsTiddl) {
    if ($tiddlInstalled) {
        Write-Host "  Upgrading tiddl $tiddlInstalled -> $TiddlVersion..."
    } else {
        Write-Host "  Installing tiddl $TiddlVersion..."
    }
    Invoke-Py $py.Command @("-m", "pip", "install", "--upgrade", "--no-warn-script-location", "tiddl==$TiddlVersion", "--quiet")
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: tiddl $TiddlVersion install failed (Python $($py.Version))." -ForegroundColor Red
        Read-Host "Press Enter to exit"; exit 1
    }
    $tiddlInstalled = $TiddlVersion
}

# tiddl.exe lives in the interpreter's Scripts folder; make sure that exact
# executable wins on PATH (an old tiddl from a Python 3.12 install may still be
# registered) and that it stays reachable in future sessions, since the API
# spawns `tiddl` by name.
$expectedTiddl = if ($scriptsDir) { Join-Path $scriptsDir "tiddl.exe" } else { "" }
if ($expectedTiddl -and (Test-Path $expectedTiddl)) {
    $resolved = (Get-Command tiddl -ErrorAction SilentlyContinue).Source
    if (-not $resolved -or ($resolved -ine $expectedTiddl)) {
        $env:PATH = "$scriptsDir;$env:PATH"
    }

    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $persisted = ($userPath -split ';') | Where-Object { $_.TrimEnd('\') -ieq $scriptsDir.TrimEnd('\') }
    if (-not $persisted) {
        [System.Environment]::SetEnvironmentVariable("PATH", "$scriptsDir;$userPath", "User")
    }
}

Write-Host "  tiddl $tiddlInstalled OK ($scriptsDir\tiddl.exe)" -ForegroundColor Green

$tiddlOk = $false
if (Get-Command tiddl -ErrorAction SilentlyContinue) {
    $null = & tiddl --help 2>&1
    $tiddlOk = ($LASTEXITCODE -eq 0)
}
if (-not $tiddlOk) {
    Write-Host "  ERROR: tiddl is installed but not runnable from PATH." -ForegroundColor Red
    Write-Host "  Try opening a new terminal, or check that $scriptsDir is on PATH." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"; exit 1
}

# ── 3. ffmpeg ────────────────────────────────────────────────────────────────
Write-Host "[3/4] Checking ffmpeg..."
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing ffmpeg..."
    winget install Gyan.FFmpeg --silent --accept-source-agreements --accept-package-agreements
    Refresh-Path
}
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Write-Host "  ffmpeg OK" -ForegroundColor Green
} else {
    Write-Host "  WARNING: ffmpeg not in PATH. Audio conversion may not work." -ForegroundColor Yellow
}

# ── 4. Node dependencies ─────────────────────────────────────────────────────
Write-Host "[4/4] Checking Node dependencies..."
$concurrently = Join-Path $root "node_modules\concurrently"
if (-not (Test-Path $concurrently)) {
    Write-Host "  Installing dependencies..."
    $exit = Run-Npm "install"
    if ($exit -ne 0) {
        Write-Host "  ERROR: npm install failed." -ForegroundColor Red
        Read-Host "Press Enter to exit"; exit 1
    }
} else {
    Write-Host "  node_modules OK" -ForegroundColor Green
}

# ── Start ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "----------------------------------------"
Write-Host " Starting Tidarr..."
Write-Host " Frontend : http://localhost:3000"
Write-Host " API      : http://localhost:8484"
Write-Host "----------------------------------------"
Write-Host ""

# Open browser before starting server - modern browsers will auto-reload
Start-Process "http://localhost:3000"

Run-Npm "run dev"
