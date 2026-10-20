# Builds docs/content.json and docs/thumbs/ from the images in docs/img/.
#
#   docs/img/<category>/<file>                 e.g. docs/img/art/lighthouse-study--ink-sketch.jpg
#   docs/img/<category>/<creator>/<file>       optional creator folder
#
# File name: "my-title--tag-one-tag-two.jpg". Words before "--" become the title,
# words after it become tags. The category folder name is always added as a tag.
#
# Run:  powershell -ExecutionPolicy Bypass -File scripts\build-content.ps1
# Re-run whenever you add, remove or rename images. Thumbnails are only regenerated when needed.

param(
  [string]$Root = (Join-Path $PSScriptRoot "..\docs"),
  [int]$ThumbWidth = 480,
  [int]$ThumbQuality = 80
)

Add-Type -AssemblyName System.Drawing
$Root = (Resolve-Path $Root).Path
$imgDir = Join-Path $Root "img"
$thumbDir = Join-Path $Root "thumbs"
if (-not (Test-Path $imgDir)) { New-Item -ItemType Directory -Path $imgDir | Out-Null }

# Default creator per category (matches the placeholder creators on the site).
$defaultCreators = @{
  "Art" = "Mira Okafor"; "Music" = "The Tide Collective"; "Games" = "Jun Park"; "Writing" = "Elan Reyes"
}
$palette = @("#5b4bff", "#ff8a5b", "#00a38d", "#a259ff", "#1fa2ff", "#ff5b8a")

function Title-Case([string]$s) {
  if (-not $s) { return $s }
  return $s.Substring(0, 1).ToUpper() + $s.Substring(1)
}
function Url-Path([string]$rel) {
  return (($rel -split "/") | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
}
function Open-Oriented([string]$path) {
  $im = [System.Drawing.Image]::FromFile($path)
  try {
    if ($im.PropertyIdList -contains 0x0112) {
      switch ($im.GetPropertyItem(0x0112).Value[0]) {
        3 { $im.RotateFlip("Rotate180FlipNone") }
        6 { $im.RotateFlip("Rotate90FlipNone") }
        8 { $im.RotateFlip("Rotate270FlipNone") }
      }
    }
  } catch { }
  return $im
}

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$ThumbQuality)

$exts = @(".jpg", ".jpeg", ".png", ".gif", ".bmp")
$files = Get-ChildItem -Path $imgDir -Recurse -File | Where-Object { $_.Extension -ne ".md" } | Sort-Object FullName
$items = @(); $creators = @{}; $skipped = 0; $made = 0
$totalOrig = 0; $totalThumb = 0

foreach ($f in $files) {
  if ($exts -notcontains $f.Extension.ToLower()) {
    Write-Warning "Skipping $($f.Name) because $($f.Extension) is not supported here. Convert it to .jpg or .png."
    $skipped++; continue
  }
  $rel = $f.FullName.Substring($imgDir.Length + 1).Replace("\", "/")
  $parts = $rel -split "/"
  if ($parts.Count -lt 2) {
    Write-Warning "Skipping ${rel}: put images inside a category folder, e.g. img/art/$rel"
    $skipped++; continue
  }
  $cat = Title-Case $parts[0].ToLower()
  $creator = if ($parts.Count -ge 3) { (($parts[1] -split "[-_ ]") | ForEach-Object { Title-Case $_ }) -join " " }
             elseif ($defaultCreators.ContainsKey($cat)) { $defaultCreators[$cat] } else { "F95 Creator" }
  if (-not $creators.ContainsKey($creator)) {
    $creators[$creator] = [ordered]@{ init = $creator.Substring(0, 1).ToUpper(); color = $palette[$creators.Count % $palette.Count] }
  }

  $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  $bits = $base -split "--", 2
  $title = Title-Case (($bits[0] -replace "[-_]+", " ").Trim())
  $tags = @($cat.ToLower())
  if ($bits.Count -gt 1) { $tags += ($bits[1] -split "[-_ ,]+" | Where-Object { $_ -and $_ -notmatch "^[0-9]+$" } | ForEach-Object { $_.ToLower() }) }
  $tags = @($tags | Select-Object -Unique)

  $relThumb = ($rel -replace "\.[^./]+$", "") + ".jpg"
  $thumbPath = Join-Path $thumbDir ($relThumb.Replace("/", "\"))
  $src = Open-Oriented $f.FullName
  try {
    $w = $src.Width; $h = $src.Height
    if (-not (Test-Path $thumbPath) -or (Get-Item $thumbPath).LastWriteTime -lt $f.LastWriteTime) {
      $tw = [Math]::Min($ThumbWidth, $w); $th = [int][Math]::Round($h * $tw / $w)
      $bmp = New-Object System.Drawing.Bitmap $tw, $th
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = "HighQualityBicubic"; $g.SmoothingMode = "HighQuality"
      $g.Clear([System.Drawing.Color]::White)
      $g.DrawImage($src, 0, 0, $tw, $th)
      New-Item -ItemType Directory -Force -Path (Split-Path $thumbPath) | Out-Null
      $bmp.Save($thumbPath, $jpeg, $encParams)
      $g.Dispose(); $bmp.Dispose(); $made++
    }
  } finally { $src.Dispose() }

  $thumbBytes = (Get-Item $thumbPath).Length
  $totalOrig += $f.Length; $totalThumb += $thumbBytes
  $items += [ordered]@{
    id = ($rel -replace "\.[^./]+$", "").ToLower()
    cat = $cat; creator = $creator; title = $title; tags = $tags
    img = "img/" + (Url-Path $rel); thumb = "thumbs/" + (Url-Path $relThumb)
    w = $w; h = $h; bytes = $f.Length; thumbBytes = $thumbBytes
    added = $f.LastWriteTimeUtc.ToString("o")
  }
}

$doc = [ordered]@{ generated = (Get-Date).ToUniversalTime().ToString("o"); creators = $creators; items = $items }
$json = $doc | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path $Root "content.json"), $json, (New-Object System.Text.UTF8Encoding $false))

$cats = $items | Group-Object { $_.cat } | ForEach-Object { "$($_.Name): $($_.Count)" }
Write-Host ("{0} images ({1}), {2} thumbnails written, {3} skipped" -f $items.Count, ($cats -join ", "), $made, $skipped)
if ($totalOrig -gt 0) {
  Write-Host ("Originals {0:N1} MB, thumbnails {1:N1} MB ({2:P0} smaller)" -f ($totalOrig / 1MB), ($totalThumb / 1MB), (1 - $totalThumb / $totalOrig))
}
if ($items.Count -lt 150) { Write-Host "Tip: 40+ images across a few categories shows taste clusters in the feed; 150+ (30+ per category) are needed for the evaluation page to mean anything." }
