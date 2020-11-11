$response = Invoke-WebRequest https://nodejs.org/en/download
if ($response.Content -notmatch "Latest LTS Version: <strong>(?<version>\d+.\d+.\d+)<\/strong>") {
  throw "Could not parse out latest LTS version from https://nodejs.org/en/download"
}

$version = $matches.version
$name = "node-$version.msi"
if (Test-Path $name) {
  # Use the cached version (this is for testing, never happens in the sandbox)
}
else {
  echo "Downloading $name"
  Invoke-WebRequest https://nodejs.org/dist/v${version}/node-v${version}-x64.msi -OutFile $name
}

echo "Installing $name"
msiexec /passive /log "${name}.log" /package $name

echo "Done"
