Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Dwij\Desktop\DOTT\public\dott-logo.png")
$bmp = new-object System.Drawing.Bitmap($img)
$img.Dispose()

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $color = $bmp.GetPixel($x, $y)
        if ($color.A -gt 0) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($color.A, 255, 255, 255))
        }
    }
}

$bmp.Save("C:\Users\Dwij\Desktop\DOTT\public\dott-logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Success"
