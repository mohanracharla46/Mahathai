param(
    [Parameter(Mandatory = $true)]
    [string[]]$InputFiles,

    [string]$OutputDirectory = "database_import",

    [string]$DefaultPasswordHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToMysqlTimestamp {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $parsed = [datetimeoffset]::Parse($Value)
    return $parsed.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss")
}

function Convert-ToTinyInt {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0
    }

    switch ($Value.Trim().ToLowerInvariant()) {
        "true" { return 1 }
        "1" { return 1 }
        "yes" { return 1 }
        default { return 0 }
    }
}

function Escape-SqlString {
    param([AllowNull()][string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "NULL"
    }

    return "'" + $Value.Replace("\", "\\").Replace("'", "''") + "'"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$rows = foreach ($file in $InputFiles) {
    Import-Csv -LiteralPath $file
}

$normalizedRows = foreach ($row in $rows) {
    $email = [string]$row.Email
    if ([string]::IsNullOrWhiteSpace($email)) {
        continue
    }

    $name = [string]$row.Name
    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = $email.Split("@")[0]
    }

    [pscustomobject]@{
        full_name = $name.Trim()
        email = $email.Trim().ToLowerInvariant()
        phone = if ([string]::IsNullOrWhiteSpace([string]$row.Phone)) { $null } else { ([string]$row.Phone).Trim() }
        password = $DefaultPasswordHash
        role = "customer"
        remember_token = $null
        created_at = Convert-ToMysqlTimestamp ([string]$row.Created)
        last_ordered_on = Convert-ToMysqlTimestamp ([string]$row.'Last Ordered On')
        following_email = Convert-ToTinyInt ([string]$row.'Following Email')
        following_sms = Convert-ToTinyInt ([string]$row.'Following SMS')
        points_remaining = if ([string]::IsNullOrWhiteSpace([string]$row.'Points Remaining')) { 0 } else { [int]$row.'Points Remaining' }
        updated_at = Convert-ToMysqlTimestamp ([string]$row.Created)
    }
}

$dedupedRows = $normalizedRows |
    Group-Object email |
    ForEach-Object {
        $_.Group |
            Sort-Object @{ Expression = { if ($_.created_at) { [datetime]$_.created_at } else { [datetime]::MinValue } }; Descending = $true } |
            Select-Object -First 1
    } |
    Sort-Object email

$csvPath = Join-Path $OutputDirectory "users_import.csv"
$sqlPath = Join-Path $OutputDirectory "users_import.sql"

$dedupedRows |
    Select-Object full_name,email,phone,password,role,remember_token,created_at,last_ordered_on,following_email,following_sms,points_remaining,updated_at |
    Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

$columns = @(
    "full_name",
    "email",
    "phone",
    "password",
    "role",
    "remember_token",
    "created_at",
    "last_ordered_on",
    "following_email",
    "following_sms",
    "points_remaining",
    "updated_at"
)

$sqlLines = New-Object System.Collections.Generic.List[string]
$quotedColumns = ($columns | ForEach-Object { "``$_``" }) -join ", "
$sqlLines.Add("INSERT INTO users ($quotedColumns) VALUES")

$valueLines = for ($i = 0; $i -lt $dedupedRows.Count; $i++) {
    $user = $dedupedRows[$i]
    $values = @(
        (Escape-SqlString $user.full_name),
        (Escape-SqlString $user.email),
        (Escape-SqlString $user.phone),
        (Escape-SqlString $user.password),
        (Escape-SqlString $user.role),
        (Escape-SqlString $user.remember_token),
        (Escape-SqlString $user.created_at),
        (Escape-SqlString $user.last_ordered_on),
        $user.following_email,
        $user.following_sms,
        $user.points_remaining,
        (Escape-SqlString $user.updated_at)
    )

    $suffix = if ($i -eq ($dedupedRows.Count - 1)) { ";" } else { "," }
    "  (" + ($values -join ", ") + ")" + $suffix
}

$sqlLines.AddRange([string[]]$valueLines)
$sqlLines | Set-Content -LiteralPath $sqlPath -Encoding UTF8

[pscustomobject]@{
    SourceRows = $rows.Count
    RowsWithEmail = $normalizedRows.Count
    OutputUsers = $dedupedRows.Count
    SkippedMissingEmail = $rows.Count - $normalizedRows.Count
    DuplicateEmailsRemoved = $normalizedRows.Count - $dedupedRows.Count
    CsvPath = (Resolve-Path $csvPath).Path
    SqlPath = (Resolve-Path $sqlPath).Path
}
