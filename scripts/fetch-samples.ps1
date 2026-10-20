# Downloads a sample image set from The Metropolitan Museum of Art's Open Access API
# (public-domain objects only, CC0) into docs/img/<category>/ and writes docs/img/CREDITS.md.
#
#   powershell -ExecutionPolicy Bypass -File scripts\fetch-samples.ps1
#
# Then build thumbnails and content.json with scripts\build-content.ps1.
# The Met has no game or writing collections, so Games and Writing are stand-ins
# (Arms and Armor; illustrated books and prints).

param(
  [string]$Root = (Join-Path $PSScriptRoot "..\docs"),
  [int]$PerCategory = 50,
  [int]$Seed = 7
)

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Root = (Resolve-Path $Root).Path
$api = "https://collectionapi.metmuseum.org/public/collection/v1"
$headers = @{ "User-Agent" = "F95-sample-fetch/1.0 (personal test project)" }

# category folder -> list of (department id, department name). Sources are used round-robin.
# Every object is checked against its department name, so stray matches are dropped.
$plan = [ordered]@{
  "art"     = @(, @{ dept = 11; name = "European Paintings" })
  "music"   = @(, @{ dept = 18; name = "Musical Instruments" })
  "games"   = @(, @{ dept = 4; name = "Arms and Armor" })
  "writing" = @(@{ dept = 16; name = "The Libraries" }, @{ q = "illuminated manuscript" }, @{ q = "calligraphy" })
}
$maxPerArtist = 3

function Get-Json([string]$url) {
  Start-Sleep -Milliseconds 120
  $r = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 60 -UseBasicParsing
  # the API sends no charset, so decode as UTF-8 ourselves
  return [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json
}
function Slug([string]$s, [int]$max) {
  $t = ($s.ToLower() -replace "[^a-z0-9]+", "-").Trim("-")
  if ($t.Length -gt $max) { $t = $t.Substring(0, $max).Trim("-") }
  return $t
}
function Tag-Words([string[]]$texts) {
  $words = @()
  foreach ($t in $texts) { if ($t) { $words += ($t.ToLower() -split "[^a-z]+") } }
  return @($words | Where-Object { $_.Length -ge 3 } | Select-Object -Unique | Select-Object -First 4)
}

$credits = @()
$rng = New-Object System.Random $Seed

foreach ($cat in $plan.Keys) {
  $dir = Join-Path $Root "img\$cat"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $sources = @($plan[$cat])

  # candidate ids per department, shuffled with a fixed seed so reruns pick the same set
  $pools = @()
  foreach ($src in $sources) {
    $res = if ($src.dept) { Get-Json "$api/objects?departmentIds=$($src.dept)" }
           else { Get-Json ("https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&isPublicDomain=true&limit=300&q=" + [uri]::EscapeDataString($src.q)) }
    $ids = @($res.objectIDs | Sort-Object { $rng.Next() } | Select-Object -First 700)
    $pools += , $ids
  }

  $got = 0; $seenUrl = @{}; $artistCount = @{}; $cursor = @(0) * $pools.Count; $turn = 0; $idle = 0
  while ($got -lt $PerCategory -and $idle -lt $pools.Count) {
    $p = $turn % $pools.Count; $turn++
    if ($cursor[$p] -ge $pools[$p].Count) { $idle++; continue }
    $idle = 0
    $id = $pools[$p][$cursor[$p]]; $cursor[$p]++

    try { $o = Get-Json "$api/objects/$id" } catch { continue }
    if ($sources[$p].name -and $o.department -ne $sources[$p].name) { continue }
    if (-not $o.isPublicDomain -or -not $o.primaryImageSmall -or -not $o.title) { continue }
    if ($seenUrl.ContainsKey($o.primaryImageSmall)) { continue }
    $artist = if ($o.artistDisplayName) { $o.artistDisplayName } else { "(unknown)" }
    if ($artist -ne "(unknown)" -and $artistCount[$artist] -ge $maxPerArtist) { continue }

    $title = Slug $o.title 45
    if (-not $title) { continue }
    $tags = Tag-Words @($o.classification, $o.objectName)
    $name = "$title--" + (($tags + $id) -join "-") + ".jpg"
    $path = Join-Path $dir $name
    try {
      Start-Sleep -Milliseconds 120
      Invoke-WebRequest -Uri $o.primaryImageSmall -Headers $headers -OutFile $path -TimeoutSec 90 -UseBasicParsing
    } catch { Write-Warning "download failed for $id"; continue }
    if (-not (Test-Path $path) -or (Get-Item $path).Length -lt 5000) { Remove-Item $path -ErrorAction SilentlyContinue; continue }

    $seenUrl[$o.primaryImageSmall] = $true; $artistCount[$artist] = 1 + [int]$artistCount[$artist]; $got++
    $credits += "| $cat | $($o.title -replace '\|', '/') | $($artist -replace '\|', '/') | $($o.objectDate -replace '\|', '/') | [$id](https://www.metmuseum.org/art/collection/search/$id) |"
    if ($got % 10 -eq 0) { Write-Host "$cat $got/$PerCategory" }
  }
  Write-Host "$cat done: $got images"
}

$md = @(
  "# Image credits",
  "",
  "Sample images are public-domain objects from The Metropolitan Museum of Art's Open Access collection (CC0).",
  "Source: https://www.metmuseum.org/about-the-met/policies-and-documents/open-access",
  "Fetched with scripts/fetch-samples.ps1. The Games and Writing folders are stand-ins (Arms and Armor; illustrated books and prints).",
  "",
  "| Category | Title | Artist | Date | Met object |",
  "|---|---|---|---|---|"
) + $credits
[IO.File]::WriteAllLines((Join-Path $Root "img\CREDITS.md"), $md, (New-Object System.Text.UTF8Encoding $false))
Write-Host ("Total {0} images. Credits written to docs/img/CREDITS.md" -f $credits.Count)
