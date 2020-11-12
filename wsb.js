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

  // TODO: Download Node and mount and run source version if source watch mode
  // TODO: Download binary for the correct platform or maybe mount host binary
  // (this would ensure that sandbox MR is the same version as host MR)
  const filePath = path.join(tempDirectoryPath, 'markright.ps1');
  await fs.promises.writeFile(filePath, `
echo "Downloading MarkRight"

# Speed up the download to human speeds
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest https://github.com/TomasHubelbauer/markright/releases/latest/download/markright-win.exe -OutFile markright.exe

cd C:\\Users\\WDAGUtilityAccount\\Desktop\\${directoryName}

# Note that C:\\Windows\\system32 is already in %PATH% so we can just invoke:
markright
`);

  const exitCode = await new Promise(async (resolve, reject) => {
    // Note that this relies on Windows Sandbox being a singleton process as enforced by Windows
    const cp = await child_process.exec(`powershell -command "windowssandbox ${wsbFilePath}; wait-process windowssandbox"`);
    cp.on('exit', resolve);
    cp.on('error', reject);
  });

  process.exit(exitCode);
}()
