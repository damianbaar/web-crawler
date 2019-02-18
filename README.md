### Requirements

### Structure
- `page-parser`
- `web-parser`
- `lambda-parser`

### How to run
* get `nixpkg` via `curl https://nixos.org/nix/install | sh`
* clone this repo
* within folder run `shell nix` command

#### For `zsh` users
* as you will spawn another shell via `nix shell` some of aliases / commands / paths would not work, however if you are an `zsh` user it should be seamless, assuming your `zsh` config lives within home directory, this is `~/.zshrc` if not, override `zdotdir/zshenv` before running `nix-shell` and apply necessary config.

#### Setup
##### AWS Credentials
```  
serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
```

#### Some why's
* `nix` - to get fully isolated environment with all node dependencies
* `serverless` - no vendor lock in
* `lambda` - there is no point to hold an instance for `RPC` like call