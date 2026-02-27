import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

// Called once when your extension is first activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Faaah! extension is now active 🔊');

  // Resolve the path to our bundled sound file
  const defaultSoundPath = context.asAbsolutePath(path.join('sounds', 'faaah.mp3'));

  // ─── Listen for terminal command completions (Shell Integration) ───────────
  // onDidEndTerminalShellExecution fires whenever a shell command finishes.
  // event.exitCode is the process exit code:
  //   0  = success
  //  >0  = error / failure
  const shellListener = vscode.window.onDidEndTerminalShellExecution(event => {
    const cfg = vscode.workspace.getConfiguration('faaah');

    if (!cfg.get<boolean>('enabled', true)) {
      return; // user has disabled the sound
    }

    const exitCode = event.exitCode;

    // undefined means VS Code couldn't determine the exit code (e.g. no shell
    // integration), so we skip. Non-zero means something went wrong → FAAAH!
    if (exitCode !== undefined && exitCode !== 0) {
      const soundPath = resolveSound(cfg, defaultSoundPath);
      playSound(soundPath, cfg.get<number>('volume', 1.0));
    }
  });

  // ─── Command: Toggle on/off ────────────────────────────────────────────────
  const toggleCmd = vscode.commands.registerCommand('faaah.toggle', () => {
    const cfg = vscode.workspace.getConfiguration('faaah');
    const current = cfg.get<boolean>('enabled', true);
    cfg.update('enabled', !current, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      !current ? 'Faaah! sound enabled 🔊' : 'Faaah! sound disabled 🔇'
    );
  });

  // ─── Command: Play a test sound ───────────────────────────────────────────
  const testCmd = vscode.commands.registerCommand('faaah.test', () => {
    const cfg = vscode.workspace.getConfiguration('faaah');
    const soundPath = resolveSound(cfg, defaultSoundPath);
    playSound(soundPath, cfg.get<number>('volume', 1.0));
    vscode.window.showInformationMessage('Playing test sound…');
  });

  // Register all disposables so VS Code cleans them up when the extension
  // is deactivated or the window is closed
  context.subscriptions.push(shellListener, toggleCmd, testCmd);
}

// Called when the extension is deactivated (VS Code closes, etc.)
export function deactivate() {
  console.log('Faaah! extension deactivated.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the path to the sound file to play.
 * If the user configured a custom path AND that file exists, use that.
 * Otherwise fall back to the bundled default.
 *
 * Validates that the custom path is actually a file (not a directory).
 */
function resolveSound(
  cfg: vscode.WorkspaceConfiguration,
  defaultPath: string
): string {
  const custom = cfg.get<string>('customSoundPath', '').trim();
  
  // Only use custom path if it exists AND is a regular file (not a directory)
  if (custom && fs.existsSync(custom)) {
    try {
      const stats = fs.statSync(custom);
      if (stats.isFile()) {
        return custom;
      }
    } catch (err) {
      // If stat fails (permission denied, etc.), fall back to default
      console.warn(`[Faaah!] Could not access custom sound: ${err}`);
    }
  }
  
  return defaultPath;
}

/**
 * Plays an MP3 file using a platform-native OS command.
 * No external npm packages required – works out of the box on:
 *   Windows  → PowerShell + Windows.Media.MediaPlayer (built in)
 *   macOS    → afplay (built in)
 *   Linux    → paplay → ffplay → mpg123 (tries each)
 */
function playSound(soundPath: string, volume: number): void {
  const p = process.platform;

  let cmd: string;

  if (p === 'win32') {
    // PowerShell ships with every modern Windows. MediaPlayer handles MP3.
    // We quote the path and run async so VS Code isn't blocked.
    const escaped = soundPath.replace(/'/g, "''"); // escape single quotes
    cmd = [
      'powershell -NoProfile -NonInteractive -Command',
      `"Add-Type -AssemblyName presentationCore;`,
      `$p = New-Object System.Windows.Media.MediaPlayer;`,
      `$p.Open([Uri]'${escaped}');`,
      `$p.Volume = ${volume};`,
      `$p.Play();`,
      `Start-Sleep -Seconds 4;`,
      `$p.Close()"`,
    ].join(' ');
  } else if (p === 'darwin') {
    // afplay is macOS built-in. -v sets volume (0.0–1.0 range, default 1).
    cmd = `afplay -v ${volume} "${soundPath}"`;
  } else {
    // Linux: try paplay (PulseAudio), ffplay (ffmpeg), or mpg123
    cmd = `paplay "${soundPath}" 2>/dev/null || ffplay -nodisp -autoexit -loglevel quiet "${soundPath}" 2>/dev/null || mpg123 -q "${soundPath}"`;
  }

  exec(cmd, err => {
    if (err) {
      // Don't spam the user with errors – just log to the dev console
      console.error('[Faaah!] Failed to play sound:', err.message);
    }
  });
}
