import path from 'path';
import os from 'os';
import fs from 'fs';
import child_process from 'child_process';

void async function () {
  const directoryPath = process.cwd();
  const directoryName = path.basename(directoryPath);

  const tempDirectoryName = 'markright';
  const tempDirectoryPath = path.join(os.tmpdir(), tempDirectoryName);
  try {
    await fs.promises.mkdir(tempDirectoryPath);
  }
  catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  // Note that `%tmp%` can not be used in `SandboxFolder` path values
  // Note that Windows-style back-slashes need to be used for path separators
  // See also https://github.com/damienvanrobaeys/Windows_Sandbox_Editor
  // TODO: Consider adding an option for read-only WSB share, maybe even default
  const wsbFilePath = path.join(tempDirectoryPath, 'markright.wsb');
  await fs.promises.writeFile(wsbFilePath, `
<Configuration>
  <MappedFolders>
    <MappedFolder>
      <HostFolder>${directoryPath}</HostFolder>
      <SandboxFolder>C:\\Users\\WDAGUtilityAccount\\Desktop\\${directoryName}</SandboxFolder>
    </MappedFolder>
    <MappedFolder>
      <HostFolder>${tempDirectoryPath}</HostFolder>
      <SandboxFolder>C:\\Users\\WDAGUtilityAccount\\AppData\\Local\\Temp\\markright</SandboxFolder>
      <ReadOnly>true</ReadOnly>
    </MappedFolder>
  </MappedFolders>
  <LogonCommand>
    <Command>C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -executionpolicy unrestricted -command "start powershell {-noexit -nologo -file C:\\Users\\WDAGUtilityAccount\\AppData\\Local\\Temp\\markright\\markright.ps1}"</Command>
  </LogonCommand>
</Configuration>
`);

  // TODO: Download MarkRight binary and run it not Node and MarkRight NPM
  // TODO: Use source version of MarkRight when in source version mode
  // (either pre-build the MarkRight binary or download Node and run MarkRight)
  const filePath = path.join(tempDirectoryPath, 'markright.ps1');
  await fs.promises.writeFile(filePath, `
$response = Invoke-WebRequest -UseBasicParsing https://nodejs.org/en/download
if ($response.Content -notmatch "Latest LTS Version: <strong>(?<version>\\d+.\\d+.\\d+)<\\/strong>") {
  throw "Could not parse out latest LTS version from https://nodejs.org/en/download"
}

$version = $matches.version
$name = "node-$version.msi"
if (Test-Path $name) {
  # Use the cached version (this is for testing, never happens in the sandbox)
}
else {
  echo "Downloading $name"
  Invoke-WebRequest https://nodejs.org/dist/v\${version}/node-v\${version}-x64.msi -OutFile $name
}

echo "Installing $name"
msiexec /passive /log "\${name}.log" /package $name
Wait-Process msiexec

echo "Adding Node and NPM to %PATH%"
$env:Path += ";C:\\Program Files\\nodejs"

node -v
npm -v
echo "Done"
`);

  // TODO: Make the sandbox self-close after having run the script
  const exitCode = await new Promise(async (resolve, reject) => {
    // Note that this relies on Windows Sandbox being a singleton process as enforced by Windows
    const cp = await child_process.exec(`powershell -command "windowssandbox ${wsbFilePath}; wait-process windowssandbox"`);
    cp.on('exit', resolve);
    cp.on('error', reject);
  });

  process.exit(exitCode);
}()
