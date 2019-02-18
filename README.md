# web-crawler

Simple webcrawler which follow the links within the same domain.

### Parts / Structure
- `page-parser` - getting source of html and following the link within it
- `web-crawler-ui` - basic user interface for `web-crawler`
- `lambda-parser`

### How to run in development mode
* get `nixpkg` via `curl https://nixos.org/nix/install | sh`
* clone this repo
* within folder run `shell nix` command

### How to run tests and lints
* `unit tests` - `yarn test:unit`
* `lints` - `yarn lint`

#### Watch mode
Just append at the end `--watch` param

#### For `zsh` users
* as you will spawn another shell via `nix shell` some of aliases / commands / paths would not work, however if you are an `zsh` user it should be seamless, assuming your `zsh` config lives within home directory, this is `~/.zshrc` if not, override `zdotdir/zshenv` before running `nix-shell` and apply necessary config.

#### Setup
##### AWS Credentials
```  
serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
```

#### Some why's
* [`nix-shell`](https://nixos.org/nixos/nix-pills/developing-with-nix-shell.html) - to get fully isolated, reproducible environment with all `node.js` dependencies without global flag required
* [`serverless`](https://serverless.com/) - easy to setup, test and deploy to cloud and locally, no vendor lock in
* [`lambda`](https://aws.amazon.com/lambda/) - there is no point to hold an instance like `EC2` for [`RPC`](https://en.wikipedia.org/wiki/Remote_procedure_call) like call
* [`yarn workspaces`](https://yarnpkg.com/lang/en/docs/workspaces/) - to have clean view on `npm` dependency tree and to have more meaningful parts of app