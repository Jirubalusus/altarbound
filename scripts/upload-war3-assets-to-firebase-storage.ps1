param(
  [string]$ProjectId = "altarbound-660da",
  [string]$Bucket = "altarbound-660da.firebasestorage.app",
  [string]$SourceDir = "public/war3-assets",
  [string]$Prefix = "war3-assets"
)

$ErrorActionPreference = "Stop"

function Get-ContentType([string]$Path) {
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    ".png"  { "image/png"; break }
    ".jpg"  { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".webp" { "image/webp"; break }
    ".json" { "application/json"; break }
    ".txt"  { "text/plain"; break }
    ".md"   { "text/markdown"; break }
    default  { "application/octet-stream" }
  }
}

# Ask Firebase CLI to refresh its cached OAuth token if needed.
# Use cmd redirection to avoid PowerShell NativeCommandError on Firebase CLI progress stderr.
cmd /c "firebase projects:list --project $ProjectId --json >NUL 2>NUL"

$configPath = Join-Path $env:USERPROFILE ".config\configstore\firebase-tools.json"
if (!(Test-Path $configPath)) { throw "Firebase CLI config not found at $configPath. Run firebase login first." }
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$accessToken = $config.tokens.access_token
if (!$accessToken) { throw "Firebase CLI access token not found. Run firebase login first." }

$root = Resolve-Path $SourceDir
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $_.Extension.ToLowerInvariant() -in @(".png", ".jpg", ".jpeg", ".webp", ".json", ".txt", ".md")
}

Write-Host "Uploading $($files.Count) files to gs://$Bucket/$Prefix ..."
$headers = @{ Authorization = "Bearer $accessToken" }
$i = 0
foreach ($file in $files) {
  $i++
  $rootPath = $root.Path.TrimEnd('\\') + '\\'
  $relative = $file.FullName.Substring($rootPath.Length).Replace("\", "/")
  $objectName = "$Prefix/$relative"
  $encoded = [uri]::EscapeDataString($objectName)
  $uri = "https://storage.googleapis.com/upload/storage/v1/b/$Bucket/o?uploadType=media&name=$encoded"
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  $contentType = Get-ContentType $file.FullName
  Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType $contentType -Body $bytes | Out-Null
  if (($i % 25) -eq 0 -or $i -eq $files.Count) { Write-Host "Uploaded $i/$($files.Count)" }
}

Write-Host "Done. Public URL pattern after Storage rules deploy:"
Write-Host "https://firebasestorage.googleapis.com/v0/b/$Bucket/o/<encoded path>?alt=media"
