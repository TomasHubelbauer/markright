import path from 'path';
import os from 'os';
import fs from 'fs';
import util from 'util';
import child_process from 'child_process';

// TODO: Replace with https://github.com/TomasHubelbauer/node-wsb
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

  // TODO: Find out how to shut-down without Windows Sandbox complaining
  // (alternatively just kill the WSB process instead of shutting down within)
  // TODO: Download Node and mount and run source version if source watch mode
  // TODO: Download binary for the correct platform or maybe mount host binary
  // (this would ensure that sandbox MR is the same version as host MR)
  const filePath = path.join(tempDirectoryPath, 'markright.ps1');
  await fs.promises.writeFile(filePath, `
cd C:\\Users\\WDAGUtilityAccount\\Desktop\\${directoryName}

# Record the output of WSB to use as the standard I/O result in MarkRight
Start-Transcript wsb.lol

echo "Downloading MarkRight"

# Speed up the download to human speeds
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest https://github.com/TomasHubelbauer/markright/releases/latest/download/markright-win.exe -OutFile markright.exe

# Note that C:\\Windows\\system32 is already in %PATH% so we can just invoke:
markright

# Shut down Windows Sandbox after the script is done running
Stop-Computer
`);

  // Note that this relies on Windows Sandbox being a singleton process as enforced by Windows
  console.log(await util.promisify(child_process.exec)(`powershell -command "windowssandbox ${wsbFilePath}; wait-process windowssandbox"`));
}()
