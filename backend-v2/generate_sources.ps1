$cp = (Get-Content "target\javac_args.txt")[1]
$files = Get-ChildItem -Path "src\main\java" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
$content = @("-cp", "`"$cp`"", "-d", "target\classes") + $files
$content | Out-File -FilePath "target\all_sources.txt" -Encoding ascii
