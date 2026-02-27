# Faaah! – Error Sound for VS Code

> Plays a dramatic **"faaah"** sound every time a terminal command fails. Never silently fail again.

---

## How It Works

Faaah! listens to VS Code's built-in **Shell Integration** events.  
Whenever any terminal command exits with a **non-zero exit code** (i.e. an error), the sound fires.

```bash
$ npm run build   # build fails → 💥 FAAAH!
$ git push        # push rejected → 💥 FAAAH!
$ python app.py   # runtime exception → 💥 FAAAH!
```

---

## Requirements

- **VS Code 1.90+**
- Shell Integration must be enabled (it is by default in bash, zsh, fish, PowerShell)

### Linux only
At least one of these must be installed: `paplay` (PulseAudio), `ffplay` (ffmpeg), or `mpg123`.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `faaah.enabled` | `true` | Turn the sound on or off |
| `faaah.customSoundPath` | `""` | Absolute path to your own MP3/WAV file |
| `faaah.volume` | `1.0` | Volume (0.0–1.0). macOS & Linux only |

---

## Commands

Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

- **Faaah!: Toggle Sound On/Off** – quickly mute/unmute
- **Faaah!: Play Test Sound** – verify your audio is working

---

## Release Notes

### 0.0.1
- Initial release 🎉
- Plays `faaah.mp3` on terminal error (non-zero exit code)
- Custom sound path support
- Toggle command

---

## License

MIT
